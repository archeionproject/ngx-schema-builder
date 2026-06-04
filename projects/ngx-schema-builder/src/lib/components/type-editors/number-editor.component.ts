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
import { JsonjoyTranslationService } from '../../services/translation.service';
import {
  isBooleanSchema,
  withObjectSchema,
  type JsonSchema,
  type ObjectJsonSchema,
} from '../../types/json-schema';
import type { ValidationTreeNode } from '../../types/validation';
import { ButtonDirective } from '../ui/button.directive';
import { InputDirective } from '../ui/input.directive';
import { LabelDirective } from '../ui/label.directive';
import type { EnumChangeContext } from '../schema-editor-internal/type-editor.component';

type NumberConstraint =
  | 'minimum'
  | 'maximum'
  | 'exclusiveMinimum'
  | 'exclusiveMaximum'
  | 'multipleOf'
  | 'enum';

let nextNumberEditorId = 0;

@Component({
  selector: 'lib-jsonjoy-number-editor',
  standalone: true,
  imports: [ButtonDirective, InputDirective, LabelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
  template: `
    <div class="space-y-4">
      @if (readOnly() && !hasConstraint()) {
        <p class="text-sm text-muted-foreground italic">{{ t().numberNoConstraint }}</p>
      }

      @if (!readOnly() || hasConstraint()) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-0 md:col-span-2">
            @if (minMaxError()) {
              <div class="text-xs text-destructive italic">{{ minMaxError() }}</div>
            }
            @if (redundantMinError()) {
              <div class="text-xs text-destructive italic">{{ redundantMinError() }}</div>
            }
            @if (redundantMaxError()) {
              <div class="text-xs text-destructive italic">{{ redundantMaxError() }}</div>
            }
            @if (enumError()) {
              <div class="text-xs text-destructive italic">{{ enumError() }}</div>
            }
          </div>

          @if (!readOnly() || minimum() !== undefined) {
            <div class="space-y-2">
              <label
                libJsonjoyLabel
                [attr.for]="minimumId"
                [class.text-destructive]="minimum() !== undefined && (!!minMaxError() || !!redundantMinError())"
              >
                {{ t().numberMinimumLabel }}
              </label>
              <input
                libJsonjoyInput
                [id]="minimumId"
                type="number"
                [value]="minimum() ?? ''"
                [disabled]="readOnly()"
                [step]="stepAttr"
                [placeholder]="t().numberMinimumPlaceholder"
                [class]="boundClasses('minimum')"
                (input)="onBoundInput('minimum', $event)"
              />
            </div>
          }

          @if (!readOnly() || maximum() !== undefined) {
            <div class="space-y-2">
              <label
                libJsonjoyLabel
                [attr.for]="maximumId"
                [class.text-destructive]="maximum() !== undefined && (!!minMaxError() || !!redundantMaxError())"
              >
                {{ t().numberMaximumLabel }}
              </label>
              <input
                libJsonjoyInput
                [id]="maximumId"
                type="number"
                [value]="maximum() ?? ''"
                [disabled]="readOnly()"
                [step]="stepAttr"
                [placeholder]="t().numberMaximumPlaceholder"
                [class]="boundClasses('maximum')"
                (input)="onBoundInput('maximum', $event)"
              />
            </div>
          }
        </div>
      }

      @if (!readOnly() || exclusiveMinimum() !== undefined || exclusiveMaximum() !== undefined) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @if (!readOnly() || exclusiveMinimum() !== undefined) {
            <div class="space-y-2">
              <label
                libJsonjoyLabel
                [attr.for]="exclusiveMinimumId"
                [class.text-destructive]="exclusiveMinimum() !== undefined && (!!minMaxError() || !!redundantMinError())"
              >
                {{ t().numberExclusiveMinimumLabel }}
              </label>
              <input
                libJsonjoyInput
                [id]="exclusiveMinimumId"
                type="number"
                [value]="exclusiveMinimum() ?? ''"
                [disabled]="readOnly()"
                [step]="stepAttr"
                [placeholder]="t().numberExclusiveMinimumPlaceholder"
                [class]="boundClasses('exclusiveMinimum')"
                (input)="onBoundInput('exclusiveMinimum', $event)"
              />
            </div>
          }

          @if (!readOnly() || exclusiveMaximum() !== undefined) {
            <div class="space-y-2">
              <label
                libJsonjoyLabel
                [attr.for]="exclusiveMaximumId"
                [class.text-destructive]="exclusiveMaximum() !== undefined && (!!minMaxError() || !!redundantMaxError())"
              >
                {{ t().numberExclusiveMaximumLabel }}
              </label>
              <input
                libJsonjoyInput
                [id]="exclusiveMaximumId"
                type="number"
                [value]="exclusiveMaximum() ?? ''"
                [disabled]="readOnly()"
                [step]="stepAttr"
                [placeholder]="t().numberExclusiveMaximumPlaceholder"
                [class]="boundClasses('exclusiveMaximum')"
                (input)="onBoundInput('exclusiveMaximum', $event)"
              />
            </div>
          }
        </div>
      }

      @if (!readOnly() || multipleOf() !== undefined) {
        <div class="space-y-2">
          <label libJsonjoyLabel [attr.for]="multipleOfId" [class.text-destructive]="!!multipleOfError()">
            {{ t().numberMultipleOfLabel }}
          </label>
          <input
            libJsonjoyInput
            [id]="multipleOfId"
            type="number"
            [value]="multipleOf() ?? ''"
            [disabled]="readOnly()"
            min="0"
            [step]="stepAttr"
            [placeholder]="t().numberMultipleOfPlaceholder"
            [class]="multipleOfClasses()"
            (input)="onBoundInput('multipleOf', $event)"
          />
          @if (multipleOfError()) {
            <div class="text-xs text-destructive italic whitespace-pre-line">{{ multipleOfError() }}</div>
          }
        </div>
      }

      @if (!readOnly() || enumValues().length > 0) {
        <div class="space-y-2 pt-2 border-t border-border/40">
          <label libJsonjoyLabel [class.text-destructive]="!!enumError()">
            {{ t().numberAllowedValuesEnumLabel }}
          </label>

          <div class="flex flex-wrap gap-2 mb-4">
            @if (enumValues().length > 0) {
              @for (value of enumValues(); track value) {
                <div class="flex items-center bg-muted/40 border rounded-md px-2 py-1 text-xs">
                  <span class="mr-1">{{ value }}</span>
                  <button
                    type="button"
                    class="text-muted-foreground hover:text-destructive"
                    (click)="removeEnumValue(value)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              }
            } @else {
              <p class="text-xs text-muted-foreground italic">{{ t().numberAllowedValuesEnumNone }}</p>
            }
          </div>

          <div class="flex items-center gap-2">
            <input
              libJsonjoyInput
              type="number"
              [value]="enumDraft()"
              [step]="stepAttr"
              [placeholder]="t().numberAllowedValuesEnumAddPlaceholder"
              class="h-8 text-xs flex-1"
              (input)="onEnumDraftInput($event)"
              (keydown.enter)="addEnumValue()"
            />
            <button libJsonjoyButton type="button" variant="secondary" size="sm" (click)="addEnumValue()">
              {{ t().numberAllowedValuesEnumAddLabel }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class NumberEditorComponent {
  readonly schema = input.required<JsonSchema>();
  readonly readOnly = input.required<boolean>();
  readonly validationNode = input<ValidationTreeNode | undefined>(undefined);
  readonly schemaKey = input<string | undefined>(undefined);
  readonly depth = input<number>(0);
  readonly integer = input<boolean>(false);

  readonly schemaChange = output<ObjectJsonSchema>();
  readonly addEnum = output<EnumChangeContext>();
  readonly deleteEnum = output<EnumChangeContext>();

  private readonly translations = inject(JsonjoyTranslationService);
  protected readonly t = this.translations.providerLocale;

  private readonly idSeq = ++nextNumberEditorId;
  protected readonly minimumId = `jjne-${this.idSeq}-min`;
  protected readonly maximumId = `jjne-${this.idSeq}-max`;
  protected readonly exclusiveMinimumId = `jjne-${this.idSeq}-emin`;
  protected readonly exclusiveMaximumId = `jjne-${this.idSeq}-emax`;
  protected readonly multipleOfId = `jjne-${this.idSeq}-mof`;

  protected readonly enumDraft = signal('');

  protected readonly minimum = computed(() =>
    withObjectSchema(this.schema(), (s) => s.minimum, undefined),
  );
  protected readonly maximum = computed(() =>
    withObjectSchema(this.schema(), (s) => s.maximum, undefined),
  );
  protected readonly exclusiveMinimum = computed(() =>
    withObjectSchema(this.schema(), (s) => s.exclusiveMinimum, undefined),
  );
  protected readonly exclusiveMaximum = computed(() =>
    withObjectSchema(this.schema(), (s) => s.exclusiveMaximum, undefined),
  );
  protected readonly multipleOf = computed(() =>
    withObjectSchema(this.schema(), (s) => s.multipleOf, undefined),
  );
  protected readonly enumValues = computed<readonly number[]>(() =>
    withObjectSchema(this.schema(), (s) => (s.enum as number[] | undefined) ?? [], []),
  );

  protected readonly hasConstraint = computed(
    () =>
      this.minimum() !== undefined ||
      this.maximum() !== undefined ||
      this.exclusiveMinimum() !== undefined ||
      this.exclusiveMaximum() !== undefined ||
      this.multipleOf() !== undefined ||
      this.enumValues().length > 0,
  );

  protected readonly minMaxError = computed(() => this.errorAt('minMax'));
  protected readonly redundantMinError = computed(() => this.errorAt('redundantMinimum'));
  protected readonly redundantMaxError = computed(() => this.errorAt('redundantMaximum'));
  protected readonly enumError = computed(() => this.errorAt('enum'));
  protected readonly multipleOfError = computed(() => this.errorAt('multipleOf'));

  protected get stepAttr(): string {
    return this.integer() ? '1' : 'any';
  }

  protected readonly multipleOfClasses = computed(() =>
    cn('h-8', !!this.multipleOfError() && 'border-destructive'),
  );

  protected boundClasses(
    field: 'minimum' | 'maximum' | 'exclusiveMinimum' | 'exclusiveMaximum',
  ): string {
    const errored =
      field === 'minimum'
        ? this.minimum() !== undefined && (!!this.minMaxError() || !!this.redundantMinError())
        : field === 'maximum'
          ? this.maximum() !== undefined && (!!this.minMaxError() || !!this.redundantMaxError())
          : field === 'exclusiveMinimum'
            ? this.exclusiveMinimum() !== undefined &&
              (!!this.minMaxError() || !!this.redundantMinError())
            : this.exclusiveMaximum() !== undefined &&
              (!!this.minMaxError() || !!this.redundantMaxError());
    return cn('h-8', errored && 'border-destructive');
  }

  protected onBoundInput(
    field: 'minimum' | 'maximum' | 'exclusiveMinimum' | 'exclusiveMaximum' | 'multipleOf',
    event: Event,
  ): void {
    const raw = (event.target as HTMLInputElement).value;
    const value = raw === '' ? undefined : Number(raw);
    this.applyValidationChange(field, value);
  }

  protected onEnumDraftInput(event: Event): void {
    this.enumDraft.set((event.target as HTMLInputElement).value);
  }

  protected addEnumValue(): void {
    const draft = this.enumDraft().trim();
    if (!draft) return;
    const parsed = Number(draft);
    if (Number.isNaN(parsed)) return;
    const value = this.integer() ? Math.floor(parsed) : parsed;
    const current = this.enumValues();
    if (!current.includes(value)) {
      const next = [...current, value];
      this.applyEnumValues(next);
      this.addEnum.emit({ value, index: current.length, schemaKey: this.schemaKey() });
    }
    this.enumDraft.set('');
  }

  protected removeEnumValue(value: number): void {
    const current = this.enumValues();
    const index = current.indexOf(value);
    if (index < 0) return;
    const next = current.filter((_, i) => i !== index);
    this.applyEnumValues(next);
    this.deleteEnum.emit({ value, index, schemaKey: this.schemaKey() });
  }

  private applyEnumValues(values: readonly number[]): void {
    if (values.length === 0) {
      this.applyValidationChange('enum', undefined);
    } else {
      this.applyValidationChange('enum', [...values]);
    }
  }

  private applyValidationChange(property: NumberConstraint, value: unknown): void {
    const current = this.schema();
    const type: 'integer' | 'number' = this.integer() ? 'integer' : 'number';
    const next: ObjectJsonSchema = isBooleanSchema(current)
      ? { type }
      : { ...current, type };

    if (value === undefined) {
      delete next[property];
    } else {
      (next as Record<string, unknown>)[property] = value;
    }

    this.schemaChange.emit(next);
  }

  private errorAt(pathKey: string): string | undefined {
    const node = this.validationNode();
    if (!node || node.validation.success) return undefined;
    return node.validation.errors?.find((err) => err.path[0] === pathKey)?.message;
  }
}
