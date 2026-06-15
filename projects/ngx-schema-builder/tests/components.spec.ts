import { Type, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { InferSchemaDialogComponent } from '../src/lib/components/infer-schema-dialog/infer-schema-dialog.component';
import { SchemaBuilderComponent } from '../src/lib/components/schema-builder/schema-builder.component';
import { SchemaFieldsEditorComponent } from '../src/lib/components/schema-fields-editor/schema-fields-editor.component';
import { SchemaJsonEditorComponent } from '../src/lib/components/schema-json-editor/schema-json-editor.component';
import { ValidateJsonDialogComponent } from '../src/lib/components/validate-json-dialog/validate-json-dialog.component';
import type { JsonSchema } from '../src/lib/types/json-schema';
import {
  provideSchemaBuilder,
  provideSchemaBuilderRefSuggestions,
} from '../src/provide';
import { fuzz } from './test-helpers';

const RICH_SCHEMA: JsonSchema = {
  type: 'object',
  required: ['str'],
  properties: {
    str: {
      type: 'string',
      minLength: 1,
      maxLength: 10,
      pattern: '.*',
      format: 'email',
      enum: ['a', 'b'],
    },
    num: {
      type: 'number',
      minimum: 0,
      maximum: 10,
      multipleOf: 2,
      enum: [2, 4],
    },
    int: { type: 'integer', minimum: 0, maximum: 5 },
    bool: { type: 'boolean' },
    arr: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 3,
      uniqueItems: true,
    },
    obj: {
      type: 'object',
      properties: { nested: { type: 'string' } },
      required: ['nested'],
    },
    any: { anyOf: [{ type: 'string' }, { type: 'number' }] },
    one: { oneOf: [{ type: 'string' }, { type: 'boolean' }] },
    all: { allOf: [{ type: 'object' }] },
    ref: { $ref: '#/$defs/Foo' },
  },
  $defs: { Foo: { type: 'object', properties: { id: { type: 'string' } } } },
};

function mount<T>(component: Type<T>, inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(component);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  return fixture;
}

describe('schema editor components (render + interaction)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideSchemaBuilder(),
        provideSchemaBuilderRefSuggestions(() =>
          signal([
            { id: '1', label: 'Foo', url: 'https://x/foo', description: 'd' },
            { id: '2', label: 'Bar', url: 'https://x/bar' },
          ]),
        ),
      ],
    });
  });

  it('SchemaFieldsEditorComponent renders the full type matrix and survives interaction', () => {
    const fixture = mount(SchemaFieldsEditorComponent, { value: RICH_SCHEMA });
    expect(fixture.componentInstance).toBeTruthy();
    fuzz(fixture);
    fuzz(fixture); // second pass exercises newly expanded children
    expect(fixture.componentInstance.value()).toBeDefined();
  });

  it('SchemaFieldsEditorComponent works in read-only mode', () => {
    const fixture = mount(SchemaFieldsEditorComponent, {
      value: RICH_SCHEMA,
      readOnly: true,
    });
    fuzz(fixture);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('SchemaBuilderComponent renders every mode', () => {
    for (const mode of ['visual', 'json', 'both'] as const) {
      const fixture = mount(SchemaBuilderComponent, {
        value: RICH_SCHEMA,
        mode,
      });
      fuzz(fixture);
      expect(fixture.componentInstance.value()).toBeDefined();
    }
  });

  it('SchemaJsonEditorComponent edits JSON through the editor', async () => {
    const fixture = mount(SchemaJsonEditorComponent, {
      value: { type: 'object' },
    });
    await fixture.whenStable();
    fuzz(fixture);
    expect(fixture.componentInstance.value()).toBeDefined();
  });

  it('SchemaJsonEditorComponent propagates a raw-JSON edit to value()', () => {
    // Regression: the value->text and text->value effects fed back on each
    // other; a raw edit was reverted before it reached value().
    const fixture = mount(SchemaJsonEditorComponent, {
      value: { type: 'object' },
    });
    const ci = fixture.componentInstance as unknown as {
      jsonText: { set: (v: string) => void };
      value: () => JsonSchema;
    };
    const emitted: JsonSchema[] = [];
    fixture.componentInstance.value.subscribe((v) => emitted.push(v));

    ci.jsonText.set('{"type":"string","title":"x"}');
    fixture.detectChanges();

    expect(ci.value()).toEqual({ type: 'string', title: 'x' });
    expect(emitted).toContainEqual({ type: 'string', title: 'x' });
  });

  it('SchemaJsonEditorComponent mirrors an external value() change into the text', () => {
    const fixture = mount(SchemaJsonEditorComponent, {
      value: { type: 'object' },
    });
    const ci = fixture.componentInstance as unknown as {
      jsonText: () => string;
    };
    fixture.componentRef.setInput('value', {
      type: 'array',
      items: { type: 'number' },
    });
    fixture.detectChanges();

    expect(JSON.parse(ci.jsonText())).toEqual({
      type: 'array',
      items: { type: 'number' },
    });
  });

  it('SchemaJsonEditorComponent ignores invalid JSON (keeps last value)', () => {
    const fixture = mount(SchemaJsonEditorComponent, {
      value: { type: 'object' },
    });
    const ci = fixture.componentInstance as unknown as {
      jsonText: { set: (v: string) => void };
      value: () => JsonSchema;
    };
    ci.jsonText.set('{ not json');
    fixture.detectChanges();
    expect(ci.value()).toEqual({ type: 'object' });
  });

  it('InferSchemaDialogComponent opens, infers and emits', async () => {
    const fixture = mount(InferSchemaDialogComponent, { open: true });
    await fixture.whenStable();
    const emitted: JsonSchema[] = [];
    fixture.componentInstance.inferred.subscribe((s) => emitted.push(s));
    fuzz(fixture);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('ValidateJsonDialogComponent opens and validates', async () => {
    const fixture = mount(ValidateJsonDialogComponent, {
      open: true,
      schema: RICH_SCHEMA,
    });
    await fixture.whenStable();
    fuzz(fixture);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
