import type {
  JsonSchema,
  NewField,
  ObjectJsonSchema,
} from '../types/json-schema';
import { isBooleanSchema, isObjectSchema } from '../types/json-schema';

/**
 * Field shape used by every editor row.
 * Mirrors `Property` from `lib/schemaEditor.ts` in the React port.
 */
export interface SchemaProperty {
  name: string;
  schema: JsonSchema;
  required: boolean;
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
  const newSchema = removeObjectSchemaEntry(schema, 'properties', propertyName);

  if (newSchema.required) {
    newSchema.required = newSchema.required.filter(
      (name) => name !== propertyName,
    );
  }

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
      validation && isObjectSchema(validation) && typeof validation.$ref === 'string'
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
  const newSchema = renameObjectSchemaEntry(
    schema,
    'properties',
    oldName,
    newName,
  );

  if (newSchema.required) {
    newSchema.required = newSchema.required.map((field) =>
      field === oldName ? newName : field,
    );
  }

  return newSchema;
}

export function renameObjectPatternProperty(
  schema: ObjectJsonSchema,
  oldName: string,
  newName: string,
): ObjectJsonSchema {
  return renameObjectSchemaEntry(
    schema,
    'patternProperties',
    oldName,
    newName,
  );
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

export function hasChildren(schema: JsonSchema): boolean {
  if (!isObjectSchema(schema)) return false;

  if (schema.type === 'object' && schema.properties) {
    return Object.keys(schema.properties).length > 0;
  }

  if (schema.type === 'array' && schema.items && isObjectSchema(schema.items)) {
    return schema.items.type === 'object' && !!schema.items.properties;
  }

  return false;
}
