import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import type { JsonjoyConfig } from './lib/interfaces';
import { JSONJOY_CONFIG } from './lib/tokens';

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
