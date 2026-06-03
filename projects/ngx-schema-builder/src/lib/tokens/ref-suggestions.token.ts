import { InjectionToken, type Signal } from '@angular/core';

import type { RefSuggestion } from '../interfaces/ref-suggestion.interface';

/**
 * DI token holding the reactive list of `$ref` suggestions, registered by
 * {@link provideSchemaBuilderRefSuggestions}. The reference editor injects it
 * with `{ optional: true }`; when absent, only free-text entry is offered.
 *
 * @public
 */
export const SCHEMA_BUILDER_REF_SUGGESTIONS = new InjectionToken<
  Signal<readonly RefSuggestion[]>
>('SCHEMA_BUILDER_REF_SUGGESTIONS');
