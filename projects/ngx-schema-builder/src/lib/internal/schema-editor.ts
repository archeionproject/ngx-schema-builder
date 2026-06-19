import type {
  JsonSchema,
  NewField,
  ObjectJsonSchema,
  SchemaEditorType,
} from '../types/json-schema';
import { isBooleanSchema, isObjectSchema } from '../types/json-schema';

/** Starting schema for each editor type, used when creating or switching fields. */
export const DEFAULT_SCHEMAS: Record<SchemaEditorType, ObjectJsonSchema> = {
  string: { type: 'string' },
  number: { type: 'number' },
  integer: { type: 'integer' },
  boolean: { type: 'boolean' },
  object: { type: 'object' },
  array: { type: 'array' },
  null: { type: 'null' },
  anyOf: { anyOf: [{ type: 'string' }, { type: 'number' }] },
  oneOf: { oneOf: [{ type: 'string' }, { type: 'number' }] },
  allOf: { allOf: [{ type: 'object' }] },
  $ref: { $ref: '' },
};

export interface SchemaProperty {
  name: string;
  schema: JsonSchema;
  required: boolean;
}

/** A local `$defs`/`definitions` entry, ready to use as a `$ref` target. */
export interface LocalDefinition {
  /** Definition name as stored under `$defs`/`definitions`. */
  name: string;
  /** JSON Pointer ref to the definition, e.g. `#/$defs/Address`. */
  ref: string;
}

export function listLocalDefinitions(
  schema: JsonSchema,
): readonly LocalDefinition[] {
  if (isBooleanSchema(schema)) return [];
  const key = schema.definitions && !schema.$defs ? 'definitions' : '$defs';
  const source = schema[key];
  if (!source) return [];
  return Object.keys(source).map((name) => ({
    name,
    ref: `#/${key}/${name}`,
  }));
}

export function copySchema<T extends JsonSchema>(schema: T): T {
  if (typeof structuredClone === 'function') return structuredClone(schema);
  return JSON.parse(JSON.stringify(schema)) as T;
}

export function updateObjectProperty(
  schema: ObjectJsonSchema,
  propertyName: string,
  propertySchema: JsonSchema,
): ObjectJsonSchema {
  return updateObjectSchemaEntry(
    schema,
    'properties',
    propertyName,
    propertySchema,
  );
}

export function updateObjectPatternProperty(
  schema: ObjectJsonSchema,
  propertyName: string,
  propertySchema: JsonSchema,
): ObjectJsonSchema {
  return updateObjectSchemaEntry(
    schema,
    'patternProperties',
    propertyName,
    propertySchema,
  );
}

function updateObjectSchemaEntry(
  schema: ObjectJsonSchema,
  schemaProperty: 'properties' | 'patternProperties',
  propertyName: string,
  propertySchema: JsonSchema,
): ObjectJsonSchema {
  if (!isObjectSchema(schema)) return schema;

  const newSchema = copySchema(schema);
  const entries = { ...(newSchema[schemaProperty] ?? {}) };
  entries[propertyName] = propertySchema;
  newSchema[schemaProperty] = entries;
  return newSchema;
}

export function removeObjectProperty(
  schema: ObjectJsonSchema,
  propertyName: string,
): ObjectJsonSchema {
  const withoutEntry = removeObjectSchemaEntry(
    schema,
    'properties',
    propertyName,
  );

  if (!withoutEntry.required?.includes(propertyName)) return withoutEntry;

  // Clone if the helper returned the original, so pruning `required` stays pure.
  const newSchema = withoutEntry === schema ? copySchema(schema) : withoutEntry;
  newSchema.required = newSchema.required?.filter(
    (name) => name !== propertyName,
  );

  return newSchema;
}

export function removeObjectPatternProperty(
  schema: ObjectJsonSchema,
  propertyName: string,
): ObjectJsonSchema {
  return removeObjectSchemaEntry(schema, 'patternProperties', propertyName);
}

function removeObjectSchemaEntry(
  schema: ObjectJsonSchema,
  schemaProperty: 'properties' | 'patternProperties',
  propertyName: string,
): ObjectJsonSchema {
  if (!isObjectSchema(schema) || !schema[schemaProperty]) return schema;

  const newSchema = copySchema(schema);
  const entries = newSchema[schemaProperty] ?? {};
  const { [propertyName]: _removed, ...remaining } = entries;

  if (Object.keys(remaining).length === 0) {
    delete newSchema[schemaProperty];
    return newSchema;
  }

  newSchema[schemaProperty] = remaining;
  return newSchema;
}

export function updatePropertyRequired(
  schema: ObjectJsonSchema,
  propertyName: string,
  required: boolean,
): ObjectJsonSchema {
  if (!isObjectSchema(schema)) return schema;

  const newSchema = copySchema(schema);
  const current = newSchema.required ?? [];

  if (required) {
    if (!current.includes(propertyName)) {
      newSchema.required = [...current, propertyName];
    } else {
      newSchema.required = current;
    }
  } else {
    newSchema.required = current.filter((name) => name !== propertyName);
  }

  return newSchema;
}

export function updateArrayItems(
  schema: JsonSchema,
  itemsSchema: JsonSchema,
): JsonSchema {
  if (isObjectSchema(schema) && schema.type === 'array') {
    return { ...schema, items: itemsSchema };
  }
  return schema;
}

export function createFieldSchema(field: NewField): JsonSchema {
  const { type, description, validation, additionalProperties } = field;

  if (type === '$ref') {
    const ref =
      validation &&
      isObjectSchema(validation) &&
      typeof validation.$ref === 'string'
        ? validation.$ref
        : '';
    return { $ref: ref };
  }

  if (type === 'anyOf' || type === 'oneOf' || type === 'allOf') {
    const schema: ObjectJsonSchema = validation ?? {
      [type]:
        type === 'allOf'
          ? [{ type: 'object' as const }]
          : [{ type: 'string' as const }, { type: 'number' as const }],
    };

    return {
      ...schema,
      description: description || undefined,
    };
  }

  if (validation && isObjectSchema(validation)) {
    return {
      type,
      description,
      ...validation,
      ...(additionalProperties === false ? { additionalProperties } : {}),
    };
  }

  return { type, description };
}

export function validateFieldName(name: string): boolean {
  if (!name || name.trim() === '') return false;
  const validNamePattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  return validNamePattern.test(name);
}

export function getSchemaProperties(schema: JsonSchema): SchemaProperty[] {
  const required = isObjectSchema(schema) ? (schema.required ?? []) : [];
  return getObjectSchemaEntries(schema, 'properties').map((entry) =>
    propertyFromEntry(entry, required),
  );
}

export function getSchemaPatternProperties(
  schema: JsonSchema,
): SchemaProperty[] {
  return getObjectSchemaEntries(schema, 'patternProperties').map((entry) =>
    propertyFromEntry(entry),
  );
}

function getObjectSchemaEntries(
  schema: JsonSchema,
  schemaProperty: 'properties' | 'patternProperties',
): Array<[string, JsonSchema]> {
  if (!isObjectSchema(schema) || !schema[schemaProperty]) return [];
  return Object.entries(schema[schemaProperty]);
}

function propertyFromEntry(
  [name, propSchema]: [string, JsonSchema],
  required: string[] = [],
): SchemaProperty {
  return {
    name,
    schema: propSchema,
    required: required.includes(name),
  };
}

export function getArrayItemsSchema(schema: JsonSchema): JsonSchema | null {
  if (isBooleanSchema(schema)) return null;
  if (schema.type !== 'array') return null;
  return schema.items ?? null;
}

export function renameObjectProperty(
  schema: ObjectJsonSchema,
  oldName: string,
  newName: string,
): ObjectJsonSchema {
  const renamed = renameObjectSchemaEntry(
    schema,
    'properties',
    oldName,
    newName,
  );

  if (!renamed.required?.includes(oldName)) return renamed;

  // Clone if the helper returned the original, so remapping `required` stays pure.
  const newSchema = renamed === schema ? copySchema(schema) : renamed;
  newSchema.required = newSchema.required?.map((field) =>
    field === oldName ? newName : field,
  );

  return newSchema;
}

export function renameObjectPatternProperty(
  schema: ObjectJsonSchema,
  oldName: string,
  newName: string,
): ObjectJsonSchema {
  return renameObjectSchemaEntry(schema, 'patternProperties', oldName, newName);
}

function renameObjectSchemaEntry(
  schema: ObjectJsonSchema,
  schemaProperty: 'properties' | 'patternProperties',
  oldName: string,
  newName: string,
): ObjectJsonSchema {
  if (!isObjectSchema(schema) || !schema[schemaProperty]) return schema;

  const newSchema = copySchema(schema);
  const entries = newSchema[schemaProperty] ?? {};
  const renamed: Record<string, JsonSchema> = {};

  for (const [key, value] of Object.entries(entries)) {
    renamed[key === oldName ? newName : key] = value;
  }

  newSchema[schemaProperty] = renamed;
  return newSchema;
}
