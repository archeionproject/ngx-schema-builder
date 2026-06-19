import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  output,
} from '@angular/core';

import {
  createFieldSchema,
  getSchemaPatternProperties,
  getSchemaProperties,
  removeObjectPatternProperty,
  removeObjectProperty,
  renameObjectPatternProperty,
  renameObjectProperty,
  updateObjectPatternProperty,
  updateObjectProperty,
  updatePropertyRequired,
} from '../../internal/schema-editor';
import { JsonjoyTranslationService } from '../../services/translation.service';
import {
  type JsonSchema,
  type NewField,
  type ObjectJsonSchema,
  isBooleanSchema,
} from '../../types/json-schema';
import type { ValidationTreeNode } from '../../types/validation';
import { AddFieldButtonComponent } from '../schema-editor-internal/add-field-button.component';
import { SchemaPropertyRowsComponent } from '../schema-editor-internal/schema-property-rows.component';
import type { EnumChangeContext } from '../schema-editor-internal/type-editor.component';

@Component({
  selector: 'lib-jsonjoy-object-editor',
  standalone: true,
  imports: [
    AddFieldButtonComponent,
    forwardRef(() => SchemaPropertyRowsComponent),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
  template: `
    <div class="space-y-4">
      @if (properties().length > 0 || patternProperties().length > 0) {
        <div class="space-y-2">
          <lib-jsonjoy-schema-property-rows
            [properties]="properties()"
            [patternProperties]="patternProperties()"
            [readOnly]="readOnly()"
            [depth]="depth()"
            [schemaKeyPrefix]="schemaKey()"
            [validationChildren]="validationNode()?.children"
            (deleteProperty)="onDeleteProperty($event)"
            (deletePatternProperty)="onDeletePatternProperty($event)"
            (nameChange)="onPropertyNameChange($event)"
            (patternNameChange)="onPatternPropertyNameChange($event)"
            (requiredChange)="onPropertyRequiredChange($event)"
            (schemaChange)="onPropertySchemaChange($event)"
            (patternSchemaChange)="onPatternPropertySchemaChange($event)"
            (addEnum)="addEnum.emit($event)"
            (deleteEnum)="deleteEnum.emit($event)"
          />
        </div>
      } @else {
        <div
          class="text-sm text-muted-foreground italic p-2 text-center border rounded-md"
        >
          {{ t().objectPropertiesNone }}
        </div>
      }

      @if (!readOnly()) {
        <div class="mt-4 flex flex-row gap-x-4">
          <lib-jsonjoy-add-field-button
            variant="secondary"
            (addField)="onAddProperty($event)"
            (addPatternField)="onAddPatternProperty($event)"
          />
          <button
            type="button"
            [class]="additionalPropertiesClasses()"
            (click)="onAdditionalPropertiesToggle()"
          >
            {{ additionalPropertiesLabel() }}
          </button>
        </div>
      }
    </div>
  `,
})
export class ObjectEditorComponent {
  readonly schema = input.required<JsonSchema>();
  readonly readOnly = input.required<boolean>();
  readonly validationNode = input<ValidationTreeNode | undefined>(undefined);
  readonly schemaKey = input<string | undefined>(undefined);
  readonly depth = input<number>(0);

  readonly schemaChange = output<ObjectJsonSchema>();
  readonly addEnum = output<EnumChangeContext>();
  readonly deleteEnum = output<EnumChangeContext>();

  private readonly translations = inject(JsonjoyTranslationService);
  protected readonly t = this.translations.providerLocale;

  protected readonly properties = computed(() =>
    getSchemaProperties(this.schema()),
  );

  protected readonly patternProperties = computed(() =>
    getSchemaPatternProperties(this.schema()),
  );

  private readonly normalized = computed<ObjectJsonSchema>(() => {
    const schema = this.schema();
    if (isBooleanSchema(schema)) {
      return { type: 'object', properties: {} };
    }
    return { ...schema, type: 'object', properties: schema.properties ?? {} };
  });

  private readonly additionalPropertiesForbidden = computed(
    () => this.normalized().additionalProperties === false,
  );

  protected readonly additionalPropertiesLabel = computed(() =>
    this.additionalPropertiesForbidden()
      ? this.t().additionalPropertiesForbid
      : this.t().additionalPropertiesAllow,
  );

  protected readonly additionalPropertiesClasses = computed(() => {
    const base = 'text-xs px-3 py-1.5 rounded-md font-medium transition-colors';
    const variant = this.additionalPropertiesForbidden()
      ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
      : 'bg-lime-500/10 text-lime-600 hover:bg-lime-500/20';
    return `${base} ${variant}`;
  });

  protected onAddProperty(field: NewField): void {
    const fieldSchema = createFieldSchema(field);
    let next = updateObjectProperty(this.normalized(), field.name, fieldSchema);
    if (field.required) {
      next = updatePropertyRequired(next, field.name, true);
    }
    this.schemaChange.emit(next);
  }

  protected onAddPatternProperty(field: NewField): void {
    const next = updateObjectPatternProperty(
      this.normalized(),
      field.name,
      createFieldSchema(field),
    );
    this.schemaChange.emit(next);
  }

  protected onDeleteProperty(name: string): void {
    this.schemaChange.emit(removeObjectProperty(this.normalized(), name));
  }

  protected onDeletePatternProperty(name: string): void {
    this.schemaChange.emit(
      removeObjectPatternProperty(this.normalized(), name),
    );
  }

  protected onPropertyNameChange(change: {
    oldName: string;
    newName: string;
  }): void {
    if (change.oldName === change.newName) return;
    this.schemaChange.emit(
      renameObjectProperty(this.normalized(), change.oldName, change.newName),
    );
  }

  protected onPatternPropertyNameChange(change: {
    oldName: string;
    newName: string;
  }): void {
    if (change.oldName === change.newName) return;
    this.schemaChange.emit(
      renameObjectPatternProperty(
        this.normalized(),
        change.oldName,
        change.newName,
      ),
    );
  }

  protected onPropertyRequiredChange(change: {
    name: string;
    required: boolean;
  }): void {
    this.schemaChange.emit(
      updatePropertyRequired(this.normalized(), change.name, change.required),
    );
  }

  protected onPropertySchemaChange(change: {
    name: string;
    schema: ObjectJsonSchema;
  }): void {
    this.schemaChange.emit(
      updateObjectProperty(this.normalized(), change.name, change.schema),
    );
  }

  protected onPatternPropertySchemaChange(change: {
    name: string;
    schema: ObjectJsonSchema;
  }): void {
    this.schemaChange.emit(
      updateObjectPatternProperty(
        this.normalized(),
        change.name,
        change.schema,
      ),
    );
  }

  protected onAdditionalPropertiesToggle(): void {
    const { additionalProperties, ...rest } = this.normalized();
    this.schemaChange.emit(
      additionalProperties !== false
        ? { ...rest, additionalProperties: false }
        : rest,
    );
  }
}
