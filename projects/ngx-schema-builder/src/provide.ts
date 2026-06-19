import {
  type EnvironmentProviders,
  type Provider,
  makeEnvironmentProviders,
} from '@angular/core';

import type {
  RefSuggestionsFactory,
  SchemaBuilderConfig,
} from './lib/interfaces';
import { JsonjoyTranslationContextService } from './lib/services/translation-context.service';
import {
  SCHEMA_BUILDER_CONFIG,
  SCHEMA_BUILDER_REF_SUGGESTIONS,
} from './lib/tokens';

export function provideSchemaBuilder(
  config: SchemaBuilderConfig = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: SCHEMA_BUILDER_CONFIG, useValue: config },
    // Root fallback so an inner editor used outside an editor subtree still resolves.
    JsonjoyTranslationContextService,
  ]);
}

export function provideSchemaBuilderRefSuggestions(
  factory: RefSuggestionsFactory,
): Provider[] {
  return [{ provide: SCHEMA_BUILDER_REF_SUGGESTIONS, useFactory: factory }];
}
