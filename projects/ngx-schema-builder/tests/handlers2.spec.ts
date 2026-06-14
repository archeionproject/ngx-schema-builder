import { Type } from '@angular/core';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ArrayEditorComponent } from '../src/lib/components/type-editors/array-editor.component';
import { BooleanEditorComponent } from '../src/lib/components/type-editors/boolean-editor.component';
import { NumberEditorComponent } from '../src/lib/components/type-editors/number-editor.component';
import { ObjectEditorComponent } from '../src/lib/components/type-editors/object-editor.component';
import { RefEditorComponent } from '../src/lib/components/type-editors/ref-editor.component';
import type { JsonSchema, NewField } from '../src/lib/types/json-schema';
import {
  provideSchemaBuilder,
  provideSchemaBuilderRefSuggestions,
} from '../src/provide';

const evt = (value: string) => ({ target: { value } }) as unknown as Event;
const field = (over: Partial<NewField> = {}): NewField => ({
  name: 'f',
  type: 'string',
  required: false,
  description: '',
  ...over,
});

function mount<T>(component: Type<T>, inputs: Record<string, unknown>) {
  const fixture = TestBed.createComponent(component);
  for (const [k, v] of Object.entries(inputs))
    fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return { fixture, ci: fixture.componentInstance as any };
}

function changeCollector(fixture: {
  componentInstance: {
    schemaChange: { subscribe: (f: (s: JsonSchema) => void) => void };
  };
}) {
  const changes: JsonSchema[] = [];
  fixture.componentInstance.schemaChange.subscribe((s) => changes.push(s));
  return changes;
}

describe('ObjectEditor handlers', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideSchemaBuilder()] }),
  );

  it('mutates properties, pattern properties and additionalProperties', () => {
    const { fixture, ci } = mount(ObjectEditorComponent, {
      schema: {
        type: 'object',
        properties: { a: { type: 'string' } },
        patternProperties: { '^x': { type: 'number' } },
        required: ['a'],
      } satisfies JsonSchema,
      readOnly: false,
    });
    const changes = changeCollector(fixture);

    ci.onAddProperty(field({ name: 'b', type: 'number' }));
    ci.onAddPatternProperty(field({ name: '^y', type: 'string' }));
    ci.onPropertyNameChange({ oldName: 'a', newName: 'a2' });
    ci.onPatternPropertyNameChange({ oldName: '^x', newName: '^z' });
    ci.onPropertyRequiredChange({ name: 'a2', required: false });
    ci.onPropertySchemaChange({ name: 'a2', schema: { type: 'boolean' } });
    ci.onPatternPropertySchemaChange({
      name: '^z',
      schema: { type: 'string' },
    });
    ci.onAdditionalPropertiesToggle();
    ci.onDeleteProperty('a2');
    ci.onDeletePatternProperty('^z');

    expect(changes.length).toBeGreaterThan(0);
  });
});

describe('NumberEditor handlers', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideSchemaBuilder()] }),
  );

  it('edits bounds and enum values', () => {
    const { fixture, ci } = mount(NumberEditorComponent, {
      schema: {
        type: 'number',
        minimum: 0,
        maximum: 10,
        enum: [2, 4],
      } satisfies JsonSchema,
      readOnly: false,
    });
    const changes = changeCollector(fixture);

    ci.onBoundInput('minimum', evt('1'));
    ci.onBoundInput('maximum', evt('20'));
    ci.onEnumDraftInput(evt('6'));
    ci.addEnumValue();
    ci.removeEnumValue(2);
    expect(typeof ci.boundClasses('minimum', false)).toBe('string');

    expect(changes.length).toBeGreaterThan(0);
  });
});

describe('ArrayEditor handlers', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideSchemaBuilder()] }),
  );

  it('edits item constraints and item schema/type', () => {
    const { fixture, ci } = mount(ArrayEditorComponent, {
      schema: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 5,
      } satisfies JsonSchema,
      readOnly: false,
    });
    const changes = changeCollector(fixture);

    ci.onMinItemsInput(evt('2'));
    ci.onMaxItemsInput(evt('8'));
    ci.commitValidation();
    ci.onUniqueItemsChange(true);
    ci.onItemSchemaChange({ type: 'string', minLength: 1 });
    ci.onItemTypeChange('number');

    expect(changes.length).toBeGreaterThan(0);
  });
});

describe('RefEditor handlers', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideSchemaBuilder(),
        provideSchemaBuilderRefSuggestions(() =>
          signal([
            {
              id: '1',
              label: 'Foo',
              url: 'https://x/foo',
              pointers: [{ label: 'id', fragment: '#/properties/id' }],
            },
          ]),
        ),
      ],
    }),
  );

  it('edits url, pointer and picks a suggestion', () => {
    const { fixture, ci } = mount(RefEditorComponent, {
      schema: { $ref: '#/$defs/Foo' } satisfies JsonSchema,
      readOnly: false,
    });
    const changes = changeCollector(fixture);

    ci.onUrlInput(evt('https://x/bar'));
    ci.onPointerInput(evt('#/properties/x'));
    ci.pickSuggestion({ id: '1', label: 'Foo', url: 'https://x/foo' });

    expect(changes.length).toBeGreaterThan(0);
  });
});

describe('BooleanEditor handlers', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideSchemaBuilder()] }),
  );

  it('toggles allowed values', () => {
    const { fixture, ci } = mount(BooleanEditorComponent, {
      schema: { type: 'boolean' } satisfies JsonSchema,
      readOnly: false,
    });
    const changes = changeCollector(fixture);

    ci.handleAllowedChange(true, false);
    ci.handleAllowedChange(false, false);
    ci.handleAllowedChange(true, true);

    expect(changes.length).toBeGreaterThan(0);
  });
});
