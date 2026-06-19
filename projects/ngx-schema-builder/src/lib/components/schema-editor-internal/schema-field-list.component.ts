import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';

import {
  type SchemaProperty,
  getSchemaPatternProperties,
  getSchemaProperties,
} from '../../internal/schema-editor';
import { JsonjoyTranslationContextService } from '../../services/translation-context.service';
import {
  type JsonSchema,
  type NewField,
  type ObjectJsonSchema,
  type SchemaEditorType,
  getEditorType,
} from '../../types/json-schema';
import { buildValidationTree } from '../../types/validation';
import { SchemaPropertyRowsComponent } from './schema-property-rows.component';
import type { EnumChangeContext } from './type-editor.component';

function pickValidEditorType(schema: JsonSchema): SchemaEditorType {
  if (typeof schema === 'boolean') return 'object';
  const declared = schema.type;
  if (Array.isArray(declared)) {
    return (declared[0] ?? 'object') as SchemaEditorType;
  }
  return getEditorType(schema);
}

function buildFieldFromProperty(
  property: SchemaProperty,
  overrides: Partial<NewField> = {},
): NewField {
  const schema = property.schema;
  return {
    name: property.name,
    type: pickValidEditorType(schema),
    description: typeof schema === 'boolean' ? '' : schema.description || '',
    required: property.required,
    validation: typeof schema === 'boolean' ? { type: 'object' } : schema,
    ...overrides,
  };
}

@Component({
  selector: 'lib-jsonjoy-schema-field-list',
  standalone: true,
  imports: [SchemaPropertyRowsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy block' },
  template: `
    <div class="space-y-2 animate-in">
      <lib-jsonjoy-schema-property-rows
        [properties]="properties()"
        [patternProperties]="patternProperties()"
        [validationChildren]="validationTree().children"
        [readOnly]="readOnly()"
        [autoFocus]="autoFocus()"
        (deleteProperty)="deleteField.emit($event)"
        (deletePatternProperty)="deletePatternField.emit($event)"
        (nameChange)="onPropertyNameChange($event)"
        (patternNameChange)="onPatternNameChange($event)"
        (requiredChange)="onRequiredChange($event)"
        (schemaChange)="onPropertySchemaChange($event)"
        (patternSchemaChange)="onPatternSchemaChange($event)"
        (addEnum)="addEnum.emit($event)"
        (deleteEnum)="deleteEnum.emit($event)"
      />
    </div>
  `,
})
export class SchemaFieldListComponent {
  readonly schema = input.required<JsonSchema>();
  readonly readOnly = input.required<boolean>();
  readonly autoFocus = input<boolean>(true);

  readonly editField = output<{ name: string; field: NewField }>();
  readonly deleteField = output<string>();
  readonly editPatternField = output<{ name: string; field: NewField }>();
  readonly deletePatternField = output<string>();
  readonly addEnum = output<EnumChangeContext>();
  readonly deleteEnum = output<EnumChangeContext>();

  private readonly t = inject(JsonjoyTranslationContextService).translation;

  protected readonly properties = computed(() =>
    getSchemaProperties(this.schema()),
  );
  protected readonly patternProperties = computed(() =>
    getSchemaPatternProperties(this.schema()),
  );
  protected readonly validationTree = computed(() =>
    buildValidationTree(this.schema(), this.t()),
  );

  protected onPropertyNameChange(event: {
    oldName: string;
    newName: string;
  }): void {
    this.emitEdit(this.properties(), this.editField, event.oldName, {
      name: event.newName,
    });
  }

  protected onPatternNameChange(event: {
    oldName: string;
    newName: string;
  }): void {
    this.emitEdit(
      this.patternProperties(),
      this.editPatternField,
      event.oldName,
      {
        name: event.newName,
      },
    );
  }

  protected onRequiredChange(event: { name: string; required: boolean }): void {
    this.emitEdit(this.properties(), this.editField, event.name, {
      required: event.required,
    });
  }

  protected onPropertySchemaChange(event: {
    name: string;
    schema: ObjectJsonSchema;
  }): void {
    this.emitEditFromSchema(
      this.properties(),
      this.editField,
      event.name,
      event.schema,
    );
  }

  protected onPatternSchemaChange(event: {
    name: string;
    schema: ObjectJsonSchema;
  }): void {
    this.emitEditFromSchema(
      this.patternProperties(),
      this.editPatternField,
      event.name,
      event.schema,
    );
  }

  private emitEdit(
    list: readonly SchemaProperty[],
    target: { emit: (value: { name: string; field: NewField }) => void },
    name: string,
    overrides: Partial<NewField>,
  ): void {
    const property = list.find((p) => p.name === name);
    if (!property) return;
    target.emit({ name, field: buildFieldFromProperty(property, overrides) });
  }

  private emitEditFromSchema(
    list: readonly SchemaProperty[],
    target: { emit: (value: { name: string; field: NewField }) => void },
    name: string,
    updatedSchema: ObjectJsonSchema,
  ): void {
    const property = list.find((p) => p.name === name);
    if (!property) return;
    const declared = updatedSchema.type ?? 'object';
    const fallback: SchemaEditorType = Array.isArray(declared)
      ? ((declared[0] as SchemaEditorType) ?? 'object')
      : (declared as SchemaEditorType);
    const editorType = getEditorType(updatedSchema) || fallback;
    target.emit({
      name,
      field: buildFieldFromProperty(property, {
        type: editorType,
        description: updatedSchema.description || '',
        validation: updatedSchema,
      }),
    });
  }
}
