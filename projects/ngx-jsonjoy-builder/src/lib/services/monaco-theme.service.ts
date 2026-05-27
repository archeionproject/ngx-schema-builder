import {
  DOCUMENT,
  DestroyRef,
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';
import type * as Monaco from 'monaco-editor';

import { JSON_SCHEMA_DRAFT_07 } from '../internal/json-schema-draft-07';
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

const DRAFT_07_SCHEMA_URIS = [
  'https://json-schema.org/draft-07/schema',
  'https://json-schema.org/draft-07/schema#',
  'http://json-schema.org/draft-07/schema',
  'http://json-schema.org/draft-07/schema#',
] as const;

const DEFAULT_DRAFT_07_SCHEMA_URI = DRAFT_07_SCHEMA_URIS[0];

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

  private observer: MutationObserver | null = null;

  constructor() {
    if (typeof window === 'undefined') return;

    this.checkDarkMode();
    this.observer = new MutationObserver(() => this.checkDarkMode());
    this.observer.observe(this.document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });
    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      this.observer = null;
    });
  }

  private checkDarkMode(): void {
    const backgroundColor = getComputedStyle(this.document.documentElement)
      .getPropertyValue('--background')
      .trim();
    const isDark =
      backgroundColor.includes('222.2') ||
      backgroundColor.includes('84% 4.9%');
    this._isDarkMode.set(isDark);
  }

  defineThemes(monaco: typeof Monaco): void {
    monaco.editor.defineTheme('appLightTheme', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'string', foreground: '3B82F6' },
        { token: 'number', foreground: 'A855F7' },
        { token: 'keyword', foreground: '3B82F6' },
        { token: 'delimiter', foreground: '0F172A' },
        { token: 'keyword.json', foreground: 'A855F7' },
        { token: 'string.key.json', foreground: '2563EB' },
        { token: 'string.value.json', foreground: '3B82F6' },
        { token: 'boolean', foreground: '22C55E' },
        { token: 'null', foreground: '64748B' },
      ],
      colors: {
        'editor.background': '#f8fafc',
        'editor.foreground': '#0f172a',
        'editorCursor.foreground': '#0f172a',
        'editor.lineHighlightBackground': '#f1f5f9',
        'editorLineNumber.foreground': '#64748b',
        'editor.selectionBackground': '#e2e8f0',
        'editor.inactiveSelectionBackground': '#e2e8f0',
        'editorIndentGuide.background': '#e2e8f0',
        'editor.findMatchBackground': '#cbd5e1',
        'editor.findMatchHighlightBackground': '#cbd5e133',
      },
    });

    monaco.editor.defineTheme('appDarkTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'string', foreground: '3B82F6' },
        { token: 'number', foreground: 'A855F7' },
        { token: 'keyword', foreground: '3B82F6' },
        { token: 'delimiter', foreground: 'F8FAFC' },
        { token: 'keyword.json', foreground: 'A855F7' },
        { token: 'string.key.json', foreground: '60A5FA' },
        { token: 'string.value.json', foreground: '3B82F6' },
        { token: 'boolean', foreground: '22C55E' },
        { token: 'null', foreground: '94A3B8' },
      ],
      colors: {
        'editor.background': '#0f172a',
        'editor.foreground': '#f8fafc',
        'editorCursor.foreground': '#f8fafc',
        'editor.lineHighlightBackground': '#1e293b',
        'editorLineNumber.foreground': '#64748b',
        'editor.selectionBackground': '#334155',
        'editor.inactiveSelectionBackground': '#334155',
        'editorIndentGuide.background': '#1e293b',
        'editor.findMatchBackground': '#475569',
        'editor.findMatchHighlightBackground': '#47556933',
      },
    });
  }

  configureJsonDefaults(monaco: typeof Monaco, schema?: JsonSchema): void {
    const schemaId =
      typeof schema === 'object' && schema && '$id' in schema && schema.$id
        ? (schema.$id as string)
        : 'https://jsonjoy-builder/schema';

    const userSchema =
      schema ??
      ({
        $schema: DEFAULT_DRAFT_07_SCHEMA_URI,
        type: 'object',
        additionalProperties: true,
      } satisfies JsonSchema);

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemaValidation: 'error',
      enableSchemaRequest: false,
      schemas: [
        ...DRAFT_07_SCHEMA_URIS.map((uri) => ({
          uri,
          schema: JSON_SCHEMA_DRAFT_07 as unknown as object,
        })),
        {
          uri: schemaId,
          fileMatch: ['*'],
          schema: userSchema as unknown as object,
        },
      ],
    });
  }
}
