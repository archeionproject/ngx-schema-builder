import { InjectionToken } from '@angular/core';

import type { SchemaBuilderConfig } from '../interfaces/schema-builder-config.interface';

/**
 * Optional DI token holding the merged {@link SchemaBuilderConfig} provided by
 * {@link provideSchemaBuilder}. Components inject this with `{ optional: true }`
 * and merge it with their own `locale` / `messages` inputs.
 *
 * @public
 */
export const SCHEMA_BUILDER_CONFIG = new InjectionToken<SchemaBuilderConfig>(
  'SCHEMA_BUILDER_CONFIG',
);
