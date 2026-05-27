import {
  DOCUMENT,
  DestroyRef,
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';
import type * as Monaco from 'monaco-editor';

import type { JsonSchema } from '../types/json-schema';

/**
 * Editor option subset surfaced by the library. Mirrors React's
 * `MonacoEditorOptions` shape (see use-monaco-theme.ts).
 */
export interface MonacoEditorOptions {
  minimap?: { enabled: boolean };
  fontSize?: number;
  fontFamily?: string;
  lineNumbers?: 'on' | 'off';
  roundedSelection?: boolean;
  scrollBeyondLastLine?: boolean;
  readOnly?: boolean;
  automaticLayout?: boolean;
  formatOnPaste?: boolean;
  formatOnType?: boolean;
  tabSize?: number;
  insertSpaces?: boolean;
  detectIndentation?: boolean;
  folding?: boolean;
  foldingStrategy?: 'auto' | 'indentation';
  renderLineHighlight?: 'all' | 'line' | 'none' | 'gutter';
  matchBrackets?: 'always' | 'near' | 'never';
  autoClosingBrackets?:
    | 'always'
    | 'languageDefined'
    | 'beforeWhitespace'
    | 'never';
  autoClosingQuotes?:
    | 'always'
    | 'languageDefined'
    | 'beforeWhitespace'
    | 'never';
  guides?: {
    bracketPairs?: boolean;
    indentation?: boolean;
  };
}

export const DEFAULT_MONACO_EDITOR_OPTIONS: MonacoEditorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  fontFamily:
    "var(--font-sans), 'SF Mono', Monaco, Menlo, Consolas, monospace",
  lineNumbers: 'on',
  roundedSelection: false,
  scrollBeyondLastLine: false,
  readOnly: false,
  automaticLayout: true,
  formatOnPaste: true,
  formatOnType: true,
  tabSize: 2,
  insertSpaces: true,
  detectIndentation: true,
  folding: true,
  foldingStrategy: 'indentation',
  renderLineHighlight: 'all',
  matchBrackets: 'always',
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always',
  guides: { bracketPairs: true, indentation: true },
};

/**
 * Replaces the React `useMonacoTheme()` hook.
 *
 * Watches `document.documentElement` via a `MutationObserver` (matches the
 * React lib's quirk — it reads `--background` off the document root, not
 * the nearest `.jsonjoy` ancestor) and exposes `isDarkMode` / `currentTheme`
 * as signals.
 *
 * Also owns the Monaco theme definitions and the JSON language defaults
 * setup that the React lib spread across the same hook.
 */
@Injectable({ providedIn: 'root' })
export class JsonjoyMonacoThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _isDarkMode = signal(false);

  readonly isDarkMode = this._isDarkMode.asReadonly();
  readonly currentTheme = computed(() =>
    this._isDarkMode() ? 'appDarkTheme' : 'appLightTheme',
  );

  constructor() {
    // TODO (deliverable 4): port theme detection (MutationObserver on
    // documentElement, read CSS variable `--background`).
  }

  /**
   * Register both `appLightTheme` and `appDarkTheme` with the Monaco
   * runtime. Called once when an editor mounts.
   *
   * @see jsonjoy-builder/src/hooks/use-monaco-theme.ts for colour table.
   */
  defineThemes(_monaco: typeof Monaco): void {
    // TODO (deliverable 4): port `defineMonacoThemes`.
  }

  /**
   * Configure JSON language defaults with both the JSON Schema draft-07
   * meta-schema and the user-supplied schema (when present).
   */
  configureJsonDefaults(_monaco: typeof Monaco, _schema?: JsonSchema): void {
    // TODO (deliverable 4): port `configureJsonDefaults`.
  }
}
