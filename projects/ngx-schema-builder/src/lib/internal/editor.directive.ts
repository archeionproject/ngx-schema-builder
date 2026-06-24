import { isPlatformBrowser } from '@angular/common';
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
import { indentWithTab } from '@codemirror/commands';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import {
  HighlightStyle,
  defaultHighlightStyle,
  syntaxHighlighting,
} from '@codemirror/language';
import {
  type Diagnostic,
  forceLinting,
  lintGutter,
  linter,
} from '@codemirror/lint';
import { Annotation, Compartment, EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { keymap } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import { basicSetup } from 'codemirror';

import type { JsonSchema } from '../types/json-schema';
import { validateJson } from './json-validator';

/**
 * Imperative handle emitted via the `mounted` output once the editor has
 * finished loading. Consumers (e.g. `ValidateJsonDialog`) use this to reveal
 * a line/column without leaking the raw editor instance across the directive
 * boundary.
 */
export interface JsonjoyEditorHandle {
  revealError(line: number, column: number): void;
  focus(): void;
  setValue(value: string): void;
  getValue(): string;
  layout(): void;
}

/** Marks transactions the directive dispatches itself, so the write-back
 * listener can ignore them and avoid echoing programmatic value updates. */
const External = Annotation.define<boolean>();

/** Readable JSON syntax colors for the dark surface (default style is light). */
const DARK_HIGHLIGHT_STYLE = HighlightStyle.define([
  { tag: [t.propertyName, t.definition(t.propertyName)], color: '#7dd3fc' },
  { tag: [t.string, t.special(t.string)], color: '#86efac' },
  { tag: [t.number, t.bool, t.null], color: '#fca5a5' },
  { tag: [t.keyword, t.operator], color: '#c4b5fd' },
  { tag: [t.punctuation, t.separator, t.bracket], color: '#a3a3a3' },
  { tag: t.comment, color: '#6b7280', fontStyle: 'italic' },
  { tag: t.invalid, color: '#fca5a5' },
]);

/**
 * CodeMirror 6 JSON editor. Attached to a host element, it creates an editor
 * instance and bridges CodeMirror's imperative API to Angular signals.
 */
@Directive({
  selector: '[libJsonjoyEditor]',
  exportAs: 'libJsonjoyEditor',
})
export class JsonjoyEditorDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly value = model<string>('');
  /** Reserved for future languages; only `json` is currently supported. */
  readonly language = input<string>('json');
  readonly readOnly = input<boolean>(false);
  readonly autoFocus = input<boolean>(false);
  readonly schema = input<JsonSchema | undefined>(undefined);

  readonly mounted = output<JsonjoyEditorHandle>();

  private readonly _loaded = signal(false);
  readonly loaded = this._loaded.asReadonly();

  private view: EditorView | null = null;
  private readonly readOnlyCompartment = new Compartment();
  private readonly themeCompartment = new Compartment();
  private observer: MutationObserver | null = null;
  private readonly _isDark = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => this.bootstrap());
    }

    effect(() => {
      const next = this.value();
      const view = this.view;
      if (!view) return;
      if (view.state.doc.toString() === next) return;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: next },
        annotations: External.of(true),
      });
    });

    effect(() => {
      const isReadOnly = this.readOnly();
      this.view?.dispatch({
        effects: this.readOnlyCompartment.reconfigure(
          this.readOnlyExtension(isReadOnly),
        ),
      });
    });

    effect(() => {
      // Re-run schema diagnostics whenever the bound schema changes.
      this.schema();
      if (this.view) forceLinting(this.view);
    });

    effect(() => {
      const dark = this._isDark();
      this.view?.dispatch({
        effects: this.themeCompartment.reconfigure(this.themeExtension(dark)),
      });
    });
  }

  private bootstrap(): void {
    this.detectDark();
    this.observeDark();

    const schemaLinter = linter(async (view): Promise<Diagnostic[]> => {
      const schema = this.schema();
      const text = view.state.doc.toString();
      if (!schema || !text.trim()) return [];
      try {
        JSON.parse(text);
      } catch {
        // jsonParseLinter already reports syntax errors.
        return [];
      }
      const result = await validateJson(text, schema);
      if (result.valid) return [];
      const doc = view.state.doc;
      return (result.errors ?? []).map((error) => {
        let from = 0;
        let to = 0;
        if (error.line) {
          const lineObj = doc.line(Math.min(error.line, doc.lines));
          from = Math.min(
            lineObj.from + Math.max(0, (error.column ?? 1) - 1),
            lineObj.to,
          );
          to = lineObj.to;
        }
        return {
          from,
          to: Math.max(from, to),
          severity: 'error' as const,
          message: error.message,
        };
      });
    });

    const state = EditorState.create({
      doc: this.value(),
      extensions: [
        basicSetup,
        json(),
        linter(jsonParseLinter()),
        schemaLinter,
        lintGutter(),
        keymap.of([indentWithTab]),
        this.readOnlyCompartment.of(this.readOnlyExtension(this.readOnly())),
        this.themeCompartment.of(this.themeExtension(this._isDark())),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          if (update.transactions.some((tr) => tr.annotation(External))) return;
          this.value.set(update.state.doc.toString());
        }),
      ],
    });

    this.view = new EditorView({
      state,
      parent: this.host.nativeElement,
      root: this.host.nativeElement.getRootNode() as Document | ShadowRoot,
    });

    if (this.autoFocus()) this.view.focus();

    this._loaded.set(true);
    this.mounted.emit(this.buildHandle());

    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      this.observer = null;
      this.view?.destroy();
      this.view = null;
    });
  }

  private readOnlyExtension(readOnly: boolean) {
    return [
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
    ];
  }

  private themeExtension(dark: boolean) {
    const base = EditorView.theme(
      {
        '&': {
          height: '100%',
          fontSize: '14px',
          backgroundColor: 'transparent',
          color: 'var(--jsonjoy-color-foreground)',
        },
        '&.cm-focused': { outline: 'none' },
        '.cm-scroller': {
          fontFamily: "'SF Mono', Monaco, Menlo, Consolas, monospace",
          overflow: 'auto',
        },
        '.cm-gutters': {
          backgroundColor: 'var(--jsonjoy-color-background, #ffffff)',
          border: 'none',
          color: 'var(--jsonjoy-color-muted-foreground)',
        },
        '.cm-activeLine, .cm-activeLineGutter': {
          backgroundColor:
            'color-mix(in srgb, var(--jsonjoy-color-muted) 40%, transparent)',
        },
      },
      { dark },
    );
    // `basicSetup` only ships a light highlight style; swap in a dark one when dark.
    const highlight = dark
      ? syntaxHighlighting(DARK_HIGHLIGHT_STYLE)
      : syntaxHighlighting(defaultHighlightStyle);
    return [base, highlight];
  }

  private observeDark(): void {
    if (typeof MutationObserver === 'undefined') return;
    this.observer = new MutationObserver(() => this.detectDark());
    // The dark toggle lives on the document root, so watch only its class.
    this.observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  private detectDark(): void {
    const host = this.host.nativeElement;
    const dark =
      host.closest('.dark') !== null ||
      document.documentElement.classList.contains('dark');
    this._isDark.set(dark);
  }

  private buildHandle(): JsonjoyEditorHandle {
    return {
      revealError: (line, column) => {
        const view = this.view;
        if (!view) return;
        const doc = view.state.doc;
        const lineNo = Math.max(1, Math.min(line, doc.lines));
        const lineObj = doc.line(lineNo);
        const pos = Math.min(
          lineObj.from + Math.max(0, (column ?? 1) - 1),
          lineObj.to,
        );
        view.dispatch({
          selection: { anchor: pos },
          effects: EditorView.scrollIntoView(pos, { y: 'center' }),
        });
        view.focus();
      },
      focus: () => this.view?.focus(),
      setValue: (value) => {
        const view = this.view;
        if (!view) return;
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: value },
          annotations: External.of(true),
        });
      },
      getValue: () => this.view?.state.doc.toString() ?? '',
      layout: () => this.view?.requestMeasure(),
    };
  }
}
