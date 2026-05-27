import { InjectionToken } from '@angular/core';

import type { JsonjoyConfig } from '../interfaces/jsonjoy-config.interface';

/**
 * Optional DI token holding the merged {@link JsonjoyConfig} provided by
 * {@link provideJsonjoy}. Components inject this with `{ optional: true }`
 * and merge it with their own `locale` / `messages` inputs.
 *
 * @public
 */
export const JSONJOY_CONFIG = new InjectionToken<JsonjoyConfig>(
  'JSONJOY_CONFIG',
);
