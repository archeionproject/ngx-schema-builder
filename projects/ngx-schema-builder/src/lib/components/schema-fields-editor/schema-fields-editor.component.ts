import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

import type { Translation } from '../../i18n/translation-keys';
import { cn } from '../../internal/cn';
import {
  createFieldSchema,
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
  asObjectSchema,
  getEditorType,
  isBooleanSchema,
  isObjectSchema,
  type JsonSchema,
  type NewField,
  type ObjectJsonSchema,
  type SchemaEditorType,
} from '../../types/json-schema';
import { AddFieldButtonComponent } from '../schema-editor-internal/add-field-button.component';
import { DefinitionsEditorComponent } from '../schema-editor-internal/definitions-editor.component';
import { SchemaFieldListComponent } from '../schema-editor-internal/schema-field-list.component';
import { TypeEditorComponent } from '../schema-editor-internal/type-editor.component';

const ROOT_TYPE_OPTIONS: readonly { id: SchemaEditorType; labelKey: keyof Translation }[] = [
  { id: 'object', labelKey: 'fieldTypeObjectLabel' },
  { id: 'string', labelKey: 'fieldTypeTextLabel' },
  { id: 'number', labelKey: 'fieldTypeNumberLabel' },
  { id: 'boolean', labelKey: 'fieldTypeBooleanLabel' },
  { id: 'array', labelKey: 'fieldTypeArrayLabel' },
  { id: 'anyOf', labelKey: 'schemaTypeAnyOf' },
  { id: 'oneOf', labelKey: 'schemaTypeOneOf' },
  { id: 'allOf', labelKey: 'schemaTypeAllOf' },
];

const DEFAULT_SCHEMAS: Record<SchemaEditorType, ObjectJsonSchema> = {
  string: { type: 'string' },
  number: { type: 'number' },
  integer: { type: 'integer' },
  boolean: { type: 'boolean' },
  object: { type: 'object' },
  array: { type: 'array' },
  null: { type: 'null' },
  anyOf: { anyOf: [{ type: 'string' }, { type: 'number' }] },
  oneOf: { oneOf: [{ type: 'string' }, { type: 'number' }] },
  allOf: { allOf: [{ type: 'object' }] },
  $ref: { $ref: '' },
};

@Component({
  selector: 'lib-jsonjoy-schema-fields-editor',
  standalone: true,
  imports: [
    AddFieldButtonComponent,
    forwardRef(() => DefinitionsEditorComponent),
    SchemaFieldListComponent,
    forwardRef(() => TypeEditorComponent),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
  template: `
    <div [class]="rootClasses()">
      @if (rootType() === 'object') {
        <div class="mb-4 shrink-0 flex items-center justify-between gap-2 border-b border-border">
          <div class="flex">
            <button
              type="button"
              [class]="tabClasses('properties')"
              (click)="activeTab.set('properties')"
            >
              {{ t().propertiesTabLabel }}
            </button>
            <button
              type="button"
              [class]="tabClasses('definitions')"
              (click)="activeTab.set('definitions')"
            >
              {{ t().definitionsTabLabel }}
              @if (definitionsCount() > 0) {
                <span class="ml-1.5 text-xs text-muted-foreground">({{ definitionsCount() }})</span>
              }
            </button>
          </div>

          @if (!readOnly() && activeTab() === 'properties') {
            <div class="flex items-center gap-2 pb-2">
              <label class="text-xs text-muted-foreground">Root type:</label>
              <select
                class="text-xs rounded-md border bg-background px-2 py-1 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                [value]="rootType()"
                (change)="onRootTypeChange($event)"
              >
                @for (option of rootTypeOptions; track option.id) {
                  <option [value]="option.id">{{ t()[option.labelKey] }}</option>
                }
              </select>
            </div>
          }
        </div>
      } @else if (!readOnly()) {
        <div class="mb-4 shrink-0 flex items-center gap-2">
          <label class="text-sm font-medium text-muted-foreground">Root type:</label>
          <select
            class="text-sm rounded-md border bg-background px-2 py-1 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            [value]="rootType()"
            (change)="onRootTypeChange($event)"
          >
            @for (option of rootTypeOptions; track option.id) {
              <option [value]="option.id">{{ t()[option.labelKey] }}</option>
            }
          </select>
        </div>
      }

      @if (rootType() === 'object') {
        @if (activeTab() === 'properties') {
          @if (!readOnly()) {
            <div class="mb-6 shrink-0">
              <lib-jsonjoy-add-field-button
                [autoFocus]="autoFocus()"
                (addField)="handleAddField($event)"
                (addPatternField)="handleAddPatternField($event)"
              />
            </div>
          }
          <div class="grow overflow-auto">
            @if (hasFields()) {
              <lib-jsonjoy-schema-field-list
                [schema]="value()"
                [readOnly]="readOnly()"
                [autoFocus]="autoFocus()"
                (editField)="handleEditField($event)"
                (deleteField)="handleDeleteField($event)"
                (editPatternField)="handleEditPatternField($event)"
                (deletePatternField)="handleDeletePatternField($event)"
              />
            } @else {
              <div class="text-center py-10 text-muted-foreground">
                <p class="mb-3">{{ t().visualEditorNoFieldsHint1 }}</p>
                <p class="text-sm">{{ t().visualEditorNoFieldsHint2 }}</p>
              </div>
            }
          </div>
        } @else {
          <lib-jsonjoy-definitions-editor
            [schema]="value()"
            [readOnly]="readOnly()"
            (schemaChange)="value.set($event)"
          />
        }
      } @else {
        <div class="grow overflow-auto">
          <lib-jsonjoy-type-editor
            [schema]="value()"
            [readOnly]="readOnly()"
            (schemaChange)="value.set($event)"
          />
        </div>
      }
    </div>
  `,
})
export class SchemaFieldsEditorComponent {
  readonly value = model<JsonSchema>({ type: 'object' });
  readonly defaultValue = input<JsonSchema | undefined>(undefined);
  readonly readOnly = input<boolean>(false);
  readonly autoFocus = input<boolean>(true);
  readonly className = input<string | undefined>(undefined);
  readonly locale = input<Translation | undefined>(undefined);
  readonly messages = input<Partial<Translation> | undefined>(undefined);

  private readonly translations = inject(JsonjoyTranslationService);
  protected readonly t = this.translations.withOverrides(this.locale, this.messages);

  protected readonly rootClasses = computed(() =>
    cn('p-4 h-full flex flex-col overflow-auto jsonjoy', this.className()),
  );

  protected readonly rootTypeOptions = ROOT_TYPE_OPTIONS;

  protected readonly rootType = computed<SchemaEditorType>(() =>
    getEditorType(this.value()),
  );

  protected onRootTypeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const nextType = target.value as SchemaEditorType;
    const current = this.value();
    const preserved: Partial<ObjectJsonSchema> = isObjectSchema(current)
      ? {
          ...(current.title !== undefined ? { title: current.title } : {}),
          ...(current.description !== undefined
            ? { description: current.description }
            : {}),
        }
      : {};
    const next = { ...DEFAULT_SCHEMAS[nextType], ...preserved };
    this.value.set(next);
  }

  protected readonly hasFields = computed(() => {
    const schema = this.value();
    if (isBooleanSchema(schema)) return false;
    const properties = schema.properties;
    const patternProperties = schema.patternProperties;
    return (
      (!!properties && Object.keys(properties).length > 0) ||
      (!!patternProperties && Object.keys(patternProperties).length > 0)
    );
  });

  protected readonly hasDefinitions = computed(() => {
    const schema = this.value();
    if (isBooleanSchema(schema)) return false;
    return (
      (!!schema.$defs && Object.keys(schema.$defs).length > 0) ||
      (!!schema.definitions && Object.keys(schema.definitions).length > 0)
    );
  });

  protected readonly definitionsCount = computed(() => {
    const schema = this.value();
    if (isBooleanSchema(schema)) return 0;
    return (
      Object.keys(schema.$defs ?? {}).length +
      Object.keys(schema.definitions ?? {}).length
    );
  });

  protected readonly activeTab = signal<'properties' | 'definitions'>('properties');

  protected tabClasses(tab: 'properties' | 'definitions'): string {
    return cn(
      'text-sm font-medium px-4 py-2 -mb-px border-b-2 transition-colors',
      this.activeTab() === tab
        ? 'border-primary text-foreground'
        : 'border-transparent text-muted-foreground hover:text-foreground',
    );
  }

  protected handleAddField(field: NewField): void {
    const fieldSchema = createFieldSchema(field);
    let next = updateObjectProperty(asObjectSchema(this.value()), field.name, fieldSchema);
    if (field.required) {
      next = updatePropertyRequired(next, field.name, true);
    }
    this.value.set(next);
  }

  protected handleAddPatternField(field: NewField): void {
    this.value.set(
      updateObjectPatternProperty(
        asObjectSchema(this.value()),
        field.name,
        createFieldSchema(field),
      ),
    );
  }

  protected handleEditField(event: { name: string; field: NewField }): void {
    const fieldSchema = createFieldSchema(event.field);
    let next = asObjectSchema(this.value());

    if (event.name !== event.field.name) {
      next = renameObjectProperty(next, event.name, event.field.name);
      next = updateObjectProperty(next, event.field.name, fieldSchema);
    } else {
      next = updateObjectProperty(next, event.name, fieldSchema);
    }

    next = updatePropertyRequired(next, event.field.name, event.field.required);
    this.value.set(next);
  }

  protected handleEditPatternField(event: { name: string; field: NewField }): void {
    const fieldSchema = createFieldSchema(event.field);
    let next = asObjectSchema(this.value());

    if (event.name !== event.field.name) {
      next = renameObjectPatternProperty(next, event.name, event.field.name);
      next = updateObjectPatternProperty(next, event.field.name, fieldSchema);
    } else {
      next = updateObjectPatternProperty(next, event.name, fieldSchema);
    }

    this.value.set(next);
  }

  protected handleDeleteField(name: string): void {
    this.value.set(removeObjectProperty(asObjectSchema(this.value()), name));
  }

  protected handleDeletePatternField(name: string): void {
    this.value.set(removeObjectPatternProperty(asObjectSchema(this.value()), name));
  }
}
