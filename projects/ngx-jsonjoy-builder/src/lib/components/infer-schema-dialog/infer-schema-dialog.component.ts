import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';

import type { Translation } from '../../i18n/translation-keys';
import {
  type JsonjoyMonacoHandle,
  JsonjoyMonacoEditorDirective,
} from '../../internal/monaco-editor.directive';
import { createSchemaFromJson } from '../../internal/schema-inference';
import { JsonjoyTranslationService } from '../../services/translation.service';
import type { JsonSchema } from '../../types/json-schema';
import { ButtonDirective } from '../ui/button.directive';

/**
 * Native `<dialog>`-based equivalent of React `<InferSchemaDialog>`. Opens a
 * Monaco-backed JSON input pane; on submit, infers a JSON Schema and emits
 * via `inferred`.
 */
@Component({
  selector: 'lib-jsonjoy-infer-schema-dialog',
  standalone: true,
  imports: [ButtonDirective, JsonjoyMonacoEditorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
  template: `
    <dialog
      #dialogRef
      class="md:max-w-4xl max-h-[90vh] w-[95vw] p-4 sm:p-6 jsonjoy rounded-lg border bg-background shadow-lg backdrop:bg-black/40"
      (close)="onDialogClose()"
    >
      <div class="mb-4">
        <h2 class="text-xl font-semibold">{{ t().inferrerTitle }}</h2>
        <p class="text-sm text-muted-foreground">{{ t().inferrerDescription }}</p>
      </div>

      <div class="flex-1 min-h-0 py-2 flex flex-col">
        <div class="border rounded-md flex-1 overflow-hidden relative h-[450px]">
          <div
            libJsonjoyMonacoEditor
            class="absolute inset-0"
            language="json"
            [autoFocus]="autoFocus()"
            [(value)]="jsonInput"
            (mounted)="onEditorMounted($event)"
          ></div>
          @if (!editorLoaded()) {
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
        @if (error()) {
          <p class="text-sm text-destructive mt-2">{{ error() }}</p>
        }
      </div>

      <div class="mt-4 gap-2 flex flex-wrap justify-end">
        <button libJsonjoyButton type="button" variant="outline" size="sm" (click)="close()">
          {{ t().inferrerCancel }}
        </button>
        <button libJsonjoyButton type="button" size="sm" (click)="generate()">
          {{ t().inferrerGenerate }}
        </button>
      </div>
    </dialog>
  `,
})
export class InferSchemaDialogComponent {
  readonly open = model<boolean>(false);
  readonly autoFocus = input<boolean>(true);
  readonly locale = input<Translation | undefined>(undefined);
  readonly messages = input<Partial<Translation> | undefined>(undefined);

  readonly inferred = output<JsonSchema>();

  private readonly translations = inject(JsonjoyTranslationService);
  protected readonly t = this.translations.withOverrides(this.locale, this.messages);

  protected readonly jsonInput = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly editorLoaded = signal(false);

  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialogRef');
  private editorHandle: JsonjoyMonacoHandle | null = null;

  constructor() {
    effect(() => {
      const shouldOpen = this.open();
      const el = this.dialogRef()?.nativeElement;
      if (!el) return;
      if (shouldOpen && !el.open) {
        el.showModal();
        if (this.autoFocus()) {
          this.editorHandle?.focus();
        }
      } else if (!shouldOpen && el.open) {
        el.close();
      }
    });
  }

  protected onEditorMounted(handle: JsonjoyMonacoHandle): void {
    this.editorHandle = handle;
    this.editorLoaded.set(true);
    if (this.open() && this.autoFocus()) {
      handle.focus();
    }
  }

  protected generate(): void {
    try {
      const parsed = JSON.parse(this.jsonInput());
      this.error.set(null);
      const inferredSchema = createSchemaFromJson(parsed);
      this.inferred.emit(inferredSchema);
      this.close();
    } catch {
      this.error.set(this.t().inferrerErrorInvalidJson);
    }
  }

  protected close(): void {
    this.open.set(false);
  }

  protected onDialogClose(): void {
    this.jsonInput.set('');
    this.error.set(null);
    if (this.open()) {
      this.open.set(false);
    }
  }
}
