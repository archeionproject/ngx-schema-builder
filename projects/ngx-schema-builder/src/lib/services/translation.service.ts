import { Injectable, computed, inject, signal } from '@angular/core';

import { en } from '../i18n/locales/en';
import type { Translation } from '../i18n/translation-keys';
import { SCHEMA_BUILDER_CONFIG } from '../tokens';

/**
 * Replaces React's `useTranslation()` hook and `SchemaBuilderConfigContext`.
 *
 * Components inject this service and either read `messages()` directly or
 * call `withOverrides()` to produce a `computed()` that layers their own
 * `locale` / `messages` inputs over the provided config.
 */
@Injectable({ providedIn: 'root' })
export class JsonjoyTranslationService {
  private readonly config = inject(SCHEMA_BUILDER_CONFIG, { optional: true });

  /**
   * The merged provider-level locale: `en` baseline overlaid with the
   * provider's `locale` and `messages` (if any).
   */
  readonly providerLocale = computed<Translation>(() => ({
    ...en,
    ...(this.config?.locale ?? {}),
    ...(this.config?.messages ?? {}),
  }));

  /**
   * Helper to build a per-component effective locale.
   *
   * @param locale per-component locale override
   * @param messages per-component messages override
   */
  withOverrides(
    locale: () => Translation | undefined,
    messages: () => Partial<Translation> | undefined,
  ) {
    return computed<Translation>(() => ({
      ...this.providerLocale(),
      ...(locale() ?? {}),
      ...(messages() ?? {}),
    }));
  }
}

/**
 * Replaces `formatTranslation()` from the React lib. Substitutes `{key}`
 * tokens in a template string with values from a record.
 */
export function formatTranslation(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = values[key];
    return value !== undefined ? String(value) : `{${key}}`;
  });
}
