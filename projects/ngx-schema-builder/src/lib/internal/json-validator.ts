import type Ajv from 'ajv';
import type { ValidateFunction } from 'ajv';

import type { JsonSchema } from '../types/json-schema';

export interface ValidationError {
  path: string;
  message: string;
  line?: number;
  column?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

let ajvPromise: Promise<Ajv> | null = null;

function loadAjv(): Promise<Ajv> {
  if (!ajvPromise) {
    ajvPromise = (async () => {
      const [{ default: AjvCtor }, ajvFormatsModule] = await Promise.all([
        import('ajv'),
        import('ajv-formats'),
      ]);
      const addFormats = (
        ajvFormatsModule as unknown as { default: (a: Ajv) => Ajv }
      ).default;
      const ajv = new AjvCtor({
        allErrors: true,
        strict: false,
        validateSchema: false,
        validateFormats: false,
      });
      addFormats(ajv);
      return ajv;
    })();
  }
  return ajvPromise;
}

const MAX_COMPILED_VALIDATORS = 16;
const compiledValidators = new Map<string, ValidateFunction>();

// Memoizes compiled validators by serialized schema, bounded as a simple LRU.
function getValidator(ajv: Ajv, schema: JsonSchema): ValidateFunction {
  const key = JSON.stringify(schema);
  const cached = compiledValidators.get(key);
  if (cached) {
    compiledValidators.delete(key);
    compiledValidators.set(key, cached);
    return cached;
  }

  const validate = ajv.compile(schema as object);
  compiledValidators.set(key, validate);
  if (compiledValidators.size > MAX_COMPILED_VALIDATORS) {
    const oldest = compiledValidators.keys().next().value;
    if (oldest !== undefined) compiledValidators.delete(oldest);
  }
  return validate;
}

/**
 * Best-effort line/column for a JSON Pointer path inside a JSON source string.
 * A textual heuristic (not a parser): single-segment paths are matched by key,
 * deeper paths fall back to the last segment. Used only to position editor
 * error markers, so an imperfect match is acceptable.
 */
export function findLineNumberForPath(
  jsonStr: string,
  path: string,
): { line: number; column: number } | undefined {
  try {
    if (path === '/' || path === '') {
      return { line: 1, column: 1 };
    }

    const pathSegments = path.split('/').filter(Boolean);

    if (pathSegments.length === 0) {
      return { line: 1, column: 1 };
    }

    const lines = jsonStr.split('\n');

    if (pathSegments.length === 1) {
      const propName = pathSegments[0];
      const propPattern = new RegExp(`([\\s]*)("${propName}")`);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = propPattern.exec(line);

        if (match) {
          const columnPos = line.indexOf(`"${propName}"`) + 1;
          return { line: i + 1, column: columnPos };
        }
      }
    }

    if (pathSegments.length > 1) {
      const lastSegment = pathSegments[pathSegments.length - 1];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes(`"${lastSegment}"`)) {
          const column = line.indexOf(`"${lastSegment}"`) + 1;
          return { line: i + 1, column };
        }
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}

export function extractErrorPosition(
  error: Error,
  jsonInput: string,
): { line: number; column: number } {
  let line = 1;
  let column = 1;
  const errorMessage = error.message;

  const lineColMatch = errorMessage.match(/at line (\d+) column (\d+)/);
  if (lineColMatch?.[1] && lineColMatch?.[2]) {
    line = Number.parseInt(lineColMatch[1], 10);
    column = Number.parseInt(lineColMatch[2], 10);
  } else {
    const positionMatch = errorMessage.match(/position (\d+)/);
    if (positionMatch?.[1]) {
      const position = Number.parseInt(positionMatch[1], 10);
      const jsonUpToError = jsonInput.substring(0, position);
      const lines = jsonUpToError.split('\n');
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }
  }

  return { line, column };
}

/**
 * Validates a JSON string against a schema using AJV. Lazy-loads AJV on first call.
 */
export async function validateJson(
  jsonInput: string,
  schema: JsonSchema,
): Promise<ValidationResult> {
  if (!jsonInput.trim()) {
    return {
      valid: false,
      errors: [{ path: '/', message: 'Empty JSON input' }],
    };
  }

  try {
    const jsonObject = JSON.parse(jsonInput);
    const ajv = await loadAjv();
    const validate = getValidator(ajv, schema);
    const valid = validate(jsonObject);

    if (!valid) {
      const errors =
        validate.errors?.map((error) => {
          const path = error.instancePath || '/';
          const position = findLineNumberForPath(jsonInput, path);
          return {
            path,
            message: error.message || 'Unknown error',
            line: position?.line,
            column: position?.column,
          };
        }) || [];

      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  } catch (error) {
    if (!(error instanceof Error)) {
      return {
        valid: false,
        errors: [{ path: '/', message: `Unknown error: ${String(error)}` }],
      };
    }

    const { line, column } = extractErrorPosition(error, jsonInput);

    return {
      valid: false,
      errors: [{ path: '/', message: error.message, line, column }],
    };
  }
}
