import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
} from '@angular/core';

import type { Translation } from '../../i18n/translation-keys';
import { cn } from '../../internal/cn';
import { JsonjoyTranslationContextService } from '../../services/translation-context.service';
import type { SchemaEditorType } from '../../types/json-schema';

interface TypeOption {
  readonly id: SchemaEditorType;
  readonly label: keyof Translation;
  readonly description: keyof Translation;
  readonly group: 'basic' | 'composition';
}

const TYPE_OPTIONS: readonly TypeOption[] = [
  {
    id: 'string',
    label: 'fieldTypeTextLabel',
    description: 'fieldTypeTextDescription',
    group: 'basic',
  },
  {
    id: 'number',
    label: 'fieldTypeNumberLabel',
    description: 'fieldTypeNumberDescription',
    group: 'basic',
  },
  {
    id: 'boolean',
    label: 'fieldTypeBooleanLabel',
    description: 'fieldTypeBooleanDescription',
    group: 'basic',
  },
  {
    id: 'object',
    label: 'fieldTypeObjectLabel',
    description: 'fieldTypeObjectDescription',
    group: 'basic',
  },
  {
    id: 'array',
    label: 'fieldTypeArrayLabel',
    description: 'fieldTypeArrayDescription',
    group: 'basic',
  },
  {
    id: 'anyOf',
    label: 'schemaTypeAnyOf',
    description: 'anyOfDescription',
    group: 'composition',
  },
  {
    id: 'oneOf',
    label: 'schemaTypeOneOf',
    description: 'oneOfDescription',
    group: 'composition',
  },
  {
    id: 'allOf',
    label: 'schemaTypeAllOf',
    description: 'allOfDescription',
    group: 'composition',
  },
  {
    id: '$ref',
    label: 'schemaTypeRef',
    description: 'fieldTypeRefDescription',
    group: 'composition',
  },
];

@Component({
  selector: 'lib-jsonjoy-schema-type-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
  template: `
    <div
      [id]="inputId()"
      class="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-2"
    >
      @for (type of typeOptions; track type.id) {
        <button
          type="button"
          [title]="t()[type.description]"
          [class]="tileClasses(type)"
          (click)="value.set(type.id)"
        >
          <div class="font-medium text-sm">{{ t()[type.label] }}</div>
          <div class="text-xs text-muted-foreground line-clamp-1">
            {{ t()[type.description] }}
          </div>
        </button>
      }
    </div>
  `,
})
export class SchemaTypeSelectorComponent {
  readonly inputId = input<string | undefined>(undefined);
  readonly value = model.required<SchemaEditorType>();

  protected readonly typeOptions = TYPE_OPTIONS;
  protected readonly t = inject(JsonjoyTranslationContextService).translation;

  protected tileClasses(type: TypeOption): string {
    const selected = this.value() === type.id;
    return cn(
      'p-2.5 rounded-lg border-2 text-left transition-all duration-200',
      selected
        ? 'border-primary bg-primary/5 shadow-xs'
        : type.group === 'composition'
          ? 'border-dashed border-border hover:border-primary/40 hover:bg-secondary'
          : 'border-border hover:border-primary/30 hover:bg-secondary',
    );
  }
}
