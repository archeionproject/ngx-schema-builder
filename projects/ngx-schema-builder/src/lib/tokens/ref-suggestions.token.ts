import { InjectionToken, type Signal } from '@angular/core';

import type { RefSuggestion } from '../interfaces/ref-suggestion.interface';

export const SCHEMA_BUILDER_REF_SUGGESTIONS = new InjectionToken<
  Signal<readonly RefSuggestion[]>
>('SCHEMA_BUILDER_REF_SUGGESTIONS');
