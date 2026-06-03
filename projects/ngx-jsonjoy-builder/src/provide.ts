import {
  type EnvironmentProviders,
  type Provider,
  makeEnvironmentProviders,
} from '@angular/core';

import type { JsonjoyConfig, RefSuggestionsFactory } from './lib/interfaces';
import { JSONJOY_CONFIG, JSONJOY_REF_SUGGESTIONS } from './lib/tokens';

/**
 * Registers the JSONJoy schema builder configuration for a section of the
 * application. The React equivalent is `<SchemaBuilderProvider>`.
 *
 * Configuration is merged inside each component as:
 * `en (baseline) → provider locale → provider messages → component locale → component messages`.
 *
 * @public
 */
export function provideJsonjoy(
  config: JsonjoyConfig = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: JSONJOY_CONFIG, useValue: config },
  ]);
}

/**
 * Registers a source of `$ref` suggestions used by the reference editor.
 * The factory runs inside Angular's injection context, so it can call
 * `inject()` to read host-side services (blueprint lists, shared schemas,
 * …) and return a `Signal<readonly RefSuggestion[]>`.
 *
 * @public
 */
export function provideJsonjoyRefSuggestions(
  factory: RefSuggestionsFactory,
): Provider[] {
  return [{ provide: JSONJOY_REF_SUGGESTIONS, useFactory: factory }];
}
