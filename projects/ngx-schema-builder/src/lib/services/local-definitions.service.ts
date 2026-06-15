import { Injectable, type Signal, signal } from '@angular/core';

import type { LocalDefinition } from '../internal/schema-editor';

/**
 * Editor-scoped context carrying the root schema's local `$defs`/`definitions`
 * down to deeply nested `$ref` editors.
 *
 * Provided at `SchemaFieldsEditorComponent` (the common ancestor of the whole
 * visual tree, definitions tab included), so descendant `RefEditor`s resolve it
 * through hierarchical DI. The root component pushes the current list via
 * {@link set}; consumers read {@link definitions}. Internal — not part of the
 * public API.
 */
@Injectable()
export class LocalDefinitionsContextService {
  private readonly defs = signal<readonly LocalDefinition[]>([]);

  /** Reactive list of the root schema's local definitions. */
  readonly definitions: Signal<readonly LocalDefinition[]> =
    this.defs.asReadonly();

  set(definitions: readonly LocalDefinition[]): void {
    this.defs.set(definitions);
  }
}
