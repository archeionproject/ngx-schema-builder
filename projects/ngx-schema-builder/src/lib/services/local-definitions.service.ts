import { Injectable, type Signal, signal } from '@angular/core';

import type { LocalDefinition } from '../internal/schema-editor';

/**
 * Editor-scoped context carrying the root schema's local `$defs`/`definitions`
 * down to deeply nested `$ref` editors.
 */
@Injectable()
export class LocalDefinitionsContextService {
  private readonly defs = signal<readonly LocalDefinition[]>([]);

  readonly definitions: Signal<readonly LocalDefinition[]> =
    this.defs.asReadonly();

  set(definitions: readonly LocalDefinition[]): void {
    this.defs.set(definitions);
  }
}
