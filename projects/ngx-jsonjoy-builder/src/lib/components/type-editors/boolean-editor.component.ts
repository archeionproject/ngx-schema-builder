import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';

import { JsonjoyTranslationService } from '../../services/translation.service';
import {
  withObjectSchema,
  type JsonSchema,
  type ObjectJsonSchema,
} from '../../types/json-schema';
import type { ValidationTreeNode } from '../../types/validation';
import { LabelDirective } from '../ui/label.directive';
import { SwitchComponent } from '../ui/switch.component';
import type { EnumChangeContext } from '../schema-editor-internal/type-editor.component';

let nextBooleanEditorId = 0;

@Component({
  selector: 'lib-jsonjoy-boolean-editor',
  standalone: true,
  imports: [LabelDirective, SwitchComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
  template: `
    <div class="space-y-4">
      @if (readOnly() && !hasEnum()) {
        <p class="text-sm text-muted-foreground italic">{{ t().booleanNoConstraint }}</p>
      }

      @if (!readOnly() || !allowsTrue() || !allowsFalse()) {
        <div class="space-y-2 pt-2">
          @if (!readOnly() || hasEnum()) {
            <label libJsonjoyLabel>{{ t().booleanAllowedValuesLabel }}</label>

            <div class="space-y-3">
              <div class="flex items-center space-x-2">
                <lib-jsonjoy-switch
                  [checked]="allowsTrue()"
                  [disabled]="readOnly()"
                  [attr.id]="allowTrueId"
                  (checkedChange)="handleAllowedChange(true, $event)"
                />
                <label libJsonjoyLabel [attr.for]="allowTrueId" class="cursor-pointer">
                  {{ t().booleanAllowTrueLabel }}
                </label>
              </div>

              <div class="flex items-center space-x-2">
                <lib-jsonjoy-switch
                  [checked]="allowsFalse()"
                  [disabled]="readOnly()"
                  [attr.id]="allowFalseId"
                  (checkedChange)="handleAllowedChange(false, $event)"
                />
                <label libJsonjoyLabel [attr.for]="allowFalseId" class="cursor-pointer">
                  {{ t().booleanAllowFalseLabel }}
                </label>
              </div>
            </div>
          }

          @if (!allowsTrue() && !allowsFalse()) {
            <p class="text-xs text-amber-600 mt-2">{{ t().booleanNeitherWarning }}</p>
          }
        </div>
      }
    </div>
  `,
})
export class BooleanEditorComponent {
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

  private readonly idSeq = ++nextBooleanEditorId;
  protected readonly allowTrueId = `jjbe-${this.idSeq}-true`;
  protected readonly allowFalseId = `jjbe-${this.idSeq}-false`;

  protected readonly enumValues = computed<readonly boolean[] | null>(() =>
    withObjectSchema(this.schema(), (s) => (s.enum as boolean[] | undefined) ?? null, null),
  );

  protected readonly hasRestrictions = computed(() => Array.isArray(this.enumValues()));

  protected readonly allowsTrue = computed(() => {
    const restricted = this.hasRestrictions();
    if (!restricted) return true;
    return this.enumValues()?.includes(true) ?? false;
  });

  protected readonly allowsFalse = computed(() => {
    const restricted = this.hasRestrictions();
    if (!restricted) return true;
    return this.enumValues()?.includes(false) ?? false;
  });

  protected readonly hasEnum = computed(() => {
    const values = this.enumValues();
    return Array.isArray(values) && values.length > 0;
  });

  protected handleAllowedChange(value: boolean, allowed: boolean): void {
    const restricted = this.hasRestrictions();
    const current = this.enumValues();
    let nextEnum: boolean[] | undefined;
    let action: 'add' | 'delete' | null = null;

    if (allowed) {
      if (!restricted) return;
      if (current?.includes(value)) return;
      nextEnum = current ? [...current, value] : [value];
      action = 'add';
      if (nextEnum.includes(true) && nextEnum.includes(false)) {
        nextEnum = undefined;
      }
    } else {
      if (restricted && !current?.includes(value)) return;
      nextEnum = [!value];
      action = 'delete';
    }

    if (nextEnum) {
      this.schemaChange.emit({ type: 'boolean', enum: nextEnum });
    } else {
      this.schemaChange.emit({ type: 'boolean' });
    }

    if (action === 'add' && nextEnum) {
      this.addEnum.emit({
        value,
        index: nextEnum.indexOf(value),
        schemaKey: this.schemaKey(),
      });
    } else if (action === 'add') {
      this.addEnum.emit({
        value,
        index: current?.length ?? 0,
        schemaKey: this.schemaKey(),
      });
    } else if (action === 'delete') {
      const fallbackIndex = current?.indexOf(value) ?? [true, false].indexOf(value);
      this.deleteEnum.emit({
        value,
        index: Math.max(fallbackIndex, 0),
        schemaKey: this.schemaKey(),
      });
    }
  }
}
