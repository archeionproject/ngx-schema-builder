import {
  copySchema,
  createFieldSchema,
  getArrayItemsSchema,
  getSchemaPatternProperties,
  getSchemaProperties,
  hasChildren,
  listLocalDefinitions,
  removeObjectPatternProperty,
  removeObjectProperty,
  renameObjectPatternProperty,
  renameObjectProperty,
  updateArrayItems,
  updateObjectPatternProperty,
  updateObjectProperty,
  updatePropertyRequired,
  validateFieldName,
} from '../src/lib/internal/schema-editor';
import type { NewField, ObjectJsonSchema } from '../src/lib/types/json-schema';

const base: ObjectJsonSchema = {
  type: 'object',
  properties: { a: { type: 'string' }, b: { type: 'number' } },
  required: ['a'],
};

describe('copySchema', () => {
  it('deep-clones without sharing references', () => {
    const copy = copySchema(base);
    expect(copy).toEqual(base);
    expect(copy).not.toBe(base);
    expect(copy.properties).not.toBe(base.properties);
  });
});

describe('updateObjectProperty / updateObjectPatternProperty', () => {
  it('adds or replaces a property immutably', () => {
    const next = updateObjectProperty(base, 'c', { type: 'boolean' });
    expect(next.properties?.['c']).toEqual({ type: 'boolean' });
    expect(base.properties?.['c']).toBeUndefined();
  });

  it('adds a pattern property', () => {
    const next = updateObjectPatternProperty(base, '^x', { type: 'string' });
    expect(next.patternProperties?.['^x']).toEqual({ type: 'string' });
  });

  it('returns boolean schemas untouched', () => {
    expect(updateObjectProperty(true as never, 'c', {})).toBe(true);
  });
});

describe('removeObjectProperty / removeObjectPatternProperty', () => {
  it('removes a property and prunes it from required', () => {
    const next = removeObjectProperty(base, 'a');
    expect(next.properties?.['a']).toBeUndefined();
    expect(next.required).not.toContain('a');
  });

  it('drops the properties key entirely when last entry removed', () => {
    const single: ObjectJsonSchema = {
      type: 'object',
      properties: { only: { type: 'string' } },
    };
    const next = removeObjectProperty(single, 'only');
    expect(next.properties).toBeUndefined();
  });

  it('no-ops when the container is missing', () => {
    const schema: ObjectJsonSchema = { type: 'object' };
    expect(removeObjectPatternProperty(schema, 'x')).toBe(schema);
  });
});

describe('updatePropertyRequired', () => {
  it('adds to required when toggled on', () => {
    expect(updatePropertyRequired(base, 'b', true).required).toContain('b');
  });

  it('is idempotent when already required', () => {
    expect(updatePropertyRequired(base, 'a', true).required).toEqual(['a']);
  });

  it('removes from required when toggled off', () => {
    expect(updatePropertyRequired(base, 'a', false).required).toEqual([]);
  });
});

describe('updateArrayItems / getArrayItemsSchema', () => {
  it('sets items on an array schema', () => {
    const arr: ObjectJsonSchema = { type: 'array' };
    expect(updateArrayItems(arr, { type: 'string' })).toEqual({
      type: 'array',
      items: { type: 'string' },
    });
  });

  it('leaves non-array schemas untouched', () => {
    expect(updateArrayItems(base, { type: 'string' })).toBe(base);
  });

  it('reads items back, null when absent or not an array', () => {
    expect(
      getArrayItemsSchema({ type: 'array', items: { type: 'string' } }),
    ).toEqual({
      type: 'string',
    });
    expect(getArrayItemsSchema({ type: 'array' })).toBeNull();
    expect(getArrayItemsSchema({ type: 'string' })).toBeNull();
    expect(getArrayItemsSchema(true)).toBeNull();
  });
});

describe('createFieldSchema', () => {
  it('builds a $ref field from validation', () => {
    const field: NewField = {
      name: 'r',
      type: '$ref',
      required: false,
      description: '',
      validation: { $ref: '#/$defs/X' },
    };
    expect(createFieldSchema(field)).toEqual({ $ref: '#/$defs/X' });
  });

  it('falls back to empty $ref', () => {
    expect(
      createFieldSchema({
        name: 'r',
        type: '$ref',
        required: false,
        description: '',
      }),
    ).toEqual({ $ref: '' });
  });

  it('builds default combinators', () => {
    expect(
      createFieldSchema({
        name: 'c',
        type: 'anyOf',
        required: false,
        description: '',
      }),
    ).toEqual({
      anyOf: [{ type: 'string' }, { type: 'number' }],
      description: undefined,
    });
    expect(
      createFieldSchema({
        name: 'c',
        type: 'allOf',
        required: false,
        description: '',
      }),
    ).toEqual({
      allOf: [{ type: 'object' }],
      description: undefined,
    });
  });

  it('merges validation into a primitive field', () => {
    const field: NewField = {
      name: 'p',
      type: 'string',
      required: false,
      description: 'desc',
      validation: { minLength: 1 },
      additionalProperties: false,
    };
    expect(createFieldSchema(field)).toEqual({
      type: 'string',
      description: 'desc',
      minLength: 1,
      additionalProperties: false,
    });
  });

  it('builds a bare primitive when no validation', () => {
    expect(
      createFieldSchema({
        name: 'p',
        type: 'string',
        required: false,
        description: 'd',
      }),
    ).toEqual({ type: 'string', description: 'd' });
  });
});

describe('validateFieldName', () => {
  it.each([
    ['valid', true],
    ['_underscore', true],
    ['$dollar', true],
    ['a1', true],
    ['1leading', false],
    ['has space', false],
    ['', false],
    ['   ', false],
  ])('"%s" -> %s', (name, expected) => {
    expect(validateFieldName(name)).toBe(expected);
  });
});

describe('getSchemaProperties / getSchemaPatternProperties', () => {
  it('lists properties with required flags', () => {
    const props = getSchemaProperties(base);
    expect(props).toContainEqual({
      name: 'a',
      schema: { type: 'string' },
      required: true,
    });
    expect(props).toContainEqual({
      name: 'b',
      schema: { type: 'number' },
      required: false,
    });
  });

  it('lists pattern properties (never required)', () => {
    const schema: ObjectJsonSchema = {
      type: 'object',
      patternProperties: { '^x': { type: 'string' } },
    };
    expect(getSchemaPatternProperties(schema)).toEqual([
      { name: '^x', schema: { type: 'string' }, required: false },
    ]);
  });

  it('returns empty for boolean or container-less schemas', () => {
    expect(getSchemaProperties(true)).toEqual([]);
    expect(getSchemaProperties({ type: 'object' })).toEqual([]);
  });
});

describe('rename helpers', () => {
  it('renames a property and updates required', () => {
    const next = renameObjectProperty(base, 'a', 'z');
    expect(next.properties?.['z']).toEqual({ type: 'string' });
    expect(next.properties?.['a']).toBeUndefined();
    expect(next.required).toContain('z');
  });

  it('renames a pattern property', () => {
    const schema: ObjectJsonSchema = {
      type: 'object',
      patternProperties: { '^x': { type: 'string' } },
    };
    const next = renameObjectPatternProperty(schema, '^x', '^y');
    expect(next.patternProperties?.['^y']).toBeDefined();
  });

  it('no-ops without a container', () => {
    const schema: ObjectJsonSchema = { type: 'object' };
    expect(renameObjectPatternProperty(schema, 'a', 'b')).toBe(schema);
  });
});

describe('hasChildren', () => {
  it('is true for objects with properties', () => {
    expect(hasChildren(base)).toBe(true);
  });

  it('is true for arrays of objects with properties', () => {
    expect(
      hasChildren({
        type: 'array',
        items: { type: 'object', properties: { a: {} } },
      }),
    ).toBe(true);
  });

  it('is false for primitives, booleans and empty objects', () => {
    expect(hasChildren({ type: 'string' })).toBe(false);
    expect(hasChildren(true)).toBe(false);
    expect(hasChildren({ type: 'object' })).toBe(false);
    expect(hasChildren({ type: 'array', items: { type: 'string' } })).toBe(
      false,
    );
  });
});

describe('listLocalDefinitions', () => {
  it('lists $defs as #/$defs/<name> refs', () => {
    const defs = listLocalDefinitions({
      type: 'object',
      $defs: { Address: { type: 'object' }, User: { type: 'object' } },
    });
    expect(defs).toEqual([
      { name: 'Address', ref: '#/$defs/Address' },
      { name: 'User', ref: '#/$defs/User' },
    ]);
  });

  it('falls back to legacy definitions key', () => {
    const defs = listLocalDefinitions({
      type: 'object',
      definitions: { Foo: { type: 'string' } },
    });
    expect(defs).toEqual([{ name: 'Foo', ref: '#/definitions/Foo' }]);
  });

  it('prefers $defs when both keys are present', () => {
    const defs = listLocalDefinitions({
      $defs: { A: { type: 'object' } },
      definitions: { B: { type: 'object' } },
    });
    expect(defs).toEqual([{ name: 'A', ref: '#/$defs/A' }]);
  });

  it('returns [] for boolean schema or no definitions', () => {
    expect(listLocalDefinitions(true)).toEqual([]);
    expect(listLocalDefinitions({ type: 'object' })).toEqual([]);
  });
});
