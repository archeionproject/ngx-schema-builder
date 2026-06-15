import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AddFieldButtonComponent } from '../src/lib/components/schema-editor-internal/add-field-button.component';
import { SchemaFieldListComponent } from '../src/lib/components/schema-editor-internal/schema-field-list.component';
import { SchemaFieldComponent } from '../src/lib/components/schema-editor-internal/schema-field.component';
// installs jsdom <dialog> polyfill
import { StringEditorComponent } from '../src/lib/components/type-editors/string-editor.component';
import type { JsonSchema } from '../src/lib/types/json-schema';
import { provideSchemaBuilder } from '../src/provide';
import './test-helpers';

const evt = (value: string) => ({ target: { value } }) as unknown as Event;

function mount<T>(component: Type<T>, inputs: Record<string, unknown>) {
  const fixture = TestBed.createComponent(component);
  for (const [k, v] of Object.entries(inputs))
    fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return { fixture, ci: fixture.componentInstance as any };
}

describe('StringEditor handlers', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideSchemaBuilder()] }),
  );

  it('edits length, pattern, format and enum values', () => {
    const { fixture, ci } = mount(StringEditorComponent, {
      schema: {
        type: 'string',
        minLength: 1,
        maxLength: 10,
        enum: ['a', 'b'],
      } satisfies JsonSchema,
      readOnly: false,
    });
    const changes: JsonSchema[] = [];
    fixture.componentInstance.schemaChange.subscribe((s) => changes.push(s));

    ci.onLengthInput('minLength', evt('2'));
    ci.onLengthInput('maxLength', evt('20'));
    ci.onPatternInput(evt('^x'));
    ci.onFormatChange(evt('email'));
    ci.onEnumDraftInput(evt('c'));
    ci.addEnumValue();
    ci.removeEnumValue('a');

    expect(changes.length).toBeGreaterThan(0);
  });
});

describe('SchemaField handlers', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideSchemaBuilder()] }),
  );

  it('forwards name/required/schema changes', () => {
    const { fixture, ci } = mount(SchemaFieldComponent, {
      name: 'a',
      schema: { type: 'string' } satisfies JsonSchema,
      readOnly: false,
      required: false,
    });
    const edits: unknown[] = [];
    fixture.componentInstance.edit.subscribe((e) => edits.push(e));

    ci.onNameChange('renamed');
    ci.onRequiredChange(true);
    ci.onSchemaChange({ type: 'number' });

    expect(edits.length).toBeGreaterThan(0);
  });
});

describe('SchemaFieldList handlers', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideSchemaBuilder()] }),
  );

  it('forwards row events for properties and pattern properties', () => {
    const { ci } = mount(SchemaFieldListComponent, {
      schema: {
        type: 'object',
        properties: { a: { type: 'string' } },
        patternProperties: { '^x': { type: 'number' } },
        required: ['a'],
      } satisfies JsonSchema,
      readOnly: false,
    });

    expect(() => {
      ci.onPropertyNameChange({ oldName: 'a', newName: 'a2' });
      ci.onPatternNameChange({ oldName: '^x', newName: '^z' });
      ci.onRequiredChange({ name: 'a2', required: false });
      ci.onPropertySchemaChange({ name: 'a2', schema: { type: 'boolean' } });
      ci.onPatternSchemaChange({ name: '^z', schema: { type: 'string' } });
    }).not.toThrow();
  });
});

describe('AddFieldButton handlers', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideSchemaBuilder()] }),
  );

  it('opens and closes the dialog and handles submit', () => {
    const { ci } = mount(AddFieldButtonComponent, { variant: 'secondary' });
    expect(() => {
      ci.openDialog();
      ci.onSubmit({ preventDefault() {} } as unknown as Event);
      ci.closeDialog();
      ci.onDialogClose();
    }).not.toThrow();
  });

  it('offers a $ref type tile and emits a reference field', () => {
    const { fixture, ci } = mount(AddFieldButtonComponent, {
      variant: 'primary',
    });
    // $ref is a selectable type in the add-field panel.
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Reference');

    const emitted: unknown[] = [];
    ci.addField.subscribe((f: unknown) => emitted.push(f));
    ci.fieldName.set('myRef');
    ci.fieldType.set('$ref');
    ci.onSubmit({ preventDefault() {} } as unknown as Event);

    expect(emitted).toContainEqual(
      expect.objectContaining({ name: 'myRef', type: '$ref' }),
    );
  });
});
