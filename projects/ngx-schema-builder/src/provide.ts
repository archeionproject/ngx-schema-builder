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

export function provideSchemaBuilder(
  config: SchemaBuilderConfig = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: SCHEMA_BUILDER_CONFIG, useValue: config },
  ]);
}

export function provideSchemaBuilderRefSuggestions(
  factory: RefSuggestionsFactory,
): Provider[] {
  return [{ provide: SCHEMA_BUILDER_REF_SUGGESTIONS, useFactory: factory }];
}
