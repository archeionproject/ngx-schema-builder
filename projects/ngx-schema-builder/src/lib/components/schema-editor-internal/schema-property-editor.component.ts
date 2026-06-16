import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';

import { cn } from '../../internal/cn';
import { JsonjoyTranslationService } from '../../services/translation.service';
import {
  type JsonSchema,
  type ObjectJsonSchema,
  type SchemaEditorType,
  asObjectSchema,
  getEditorType,
  getSchemaDescription,
} from '../../types/json-schema';
import type { ValidationTreeNode } from '../../types/validation';
import { BadgeDirective } from '../ui/badge.directive';
import { InputDirective } from '../ui/input.directive';
import { LabelDirective } from '../ui/label.directive';
import { TypeDropdownComponent } from './type-dropdown.component';
import {
  type EnumChangeContext,
  TypeEditorComponent,
} from './type-editor.component';

@Component({
  selector: 'lib-jsonjoy-schema-property-editor',
  standalone: true,
  imports: [
    BadgeDirective,
    InputDirective,
    LabelDirective,
    TypeDropdownComponent,
    forwardRef(() => TypeEditorComponent),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy block' },
  template: `
    <div [class]="rootClasses()">
      <div
        class="relative json-field-row justify-between group flex items-center"
      >
        <div class="flex items-center gap-2 grow min-w-0">
          <button
            type="button"
            class="text-muted-foreground hover:text-foreground transition-colors"
            [attr.aria-label]="expanded() ? t().collapse : t().expand"
            (click)="toggleExpanded()"
          >
            @if (expanded()) {
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
          </button>

          <div class="flex items-center gap-2 grow min-w-0 overflow-visible">
            <div class="flex items-center gap-2 min-w-0 grow overflow-visible">
              @if (!readOnly() && isEditingName()) {
                <input
                  #nameInput
                  libJsonjoyInput
                  [value]="tempName()"
                  class="h-8 text-sm font-medium min-w-[120px] max-w-full z-10"
                  (input)="onTempNameInput($event)"
                  (blur)="submitName()"
                  (keydown.enter)="submitName()"
                  (focus)="selectAll($event)"
                />
              } @else {
                <button
                  type="button"
                  [attr.aria-label]="nameAriaLabel()"
                  [attr.title]="nameTitle()"
                  [class]="nameButtonClasses()"
                  (click)="beginEditName()"
                  (keydown.enter)="beginEditName()"
                >
                  {{ name() }}
                </button>
              }

              @if (!isRef()) {
                @if (!readOnly() && isEditingDesc()) {
                  <input
                    #descInput
                    libJsonjoyInput
                    [value]="tempDesc()"
                    [placeholder]="t().propertyDescriptionPlaceholder"
                    class="h-8 text-xs text-muted-foreground italic flex-1 min-w-[150px] z-10"
                    (input)="onTempDescInput($event)"
                    (blur)="submitDesc()"
                    (keydown.enter)="submitDesc()"
                    (focus)="selectAll($event)"
                  />
                } @else if (tempDesc()) {
                  <button
                    type="button"
                    class="text-xs text-muted-foreground italic cursor-text px-2 py-0.5 -mx-0.5 rounded-sm hover:bg-secondary/30 hover:shadow-xs hover:ring-1 hover:ring-ring/20 transition-all text-left truncate flex-1 max-w-[40%] mr-2"
                    (click)="beginEditDesc()"
                    (keydown.enter)="beginEditDesc()"
                  >
                    {{ tempDesc() }}
                  </button>
                } @else {
                  <button
                    type="button"
                    class="text-xs text-muted-foreground/50 italic cursor-text px-2 py-0.5 -mx-0.5 rounded-sm hover:bg-secondary/30 hover:shadow-xs hover:ring-1 hover:ring-ring/20 transition-all opacity-0 group-hover:opacity-100 text-left truncate flex-1 max-w-[40%] mr-2"
                    (click)="beginEditDesc()"
                    (keydown.enter)="beginEditDesc()"
                  >
                    {{ t().propertyDescriptionButton }}
                  </button>
                }
              }
            </div>

            <div class="flex items-center gap-2 justify-end shrink-0">
              <lib-jsonjoy-type-dropdown
                [value]="type()"
                [readOnly]="readOnly()"
                (valueChange)="onTypeChange($event)"
              />

              @if (mode() === 'property') {
                <button
                  type="button"
                  [class]="requiredToggleClasses()"
                  (click)="toggleRequired()"
                >
                  {{ required() ? t().propertyRequired : t().propertyOptional }}
                </button>
              } @else if (mode() === 'pattern') {
                <span
                  class="text-xs px-2 py-1 rounded-md font-medium min-w-[80px] text-center whitespace-nowrap bg-secondary text-muted-foreground flex items-center justify-center gap-1"
                  [title]="t().propertyNameRegexDescription"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17 3v10" />
                    <path d="m12.67 5.5 8.66 5" />
                    <path d="m12.67 10.5 8.66-5" />
                    <path d="M9 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                  </svg>
                  regex
                </span>
              }
            </div>
          </div>
        </div>

        @if (errorCount() > 0) {
          <div
            libJsonjoyBadge
            variant="destructive"
            class="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums justify-center"
          >
            {{ errorCount() }}
          </div>
        }

        @if (!readOnly()) {
          <div class="flex items-center gap-1 text-muted-foreground">
            <button
              type="button"
              class="p-1 rounded-md hover:bg-secondary hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
              [attr.aria-label]="t().propertyDelete"
              (click)="delete.emit()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
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
          </div>
        }
      </div>

      @if (expanded()) {
        <div class="pt-1 pb-2 px-2 sm:px-3 animate-in">
          @if (readOnly() && tempDesc()) {
            <p class="pb-2">{{ tempDesc() }}</p>
          }

          @if (!isRef()) {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div class="space-y-1">
                <label libJsonjoyLabel [attr.for]="titleId">{{
                  t().propertyTitleLabel
                }}</label>
                <input
                  libJsonjoyInput
                  [id]="titleId"
                  type="text"
                  class="h-8"
                  [value]="tempTitle()"
                  [disabled]="readOnly()"
                  [placeholder]="t().propertyTitlePlaceholder"
                  (focus)="isEditingTitle.set(true)"
                  (input)="onTempTitleInput($event)"
                  (blur)="submitTitle()"
                />
              </div>
              <div class="space-y-1">
                <label libJsonjoyLabel [attr.for]="defaultId">{{
                  t().propertyDefaultLabel
                }}</label>
                <input
                  libJsonjoyInput
                  [id]="defaultId"
                  type="text"
                  class="h-8"
                  [value]="tempDefault()"
                  [disabled]="readOnly()"
                  [placeholder]="t().propertyDefaultPlaceholder"
                  (focus)="isEditingDefault.set(true)"
                  (input)="onTempDefaultInput($event)"
                  (blur)="submitDefault()"
                />
              </div>
            </div>
          }

          <lib-jsonjoy-type-editor
            [schema]="schema()"
            [readOnly]="readOnly()"
            [validationNode]="validationNode()"
            [schemaKey]="schemaKey() ?? name()"
            [depth]="depth() + 1"
            (schemaChange)="onChildSchemaChange($event)"
            (addEnum)="addEnum.emit($event)"
            (deleteEnum)="deleteEnum.emit($event)"
          />
        </div>
      }
    </div>
  `,
})
export class SchemaPropertyEditorComponent {
  readonly name = input.required<string>();
  readonly schema = input.required<JsonSchema>();
  readonly schemaKey = input<string | undefined>(undefined);
  readonly required = input<boolean>(false);
  readonly readOnly = input.required<boolean>();
  readonly autoFocus = input<boolean>(true);
  readonly depth = input<number>(0);
  readonly validationNode = input<ValidationTreeNode | undefined>(undefined);
  readonly mode = input<'property' | 'pattern' | 'definition'>('property');

  readonly delete = output<void>();
  readonly nameChange = output<string>();
  readonly requiredChange = output<boolean>();
  readonly schemaChange = output<ObjectJsonSchema>();
  readonly addEnum = output<EnumChangeContext>();
  readonly deleteEnum = output<EnumChangeContext>();

  private readonly translations = inject(JsonjoyTranslationService);
  protected readonly t = this.translations.providerLocale;

  private static nextId = 0;
  private readonly editorId = (SchemaPropertyEditorComponent.nextId += 1);
  protected readonly titleId = `jsonjoy-title-${this.editorId}`;
  protected readonly defaultId = `jsonjoy-default-${this.editorId}`;

  protected readonly expanded = signal(false);
  protected readonly isEditingName = signal(false);
  protected readonly isEditingDesc = signal(false);
  protected readonly isEditingTitle = signal(false);
  protected readonly isEditingDefault = signal(false);
  protected readonly tempName = signal('');
  protected readonly tempDesc = signal('');
  protected readonly tempTitle = signal('');
  protected readonly tempDefault = signal('');

  protected readonly type = computed(() => getEditorType(this.schema()));
  protected readonly isRef = computed(() => this.type() === '$ref');
  protected readonly errorCount = computed(
    () => this.validationNode()?.cumulativeChildrenErrors ?? 0,
  );

  protected readonly rootClasses = computed(() =>
    cn(
      'mb-2 animate-in rounded-lg border border-border transition-all duration-200',
      this.depth() > 0 && 'ml-0 sm:ml-4 border-l-2 border-l-border',
    ),
  );

  protected readonly nameButtonClasses = computed(() =>
    cn(
      'json-field-label font-medium cursor-text px-2 py-0.5 -mx-0.5 rounded-sm hover:bg-secondary/30 hover:shadow-xs hover:ring-1 hover:ring-ring/20 transition-all text-left truncate min-w-[80px] max-w-[50%]',
      this.mode() === 'pattern' && 'font-mono',
    ),
  );

  protected readonly nameAriaLabel = computed(() =>
    this.mode() === 'pattern'
      ? `${this.t().fieldNameRegexLabel}: ${this.name()}`
      : null,
  );
  protected readonly nameTitle = computed(() =>
    this.mode() === 'pattern' ? this.t().propertyNameRegexDescription : null,
  );

  protected readonly requiredToggleClasses = computed(() =>
    cn(
      'text-xs px-2 py-1 rounded-md font-medium min-w-[80px] text-center cursor-pointer hover:shadow-xs hover:ring-2 hover:ring-ring/30 active:scale-95 transition-all whitespace-nowrap',
      this.required()
        ? 'bg-red-50 text-red-500'
        : 'bg-secondary text-muted-foreground',
    ),
  );

  private readonly nameInput =
    viewChild<ElementRef<HTMLInputElement>>('nameInput');
  private readonly descInput =
    viewChild<ElementRef<HTMLInputElement>>('descInput');

  constructor() {
    // Sync the editable buffers from external schema/name changes, but never
    // overwrite a field the user is currently editing (otherwise an external
    // update — e.g. the JSON editor in `both` mode — clobbers their draft).
    effect(() => {
      const name = this.name();
      const schema = this.schema();
      untracked(() => {
        if (!this.isEditingName()) this.tempName.set(name);
        if (!this.isEditingDesc()) {
          this.tempDesc.set(getSchemaDescription(schema));
        }
        const s = asObjectSchema(schema);
        if (!this.isEditingTitle()) {
          this.tempTitle.set(typeof s.title === 'string' ? s.title : '');
        }
        if (!this.isEditingDefault()) {
          this.tempDefault.set(
            s.default === undefined ? '' : formatDefault(s.default),
          );
        }
      });
    });

    effect(() => {
      if (this.isEditingName() && this.autoFocus()) {
        queueMicrotask(() => this.nameInput()?.nativeElement.focus());
      }
    });

    effect(() => {
      if (this.isEditingDesc() && this.autoFocus()) {
        queueMicrotask(() => this.descInput()?.nativeElement.focus());
      }
    });
  }

  protected toggleExpanded(): void {
    this.expanded.update((v) => !v);
  }

  protected beginEditName(): void {
    if (this.readOnly()) return;
    this.isEditingName.set(true);
  }

  protected beginEditDesc(): void {
    if (this.readOnly()) return;
    this.isEditingDesc.set(true);
  }

  protected onTempNameInput(event: Event): void {
    this.tempName.set((event.target as HTMLInputElement).value);
  }

  protected onTempDescInput(event: Event): void {
    this.tempDesc.set((event.target as HTMLInputElement).value);
  }

  protected submitName(): void {
    const trimmed = this.tempName().trim();
    if (trimmed && trimmed !== this.name()) {
      this.nameChange.emit(trimmed);
    } else {
      this.tempName.set(this.name());
    }
    this.isEditingName.set(false);
  }

  protected submitDesc(): void {
    const trimmed = this.tempDesc().trim();
    const currentDesc = getSchemaDescription(this.schema());
    if (trimmed !== currentDesc) {
      this.schemaChange.emit({
        ...asObjectSchema(this.schema()),
        description: trimmed || undefined,
      });
    } else {
      this.tempDesc.set(currentDesc);
    }
    this.isEditingDesc.set(false);
  }

  protected onTempTitleInput(event: Event): void {
    this.tempTitle.set((event.target as HTMLInputElement).value);
  }

  protected submitTitle(): void {
    this.isEditingTitle.set(false);
    const trimmed = this.tempTitle().trim();
    const base = asObjectSchema(this.schema());
    const current = typeof base.title === 'string' ? base.title : '';
    if (trimmed === current) return;
    const { title: _t, ...rest } = base;
    this.schemaChange.emit(trimmed ? { ...rest, title: trimmed } : rest);
  }

  protected onTempDefaultInput(event: Event): void {
    this.tempDefault.set((event.target as HTMLInputElement).value);
  }

  protected submitDefault(): void {
    this.isEditingDefault.set(false);
    const raw = this.tempDefault().trim();
    const base = asObjectSchema(this.schema());
    if (!raw) {
      if (base.default === undefined) return;
      const { default: _d, ...rest } = base;
      this.schemaChange.emit(rest);
      return;
    }
    const value = parseDefault(raw);
    if (deepEqual(value, base.default)) return;
    this.schemaChange.emit({ ...base, default: value });
  }

  protected toggleRequired(): void {
    if (this.readOnly()) return;
    this.requiredChange.emit(!this.required());
  }

  protected selectAll(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  protected onTypeChange(newType: SchemaEditorType): void {
    const current = asObjectSchema(this.schema());
    if (newType === '$ref') {
      this.schemaChange.emit({ $ref: '' });
      this.expanded.set(true);
      return;
    }
    if (newType === 'anyOf' || newType === 'oneOf' || newType === 'allOf') {
      const {
        type: _type,
        $ref: _r,
        anyOf: _a,
        oneOf: _o,
        allOf: _al,
        ...rest
      } = current;
      const initial =
        newType === 'allOf'
          ? { allOf: [{ type: 'object' as const }] }
          : {
              [newType]: [
                { type: 'string' as const },
                { type: 'number' as const },
              ],
            };
      this.schemaChange.emit({ ...rest, ...initial });
    } else {
      const { $ref: _r, anyOf: _a, oneOf: _o, allOf: _al, ...rest } = current;
      this.schemaChange.emit({ ...rest, type: newType });
    }
  }

  protected onChildSchemaChange(updated: ObjectJsonSchema): void {
    if (typeof updated.$ref === 'string') {
      this.schemaChange.emit({ $ref: updated.$ref });
      return;
    }
    const base = asObjectSchema(this.schema());
    const merged: ObjectJsonSchema = { ...updated };
    const desc = getSchemaDescription(this.schema());
    if (desc) merged.description = desc;
    if (typeof base.title === 'string' && base.title) merged.title = base.title;
    if (base.default !== undefined) merged.default = base.default;
    this.schemaChange.emit(merged);
  }
}

function formatDefault(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function parseDefault(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}
