import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';

import { cn } from '../../internal/cn';
import { JsonjoyTranslationService } from '../../services/translation.service';
import type { Translation } from '../../i18n/translation-keys';
import {
  getEditorType,
  getSchemaDescription,
  isBooleanSchema,
  type JsonSchema,
  type ObjectJsonSchema,
  type SchemaEditorType,
  type SchemaType,
} from '../../types/json-schema';
import type { ValidationTreeNode } from '../../types/validation';
import { InputDirective } from '../ui/input.directive';
import { TypeDropdownComponent } from '../schema-editor-internal/type-dropdown.component';
import { TypeEditorComponent } from '../schema-editor-internal/type-editor.component';
import type { EnumChangeContext } from '../schema-editor-internal/type-editor.component';

export type CombinatorKind = 'anyOf' | 'oneOf' | 'allOf';

interface CombinatorStrings {
  description: string;
  addButton: string;
  removeButton: string;
  itemLabel: string;
  noItems: string;
}

function getCombinatorStrings(
  t: Translation,
  combinator: CombinatorKind,
): CombinatorStrings {
  switch (combinator) {
    case 'anyOf':
      return {
        description: t.anyOfDescription,
        addButton: t.anyOfAddOption,
        removeButton: t.anyOfRemoveOption,
        itemLabel: t.anyOfOptionLabel,
        noItems: t.anyOfNoOptions,
      };
    case 'oneOf':
      return {
        description: t.oneOfDescription,
        addButton: t.oneOfAddOption,
        removeButton: t.oneOfRemoveOption,
        itemLabel: t.oneOfOptionLabel,
        noItems: t.oneOfNoOptions,
      };
    case 'allOf':
      return {
        description: t.allOfDescription,
        addButton: t.allOfAddSchema,
        removeButton: t.allOfRemoveSchema,
        itemLabel: t.allOfSchemaLabel,
        noItems: t.allOfNoSchemas,
      };
  }
}

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
};

interface OptionRow {
  readonly id: string;
  readonly index: number;
  readonly schema: JsonSchema;
  readonly description: string;
  readonly type: SchemaEditorType;
  readonly isExpanded: boolean;
  readonly isDescFocused: boolean;
}

let idCounter = 0;
const nextId = () => `combinator-${++idCounter}`;

@Component({
  selector: 'lib-jsonjoy-combinator-editor',
  standalone: true,
  imports: [InputDirective, TypeDropdownComponent, forwardRef(() => TypeEditorComponent)],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
  template: `
    <div class="space-y-3">
      <p class="text-xs text-muted-foreground italic">
        {{ strings().description }}
      </p>

      @if (options().length === 0) {
        <div
          class="text-sm text-muted-foreground italic p-2 text-center border rounded-md"
        >
          {{ strings().noItems }}
        </div>
      } @else {
        <div class="space-y-2">
          @for (row of rows(); track row.id) {
            <div [class]="rowClasses()">
              <div
                class="flex flex-wrap items-center gap-2 px-3 py-2 sm:flex-nowrap"
              >
                <button
                  type="button"
                  class="flex shrink-0 items-center gap-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  (click)="toggleExpanded(row.id)"
                >
                  @if (row.isExpanded) {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  } @else {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  }
                  <span class="shrink-0">
                    {{ strings().itemLabel }} {{ row.index + 1 }}
                  </span>
                </button>

                @if (readOnly()) {
                  @if (row.description) {
                    <span
                      class="flex-1 truncate px-2 py-0.5 text-left text-xs text-muted-foreground italic"
                    >
                      {{ row.description }}
                    </span>
                  }
                } @else if (row.isDescFocused) {
                  <input
                    libJsonjoyInput
                    [attr.aria-label]="t().propertyDescriptionPlaceholder"
                    class="z-10 min-w-40 flex-1 text-xs"
                    [placeholder]="t().propertyDescriptionPlaceholder"
                    [value]="row.description"
                    [autofocus]="true"
                    (focus)="selectAll($event)"
                    (input)="onDescriptionInput(row.index, $event)"
                    (blur)="onDescriptionBlur(row.index, $event)"
                    (keydown.enter)="onDescriptionEnter($event)"
                  />
                } @else if (row.description) {
                  <button
                    type="button"
                    class="mr-2 min-w-0 flex-1 cursor-text truncate rounded-sm px-2 py-0.5 text-left text-xs text-muted-foreground italic transition-all -mx-0.5 hover:bg-secondary/30 hover:ring-1 hover:ring-ring/20 hover:shadow-xs"
                    (click)="focusDescription(row.id)"
                    (keydown.enter)="focusDescription(row.id)"
                  >
                    {{ row.description }}
                  </button>
                } @else {
                  <button
                    type="button"
                    class="mr-2 min-w-0 flex-1 cursor-text truncate rounded-sm px-2 py-0.5 text-left text-xs text-muted-foreground/50 italic opacity-0 transition-all -mx-0.5 hover:bg-secondary/30 hover:ring-1 hover:ring-ring/20 hover:shadow-xs group-hover:opacity-100"
                    (click)="focusDescription(row.id)"
                    (keydown.enter)="focusDescription(row.id)"
                  >
                    {{ t().propertyDescriptionButton }}
                  </button>
                }

                <div class="flex shrink-0 items-center gap-2 sm:ml-auto">
                  <lib-jsonjoy-type-dropdown
                    [value]="row.type"
                    [readOnly]="readOnly()"
                    (valueChange)="onOptionTypeChange(row.index, $event)"
                  />
                  @if (!readOnly()) {
                    <button
                      type="button"
                      class="p-1 rounded-md hover:bg-secondary hover:text-destructive transition-colors text-muted-foreground"
                      [attr.aria-label]="strings().removeButton"
                      (click)="onRemoveOption(row.index)"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  }
                </div>
              </div>

              @if (row.isExpanded) {
                <div class="pt-1 pb-2 px-3 border-t animate-in">
                  <lib-jsonjoy-type-editor
                    [schema]="row.schema"
                    [readOnly]="readOnly()"
                    [validationNode]="
                      validationNode()?.children?.[childKey(row.index)]
                    "
                    [schemaKey]="optionSchemaKey(row.index)"
                    [depth]="depth() + 1"
                    (schemaChange)="onOptionSchemaChange(row.index, $event)"
                    (addEnum)="addEnum.emit($event)"
                    (deleteEnum)="deleteEnum.emit($event)"
                  />
                </div>
              }
            </div>
          }
        </div>
      }

      @if (!readOnly()) {
        <button
          type="button"
          class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary"
          (click)="onAddOption()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
            <path d="M12 8v8" />
          </svg>
          {{ strings().addButton }}
        </button>
      }
    </div>
  `,
})
export class CombinatorEditorComponent {
  readonly schema = input.required<JsonSchema>();
  readonly readOnly = input.required<boolean>();
  readonly combinator = input.required<CombinatorKind>();
  readonly validationNode = input<ValidationTreeNode | undefined>(undefined);
  readonly schemaKey = input<string | undefined>(undefined);
  readonly depth = input<number>(0);

  readonly schemaChange = output<ObjectJsonSchema>();
  readonly addEnum = output<EnumChangeContext>();
  readonly deleteEnum = output<EnumChangeContext>();

  private readonly translations = inject(JsonjoyTranslationService);
  protected readonly t = this.translations.providerLocale;

  protected readonly strings = computed(() =>
    getCombinatorStrings(this.t(), this.combinator()),
  );

  protected readonly options = computed<readonly JsonSchema[]>(() => {
    const schema = this.schema();
    if (isBooleanSchema(schema)) return [];
    return schema[this.combinator()] ?? [];
  });

  protected readonly ids = linkedSignal<readonly string[]>(() =>
    this.options().map(() => nextId()),
  );

  protected readonly expandedId = signal<string | null>(null);
  protected readonly descFocusId = signal<string | null>(null);

  protected readonly rows = computed<readonly OptionRow[]>(() => {
    const ids = this.ids();
    const expandedId = this.expandedId();
    const descFocusId = this.descFocusId();
    return this.options().map((option, index) => ({
      id: ids[index] ?? `fallback-${index}`,
      index,
      schema: option,
      description: getSchemaDescription(option),
      type: getEditorType(option),
      isExpanded: expandedId === ids[index],
      isDescFocused: descFocusId === ids[index],
    }));
  });

  protected readonly rowClasses = computed(() =>
    cn(
      'group rounded-lg border transition-all duration-200',
      this.depth() > 0 && 'ml-0 sm:ml-4 border-l border-l-border/40',
    ),
  );

  protected childKey(index: number): string {
    return `${this.combinator()}:${index}`;
  }

  protected optionSchemaKey(index: number): string {
    const prefix = this.schemaKey();
    const k = this.combinator();
    return prefix ? `${prefix}.${k}[${index}]` : `${k}[${index}]`;
  }

  protected toggleExpanded(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  protected focusDescription(id: string): void {
    this.descFocusId.set(id);
  }

  protected selectAll(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  protected onDescriptionInput(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.applyDescription(index, value);
  }

  protected onDescriptionBlur(index: number, event: FocusEvent): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.applyDescription(index, value);
    this.descFocusId.set(null);
  }

  protected onDescriptionEnter(event: Event): void {
    event.preventDefault();
    (event.target as HTMLInputElement).blur();
  }

  protected onAddOption(): void {
    const newOptions = [...this.options(), { type: 'string' as const }];
    const newId = nextId();
    this.ids.set([...this.ids(), newId]);
    this.commitOptions(newOptions);
    this.expandedId.set(newId);
  }

  protected onRemoveOption(index: number): void {
    const ids = this.ids();
    const removedId = ids[index];
    const newOptions = this.options().filter((_, i) => i !== index);
    this.ids.set(ids.filter((_, i) => i !== index));
    if (this.expandedId() === removedId) {
      this.expandedId.set(null);
    }
    this.commitOptions(newOptions);
  }

  protected onOptionTypeChange(
    index: number,
    newType: SchemaEditorType,
  ): void {
    const options = this.options();
    const prevDesc = getSchemaDescription(options[index]);
    let next: ObjectJsonSchema =
      DEFAULT_SCHEMAS[newType as SchemaType] ??
      DEFAULT_SCHEMAS[newType] ?? { type: 'string' };
    if (prevDesc !== '') {
      next = { ...next, description: prevDesc };
    }
    const newOptions = [...options];
    newOptions[index] = next;
    this.commitOptions(newOptions);
  }

  protected onOptionSchemaChange(
    index: number,
    updated: ObjectJsonSchema,
  ): void {
    const newOptions = [...this.options()];
    newOptions[index] = updated;
    this.commitOptions(newOptions);
  }

  private applyDescription(index: number, raw: string): void {
    const description = raw === '' ? undefined : raw;
    const opt = this.options()[index];
    let updated: JsonSchema;
    if (isBooleanSchema(opt)) {
      updated = description !== undefined ? { description } : opt;
    } else {
      const base = { ...opt };
      if (description !== undefined) {
        base.description = description;
      } else {
        delete base.description;
      }
      updated = base;
    }
    const newOptions = [...this.options()];
    newOptions[index] = updated;
    this.commitOptions(newOptions);
  }

  private commitOptions(newOptions: readonly JsonSchema[]): void {
    const schema = this.schema();
    const base = isBooleanSchema(schema) ? {} : schema;
    const combinator = this.combinator();
    const {
      [combinator]: _old,
      type: _type,
      ...rest
    } = base as ObjectJsonSchema & Record<CombinatorKind, JsonSchema[] | undefined>;
    this.schemaChange.emit({ ...rest, [combinator]: [...newOptions] });
  }
}
