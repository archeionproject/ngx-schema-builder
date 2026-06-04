import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { JsonjoyTranslationService } from '../../services/translation.service';
import type { NewField, SchemaEditorType } from '../../types/json-schema';
import { BadgeDirective } from '../ui/badge.directive';
import { ButtonDirective } from '../ui/button.directive';
import { InputDirective } from '../ui/input.directive';
import { LabelDirective } from '../ui/label.directive';
import { SchemaTypeSelectorComponent } from './schema-type-selector.component';

let nextAddFieldId = 0;

@Component({
  selector: 'lib-jsonjoy-add-field-button',
  standalone: true,
  imports: [
    BadgeDirective,
    ButtonDirective,
    InputDirective,
    LabelDirective,
    SchemaTypeSelectorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy inline-block' },
  template: `
    <button
      libJsonjoyButton
      type="button"
      [variant]="variant() === 'primary' ? 'default' : 'outline'"
      size="sm"
      class="flex items-center gap-1.5 group"
      (click)="openDialog()"
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
        class="group-hover:scale-110 transition-transform"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8" />
        <path d="M12 8v8" />
      </svg>
      <span>{{ t().fieldAddNewButton }}</span>
    </button>

    <dialog
      #dialogRef
      class="md:max-w-[1200px] max-h-[85vh] w-[95vw] p-4 sm:p-6 jsonjoy rounded-lg border bg-background shadow-lg backdrop:bg-black/40"
      (close)="onDialogClose()"
    >
      <div class="mb-4">
        <div class="text-xl flex flex-wrap items-center gap-2">
          {{ t().fieldAddNewLabel }}
          <span libJsonjoyBadge variant="secondary" class="text-xs">
            {{ t().fieldAddNewBadge }}
          </span>
        </div>
        <p class="text-sm text-muted-foreground">{{ t().fieldAddNewDescription }}</p>
      </div>

      <form class="space-y-6" [id]="formId" (submit)="onSubmit($event)">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-4 min-w-[280px]">
            <div>
              <div class="flex items-center justify-between gap-2">
                <label libJsonjoyLabel [attr.for]="fieldNameId" class="text-sm font-medium">
                  {{ useRegex() ? t().fieldNameRegexLabel : t().fieldNameLabel }}
                </label>
                <button
                  type="button"
                  class="text-xs text-muted-foreground hover:text-foreground underline shrink-0"
                  (click)="useRegex.set(!useRegex())"
                >
                  {{ useRegex() ? t().fieldNameUseExactName : t().fieldNameUseRegex }}
                </button>
              </div>
              <input
                libJsonjoyInput
                [id]="fieldNameId"
                [value]="fieldName()"
                [placeholder]="useRegex() ? t().fieldNameRegexPlaceholder : t().fieldNamePlaceholder"
                class="font-mono text-sm w-full mt-1.5"
                [class.border-destructive]="!!regexError()"
                required
                (input)="fieldName.set(($any($event.target)).value)"
              />
              @if (regexError()) {
                <p class="text-xs text-destructive mt-1">{{ t().fieldNameRegexError }}</p>
              } @else if (useRegex()) {
                <p class="text-xs text-muted-foreground mt-1">{{ t().fieldNameRegexHelp }}</p>
              }
            </div>

            <div>
              <label libJsonjoyLabel [attr.for]="fieldDescId" class="block text-sm font-medium">
                {{ t().fieldDescription }}
              </label>
              <input
                libJsonjoyInput
                [id]="fieldDescId"
                [value]="fieldDesc()"
                [placeholder]="t().fieldDescriptionPlaceholder"
                class="text-sm w-full mt-1.5"
                (input)="fieldDesc.set(($any($event.target)).value)"
              />
            </div>

            @if (!useRegex()) {
              <div class="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                <input
                  type="checkbox"
                  [id]="fieldRequiredId"
                  [checked]="fieldRequired()"
                  class="rounded border-gray-300 shrink-0"
                  (change)="fieldRequired.set(($any($event.target)).checked)"
                />
                <label libJsonjoyLabel [attr.for]="fieldRequiredId" class="text-sm">
                  {{ t().fieldRequiredLabel }}
                </label>
              </div>
            }
          </div>

          <div class="space-y-4 min-w-[280px]">
            <div>
              <label libJsonjoyLabel [attr.for]="fieldTypeId" class="block text-sm font-medium mb-1.5">
                {{ t().fieldType }}
              </label>
              <lib-jsonjoy-schema-type-selector
                [inputId]="fieldTypeId"
                [(value)]="fieldType"
              />
            </div>
          </div>
        </div>

        <div class="mt-6 gap-2 flex flex-wrap justify-end">
          <button libJsonjoyButton type="button" variant="outline" size="sm" (click)="closeDialog()">
            {{ t().fieldAddNewCancel }}
          </button>
          <button libJsonjoyButton type="submit" size="sm" [attr.form]="formId" [disabled]="!canSubmit()">
            {{ t().fieldAddNewConfirm }}
          </button>
        </div>
      </form>
    </dialog>
  `,
})
export class AddFieldButtonComponent {
  readonly variant = input<'primary' | 'secondary'>('primary');
  readonly autoFocus = input<boolean>(true);

  readonly addField = output<NewField>();
  readonly addPatternField = output<NewField>();

  private readonly translations = inject(JsonjoyTranslationService);
  protected readonly t = this.translations.providerLocale;

  private readonly idSeq = ++nextAddFieldId;
  protected readonly fieldNameId = `jjadd-${this.idSeq}-name`;
  protected readonly fieldDescId = `jjadd-${this.idSeq}-desc`;
  protected readonly fieldRequiredId = `jjadd-${this.idSeq}-required`;
  protected readonly fieldTypeId = `jjadd-${this.idSeq}-type`;
  protected readonly formId = `jjadd-${this.idSeq}-form`;

  protected readonly fieldName = signal('');
  protected readonly fieldType = signal<SchemaEditorType>('string');
  protected readonly fieldDesc = signal('');
  protected readonly fieldRequired = signal(false);
  protected readonly useRegex = signal(false);

  protected readonly regexError = computed(() => {
    if (!this.useRegex()) return false;
    const pattern = this.fieldName().trim();
    if (!pattern) return false;
    try {
      new RegExp(pattern);
      return false;
    } catch {
      return true;
    }
  });

  protected readonly canSubmit = computed(
    () => this.fieldName().trim().length > 0 && !this.regexError(),
  );

  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialogRef');

  protected openDialog(): void {
    this.dialogRef()?.nativeElement.showModal();
  }

  protected closeDialog(): void {
    this.dialogRef()?.nativeElement.close();
  }

  protected onDialogClose(): void {
    this.resetForm();
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    const name = this.fieldName().trim();
    if (!name) return;
    if (this.useRegex()) {
      if (this.regexError()) return;
      this.addPatternField.emit({
        name,
        type: this.fieldType(),
        description: this.fieldDesc(),
        required: false,
      });
    } else {
      this.addField.emit({
        name,
        type: this.fieldType(),
        description: this.fieldDesc(),
        required: this.fieldRequired(),
      });
    }
    this.closeDialog();
  }

  private resetForm(): void {
    this.fieldName.set('');
    this.fieldType.set('string');
    this.fieldDesc.set('');
    this.fieldRequired.set(false);
    this.useRegex.set(false);
  }
}
