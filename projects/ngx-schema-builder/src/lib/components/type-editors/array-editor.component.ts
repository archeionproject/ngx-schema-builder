import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';

import { cn } from '../../internal/cn';
import { getArrayItemsSchema } from '../../internal/schema-editor';
import { JsonjoyTranslationContextService } from '../../services/translation-context.service';
import {
  type JsonSchema,
  type ObjectJsonSchema,
  type SchemaEditorType,
  asObjectSchema,
  getEditorType,
  isBooleanSchema,
  withObjectSchema,
} from '../../types/json-schema';
import type { ValidationTreeNode } from '../../types/validation';
import { TypeDropdownComponent } from '../schema-editor-internal/type-dropdown.component';
import { TypeEditorComponent } from '../schema-editor-internal/type-editor.component';
import type { EnumChangeContext } from '../schema-editor-internal/type-editor.component';
import { InputDirective } from '../ui/input.directive';
import { LabelDirective } from '../ui/label.directive';
import { SwitchComponent } from '../ui/switch.component';

let nextArrayId = 0;

@Component({
  selector: 'lib-jsonjoy-array-editor',
  standalone: true,
  imports: [
    InputDirective,
    LabelDirective,
    SwitchComponent,
    TypeDropdownComponent,
    forwardRef(() => TypeEditorComponent),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
  template: `
    <div class="space-y-6">
      @if (!readOnly() || !!maxItems() || !!minItems()) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @if (!readOnly() || !!minItems()) {
            <div class="space-y-2">
              <label
                libJsonjoyLabel
                [attr.for]="minItemsId"
                [class.text-destructive]="!!minMaxError() || !!minItemsError()"
              >
                {{ t().arrayMinimumLabel }}
              </label>
              <input
                libJsonjoyInput
                [id]="minItemsId"
                type="number"
                min="0"
                [value]="minItems() ?? ''"
                [placeholder]="t().arrayMinimumPlaceholder"
                [class]="numberInputClasses(!!minMaxError())"
                (input)="onMinItemsInput($event)"
                (blur)="commitValidation()"
              />
            </div>
          }
          @if (!readOnly() || !!maxItems()) {
            <div class="space-y-2">
              <label
                libJsonjoyLabel
                [attr.for]="maxItemsId"
                [class.text-destructive]="!!minMaxError() || !!maxItemsError()"
              >
                {{ t().arrayMaximumLabel }}
              </label>
              <input
                libJsonjoyInput
                [id]="maxItemsId"
                type="number"
                min="0"
                [value]="maxItems() ?? ''"
                [placeholder]="t().arrayMaximumPlaceholder"
                [class]="numberInputClasses(!!minMaxError())"
                (input)="onMaxItemsInput($event)"
                (blur)="commitValidation()"
              />
            </div>
          }
          @if (!!minMaxError() || !!minItemsError() || !!maxItemsError()) {
            <div
              class="text-xs text-destructive italic md:col-span-2 whitespace-pre-line"
            >
              {{ combinedRangeError() }}
            </div>
          }
        </div>
      }

      @if (!readOnly() || uniqueItems()) {
        <div class="flex items-center space-x-2">
          <lib-jsonjoy-switch
            [id]="uniqueItemsId"
            [checked]="uniqueItems()"
            [ariaLabel]="t().arrayForceUniqueItemsLabel"
            (checkedChange)="onUniqueItemsChange($event)"
          />
          <label
            libJsonjoyLabel
            [attr.for]="uniqueItemsId"
            class="cursor-pointer"
          >
            {{ t().arrayForceUniqueItemsLabel }}
          </label>
        </div>
      }

      <div [class]="itemSectionClasses()">
        <div class="flex items-center justify-between mb-4">
          <label libJsonjoyLabel>{{ t().arrayItemTypeLabel }}</label>
          <lib-jsonjoy-type-dropdown
            [value]="itemType()"
            [readOnly]="readOnly()"
            (valueChange)="onItemTypeChange($event)"
          />
        </div>

        <lib-jsonjoy-type-editor
          [schema]="itemsSchema()"
          [readOnly]="readOnly()"
          [validationNode]="validationNode()"
          [schemaKey]="itemSchemaKey()"
          [depth]="depth() + 1"
          (schemaChange)="onItemSchemaChange($event)"
          (addEnum)="addEnum.emit($event)"
          (deleteEnum)="deleteEnum.emit($event)"
        />
      </div>
    </div>
  `,
})
export class ArrayEditorComponent {
  readonly schema = input.required<JsonSchema>();
  readonly readOnly = input.required<boolean>();
  readonly validationNode = input<ValidationTreeNode | undefined>(undefined);
  readonly schemaKey = input<string | undefined>(undefined);
  readonly depth = input<number>(0);

  readonly schemaChange = output<ObjectJsonSchema>();
  readonly addEnum = output<EnumChangeContext>();
  readonly deleteEnum = output<EnumChangeContext>();

  protected readonly t = inject(JsonjoyTranslationContextService).translation;

  private readonly idSeq = ++nextArrayId;
  protected readonly minItemsId = `jjarr-${this.idSeq}-min`;
  protected readonly maxItemsId = `jjarr-${this.idSeq}-max`;
  protected readonly uniqueItemsId = `jjarr-${this.idSeq}-unique`;

  protected readonly minItems = linkedSignal<number | undefined>(() =>
    withObjectSchema(this.schema(), (s) => s.minItems, undefined),
  );
  protected readonly maxItems = linkedSignal<number | undefined>(() =>
    withObjectSchema(this.schema(), (s) => s.maxItems, undefined),
  );
  protected readonly uniqueItems = linkedSignal<boolean>(() =>
    withObjectSchema(this.schema(), (s) => s.uniqueItems ?? false, false),
  );

  protected readonly itemsSchema = computed<JsonSchema>(
    () => getArrayItemsSchema(this.schema()) ?? { type: 'string' },
  );

  protected readonly itemSchemaKey = computed(() => {
    const key = this.schemaKey();
    return key ? `${key}[]` : undefined;
  });

  protected readonly itemType = computed<SchemaEditorType>(() =>
    getEditorType(this.itemsSchema()),
  );

  private readonly errorsByPath = computed(() => {
    const errors = this.validationNode()?.validation.errors ?? [];
    return errors;
  });

  protected readonly minMaxError = computed(
    () => this.errorsByPath().find((err) => err.path[0] === 'minmax')?.message,
  );

  protected readonly minItemsError = computed(
    () =>
      this.errorsByPath().find((err) => err.path[0] === 'minItems')?.message,
  );

  protected readonly maxItemsError = computed(
    () =>
      this.errorsByPath().find((err) => err.path[0] === 'maxItems')?.message,
  );

  protected readonly combinedRangeError = computed(() => {
    const parts = [
      this.minMaxError(),
      this.minItemsError() ?? this.maxItemsError(),
    ].filter(Boolean);
    return parts.join('\n');
  });

  protected readonly itemSectionClasses = computed(() =>
    cn(
      'space-y-2 pt-4 border-border/40',
      !this.readOnly() ||
        this.minItems() ||
        this.maxItems() ||
        this.uniqueItems()
        ? 'border-t'
        : null,
    ),
  );

  protected numberInputClasses(hasMinMaxError: boolean): string {
    return cn('h-8', hasMinMaxError && 'border-destructive');
  }

  protected onMinItemsInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.minItems.set(raw === '' ? undefined : Number(raw));
  }

  protected onMaxItemsInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.maxItems.set(raw === '' ? undefined : Number(raw));
  }

  protected commitValidation(): void {
    this.schemaChange.emit(this.buildValidationProps());
  }

  protected onUniqueItemsChange(value: boolean): void {
    this.uniqueItems.set(value);
    this.schemaChange.emit(this.buildValidationProps({ uniqueItems: value }));
  }

  protected onItemSchemaChange(updatedItem: ObjectJsonSchema): void {
    const schema = this.schema();
    const base: ObjectJsonSchema = {
      type: 'array',
      ...(isBooleanSchema(schema) ? {} : schema),
      items: updatedItem,
    };
    this.schemaChange.emit(base);
  }

  protected onItemTypeChange(newType: SchemaEditorType): void {
    const items = this.itemsSchema();
    const rest = stripTypeAndCombinators(asObjectSchema(items));
    if (newType === '$ref') {
      this.onItemSchemaChange({ $ref: '' });
      return;
    }
    if (newType === 'anyOf' || newType === 'oneOf' || newType === 'allOf') {
      const initial =
        newType === 'allOf'
          ? { allOf: [{ type: 'object' as const }] }
          : {
              [newType]: [
                { type: 'string' as const },
                { type: 'number' as const },
              ],
            };
      this.onItemSchemaChange({ ...rest, ...initial });
    } else {
      this.onItemSchemaChange({ ...rest, type: newType });
    }
  }

  private buildValidationProps(
    overrides: {
      minItems?: number;
      maxItems?: number;
      uniqueItems?: boolean;
    } = {},
  ): ObjectJsonSchema {
    const schema = this.schema();
    const next: ObjectJsonSchema = {
      type: 'array',
      ...(isBooleanSchema(schema) ? {} : schema),
      minItems: overrides.minItems ?? this.minItems(),
      maxItems: overrides.maxItems ?? this.maxItems(),
      uniqueItems: overrides.uniqueItems || undefined,
    };

    if (next.items === undefined) {
      next.items = this.itemsSchema();
    }

    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(next)) {
      if (value !== undefined) cleaned[key] = value;
    }
    return cleaned as ObjectJsonSchema;
  }
}

function stripTypeAndCombinators(schema: ObjectJsonSchema): ObjectJsonSchema {
  const {
    type: _type,
    $ref: _ref,
    anyOf: _anyOf,
    oneOf: _oneOf,
    allOf: _allOf,
    ...rest
  } = schema;
  return rest as ObjectJsonSchema;
}
