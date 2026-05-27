import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  untracked,
} from '@angular/core';

import type { Translation } from '../../i18n/translation-keys';
import { cn } from '../../internal/cn';
import { JsonjoyTranslationService } from '../../services/translation.service';
import type { JsonSchema } from '../../types/json-schema';
import { SchemaFieldsEditorComponent } from '../schema-fields-editor/schema-fields-editor.component';

@Component({
  selector: 'lib-jsonjoy-schema-builder',
  standalone: true,
  imports: [SchemaFieldsEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy block' },
  template: `
    <div [class]="rootClasses()">
      <div class="flex items-center justify-between px-4 py-3 border-b w-full shrink-0">
        <h3 class="font-medium">{{ t().schemaEditorTitle }}</h3>
      </div>
      <div class="w-full h-[600px]">
        <lib-jsonjoy-schema-fields-editor
          [(value)]="value"
          [readOnly]="readOnly()"
          [autoFocus]="autoFocus()"
          [locale]="locale()"
          [messages]="messages()"
        />
      </div>
    </div>
  `,
})
export class SchemaBuilderComponent {
  readonly value = model<JsonSchema>({ type: 'object' });
  readonly defaultValue = input<JsonSchema | undefined>(undefined);
  readonly readOnly = input<boolean>(false);
  readonly autoFocus = input<boolean>(true);
  readonly className = input<string | undefined>(undefined);
  readonly locale = input<Translation | undefined>(undefined);
  readonly messages = input<Partial<Translation> | undefined>(undefined);

  private readonly translations = inject(JsonjoyTranslationService);
  protected readonly t = this.translations.withOverrides(this.locale, this.messages);

  protected readonly rootClasses = computed(() =>
    cn('json-editor-container w-full jsonjoy', this.className()),
  );

  constructor() {
    effect(() => {
      const initial = this.defaultValue();
      if (!initial) return;
      untracked(() => {
        const current = this.value();
        const isDefaultEmpty =
          typeof current === 'object' &&
          current !== null &&
          !Array.isArray(current) &&
          Object.keys(current).length === 1 &&
          (current as { type?: unknown }).type === 'object';
        if (isDefaultEmpty) {
          this.value.set(initial);
        }
      });
    });
  }
}
