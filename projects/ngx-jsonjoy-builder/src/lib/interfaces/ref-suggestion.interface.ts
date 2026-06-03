import type { Signal } from '@angular/core';

/**
 * A single ref-target presented to the user in the `$ref` editor's
 * suggestion list. Host applications produce these by translating their
 * domain entities (blueprints, schemas, etc.) into a URL the backend
 * resolver understands.
 *
 * @public
 */
export interface RefSuggestion {
  /** Stable identifier (e.g. blueprint UUID). Used for `trackBy`. */
  readonly id: string;
  /** Human-readable label shown in the suggestion list. */
  readonly label: string;
  /** Absolute URL (no fragment) that becomes the `$ref` value. */
  readonly url: string;
  /** Optional secondary line below the label. */
  readonly description?: string;
  /** Optional inline pointers (e.g. `#/properties/foo`) the user can append. */
  readonly pointers?: ReadonlyArray<{
    readonly label: string;
    readonly fragment: string;
  }>;
}

/**
 * Factory producing a reactive list of {@link RefSuggestion}s. Evaluated
 * inside Angular's injection context, so it can call `inject()` to reach
 * host services.
 *
 * @public
 */
export type RefSuggestionsFactory = () => Signal<readonly RefSuggestion[]>;
