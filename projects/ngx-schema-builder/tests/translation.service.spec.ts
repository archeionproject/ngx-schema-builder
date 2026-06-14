import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import {
  JsonjoyTranslationService,
  formatTranslation,
} from '../src/lib/services/translation.service';
import { en } from '../src/lib/i18n/locales/en';
import { provideSchemaBuilder } from '../src/provide';
import type { Translation } from '../src/lib/i18n/translation-keys';

describe('formatTranslation', () => {
  it('substitutes named tokens', () => {
    expect(formatTranslation('{count} of {total}', { count: 2, total: 5 })).toBe(
      '2 of 5',
    );
  });

  it('leaves unknown tokens intact', () => {
    expect(formatTranslation('{missing}', {})).toBe('{missing}');
  });
});

describe('JsonjoyTranslationService', () => {
  it('defaults to the en baseline when no config provided', () => {
    TestBed.configureTestingModule({ providers: [provideSchemaBuilder()] });
    const svc = TestBed.inject(JsonjoyTranslationService);
    expect(svc.providerLocale().schemaTypeString).toBe(en.schemaTypeString);
  });

  it('overlays provider messages on top of the locale', () => {
    TestBed.configureTestingModule({
      providers: [provideSchemaBuilder({ messages: { schemaTypeString: 'STR' } })],
    });
    const svc = TestBed.inject(JsonjoyTranslationService);
    expect(svc.providerLocale().schemaTypeString).toBe('STR');
  });

  it('withOverrides layers component locale and messages last', () => {
    TestBed.configureTestingModule({
      providers: [provideSchemaBuilder({ messages: { schemaTypeString: 'PROVIDER' } })],
    });
    const svc = TestBed.inject(JsonjoyTranslationService);
    const locale = signal<Translation | undefined>(undefined);
    const messages = signal<Partial<Translation> | undefined>({
      schemaTypeString: 'COMPONENT',
    });
    const merged = TestBed.runInInjectionContext(() =>
      svc.withOverrides(locale, messages),
    );
    expect(merged().schemaTypeString).toBe('COMPONENT');

    messages.set(undefined);
    expect(merged().schemaTypeString).toBe('PROVIDER');
  });
});
