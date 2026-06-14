import {
  type EnvironmentProviders,
  type Provider,
  makeEnvironmentProviders,
} from '@angular/core';

import type {
  RefSuggestionsFactory,
  SchemaBuilderConfig,
} from './lib/interfaces';
import {
  SCHEMA_BUILDER_CONFIG,
  SCHEMA_BUILDER_REF_SUGGESTIONS,
} from './lib/tokens';

/**
 * Registers the JSONJoy schema builder configuration for a section of the
 * application. The React equivalent is `<SchemaBuilderProvider>`.
 *
 * Configuration is merged inside each component as:
 * `en (baseline) → provider locale → provider messages → component locale → component messages`.
 *
 * @public
 */
export function provideSchemaBuilder(
  config: SchemaBuilderConfig = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: SCHEMA_BUILDER_CONFIG, useValue: config },
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
export function provideSchemaBuilderRefSuggestions(
  factory: RefSuggestionsFactory,
): Provider[] {
  return [{ provide: SCHEMA_BUILDER_REF_SUGGESTIONS, useFactory: factory }];
}
