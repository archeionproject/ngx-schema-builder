import {
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type * as Monaco from 'monaco-editor';

import {
  DEFAULT_MONACO_EDITOR_OPTIONS,
  JsonjoyMonacoThemeService,
  type MonacoEditorOptions,
} from '../services/monaco-theme.service';
import type { JsonSchema } from '../types/json-schema';

/**
 * Imperative handle emitted via the `mounted` output once Monaco has
 * finished loading. Consumers (e.g. `ValidateJsonDialog`) use this to
 * reveal a line/column without leaking the raw editor instance across
 * the directive boundary.
 */
export interface JsonjoyMonacoHandle {
  revealError(line: number, column: number): void;
  focus(): void;
  setValue(value: string): void;
  getValue(): string;
  /**
   * Force a re-measure of the host element's size. Call this when the editor
   * is unhidden (e.g. its containing `<dialog>` opens) — Monaco snapshots its
   * container size on mount and does not auto-recover from 0×0.
   */
  layout(): void;
}

/**
 * Replaces `@monaco-editor/react`. Attached to a host `<div>`, lazy-loads
 * `monaco-editor`, creates an editor instance, and bridges Monaco's
 * imperative API to Angular signals.
 *
 * **Consumer setup — Monaco workers:** This library does not bundle
 * Monaco's worker registration (it is bundler-specific). Consumers must
 * set `self.MonacoEnvironment.getWorker` at app bootstrap. Without it,
 * Monaco falls back to inline workers and JSON diagnostics may not work.
 *
 * Angular CLI / Vite example (used by `@angular/build:application`):
 * create two tiny worker entry files in your app source —
 *
 * ```ts
 * // src/monaco/editor.worker.ts
 * import 'monaco-editor/esm/vs/editor/editor.worker.js';
 * ```
 *
 * ```ts
 * // src/monaco/json.worker.ts
 * import 'monaco-editor/esm/vs/language/json/json.worker.js';
 * ```
 *
 * — then wire them up at bootstrap:
 *
 * ```ts
 * (self as any).MonacoEnvironment = {
 *   getWorker(_id: string, label: string) {
 *     const url = label === 'json'
 *       ? new URL('./monaco/json.worker', import.meta.url)
 *       : new URL('./monaco/editor.worker', import.meta.url);
 *     return new Worker(url, { type: 'module' });
 *   },
 * };
 * ```
 *
 * Zoneless note: Monaco callbacks run outside Angular's zone. Signal
 * writes inside those callbacks auto-schedule change detection, so no
 * `NgZone.run` is needed.
 */
@Directive({
  selector: '[libJsonjoyMonacoEditor]',
  exportAs: 'libJsonjoyMonacoEditor',
})
export class JsonjoyMonacoEditorDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly themeService = inject(JsonjoyMonacoThemeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly value = model<string>('');
  readonly language = input<string>('json');
  readonly readOnly = input<boolean>(false);
  readonly autoFocus = input<boolean>(false);
  readonly options = input<MonacoEditorOptions | undefined>(undefined);
  readonly schema = input<JsonSchema | undefined>(undefined);

  readonly mounted = output<JsonjoyMonacoHandle>();

  private readonly _loaded = signal(false);
  readonly loaded = this._loaded.asReadonly();

  private editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  private monaco: typeof Monaco | null = null;
  private suppressNextChange = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        void this.bootstrap();
      });
    }

    effect(() => {
      const next = this.value();
      if (!this.editor) return;
      if (this.editor.getValue() === next) return;
      this.suppressNextChange = true;
      this.editor.setValue(next);
    });

    effect(() => {
      const isReadOnly = this.readOnly();
      this.editor?.updateOptions({ readOnly: isReadOnly });
    });

    effect(() => {
      const lang = this.language();
      if (!this.editor || !this.monaco) return;
      const model = this.editor.getModel();
      if (model) this.monaco.editor.setModelLanguage(model, lang);
    });

    effect(() => {
      const schema = this.schema();
      if (!this.monaco) return;
      this.themeService.configureJsonDefaults(this.monaco, schema);
    });

    effect(() => {
      const theme = this.themeService.currentTheme();
      this.monaco?.editor.setTheme(theme);
    });
  }

  private async bootstrap(): Promise<void> {
    const monaco = await import('monaco-editor');
    this.monaco = monaco;
    this.themeService.defineThemes(monaco);
    this.themeService.configureJsonDefaults(monaco, this.schema());

    const merged = {
      ...DEFAULT_MONACO_EDITOR_OPTIONS,
      ...(this.options() ?? {}),
      readOnly: this.readOnly(),
      language: this.language(),
      value: this.value(),
      theme: this.themeService.currentTheme(),
    } satisfies Monaco.editor.IStandaloneEditorConstructionOptions;

    this.editor = monaco.editor.create(
      this.host.nativeElement,
      merged as Monaco.editor.IStandaloneEditorConstructionOptions,
    );

    this.editor.onDidChangeModelContent(() => {
      if (this.suppressNextChange) {
        this.suppressNextChange = false;
        return;
      }
      const next = this.editor?.getValue() ?? '';
      this.value.set(next);
    });

    if (this.autoFocus()) {
      this.editor.focus();
    }

    this._loaded.set(true);
    this.mounted.emit(this.buildHandle());

    this.destroyRef.onDestroy(() => {
      this.editor?.dispose();
      this.editor = null;
      this.monaco = null;
    });
  }

  private buildHandle(): JsonjoyMonacoHandle {
    return {
      revealError: (line, column) => {
        const editor = this.editor;
        if (!editor) return;
        editor.revealLineInCenter(line);
        editor.setPosition({ lineNumber: line, column });
        editor.focus();
      },
      focus: () => this.editor?.focus(),
      setValue: (value) => {
        if (!this.editor) return;
        this.suppressNextChange = true;
        this.editor.setValue(value);
      },
      getValue: () => this.editor?.getValue() ?? '',
      layout: () => this.editor?.layout(),
    };
  }
}
