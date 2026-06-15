import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';

import type { Translation } from '../../i18n/translation-keys';
import { JsonjoyEditorDirective } from '../../internal/editor.directive';
import { JsonjoyTranslationService } from '../../services/translation.service';
import type { JsonSchema } from '../../types/json-schema';

/**
 * Angular equivalent of React `<SchemaJsonEditor>`. Renders the
 * CodeMirror-backed JSON source editor with a download button.
 */
@Component({
  selector: 'lib-jsonjoy-schema-json-editor',
  standalone: true,
  imports: [JsonjoyEditorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
  template: `
    <div class="relative overflow-hidden h-full flex flex-col jsonjoy">
      <div
        class="flex items-center justify-between bg-secondary/80 backdrop-blur-xs px-4 py-2 border-b shrink-0"
      >
        <div class="flex items-center gap-2">
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
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            />
            <polyline points="14 2 14 8 20 8" />
            <path
              d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1"
            />
            <path
              d="M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1"
            />
          </svg>
          <span class="font-medium text-sm">{{ t().visualizerSource }}</span>
        </div>
        <button
          type="button"
          class="p-1.5 hover:bg-secondary rounded-md transition-colors"
          [title]="t().visualizerDownloadTitle"
          (click)="onDownload()"
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>
      <div class="grow flex min-h-0">
        <div
          #editorHost
          libJsonjoyEditor
          class="editor-container w-full h-full"
          language="json"
          [readOnly]="readOnly()"
          [autoFocus]="autoFocus()"
          [(value)]="jsonText"
        ></div>
        @if (!loaded()) {
          <div
            class="absolute inset-x-0 bottom-0 top-12 flex items-center justify-center bg-secondary/30"
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
  `,
})
export class SchemaJsonEditorComponent {
  readonly value = model<JsonSchema>({ type: 'object' });
  readonly readOnly = input<boolean>(false);
  readonly autoFocus = input<boolean>(true);
  readonly locale = input<Translation | undefined>(undefined);
  readonly messages = input<Partial<Translation> | undefined>(undefined);

  private readonly translations = inject(JsonjoyTranslationService);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly t = this.translations.withOverrides(
    this.locale,
    this.messages,
  );

  private readonly editorDirective = viewChild.required(JsonjoyEditorDirective);

  /**
   * Pretty-printed mirror of the bound schema. Pushed into the editor via the
   * directive's two-way `value`. Updated by `effect()` when `value()` changes
   * externally; the directive writes back to this signal when the user edits.
   */
  protected readonly jsonText = signal(this.stringify(this.value()));

  protected readonly loaded = computed(() => this.editorDirective().loaded());

  constructor() {
    // value -> text. Reacts only to value(); the current text is read
    // untracked so a user edit (which changes jsonText, then value) does not
    // wake this effect and revert the edit before it is applied. Skips
    // reformatting when the text already represents the same schema, so the
    // caret is not disturbed while typing.
    effect(() => {
      const next = this.stringify(this.value());
      const current = untracked(this.jsonText);
      if (current === next || this.textMatchesValue(current)) return;
      this.jsonText.set(next);
    });

    // text -> value. Reacts only to jsonText(); value() is read untracked so
    // an external value change does not re-run this effect.
    effect(() => {
      const raw = this.jsonText();
      if (untracked(this.readOnly)) return;
      try {
        const parsed = JSON.parse(raw) as JsonSchema;
        if (this.jsonEqual(parsed, untracked(this.value))) return;
        this.value.set(parsed);
      } catch {
        // The editor surfaces the parse error inline — silently ignore here.
      }
    });
  }

  /** Whether `text` parses to a schema deep-equal to the current `value()`. */
  private textMatchesValue(text: string): boolean {
    try {
      return this.jsonEqual(JSON.parse(text) as JsonSchema, this.value());
    } catch {
      return false;
    }
  }

  /** Order-insensitive structural equality for two JSON values. */
  private jsonEqual(a: JsonSchema, b: JsonSchema): boolean {
    return stableStringify(a) === stableStringify(b);
  }

  protected onDownload(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const content = this.stringify(this.value());
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = this.t().visualizerDownloadFileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  private stringify(value: JsonSchema): string {
    return JSON.stringify(value, null, 2);
  }
}

/** JSON stringify with object keys sorted recursively, for stable comparison. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${stableStringify(
            (value as Record<string, unknown>)[key],
          )}`,
      );
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}
