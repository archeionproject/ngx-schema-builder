import {
  asObjectSchema,
  getEditorType,
  isAnyOfSchema,
  isBooleanSchema,
  isObjectSchema,
  isRefSchema,
} from './json-schema';

describe('schema guards', () => {
  it('detects boolean schemas', () => {
    expect(isBooleanSchema(true)).toBe(true);
    expect(isBooleanSchema({ type: 'string' })).toBe(false);
  });

  it('detects object schemas', () => {
    expect(isObjectSchema({ type: 'object' })).toBe(true);
    expect(isObjectSchema(false)).toBe(false);
  });

  it('detects $ref schemas', () => {
    expect(isRefSchema({ $ref: '#/$defs/Foo' })).toBe(true);
    expect(isRefSchema({ type: 'string' })).toBe(false);
  });

  it('detects combinators', () => {
    expect(isAnyOfSchema({ anyOf: [{ type: 'string' }] })).toBe(true);
  });

  it('coerces a boolean schema to a null-typed object schema', () => {
    expect(asObjectSchema(true)).toEqual({ type: 'null' });
    expect(asObjectSchema({ type: 'string' })).toEqual({ type: 'string' });
  });
});

describe('getEditorType', () => {
  it('maps primitive types to their editor type', () => {
    expect(getEditorType({ type: 'string' })).toBe('string');
    expect(getEditorType({ type: 'number' })).toBe('number');
  });

  it('maps combinators and refs', () => {
    expect(getEditorType({ $ref: '#/$defs/Foo' })).toBe('$ref');
    expect(getEditorType({ anyOf: [{ type: 'string' }] })).toBe('anyOf');
    expect(getEditorType({ oneOf: [{ type: 'string' }] })).toBe('oneOf');
    expect(getEditorType({ allOf: [{ type: 'string' }] })).toBe('allOf');
  });

  it('defaults to object', () => {
    expect(getEditorType({})).toBe('object');
  });
});
