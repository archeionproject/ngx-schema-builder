import {
  createSchemaFromJson,
  inferSchema,
} from '../src/lib/internal/schema-inference';
import { asObjectSchema } from '../src/lib/types/json-schema';

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
    expect(inferSchema('2026-06-14T10:00:00Z')).toEqual({
      type: 'string',
      format: 'date-time',
    });
    expect(inferSchema('550e8400-e29b-41d4-a716-446655440000')).toEqual({
      type: 'string',
      format: 'uuid',
    });
    expect(inferSchema('https://example.com/x')).toEqual({
      type: 'string',
      format: 'uri',
    });
  });

  it('infers object schemas with sorted required keys', () => {
    const schema = asObjectSchema(
      inferSchema({ name: 'a', age: 30, maybe: null }),
    );
    expect(schema.type).toBe('object');
    expect(schema.properties?.['name']).toEqual({ type: 'string' });
    expect(schema.properties?.['age']).toEqual({ type: 'integer' });
    // null values are present but not required
    expect(schema.required).toEqual(['age', 'name']);
  });

  it('infers an empty array as items:{}', () => {
    expect(inferSchema([])).toEqual({ type: 'array', items: {} });
  });

  it('infers a homogeneous primitive array', () => {
    const schema = asObjectSchema(inferSchema([1, 2, 3]));
    expect(schema.type).toBe('array');
    expect(schema.items).toEqual({ type: 'integer' });
  });

  it('merges an array of objects into a single item schema with required', () => {
    const schema = asObjectSchema(
      inferSchema([
        { id: 1, name: 'a' },
        { id: 2, name: 'b', extra: true },
      ]),
    );
    const items = asObjectSchema(schema.items!);
    expect(items.type).toBe('object');
    // id + name appear in all items -> required; extra does not
    expect(items.required).toEqual(['id', 'name']);
  });

  it('merges incompatible primitive props into oneOf', () => {
    const schema = asObjectSchema(
      inferSchema([{ v: 1 }, { v: 'str' }, { v: 2 }, { v: 'x' }]),
    );
    const items = asObjectSchema(schema.items!);
    const v = asObjectSchema(items.properties!['v']);
    expect(v.oneOf).toBeDefined();
  });

  it('widens integer+number props to number', () => {
    const schema = asObjectSchema(inferSchema([{ v: 1 }, { v: 1.5 }]));
    const items = asObjectSchema(schema.items!);
    expect(asObjectSchema(items.properties!['v']).type).toBe('number');
  });

  it('produces a oneOf array for mixed scalar item types', () => {
    const schema = asObjectSchema(inferSchema([1, 'a']));
    const items = asObjectSchema(schema.items!);
    expect(items.oneOf).toBeDefined();
  });

  it('detects enums across a large homogeneous array', () => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      status: i % 2 === 0 ? 'on' : 'off',
    }));
    const schema = asObjectSchema(inferSchema(data));
    const status = asObjectSchema(
      asObjectSchema(schema.items!).properties!['status'],
    );
    expect(status.enum).toEqual(['off', 'on']);
  });

  it('detects coordinate arrays as fixed-length number arrays', () => {
    const data = Array.from({ length: 3 }, () => ({ coordinates: [1.1, 2.2] }));
    const schema = asObjectSchema(inferSchema(data));
    const coords = asObjectSchema(
      asObjectSchema(schema.items!).properties!['coordinates'],
    );
    expect(coords).toEqual({
      type: 'array',
      items: { type: 'number' },
      minItems: 2,
      maxItems: 2,
    });
  });

  it('detects unix-timestamp integer fields', () => {
    const now = Date.now();
    const data = Array.from({ length: 3 }, (_, i) => ({ createdAt: now + i }));
    const schema = asObjectSchema(inferSchema(data));
    const ts = asObjectSchema(
      asObjectSchema(schema.items!).properties!['createdAt'],
    );
    expect(ts.format).toBe('unix-timestamp');
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

  it('keeps an array root as an array document', () => {
    const schema = asObjectSchema(createSchemaFromJson([1, 2, 3]));
    expect(schema.type).toBe('array');
    expect(schema.items).toBeDefined();
  });

  it('normalizes a primitive root into an object wrapper', () => {
    const schema = asObjectSchema(createSchemaFromJson('just-a-string'));
    expect(schema.type).toBe('object');
    expect(schema.properties?.['value']).toEqual({ type: 'string' });
    expect(schema.required).toContain('value');
  });
});
