import { en } from '../src/lib/i18n/locales/en';
import { it as itLocale } from '../src/lib/i18n/locales/it';

describe('locales', () => {
  it('it has the same key set as en', () => {
    const enKeys = Object.keys(en).sort();
    const itKeys = Object.keys(itLocale).sort();
    expect(itKeys).toEqual(enKeys);
  });

  it('every value is a non-empty string', () => {
    for (const locale of [en, itLocale]) {
      for (const value of Object.values(locale)) {
        expect(typeof value).toBe('string');
        expect((value as string).length).toBeGreaterThan(0);
      }
    }
  });
});
