import { en } from '../src/lib/i18n/locales/en';
import { it as itLocale } from '../src/lib/i18n/locales/it';

describe('locales', () => {
  it('it has the same key set as en', () => {
    const enKeys = Object.keys(en).sort();
    const itKeys = Object.keys(itLocale).sort();
    expect(itKeys).toEqual(enKeys);
  });

  it('every value is a string, non-empty except placeholders', () => {
    // Placeholders may be intentionally empty (e.g. refUrlPlaceholder).
    for (const locale of [en, itLocale]) {
      for (const [key, value] of Object.entries(locale)) {
        expect(typeof value).toBe('string');
        if (!key.endsWith('Placeholder')) {
          expect((value as string).length).toBeGreaterThan(0);
        }
      }
    }
  });
});
