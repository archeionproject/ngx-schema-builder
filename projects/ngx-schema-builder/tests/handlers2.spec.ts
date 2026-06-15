import { Type } from '@angular/core';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ArrayEditorComponent } from '../src/lib/components/type-editors/array-editor.component';
import { BooleanEditorComponent } from '../src/lib/components/type-editors/boolean-editor.component';
import { NumberEditorComponent } from '../src/lib/components/type-editors/number-editor.component';
import { ObjectEditorComponent } from '../src/lib/components/type-editors/object-editor.component';
import { RefEditorComponent } from '../src/lib/components/type-editors/ref-editor.component';
import { LocalDefinitionsContextService } from '../src/lib/services/local-definitions.service';
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

  it('does not concatenate the ref when typing a "#"-prefixed URL', () => {
    // Regression: the controlled URL input re-split the round-tripped ref on
    // '#', fighting the user and appending the ref on every keystroke.
    const { fixture, ci } = mount(RefEditorComponent, {
      schema: { $ref: '' } satisfies JsonSchema,
      readOnly: false,
    });
    // Mimic the parent two-way binding so the emitted ref flows back in.
    ci.schemaChange.subscribe((s: JsonSchema) =>
      fixture.componentRef.setInput('schema', s),
    );
    const urlInput = (fixture.nativeElement as HTMLElement).querySelector(
      'input[type="url"]',
    ) as HTMLInputElement;

    const target = '#definitions/LegalEntity';
    for (const ch of target) {
      urlInput.value = urlInput.value + ch;
      urlInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    expect(ci.schema()).toEqual({ $ref: '#definitions/LegalEntity' });
  });

  it('mirrors an external ref change into the url/pointer fields', () => {
    const { fixture, ci } = mount(RefEditorComponent, {
      schema: { $ref: '' } satisfies JsonSchema,
      readOnly: false,
    });
    fixture.componentRef.setInput('schema', {
      $ref: 'https://x/foo#/properties/id',
    } satisfies JsonSchema);
    fixture.detectChanges();
    expect(ci.urlValue()).toBe('https://x/foo');
    expect(ci.pointerValue()).toBe('/properties/id');
  });

  it('shows the suggestions section when a provider is registered', () => {
    const { fixture } = mount(RefEditorComponent, {
      schema: { $ref: '' } satisfies JsonSchema,
      readOnly: false,
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Suggestions');
  });
});

describe('RefEditor without a suggestions provider', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideSchemaBuilder()] }),
  );

  it('hides the suggestions section entirely', () => {
    const { fixture } = mount(RefEditorComponent, {
      schema: { $ref: '' } satisfies JsonSchema,
      readOnly: false,
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Suggestions');
    expect(text).not.toContain('No suggestions available');
  });
});

describe('RefEditor local definitions', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideSchemaBuilder(), LocalDefinitionsContextService],
    }),
  );

  it('lists local defs and emits #/$defs/<name> on pick', () => {
    const ctx = TestBed.inject(LocalDefinitionsContextService);
    ctx.set([
      { name: 'Address', ref: '#/$defs/Address' },
      { name: 'User', ref: '#/$defs/User' },
    ]);

    const { fixture, ci } = mount(RefEditorComponent, {
      schema: { $ref: '' } satisfies JsonSchema,
      readOnly: false,
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Local definitions');
    expect(text).toContain('#/$defs/Address');

    const changes = changeCollector(fixture);
    ci.pickLocalDefinition({ name: 'User', ref: '#/$defs/User' });
    expect(changes).toContainEqual({ $ref: '#/$defs/User' });
  });

  it('omits the local section when there are no defs', () => {
    const { fixture } = mount(RefEditorComponent, {
      schema: { $ref: '' } satisfies JsonSchema,
      readOnly: false,
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Local definitions');
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
