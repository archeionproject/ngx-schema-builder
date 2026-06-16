import {
  extractErrorPosition,
  validateJson,
} from '../src/lib/internal/json-validator';
import type { JsonSchema } from '../src/lib/types/json-schema';

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

  it('reports a schema violation with a path', async () => {
    const result = await validateJson('{ "name": "a" }', schema);
    expect(result.valid).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it('reports a wrong-type violation', async () => {
    const result = await validateJson('{ "age": "thirty" }', schema);
    expect(result.valid).toBe(false);
  });

  it('reports a syntax error with a line for invalid JSON', async () => {
    const result = await validateJson('{ not json', schema);
    expect(result.valid).toBe(false);
    expect(result.errors?.[0]?.line).toBeDefined();
  });

  it('treats empty input as invalid', async () => {
    const result = await validateJson('   ', schema);
    expect(result.valid).toBe(false);
    expect(result.errors?.[0]?.message).toBe('Empty JSON input');
  });

  it('validates string formats via ajv-formats', async () => {
    const emailSchema: JsonSchema = {
      type: 'object',
      properties: { email: { type: 'string', format: 'email' } },
    };
    const ok = await validateJson('{ "email": "a@b.com" }', emailSchema);
    expect(ok.valid).toBe(true);
  });
});

describe('extractErrorPosition', () => {
  it('parses "line X column Y" messages', () => {
    expect(
      extractErrorPosition(new Error('Bad at line 4 column 7'), ''),
    ).toEqual({ line: 4, column: 7 });
  });

  it('derives line/column from a position offset', () => {
    const input = 'line1\nline2broken';
    const pos = extractErrorPosition(
      new Error('Unexpected at position 8'),
      input,
    );
    expect(pos.line).toBe(2);
    expect(pos.column).toBeGreaterThan(0);
  });

  it('defaults to 1:1 when nothing matches', () => {
    expect(extractErrorPosition(new Error('opaque'), '')).toEqual({
      line: 1,
      column: 1,
    });
  });
});
