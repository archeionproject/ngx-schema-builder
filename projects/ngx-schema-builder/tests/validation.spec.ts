import {
  buildValidationTree,
  getTypeValidation,
  validateSchemaByType,
} from '../src/lib/types/validation';
import { en } from '../src/lib/i18n/locales/en';

const t = en;

describe('getTypeValidation', () => {
  it('returns a zod schema per known type', () => {
    for (const type of ['string', 'number', 'array', 'object']) {
      expect(getTypeValidation(type, t).safeParse({})).toBeDefined();
    }
  });

  it('falls back to z.unknown for unknown types', () => {
    expect(getTypeValidation('boolean', t).safeParse('anything').success).toBe(true);
  });
});

describe('validateSchemaByType', () => {
  it('passes a consistent string schema', () => {
    expect(validateSchemaByType({ minLength: 1, maxLength: 5 }, 'string', t).success).toBe(
      true,
    );
  });

  it('fails when minLength > maxLength', () => {
    const r = validateSchemaByType({ minLength: 5, maxLength: 1 }, 'string', t);
    expect(r.success).toBe(false);
    expect(r.errors?.length).toBeGreaterThan(0);
  });

  it('rejects a negative / non-integer length', () => {
    expect(validateSchemaByType({ minLength: -1 }, 'string', t).success).toBe(false);
    expect(validateSchemaByType({ minLength: 1.5 }, 'string', t).success).toBe(false);
  });

  it('rejects number with both inclusive and exclusive minimum', () => {
    expect(
      validateSchemaByType({ minimum: 1, exclusiveMinimum: 0 }, 'number', t).success,
    ).toBe(false);
  });

  it('rejects number with min > max', () => {
    expect(validateSchemaByType({ minimum: 10, maximum: 1 }, 'number', t).success).toBe(
      false,
    );
  });

  it('rejects enum values outside the numeric range', () => {
    expect(
      validateSchemaByType({ minimum: 0, maximum: 5, enum: [10] }, 'number', t).success,
    ).toBe(false);
  });

  it('accepts enum values within range', () => {
    expect(
      validateSchemaByType({ minimum: 0, maximum: 5, enum: [1, 2] }, 'number', t).success,
    ).toBe(true);
  });

  it('rejects multipleOf <= 0', () => {
    expect(validateSchemaByType({ multipleOf: 0 }, 'number', t).success).toBe(false);
  });

  it('validates array min/max items and contains', () => {
    expect(validateSchemaByType({ minItems: 2, maxItems: 1 }, 'array', t).success).toBe(
      false,
    );
    expect(
      validateSchemaByType({ minContains: 2, maxContains: 1 }, 'array', t).success,
    ).toBe(false);
  });

  it('validates object min/max properties', () => {
    expect(
      validateSchemaByType({ minProperties: 5, maxProperties: 1 }, 'object', t).success,
    ).toBe(false);
  });
});

describe('buildValidationTree', () => {
  it('marks `true` schema valid and `false` invalid', () => {
    expect(buildValidationTree(true, t).validation.success).toBe(true);
    const f = buildValidationTree(false, t);
    expect(f.validation.success).toBe(false);
    expect(f.cumulativeChildrenErrors).toBeGreaterThan(0);
  });

  it('recurses into object properties and pattern properties', () => {
    const tree = buildValidationTree(
      {
        type: 'object',
        properties: { a: { type: 'string' } },
        patternProperties: { '^x': { type: 'number' } },
      },
      t,
    );
    expect(tree.name).toBe('object');
    expect(tree.children['a']).toBeDefined();
    expect(tree.children['pattern:^x']).toBeDefined();
  });

  it('recurses into array items, tuple items and prefixItems', () => {
    const single = buildValidationTree(
      { type: 'array', items: { type: 'string' } },
      t,
    );
    expect(single.children['items']).toBeDefined();

    const tuple = buildValidationTree(
      {
        type: 'array',
        items: [{ type: 'string' }],
        prefixItems: [{ type: 'number' }],
      } as never,
      t,
    );
    expect(tuple.children['items[0]']).toBeDefined();
    expect(tuple.children['prefixItems[0]']).toBeDefined();
  });

  it('recurses into combinators, not, $defs and definitions', () => {
    const tree = buildValidationTree(
      {
        allOf: [{ type: 'object' }],
        anyOf: [{ type: 'string' }],
        oneOf: [{ type: 'number' }],
        not: { type: 'null' },
        $defs: { A: { type: 'string' } },
        definitions: { B: { type: 'number' } },
      },
      t,
    );
    expect(tree.children['allOf:0']).toBeDefined();
    expect(tree.children['anyOf:0']).toBeDefined();
    expect(tree.children['oneOf:0']).toBeDefined();
    expect(tree.children['not']).toBeDefined();
    expect(tree.children['$defs:A']).toBeDefined();
    expect(tree.children['definitions:B']).toBeDefined();
  });

  it('accumulates descendant errors', () => {
    const tree = buildValidationTree(
      { type: 'object', properties: { bad: { type: 'string', minLength: -1 } } },
      t,
    );
    expect(tree.cumulativeChildrenErrors).toBeGreaterThan(0);
  });

  it('derives type from a string[] type and defaults to object', () => {
    expect(buildValidationTree({ type: ['object', 'null'] } as never, t).name).toBe(
      'object',
    );
    expect(buildValidationTree({} as never, t).name).toBe('object');
  });
});
