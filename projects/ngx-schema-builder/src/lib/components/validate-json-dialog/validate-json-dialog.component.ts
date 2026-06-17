import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';

import type { Translation } from '../../i18n/translation-keys';
import {
  JsonjoyEditorDirective,
  type JsonjoyEditorHandle,
} from '../../internal/editor.directive';
import {
  type ValidationResult,
  validateJson,
} from '../../internal/json-validator';
import {
  JsonjoyTranslationService,
  formatTranslation,
} from '../../services/translation.service';
import type { JsonSchema } from '../../types/json-schema';

const VALIDATION_DEBOUNCE_MS = 500;

/**
 * Native `<dialog>`-based equivalent of React `<ValidateJsonDialog>`. Two
 * CodeMirror editors side-by-side: writable user JSON validated against the
 * provided schema, and a read-only schema viewer. Validation runs debounced.
 */
@Component({
  selector: 'lib-jsonjoy-validate-json-dialog',
  standalone: true,
  imports: [JsonjoyEditorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
  template: `
    <dialog
      #dialogRef
      class="md:max-w-5xl max-h-[90vh] w-[95vw] m-auto p-4 sm:p-6 jsonjoy rounded-lg border bg-background shadow-lg backdrop:bg-black/40"
      (close)="onDialogClose()"
    >
      <div class="mb-4">
        <h2 class="text-xl font-semibold">{{ t().validatorTitle }}</h2>
        <p class="text-sm text-muted-foreground">
          {{ t().validatorDescription }}
        </p>
      </div>

      <div
        class="flex-1 flex flex-col md:flex-row gap-4 py-2 overflow-hidden h-[500px]"
      >
        <div class="flex-1 flex flex-col h-full min-w-0">
          <div class="text-sm font-medium mb-2">{{ t().validatorContent }}</div>
          <div class="border rounded-md flex-1 h-full relative overflow-hidden">
            <div
              libJsonjoyEditor
              class="absolute inset-0"
              language="json"
              [autoFocus]="autoFocus()"
              [schema]="schema()"
              [(value)]="jsonInput"
              (mounted)="onJsonEditorMounted($event)"
            ></div>
            @if (!jsonEditorLoaded()) {
              <div
                class="absolute inset-0 flex items-center justify-center bg-secondary/30"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="animate-spin"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              </div>
            }
          </div>
        </div>

        <div class="flex-1 flex flex-col h-full min-w-0">
          <div class="text-sm font-medium mb-2">
            {{ t().validatorCurrentSchema }}
          </div>
          <div class="border rounded-md flex-1 h-full relative overflow-hidden">
            <div
              libJsonjoyEditor
              class="absolute inset-0"
              language="json"
              [readOnly]="true"
              [value]="schemaText()"
              (mounted)="onSchemaEditorMounted($event)"
            ></div>
          </div>
        </div>
      </div>

      @if (validationResult(); as result) {
        <div
          class="rounded-md p-4 mt-3 transition-all duration-300 ease-in-out"
          [class.bg-green-50]="result.valid"
          [class.border]="true"
          [class.border-green-200]="result.valid"
          [class.bg-red-50]="!result.valid"
          [class.border-red-200]="!result.valid"
        >
          <div class="flex items-center">
            @if (result.valid) {
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-green-500 mr-2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p class="text-green-700 font-medium">{{ t().validatorValid }}</p>
            } @else {
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-red-500 mr-2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p class="text-red-700 font-medium">{{ headerMessage() }}</p>
            }
          </div>

          @if (!result.valid && (result.errors?.length ?? 0) > 0) {
            <div class="mt-3 max-h-[200px] overflow-y-auto">
              <ul class="space-y-2">
                @for (error of result.errors; track $index) {
                  <li>
                    <button
                      type="button"
                      class="w-full text-left bg-white border border-red-100 rounded-md p-3 shadow-xs hover:shadow-md transition-shadow duration-200 cursor-pointer"
                      (click)="goToError(error.line, error.column)"
                    >
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <p class="text-sm font-medium text-red-700">
                            {{
                              error.path === '/'
                                ? t().validatorErrorPathRoot
                                : error.path
                            }}
                          </p>
                          <p class="text-sm text-gray-600 mt-1">
                            {{ error.message }}
                          </p>
                        </div>
                        @if (error.line) {
                          <div
                            class="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600"
                          >
                            {{ formatLocation(error.line, error.column) }}
                          </div>
                        }
                      </div>
                    </button>
                  </li>
                }
              </ul>
            </div>
          }
        </div>
      }
    </dialog>
  `,
})
export class ValidateJsonDialogComponent {
  readonly open = model<boolean>(false);
  readonly schema = input.required<JsonSchema>();
  readonly autoFocus = input<boolean>(true);
  readonly locale = input<Translation | undefined>(undefined);
  readonly messages = input<Partial<Translation> | undefined>(undefined);

  private readonly translations = inject(JsonjoyTranslationService);
  protected readonly t = this.translations.withOverrides(
    this.locale,
    this.messages,
  );

  protected readonly jsonInput = signal('');
  protected readonly validationResult = signal<ValidationResult | null>(null);
  protected readonly jsonEditorLoaded = signal(false);

  protected readonly schemaText = computed(() =>
    JSON.stringify(this.schema(), null, 2),
  );

  protected readonly headerMessage = computed(() => {
    const result = this.validationResult();
    if (!result || result.valid) return '';
    const errors = result.errors ?? [];
    if (errors.length === 1) {
      const messages = this.t();
      return errors[0].path === '/'
        ? messages.validatorErrorInvalidSyntax
        : messages.validatorErrorSchemaValidation;
    }
    return formatTranslation(this.t().validatorErrorCount, {
      count: errors.length,
    });
  });

  private readonly dialogRef =
    viewChild<ElementRef<HTMLDialogElement>>('dialogRef');
  private jsonEditorHandle: JsonjoyEditorHandle | null = null;
  private schemaEditorHandle: JsonjoyEditorHandle | null = null;
  private validationSeq = 0;

  constructor() {
    effect(() => {
      const shouldOpen = this.open();
      const el = this.dialogRef()?.nativeElement;
      if (!el) return;
      if (shouldOpen && !el.open) {
        el.showModal();
        requestAnimationFrame(() => {
          this.jsonEditorHandle?.layout();
          this.schemaEditorHandle?.layout();
          if (this.autoFocus()) {
            this.jsonEditorHandle?.focus();
          }
        });
      } else if (!shouldOpen && el.open) {
        el.close();
      }
    });

    effect((onCleanup) => {
      const input = this.jsonInput();
      const schema = this.schema();
      if (!input.trim()) {
        this.validationResult.set(null);
        return;
      }

      const seq = ++this.validationSeq;
      const handle = setTimeout(() => {
        void validateJson(input, schema).then((result) => {
          if (seq !== this.validationSeq) return;
          this.validationResult.set(result);
        });
      }, VALIDATION_DEBOUNCE_MS);

      onCleanup(() => clearTimeout(handle));
    });
  }

  protected onJsonEditorMounted(handle: JsonjoyEditorHandle): void {
    this.jsonEditorHandle = handle;
    this.jsonEditorLoaded.set(true);
    if (this.open()) {
      handle.layout();
      if (this.autoFocus()) {
        handle.focus();
      }
    }
  }

  protected onSchemaEditorMounted(handle: JsonjoyEditorHandle): void {
    this.schemaEditorHandle = handle;
    if (this.open()) {
      handle.layout();
    }
  }

  protected goToError(
    line: number | undefined,
    column: number | undefined,
  ): void {
    if (!line) return;
    this.jsonEditorHandle?.revealError(line, column ?? 1);
  }

  protected formatLocation(line: number, column: number | undefined): string {
    if (column !== undefined) {
      return formatTranslation(this.t().validatorErrorLocationLineAndColumn, {
        line,
        column,
      });
    }
    return formatTranslation(this.t().validatorErrorLocationLineOnly, { line });
  }

  protected onDialogClose(): void {
    this.jsonInput.set('');
    this.validationResult.set(null);
    if (this.open()) {
      this.open.set(false);
    }
  }
}
