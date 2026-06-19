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
import { SchemaJsonEditorComponent } from '../schema-json-editor/schema-json-editor.component';

export type SchemaBuilderMode = 'visual' | 'json' | 'both';

@Component({
  selector: 'lib-jsonjoy-schema-builder',
  standalone: true,
  imports: [SchemaFieldsEditorComponent, SchemaJsonEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy block' },
  template: `
    <div [class]="rootClasses()">
      <div
        class="flex items-center justify-between px-4 py-3 border-b w-full shrink-0"
      >
        <h3 class="font-medium">{{ t().schemaEditorTitle }}</h3>
        <div
          class="grid grid-cols-3 w-[280px] h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
        >
          <button
            type="button"
            [class]="toggleButtonClasses(mode() === 'visual')"
            (click)="mode.set('visual')"
          >
            {{ t().schemaEditorEditModeVisual }}
          </button>
          <button
            type="button"
            [class]="toggleButtonClasses(mode() === 'both')"
            (click)="mode.set('both')"
          >
            {{ t().schemaEditorEditModeBoth }}
          </button>
          <button
            type="button"
            [class]="toggleButtonClasses(mode() === 'json')"
            (click)="mode.set('json')"
          >
            {{ t().schemaEditorEditModeJson }}
          </button>
        </div>
      </div>

      <div class="flex flex-row w-full h-[600px] min-h-0">
        @if (mode() !== 'json') {
          <div [class]="visualPaneClasses()">
            <lib-jsonjoy-schema-fields-editor
              [(value)]="value"
              [readOnly]="readOnly()"
              [autoFocus]="autoFocus()"
              [locale]="locale()"
              [messages]="messages()"
            />
          </div>
        }
        @if (mode() === 'both') {
          <div class="w-px bg-border shrink-0"></div>
        }
        @if (mode() !== 'visual') {
          <div [class]="jsonPaneClasses()">
            <lib-jsonjoy-schema-json-editor
              [(value)]="value"
              [readOnly]="readOnly()"
              [autoFocus]="autoFocus()"
              [locale]="locale()"
              [messages]="messages()"
            />
          </div>
        }
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
  readonly mode = model<SchemaBuilderMode>('both');

  private readonly translations = inject(JsonjoyTranslationService);
  protected readonly t = this.translations.withOverrides(
    this.locale,
    this.messages,
  );

  protected readonly rootClasses = computed(() =>
    cn('json-editor-container w-full jsonjoy flex flex-col', this.className()),
  );

  protected readonly visualPaneClasses = computed(() =>
    this.mode() === 'both' ? 'w-1/2 h-full min-h-0' : 'w-full h-full min-h-0',
  );

  protected readonly jsonPaneClasses = computed(() =>
    this.mode() === 'both' ? 'w-1/2 h-full min-h-0' : 'w-full h-full min-h-0',
  );

  protected toggleButtonClasses(active: boolean): string {
    return cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium transition-all',
      active && 'bg-background text-foreground shadow-xs',
    );
  }

  private seededDefault = false;

  constructor() {
    // Seed `defaultValue` once, on first run, and only if the consumer hasn't
    // bound a value — so it never clobbers a real binding.
    effect(() => {
      const initial = this.defaultValue();
      if (this.seededDefault || !initial) return;
      untracked(() => {
        this.seededDefault = true;
        if (this.isUnseededDefault(this.value())) {
          this.value.set(initial);
        }
      });
    });
  }

  private isUnseededDefault(current: JsonSchema): boolean {
    return (
      typeof current === 'object' &&
      current !== null &&
      !Array.isArray(current) &&
      Object.keys(current).length === 1 &&
      (current as { type?: unknown }).type === 'object'
    );
  }
}
