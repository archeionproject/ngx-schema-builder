import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
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
  isBooleanSchema,
  type JsonSchema,
  type NewField,
} from '../../types/json-schema';
import { AddFieldButtonComponent } from '../schema-editor-internal/add-field-button.component';
import { SchemaFieldListComponent } from '../schema-editor-internal/schema-field-list.component';

@Component({
  selector: 'lib-jsonjoy-schema-fields-editor',
  standalone: true,
  imports: [AddFieldButtonComponent, SchemaFieldListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
  template: `
    <div [class]="rootClasses()">
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
