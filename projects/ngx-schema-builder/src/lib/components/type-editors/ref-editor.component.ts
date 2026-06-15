import {
  ChangeDetectionStrategy,
  Component,
  type Signal,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import type { RefSuggestion } from '../../interfaces/ref-suggestion.interface';
import type { LocalDefinition } from '../../internal/schema-editor';
import { LocalDefinitionsContextService } from '../../services/local-definitions.service';
import { JsonjoyTranslationService } from '../../services/translation.service';
import { SCHEMA_BUILDER_REF_SUGGESTIONS } from '../../tokens/ref-suggestions.token';
import {
  type JsonSchema,
  type ObjectJsonSchema,
  asRefSchema,
} from '../../types/json-schema';
import type { ValidationTreeNode } from '../../types/validation';
import { InputDirective } from '../ui/input.directive';
import { LabelDirective } from '../ui/label.directive';

let nextRefEditorId = 0;

@Component({
  selector: 'lib-jsonjoy-ref-editor',
  standalone: true,
  imports: [InputDirective, LabelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
  template: `
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div class="space-y-2 md:col-span-2">
          <label libJsonjoyLabel [attr.for]="urlId">
            {{ t().refUrlLabel }}
          </label>
          <input
            libJsonjoyInput
            [id]="urlId"
            type="url"
            [value]="urlValue()"
            [disabled]="readOnly()"
            [placeholder]="t().refUrlPlaceholder"
            (input)="onUrlInput($event)"
          />
        </div>

        <div class="space-y-2">
          <label libJsonjoyLabel [attr.for]="pointerId">
            {{ t().refPointerLabel }}
          </label>
          <input
            libJsonjoyInput
            [id]="pointerId"
            type="text"
            [value]="pointerValue()"
            [disabled]="readOnly()"
            [placeholder]="t().refPointerPlaceholder"
            (input)="onPointerInput($event)"
          />
        </div>
      </div>

      @if (!readOnly() && localDefinitions().length > 0) {
        <div class="space-y-2">
          <label libJsonjoyLabel>{{ t().refLocalDefinitionsLabel }}</label>
          <ul
            class="flex flex-col gap-1 max-h-48 overflow-y-auto rounded-md border border-border p-1"
          >
            @for (def of localDefinitions(); track def.ref) {
              <li>
                <button
                  type="button"
                  class="w-full text-left px-2 py-1.5 rounded-sm hover:bg-secondary/50 transition-colors"
                  (click)="pickLocalDefinition(def)"
                >
                  <span class="block text-sm font-medium">{{ def.name }}</span>
                  <span
                    class="block text-xs text-muted-foreground font-mono truncate"
                    >{{ def.ref }}</span
                  >
                </button>
              </li>
            }
          </ul>
        </div>
      }

      @if (!readOnly() && hasSuggestionsProvider) {
        <div class="space-y-2">
          <label libJsonjoyLabel>{{ t().refSuggestionsLabel }}</label>
          @if (filteredSuggestions().length === 0) {
            <p class="text-xs text-muted-foreground italic">
              {{ t().refNoSuggestions }}
            </p>
          } @else {
            <ul
              class="flex flex-col gap-1 max-h-48 overflow-y-auto rounded-md border border-border p-1"
            >
              @for (s of filteredSuggestions(); track s.id) {
                <li>
                  <button
                    type="button"
                    class="w-full text-left px-2 py-1.5 rounded-sm hover:bg-secondary/50 transition-colors"
                    (click)="pickSuggestion(s)"
                  >
                    <span class="block text-sm font-medium">{{ s.label }}</span>
                    @if (s.description) {
                      <span
                        class="block text-xs text-muted-foreground truncate"
                        >{{ s.description }}</span
                      >
                    }
                    <span
                      class="block text-xs text-muted-foreground font-mono truncate"
                      >{{ s.url }}</span
                    >
                  </button>
                </li>
              }
            </ul>
          }
        </div>
      }
    </div>
  `,
})
export class RefEditorComponent {
  readonly schema = input.required<JsonSchema>();
  readonly readOnly = input.required<boolean>();
  readonly validationNode = input<ValidationTreeNode | undefined>(undefined);
  readonly schemaKey = input<string | undefined>(undefined);
  readonly depth = input<number>(0);

  readonly schemaChange = output<ObjectJsonSchema>();

  protected readonly t = inject(JsonjoyTranslationService).providerLocale;

  private readonly injectedSuggestions = inject(
    SCHEMA_BUILDER_REF_SUGGESTIONS,
    {
      optional: true,
    },
  );
  private readonly suggestionsSignal: Signal<readonly RefSuggestion[]> =
    this.injectedSuggestions ?? computed(() => [] as readonly RefSuggestion[]);

  /** The host registered a suggestions provider; gates the suggestions list. */
  protected readonly hasSuggestionsProvider = this.injectedSuggestions !== null;

  private readonly localDefinitionsCtx = inject(
    LocalDefinitionsContextService,
    { optional: true },
  );
  protected readonly localDefinitions = computed<readonly LocalDefinition[]>(
    () => this.localDefinitionsCtx?.definitions() ?? [],
  );

  private readonly id = ++nextRefEditorId;
  protected readonly urlId = `jsonjoy-ref-url-${this.id}`;
  protected readonly pointerId = `jsonjoy-ref-pointer-${this.id}`;

  private readonly currentRef = computed(() => asRefSchema(this.schema()).$ref);
  protected readonly urlValue = computed(() => splitRef(this.currentRef()).url);
  protected readonly pointerValue = computed(
    () => splitRef(this.currentRef()).pointer,
  );

  private readonly urlOverride = signal<string | null>(null);
  private readonly pointerOverride = signal<string | null>(null);

  protected readonly filteredSuggestions = computed(() => {
    const all = this.suggestionsSignal();
    const query = (this.urlOverride() ?? this.urlValue()).toLowerCase().trim();
    if (!query) return all;
    return all.filter(
      (s) =>
        s.url.toLowerCase().includes(query) ||
        s.label.toLowerCase().includes(query),
    );
  });

  protected onUrlInput(event: Event): void {
    const newUrl = (event.target as HTMLInputElement).value;
    this.urlOverride.set(newUrl);
    this.emitRef(newUrl, this.pointerOverride() ?? this.pointerValue());
  }

  protected onPointerInput(event: Event): void {
    const newPointer = (event.target as HTMLInputElement).value;
    this.pointerOverride.set(newPointer);
    this.emitRef(this.urlOverride() ?? this.urlValue(), newPointer);
  }

  protected pickSuggestion(suggestion: RefSuggestion): void {
    this.urlOverride.set(suggestion.url);
    this.emitRef(suggestion.url, this.pointerOverride() ?? this.pointerValue());
  }

  protected pickLocalDefinition(def: LocalDefinition): void {
    // A local def ref is a pure fragment (no URL part), e.g. #/$defs/Address.
    this.urlOverride.set('');
    this.pointerOverride.set(def.ref.replace(/^#/, ''));
    this.schemaChange.emit({ $ref: def.ref });
  }

  private emitRef(url: string, pointer: string): void {
    const trimmedPointer = pointer.replace(/^#/, '');
    const fullRef = trimmedPointer ? `${url}#${trimmedPointer}` : url;
    this.schemaChange.emit({ $ref: fullRef });
  }
}

function splitRef(ref: string): { url: string; pointer: string } {
  const hashIndex = ref.indexOf('#');
  if (hashIndex < 0) return { url: ref, pointer: '' };
  return {
    url: ref.slice(0, hashIndex),
    pointer: ref.slice(hashIndex + 1),
  };
}
