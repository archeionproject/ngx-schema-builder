import {
  Directive,
  ElementRef,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import type * as Monaco from 'monaco-editor';

import {
  type MonacoEditorOptions,
  JsonjoyMonacoThemeService,
} from '../services/monaco-theme.service';
import type { JsonSchema } from '../types/json-schema';

/**
 * Replaces `@monaco-editor/react`. Attached to a host `<div>`, lazy-loads
 * `monaco-editor`, creates an editor instance, and bridges Monaco's
 * imperative API to Angular signals.
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
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly themeService = inject(JsonjoyMonacoThemeService);

  /** Editor content. Two-way bound. */
  readonly value = model<string>('');
  /** Editor language id. Defaults to `'json'`. */
  readonly language = input<string>('json');
  /** Read-only flag. */
  readonly readOnly = input<boolean>(false);
  /** Whether to focus the editor once it mounts. */
  readonly autoFocus = input<boolean>(false);
  /** Override default editor options. */
  readonly options = input<MonacoEditorOptions | undefined>(undefined);
  /** When set, the JSON language is configured to validate against this schema. */
  readonly schema = input<JsonSchema | undefined>(undefined);

  /** Emits when Monaco has finished loading and the editor is mounted. */
  readonly mounted = output<unknown>();

  // TODO (deliverable 4):
  //   - lazy import('monaco-editor')
  //   - call themeService.defineThemes(monaco) + configureJsonDefaults(monaco, schema)
  //   - create editor with merged options
  //   - subscribe to onDidChangeModelContent → this.value.set(model.getValue())
  //   - apply readOnly / language / schema changes via effect()
  //   - dispose on destroy
}
