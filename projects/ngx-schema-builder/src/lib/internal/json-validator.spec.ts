import { validateJson, findLineNumberForPath } from './json-validator';
import type { JsonSchema } from '../types/json-schema';

const schema: JsonSchema = {
  type: 'object',
  properties: {
    age: { type: 'number' },
    name: { type: 'string' },
  },
  required: ['age'],
};

describe('validateJson', () => {
  it('accepts a document that matches the schema', async () => {
    const result = await validateJson('{ "age": 30, "name": "a" }', schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('reports a schema violation', async () => {
    const result = await validateJson('{ "name": "a" }', schema);
    expect(result.valid).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it('reports a wrong-type violation', async () => {
    const result = await validateJson('{ "age": "thirty" }', schema);
    expect(result.valid).toBe(false);
  });

  it('reports a syntax error for invalid JSON', async () => {
    const result = await validateJson('{ not json', schema);
    expect(result.valid).toBe(false);
    expect(result.errors?.[0]?.line).toBeDefined();
  });

  it('treats empty input as invalid', async () => {
    const result = await validateJson('   ', schema);
    expect(result.valid).toBe(false);
  });
});

describe('findLineNumberForPath', () => {
  const json = '{\n  "age": 30,\n  "name": "a"\n}';

  it('maps the root path to line 1', () => {
    expect(findLineNumberForPath(json, '/')).toEqual({ line: 1, column: 1 });
  });

  it('locates a top-level property', () => {
    const pos = findLineNumberForPath(json, '/name');
    expect(pos?.line).toBe(3);
  });
});
