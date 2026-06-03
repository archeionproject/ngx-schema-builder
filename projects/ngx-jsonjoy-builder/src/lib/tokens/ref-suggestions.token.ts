import { InjectionToken, type Signal } from '@angular/core';

import type { RefSuggestion } from '../interfaces/ref-suggestion.interface';

/**
 * DI token holding the reactive list of `$ref` suggestions, registered by
 * {@link provideJsonjoyRefSuggestions}. The reference editor injects it
 * with `{ optional: true }`; when absent, only free-text entry is offered.
 *
 * @public
 */
export const JSONJOY_REF_SUGGESTIONS = new InjectionToken<
  Signal<readonly RefSuggestion[]>
>('JSONJOY_REF_SUGGESTIONS');
