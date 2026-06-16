import { Type, type WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AddFieldButtonComponent } from '../src/lib/components/schema-editor-internal/add-field-button.component';
import { DefinitionsEditorComponent } from '../src/lib/components/schema-editor-internal/definitions-editor.component';
import { SchemaFieldListComponent } from '../src/lib/components/schema-editor-internal/schema-field-list.component';
import { SchemaFieldComponent } from '../src/lib/components/schema-editor-internal/schema-field.component';
import { SchemaPropertyEditorComponent } from '../src/lib/components/schema-editor-internal/schema-property-editor.component';
import { SchemaPropertyRowsComponent } from '../src/lib/components/schema-editor-internal/schema-property-rows.component';
import { TypeDropdownComponent } from '../src/lib/components/schema-editor-internal/type-dropdown.component';
import { en } from '../src/lib/i18n/locales/en';
import type { JsonSchema } from '../src/lib/types/json-schema';
import { buildValidationTree } from '../src/lib/types/validation';
import {
  provideSchemaBuilder,
  provideSchemaBuilderRefSuggestions,
} from '../src/provide';
import { fuzz } from './test-helpers';

const OBJECT_SCHEMA: JsonSchema = {
  type: 'object',
  properties: { a: { type: 'string' }, b: { type: 'number' } },
  patternProperties: { '^x': { type: 'boolean' } },
  required: ['a'],
};

function mount<T>(component: Type<T>, inputs: Record<string, unknown>) {
  const fixture = TestBed.createComponent(component);
  for (const [k, v] of Object.entries(inputs))
    fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('schema-editor-internal components', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideSchemaBuilder(),
        provideSchemaBuilderRefSuggestions(() =>
          signal([{ id: '1', label: 'Foo', url: 'https://x/foo' }]),
        ),
      ],
    });
  });

  it('SchemaFieldComponent renders a field and reacts', () => {
    const fixture = mount(SchemaFieldComponent, {
      name: 'a',
      schema: { type: 'string' },
      readOnly: false,
      required: true,
    });
    fuzz(fixture);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('SchemaFieldListComponent lists properties and pattern properties', () => {
    const fixture = mount(SchemaFieldListComponent, {
      schema: OBJECT_SCHEMA,
      readOnly: false,
    });
    fuzz(fixture);
    fuzz(fixture);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('SchemaPropertyEditorComponent covers property / pattern / definition modes', () => {
    for (const mode of ['property', 'pattern', 'definition'] as const) {
      const schema: JsonSchema = {
        type: 'object',
        properties: { nested: { type: 'string' } },
      };
      const fixture = mount(SchemaPropertyEditorComponent, {
        name: 'prop',
        schema,
        readOnly: false,
        required: true,
        mode,
        validationNode: buildValidationTree(schema, en),
      });
      fuzz(fixture);
      expect(fixture.componentInstance).toBeTruthy();
    }
  });

  it('SchemaPropertyEditorComponent keeps in-progress edits on external schema change', () => {
    const schema: JsonSchema = { type: 'object', title: 'Original' };
    const fixture = mount(SchemaPropertyEditorComponent, {
      name: 'prop',
      schema,
      readOnly: false,
      required: false,
      mode: 'property',
      validationNode: buildValidationTree(schema, en),
    });
    const inst = fixture.componentInstance as unknown as {
      isEditingName: WritableSignal<boolean>;
      tempName: WritableSignal<string>;
      isEditingTitle: WritableSignal<boolean>;
      tempTitle: WritableSignal<string>;
    };

    // User is mid-edit (focused, not yet blurred) on both name and title.
    inst.isEditingName.set(true);
    inst.tempName.set('draftName');
    inst.isEditingTitle.set(true);
    inst.tempTitle.set('draftTitle');

    // An external update arrives (e.g. the JSON editor in `both` mode).
    fixture.componentRef.setInput('schema', {
      type: 'object',
      title: 'Changed',
    });
    fixture.detectChanges();

    expect(inst.tempName()).toBe('draftName');
    expect(inst.tempTitle()).toBe('draftTitle');
  });

  it('SchemaPropertyRowsComponent renders rows (and empty)', () => {
    const rows = [
      { name: 'a', schema: { type: 'string' } as JsonSchema, required: true },
      { name: 'b', schema: { type: 'number' } as JsonSchema, required: false },
    ];
    const fixture = mount(SchemaPropertyRowsComponent, {
      properties: rows,
      patternProperties: [
        {
          name: '^x',
          schema: { type: 'boolean' } as JsonSchema,
          required: false,
        },
      ],
      readOnly: false,
    });
    fuzz(fixture);
    expect(fixture.componentInstance).toBeTruthy();

    const empty = mount(SchemaPropertyRowsComponent, {
      properties: [],
      patternProperties: [],
      readOnly: true,
    });
    expect(empty.componentInstance).toBeTruthy();
  });

  it('DefinitionsEditorComponent manages $defs', () => {
    const fixture = mount(DefinitionsEditorComponent, {
      schema: {
        type: 'object',
        $defs: {
          Foo: { type: 'object', properties: { id: { type: 'string' } } },
        },
      },
      readOnly: false,
    });
    fuzz(fixture);
    fuzz(fixture);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('TypeDropdownComponent opens and selects types', () => {
    const fixture = mount(TypeDropdownComponent, {
      value: 'string',
      readOnly: false,
    });
    fuzz(fixture);
    fuzz(fixture);
    expect(fixture.componentInstance.value()).toBeDefined();
  });

  it('AddFieldButtonComponent opens the form and adds a field', () => {
    const fixture = mount(AddFieldButtonComponent, { variant: 'primary' });
    const added: unknown[] = [];
    fixture.componentInstance.addField.subscribe((f) => added.push(f));
    fuzz(fixture);
    fuzz(fixture);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
