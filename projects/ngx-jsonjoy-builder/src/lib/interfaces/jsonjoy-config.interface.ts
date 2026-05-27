import type { Translation } from '../i18n/translation-keys';

/**
 * Library-wide configuration consumed by {@link provideJsonjoy}.
 *
 * Component-level `locale` and `messages` inputs further override the
 * provided values via a computed merge inside each component (provider
 * locale → provider messages → component locale → component messages).
 *
 * @public
 */
export interface JsonjoyConfig {
  /** Full locale object used as the baseline for every translation key. */
  readonly locale?: Translation;
  /** Per-key overrides applied on top of `locale`. */
  readonly messages?: Partial<Translation>;
}
