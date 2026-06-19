import {
  Injectable,
  type Signal,
  computed,
  inject,
  signal,
} from '@angular/core';

import type { Translation } from '../i18n/translation-keys';
import { JsonjoyTranslationService } from './translation.service';

/**
 * Editor-scoped context that carries the effective translation down to nested
 * editors. Entry components provide it and call {@link setSource}; inner
 * components inject it and read {@link translation}. Falls back to the provider
 * locale until a source is set.
 */
@Injectable()
export class JsonjoyTranslationContextService {
  private readonly fallback = inject(JsonjoyTranslationService).providerLocale;
  private readonly source = signal<Signal<Translation> | null>(null);

  readonly translation: Signal<Translation> = computed(() =>
    (this.source() ?? this.fallback)(),
  );

  setSource(source: Signal<Translation>): void {
    this.source.set(source);
  }
}
