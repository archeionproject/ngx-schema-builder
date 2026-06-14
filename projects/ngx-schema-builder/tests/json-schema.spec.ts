import {
  asObjectSchema,
  asRefSchema,
  getEditorType,
  getSchemaDescription,
  isAllOfSchema,
  isAnyOfSchema,
  isBooleanSchema,
  isObjectSchema,
  isOneOfSchema,
  isRefSchema,
  withObjectSchema,
} from '../src/lib/types/json-schema';

describe('schema guards', () => {
  it('detects boolean schemas', () => {
    expect(isBooleanSchema(true)).toBe(true);
    expect(isBooleanSchema(false)).toBe(true);
    expect(isBooleanSchema({ type: 'string' })).toBe(false);
  });

  it('detects object schemas', () => {
    expect(isObjectSchema({ type: 'object' })).toBe(true);
    expect(isObjectSchema(false)).toBe(false);
  });

  it('detects $ref schemas', () => {
    expect(isRefSchema({ $ref: '#/$defs/Foo' })).toBe(true);
    expect(isRefSchema({ type: 'string' })).toBe(false);
    expect(isRefSchema(true)).toBe(false);
  });

  it('detects combinators', () => {
    expect(isAnyOfSchema({ anyOf: [{ type: 'string' }] })).toBe(true);
    expect(isOneOfSchema({ oneOf: [{ type: 'string' }] })).toBe(true);
    expect(isAllOfSchema({ allOf: [{ type: 'string' }] })).toBe(true);
    expect(isAnyOfSchema({ type: 'string' })).toBe(false);
  });

  it('coerces a boolean schema to a null-typed object schema', () => {
    expect(asObjectSchema(true)).toEqual({ type: 'null' });
    expect(asObjectSchema({ type: 'string' })).toEqual({ type: 'string' });
  });

  it('asRefSchema returns the ref or an empty ref fallback', () => {
    expect(asRefSchema({ $ref: '#/x' })).toEqual({ $ref: '#/x' });
    expect(asRefSchema(true)).toEqual({ $ref: '' });
  });

  it('getSchemaDescription reads description or empty string', () => {
    expect(getSchemaDescription({ type: 'string', description: 'hi' })).toBe('hi');
    expect(getSchemaDescription({ type: 'string' })).toBe('');
    expect(getSchemaDescription(true)).toBe('');
  });

  it('withObjectSchema applies fn for objects, default for booleans', () => {
    expect(
      withObjectSchema<string>({ type: 'string' }, (s) => String(s.type), 'x'),
    ).toBe('string');
    expect(withObjectSchema<string>(true, (s) => String(s.type), 'fallback')).toBe(
      'fallback',
    );
  });
});

describe('getEditorType', () => {
  it('maps primitive types to their editor type', () => {
    expect(getEditorType({ type: 'string' })).toBe('string');
    expect(getEditorType({ type: 'number' })).toBe('number');
    expect(getEditorType({ type: 'integer' })).toBe('integer');
    expect(getEditorType({ type: 'boolean' })).toBe('boolean');
    expect(getEditorType({ type: 'array' })).toBe('array');
    expect(getEditorType({ type: 'null' })).toBe('null');
  });

  it('maps combinators and refs (ref wins precedence)', () => {
    expect(getEditorType({ $ref: '#/$defs/Foo' })).toBe('$ref');
    expect(getEditorType({ anyOf: [{ type: 'string' }] })).toBe('anyOf');
    expect(getEditorType({ oneOf: [{ type: 'string' }] })).toBe('oneOf');
    expect(getEditorType({ allOf: [{ type: 'string' }] })).toBe('allOf');
  });

  it('defaults to object for untyped or boolean schemas', () => {
    expect(getEditorType({})).toBe('object');
    expect(getEditorType(true)).toBe('object');
  });
});
