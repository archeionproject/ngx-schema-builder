import { inferSchema, createSchemaFromJson } from './schema-inference';
import { asObjectSchema } from '../types/json-schema';

describe('inferSchema', () => {
  it('infers primitive types', () => {
    expect(inferSchema(null)).toEqual({ type: 'null' });
    expect(inferSchema(true)).toEqual({ type: 'boolean' });
    expect(inferSchema('hello')).toEqual({ type: 'string' });
  });

  it('distinguishes integers from floats', () => {
    expect(inferSchema(42)).toEqual({ type: 'integer' });
    expect(inferSchema(4.2)).toEqual({ type: 'number' });
  });

  it('detects well-known string formats', () => {
    expect(inferSchema('user@example.com')).toEqual({
      type: 'string',
      format: 'email',
    });
    expect(inferSchema('2026-06-14')).toEqual({
      type: 'string',
      format: 'date',
    });
  });

  it('infers object schemas with properties', () => {
    const schema = asObjectSchema(inferSchema({ name: 'a', age: 30 }));
    expect(schema.type).toBe('object');
    expect(schema.properties?.['name']).toEqual({ type: 'string' });
    expect(schema.properties?.['age']).toEqual({ type: 'integer' });
  });

  it('infers array schemas', () => {
    const schema = asObjectSchema(inferSchema([1, 2, 3]));
    expect(schema.type).toBe('array');
  });
});

describe('createSchemaFromJson', () => {
  it('wraps an inferred object with document metadata', () => {
    const schema = asObjectSchema(createSchemaFromJson({ name: 'a' }));
    expect(schema.$schema).toBe('https://json-schema.org/draft-07/schema');
    expect(schema.title).toBe('Generated Schema');
    expect(schema.type).toBe('object');
    expect(schema.properties?.['name']).toEqual({ type: 'string' });
  });

  it('normalizes a primitive root into an object wrapper', () => {
    const schema = asObjectSchema(createSchemaFromJson('just-a-string'));
    expect(schema.type).toBe('object');
    expect(schema.properties?.['value']).toEqual({ type: 'string' });
    expect(schema.required).toContain('value');
  });
});
