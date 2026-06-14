import { TestBed } from '@angular/core/testing';

import { SchemaFieldsEditorComponent } from './schema-fields-editor.component';
import { provideSchemaBuilder } from '../../../provide';
import type { JsonSchema } from '../../types/json-schema';

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
});
