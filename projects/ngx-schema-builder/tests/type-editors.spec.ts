import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TypeEditorComponent } from '../src/lib/components/schema-editor-internal/type-editor.component';
import { ArrayEditorComponent } from '../src/lib/components/type-editors/array-editor.component';
import { BooleanEditorComponent } from '../src/lib/components/type-editors/boolean-editor.component';
import { CombinatorEditorComponent } from '../src/lib/components/type-editors/combinator-editor.component';
import { NumberEditorComponent } from '../src/lib/components/type-editors/number-editor.component';
import { ObjectEditorComponent } from '../src/lib/components/type-editors/object-editor.component';
import { RefEditorComponent } from '../src/lib/components/type-editors/ref-editor.component';
import { StringEditorComponent } from '../src/lib/components/type-editors/string-editor.component';
import { en } from '../src/lib/i18n/locales/en';
import type { JsonSchema } from '../src/lib/types/json-schema';
import { buildValidationTree } from '../src/lib/types/validation';
import { provideSchemaBuilder } from '../src/provide';
import { fuzz } from './test-helpers';

function mountEditor<T>(
  component: Type<T>,
  schema: JsonSchema,
  extra: Record<string, unknown> = {},
) {
  const fixture = TestBed.createComponent(component);
  fixture.componentRef.setInput('schema', schema);
  fixture.componentRef.setInput('readOnly', false);
  fixture.componentRef.setInput(
    'validationNode',
    buildValidationTree(schema, en),
  );
  for (const [k, v] of Object.entries(extra))
    fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

const STRING_SCHEMA: JsonSchema = {
  type: 'string',
  minLength: 1,
  maxLength: 10,
  pattern: '.*',
  format: 'email',
  enum: ['a', 'b'],
};
const NUMBER_SCHEMA: JsonSchema = {
  type: 'number',
  minimum: 0,
  maximum: 10,
  multipleOf: 2,
  enum: [2, 4],
};
const OBJECT_SCHEMA: JsonSchema = {
  type: 'object',
  properties: { a: { type: 'string' } },
  patternProperties: { '^x': { type: 'number' } },
  required: ['a'],
  minProperties: 1,
  maxProperties: 5,
};
const ARRAY_SCHEMA: JsonSchema = {
  type: 'array',
  items: { type: 'string' },
  minItems: 1,
  maxItems: 5,
  uniqueItems: true,
};

describe('type editors (direct mount)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideSchemaBuilder()] });
  });

  it('StringEditorComponent renders and reacts', () => {
    const fixture = mountEditor(StringEditorComponent, STRING_SCHEMA);
    fuzz(fixture);
    fixture.componentRef.setInput('readOnly', true);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('NumberEditorComponent renders for number and integer', () => {
    for (const integer of [false, true]) {
      const fixture = mountEditor(NumberEditorComponent, NUMBER_SCHEMA, {
        integer,
      });
      fuzz(fixture);
      expect(fixture.componentInstance).toBeTruthy();
    }
  });

  it('BooleanEditorComponent renders and reacts', () => {
    const fixture = mountEditor(BooleanEditorComponent, { type: 'boolean' });
    fuzz(fixture);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('ObjectEditorComponent renders nested properties', () => {
    const fixture = mountEditor(ObjectEditorComponent, OBJECT_SCHEMA);
    fuzz(fixture);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('ArrayEditorComponent renders item constraints', () => {
    const fixture = mountEditor(ArrayEditorComponent, ARRAY_SCHEMA);
    fuzz(fixture);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('ArrayEditorComponent item-type reflects combinator/ref items (not "string")', () => {
    // Regression: items that are a combinator or $ref were mislabeled as
    // the default "string" because itemType read schema.type directly.
    const cases: Array<[JsonSchema, string]> = [
      [{ type: 'array', items: { oneOf: [{ type: 'string' }] } }, 'oneOf'],
      [{ type: 'array', items: { anyOf: [{ type: 'number' }] } }, 'anyOf'],
      [{ type: 'array', items: { allOf: [{ type: 'object' }] } }, 'allOf'],
      [{ type: 'array', items: { $ref: '#/$defs/Foo' } }, '$ref'],
      [{ type: 'array', items: { type: 'object' } }, 'object'],
    ];
    for (const [schema, expected] of cases) {
      const fixture = mountEditor(ArrayEditorComponent, schema);
      expect(fixture.componentInstance['itemType']()).toBe(expected);
    }
  });

  it('RefEditorComponent renders with suggestions', () => {
    const fixture = mountEditor(RefEditorComponent, { $ref: '#/$defs/Foo' });
    fuzz(fixture);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('CombinatorEditorComponent renders each combinator kind', () => {
    const cases: Array<[string, JsonSchema]> = [
      ['anyOf', { anyOf: [{ type: 'string' }, { type: 'number' }] }],
      ['oneOf', { oneOf: [{ type: 'string' }, { type: 'boolean' }] }],
      ['allOf', { allOf: [{ type: 'object' }] }],
    ];
    for (const [combinator, schema] of cases) {
      const fixture = mountEditor(CombinatorEditorComponent, schema, {
        combinator,
      });
      fuzz(fixture);
      expect(fixture.componentInstance).toBeTruthy();
    }
  });

  it('CombinatorEditorComponent keeps row ids stable when an option changes', () => {
    const fixture = mountEditor(
      CombinatorEditorComponent,
      { anyOf: [{ type: 'string' }, { type: 'number' }] },
      { combinator: 'anyOf' },
    );
    const ids = () =>
      (
        fixture.componentInstance as unknown as { ids: () => readonly string[] }
      ).ids();
    const before = [...ids()];

    // Edit an option's content without changing the number of options.
    fixture.componentRef.setInput('schema', {
      anyOf: [{ type: 'string', minLength: 1 }, { type: 'number' }],
    });
    fixture.detectChanges();

    expect(ids()).toEqual(before);
  });
});

describe('TypeEditorComponent dispatcher', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideSchemaBuilder()] });
  });

  it('dispatches to the right editor for every schema type', () => {
    const schemas: JsonSchema[] = [
      STRING_SCHEMA,
      NUMBER_SCHEMA,
      { type: 'integer' },
      { type: 'boolean' },
      OBJECT_SCHEMA,
      ARRAY_SCHEMA,
      { $ref: '#/$defs/Foo' },
      { anyOf: [{ type: 'string' }] },
      { oneOf: [{ type: 'string' }] },
      { allOf: [{ type: 'object' }] },
    ];
    for (const schema of schemas) {
      const fixture = TestBed.createComponent(TypeEditorComponent);
      fixture.componentRef.setInput('schema', schema);
      fixture.componentRef.setInput('readOnly', false);
      fixture.detectChanges();
      fuzz(fixture);
      expect(fixture.componentInstance).toBeTruthy();
    }
  });
});
