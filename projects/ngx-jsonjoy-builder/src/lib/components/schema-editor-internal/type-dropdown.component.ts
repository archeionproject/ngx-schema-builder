import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

import { cn, getTypeColor, getTypeLabel } from '../../internal/cn';
import { JsonjoyTranslationService } from '../../services/translation.service';
import type { SchemaEditorType } from '../../types/json-schema';

const TYPE_OPTIONS: readonly SchemaEditorType[] = [
  'string',
  'number',
  'boolean',
  'object',
  'array',
  'null',
  'anyOf',
  'oneOf',
  'allOf',
] as const;

@Component({
  selector: 'lib-jsonjoy-type-dropdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'jsonjoy relative inline-block',
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <button
      type="button"
      [class]="triggerClasses()"
      (click)="toggle($event)"
    >
      <span>{{ getTypeLabel(t(), value()) }}</span>
      @if (!readOnly()) {
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="ml-1"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      }
    </button>

    @if (isOpen()) {
      <div
        class="absolute z-50 mt-1 w-[140px] rounded-md border bg-popover shadow-lg animate-in fade-in-50 zoom-in-95"
      >
        <div class="py-1">
          @for (type of typeOptions; track type) {
            <button
              type="button"
              [class]="itemClasses(type)"
              (click)="select(type, $event)"
            >
              <span [class]="'px-2 py-0.5 rounded ' + getTypeColor(type)">
                {{ getTypeLabel(t(), type) }}
              </span>
              @if (value() === type) {
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              }
            </button>
          }
        </div>
      </div>
    }
  `,
})
export class TypeDropdownComponent {
  readonly value = model.required<SchemaEditorType>();
  readonly readOnly = input.required<boolean>();
  readonly className = input<string | undefined>(undefined);

  protected readonly typeOptions = TYPE_OPTIONS;
  protected readonly getTypeColor = getTypeColor;
  protected readonly getTypeLabel = getTypeLabel;

  private readonly translations = inject(JsonjoyTranslationService);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly t = this.translations.providerLocale;
  protected readonly isOpen = signal(false);

  protected readonly triggerClasses = computed(() =>
    cn(
      'text-xs px-3.5 py-1.5 rounded-md font-medium text-center flex items-center justify-between',
      getTypeColor(this.value()),
      'hover:shadow-xs hover:ring-1 hover:ring-ring/30 active:scale-95 transition-all',
      this.readOnly() ? '' : 'w-[92px]',
      this.className(),
    ),
  );

  protected itemClasses(type: SchemaEditorType): string {
    return cn(
      'w-full text-left px-3 py-1.5 text-xs flex items-center justify-between',
      'hover:bg-muted/50 transition-colors',
      this.value() === type && 'font-medium',
    );
  }

  protected toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.readOnly()) return;
    this.isOpen.update((v) => !v);
  }

  protected select(type: SchemaEditorType, event: MouseEvent): void {
    event.stopPropagation();
    this.value.set(type);
    this.isOpen.set(false);
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.isOpen.set(false);
    }
  }
}
