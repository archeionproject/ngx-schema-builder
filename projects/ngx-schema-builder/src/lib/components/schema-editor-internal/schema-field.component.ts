import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';

import { JsonjoyTranslationService } from '../../services/translation.service';
import {
  type JsonSchema,
  type NewField,
  type ObjectJsonSchema,
  type SchemaType,
  asObjectSchema,
  getSchemaDescription,
  withObjectSchema,
} from '../../types/json-schema';
import { SchemaPropertyEditorComponent } from './schema-property-editor.component';

@Component({
  selector: 'lib-jsonjoy-schema-field',
  standalone: true,
  imports: [SchemaPropertyEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy block' },
  template: `
    <lib-jsonjoy-schema-property-editor
      [name]="name()"
      [schema]="schema()"
      [required]="required()"
      [readOnly]="readOnly()"
      [depth]="depth()"
      (delete)="delete.emit()"
      (nameChange)="onNameChange($event)"
      (requiredChange)="onRequiredChange($event)"
      (schemaChange)="onSchemaChange($event)"
    />
  `,
})
export class SchemaFieldComponent {
  readonly name = input.required<string>();
  readonly schema = input.required<JsonSchema>();
  readonly required = input<boolean>(false);
  readonly readOnly = input.required<boolean>();
  readonly isNested = input<boolean>(false);
  readonly depth = input<number>(0);

  readonly delete = output<void>();
  readonly edit = output<NewField>();
  readonly addField = output<NewField>();

  protected readonly t = inject(JsonjoyTranslationService).providerLocale;

  protected onNameChange(newName: string): void {
    if (newName === this.name()) return;
    this.edit.emit(this.buildField({ name: newName }));
  }

  protected onRequiredChange(isRequired: boolean): void {
    if (isRequired === this.required()) return;
    this.edit.emit(this.buildField({ required: isRequired }));
  }

  protected onSchemaChange(updatedSchema: ObjectJsonSchema): void {
    const declared = updatedSchema.type ?? 'object';
    const type = (
      Array.isArray(declared) ? declared[0] : declared
    ) as SchemaType;
    this.edit.emit({
      name: this.name(),
      type,
      description: updatedSchema.description || '',
      required: this.required(),
      validation: updatedSchema,
    });
  }

  private buildField(overrides: Partial<NewField>): NewField {
    const schema = this.schema();
    const declared = withObjectSchema(
      schema,
      (s) => s.type ?? 'object',
      'object',
    );
    const type = (
      Array.isArray(declared) ? declared[0] : declared
    ) as SchemaType;
    return {
      name: this.name(),
      type,
      description: getSchemaDescription(schema),
      required: this.required(),
      validation: asObjectSchema(schema),
      ...overrides,
    };
  }
}
