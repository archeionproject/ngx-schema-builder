import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { cn } from '../../internal/cn';
import { JsonjoyTranslationContextService } from '../../services/translation-context.service';
import {
  type JsonSchema,
  type ObjectJsonSchema,
  isBooleanSchema,
  withObjectSchema,
} from '../../types/json-schema';
import type { ValidationTreeNode } from '../../types/validation';
import type { EnumChangeContext } from '../schema-editor-internal/type-editor.component';
import { ButtonDirective } from '../ui/button.directive';
import { InputDirective } from '../ui/input.directive';
import { LabelDirective } from '../ui/label.directive';

type StringValidationProperty =
  | 'enum'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'format';

let nextStringEditorId = 0;

const STRING_FORMATS = [
  'none',
  'date-time',
  'date',
  'time',
  'email',
  'uri',
  'uuid',
  'hostname',
  'ipv4',
  'ipv6',
] as const;

@Component({
  selector: 'lib-jsonjoy-string-editor',
  standalone: true,
  imports: [ButtonDirective, InputDirective, LabelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
  template: `
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        @if (readOnly() && !needsDetail()) {
          <p class="text-sm text-muted-foreground italic">
            {{ t().stringNoConstraint }}
          </p>
        }

        @if (!readOnly() || minLengthValue() !== '') {
          <div class="space-y-2">
            <label
              libJsonjoyLabel
              [attr.for]="minLengthId"
              [class.text-destructive]="!!minMaxError() || !!minLengthError()"
            >
              {{ t().stringMinimumLengthLabel }}
            </label>
            <input
              libJsonjoyInput
              [id]="minLengthId"
              type="number"
              min="0"
              [value]="minLengthValue()"
              [disabled]="readOnly()"
              [placeholder]="t().stringMinimumLengthPlaceholder"
              [class]="minMaxInputClasses()"
              (input)="onLengthInput('minLength', $event)"
            />
          </div>
        }

        @if (!readOnly() || maxLengthValue() !== '') {
          <div class="space-y-2">
            <label
              libJsonjoyLabel
              [attr.for]="maxLengthId"
              [class.text-destructive]="!!minMaxError() || !!maxLengthError()"
            >
              {{ t().stringMaximumLengthLabel }}
            </label>
            <input
              libJsonjoyInput
              [id]="maxLengthId"
              type="number"
              min="0"
              [value]="maxLengthValue()"
              [disabled]="readOnly()"
              [placeholder]="t().stringMaximumLengthPlaceholder"
              [class]="maxMinInputClasses()"
              (input)="onLengthInput('maxLength', $event)"
            />
          </div>
        }

        @if (lengthErrorText()) {
          <div
            class="text-xs text-destructive italic md:col-span-2 whitespace-pre-line"
          >
            {{ lengthErrorText() }}
          </div>
        }
      </div>

      @if (!readOnly() || patternValue() !== '') {
        <div class="space-y-2">
          <label
            libJsonjoyLabel
            [attr.for]="patternId"
            [class.text-destructive]="!!patternError()"
          >
            {{ t().stringPatternLabel }}
          </label>
          <input
            libJsonjoyInput
            [id]="patternId"
            type="text"
            [value]="patternValue()"
            [disabled]="readOnly()"
            [placeholder]="t().stringPatternPlaceholder"
            class="h-8"
            (input)="onPatternInput($event)"
          />
        </div>
      }

      @if (!readOnly() || formatValue() !== 'none') {
        <div class="space-y-2">
          <label
            libJsonjoyLabel
            [attr.for]="formatId"
            [class.text-destructive]="!!formatError()"
          >
            {{ t().stringFormatLabel }}
          </label>
          <select
            [id]="formatId"
            class="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            [disabled]="readOnly()"
            [value]="formatValue()"
            (change)="onFormatChange($event)"
          >
            <option value="none">{{ t().stringFormatNone }}</option>
            <option value="date-time">{{ t().stringFormatDateTime }}</option>
            <option value="date">{{ t().stringFormatDate }}</option>
            <option value="time">{{ t().stringFormatTime }}</option>
            <option value="email">{{ t().stringFormatEmail }}</option>
            <option value="uri">{{ t().stringFormatUri }}</option>
            <option value="uuid">{{ t().stringFormatUuid }}</option>
            <option value="hostname">{{ t().stringFormatHostname }}</option>
            <option value="ipv4">{{ t().stringFormatIpv4 }}</option>
            <option value="ipv6">{{ t().stringFormatIpv6 }}</option>
          </select>
        </div>
      }

      @if (!readOnly() || enumValues().length > 0) {
        <div class="space-y-2 pt-2 border-t border-border/40">
          <label libJsonjoyLabel>{{ t().stringAllowedValuesEnumLabel }}</label>

          <div class="flex flex-wrap gap-2 mb-4">
            @if (enumValues().length > 0) {
              @for (value of enumValues(); track value) {
                <div
                  class="flex items-center bg-muted/40 border rounded-md px-2 py-1 text-xs"
                >
                  <span class="mr-1">{{ value }}</span>
                  <button
                    type="button"
                    class="text-muted-foreground hover:text-destructive"
                    (click)="removeEnumValue(value)"
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
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
              }
            } @else {
              <p class="text-xs text-muted-foreground italic">
                {{ t().stringAllowedValuesEnumNone }}
              </p>
            }
          </div>

          <div class="flex items-center gap-2">
            <input
              libJsonjoyInput
              type="text"
              [value]="enumDraft()"
              [placeholder]="t().stringAllowedValuesEnumAddPlaceholder"
              class="h-8 text-xs flex-1"
              (input)="onEnumDraftInput($event)"
              (keydown.enter)="addEnumValue()"
            />
            <button
              libJsonjoyButton
              variant="secondary"
              size="sm"
              type="button"
              (click)="addEnumValue()"
            >
              {{ t().stringAllowedValuesEnumAddLabel }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class StringEditorComponent {
  readonly schema = input.required<JsonSchema>();
  readonly readOnly = input.required<boolean>();
  readonly validationNode = input<ValidationTreeNode | undefined>(undefined);
  readonly schemaKey = input<string | undefined>(undefined);
  readonly depth = input<number>(0);

  readonly schemaChange = output<ObjectJsonSchema>();
  readonly addEnum = output<EnumChangeContext>();
  readonly deleteEnum = output<EnumChangeContext>();

  protected readonly t = inject(JsonjoyTranslationContextService).translation;

  private readonly idSeq = ++nextStringEditorId;
  protected readonly minLengthId = `jjse-${this.idSeq}-min`;
  protected readonly maxLengthId = `jjse-${this.idSeq}-max`;
  protected readonly patternId = `jjse-${this.idSeq}-pattern`;
  protected readonly formatId = `jjse-${this.idSeq}-format`;

  protected readonly enumDraft = signal('');

  protected readonly minLength = computed(() =>
    withObjectSchema(this.schema(), (s) => s.minLength, undefined),
  );
  protected readonly maxLength = computed(() =>
    withObjectSchema(this.schema(), (s) => s.maxLength, undefined),
  );
  protected readonly pattern = computed(() =>
    withObjectSchema(this.schema(), (s) => s.pattern, undefined),
  );
  protected readonly format = computed(() =>
    withObjectSchema(this.schema(), (s) => s.format, undefined),
  );
  protected readonly enumValues = computed<readonly string[]>(() =>
    withObjectSchema(
      this.schema(),
      (s) => (s.enum as string[] | undefined) ?? [],
      [],
    ),
  );

  protected readonly minLengthValue = computed(() => this.minLength() ?? '');
  protected readonly maxLengthValue = computed(() => this.maxLength() ?? '');
  protected readonly patternValue = computed(() => this.pattern() ?? '');
  protected readonly formatValue = computed(() => this.format() || 'none');

  protected readonly needsDetail = computed(() => {
    return (
      !this.readOnly() ||
      this.minLengthValue() !== '' ||
      this.maxLengthValue() !== '' ||
      this.patternValue() !== '' ||
      this.formatValue() !== 'none' ||
      this.enumValues().length > 0
    );
  });

  protected readonly minMaxError = computed(() => this.errorAt('length'));
  protected readonly minLengthError = computed(() => this.errorAt('minLength'));
  protected readonly maxLengthError = computed(() => this.errorAt('maxLength'));
  protected readonly patternError = computed(() => this.errorAt('pattern'));
  protected readonly formatError = computed(() => this.errorAt('format'));

  protected readonly lengthErrorText = computed(() => {
    const parts = [
      this.minMaxError(),
      this.minLengthError() ?? this.maxLengthError(),
    ].filter(Boolean);
    return parts.length > 0 ? parts.join('\n') : '';
  });

  protected readonly minMaxInputClasses = computed(() =>
    cn(
      'h-8',
      (!!this.minMaxError() || !!this.minLengthError()) && 'border-destructive',
    ),
  );
  protected readonly maxMinInputClasses = computed(() =>
    cn(
      'h-8',
      (!!this.minMaxError() || !!this.maxLengthError()) && 'border-destructive',
    ),
  );

  protected onLengthInput(
    property: 'minLength' | 'maxLength',
    event: Event,
  ): void {
    const raw = (event.target as HTMLInputElement).value;
    const value = raw === '' ? undefined : Number(raw);
    this.applyValidationChange(property, value);
  }

  protected onPatternInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.applyValidationChange('pattern', raw === '' ? undefined : raw);
  }

  protected onFormatChange(event: Event): void {
    const selected = (event.target as HTMLSelectElement).value;
    const next = STRING_FORMATS.find((f) => f === selected) ?? 'none';
    this.applyValidationChange('format', next === 'none' ? undefined : next);
  }

  protected onEnumDraftInput(event: Event): void {
    this.enumDraft.set((event.target as HTMLInputElement).value);
  }

  protected addEnumValue(): void {
    const trimmed = this.enumDraft().trim();
    if (!trimmed) return;
    const current = this.enumValues();
    if (!current.includes(trimmed)) {
      const addedIndex = current.length;
      this.applyEnumValues([...current, trimmed]);
      this.addEnum.emit({
        value: trimmed,
        index: addedIndex,
        schemaKey: this.schemaKey(),
      });
    }
    this.enumDraft.set('');
  }

  protected removeEnumValue(value: string): void {
    const current = this.enumValues();
    const index = current.indexOf(value);
    if (index < 0) return;
    const next = current.filter((_, i) => i !== index);
    this.applyEnumValues(next);
    this.deleteEnum.emit({ value, index, schemaKey: this.schemaKey() });
  }

  private applyValidationChange(
    property: StringValidationProperty,
    value: unknown,
  ): void {
    const current = this.schema();
    const next: ObjectJsonSchema = isBooleanSchema(current)
      ? { type: 'string' }
      : { ...current, type: 'string' };
    if (value === undefined) {
      delete next[property];
    } else {
      (next as Record<string, unknown>)[property] = value;
    }
    this.schemaChange.emit(next);
  }

  private applyEnumValues(values: readonly string[]): void {
    const current = this.schema();
    if (values.length > 0) {
      const base: ObjectJsonSchema = isBooleanSchema(current)
        ? { type: 'string' }
        : { ...current };
      this.schemaChange.emit({ ...base, type: 'string', enum: [...values] });
      return;
    }
    if (!isBooleanSchema(current) && 'enum' in current) {
      const { enum: _enum, ...rest } = current;
      this.schemaChange.emit(rest as ObjectJsonSchema);
      return;
    }
    const base: ObjectJsonSchema = isBooleanSchema(current)
      ? { type: 'string' }
      : { ...current };
    this.schemaChange.emit(base);
  }

  private errorAt(pathKey: string): string | undefined {
    const node = this.validationNode();
    if (!node || node.validation.success) return undefined;
    const errors = node.validation.errors;
    if (!errors) return undefined;
    const match = errors.find((err) => err.path[0] === pathKey);
    return match?.message;
  }
}
