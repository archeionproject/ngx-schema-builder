import { TestBed } from '@angular/core/testing';

import { SchemaFieldsEditorComponent } from '../src/lib/components/schema-fields-editor/schema-fields-editor.component';
import type { JsonSchema } from '../src/lib/types/json-schema';
import { provideSchemaBuilder } from '../src/provide';

describe('SchemaFieldsEditorComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SchemaFieldsEditorComponent],
      providers: [provideSchemaBuilder()],
    });
  });

  it('creates and renders without throwing', () => {
    const fixture = TestBed.createComponent(SchemaFieldsEditorComponent);
    const schema: JsonSchema = {
      type: 'object',
      properties: { title: { type: 'string' } },
      required: ['title'],
    };
    fixture.componentRef.setInput('value', schema);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.value()).toEqual(schema);
    expect(
      (fixture.nativeElement as HTMLElement).classList.contains('jsonjoy'),
    ).toBe(true);
  });

  it('root-type select reflects a non-object root (array -> "array", not "object")', () => {
    // Regression: the root <select> bound [value] on the element, which does
    // not reliably select a native <option>, so an array root rendered as the
    // first option ("object"/Group) instead of "array"/List.
    const fixture = TestBed.createComponent(SchemaFieldsEditorComponent);
    const schema: JsonSchema = {
      type: 'array',
      items: { oneOf: [{ type: 'string' }, { type: 'integer' }] },
    };
    fixture.componentRef.setInput('value', schema);
    fixture.componentRef.setInput('readOnly', false);
    fixture.detectChanges();

    const select = (fixture.nativeElement as HTMLElement).querySelector(
      'select',
    ) as HTMLSelectElement;
    expect(select.value).toBe('array');
  });
});
