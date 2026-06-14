import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  output,
} from '@angular/core';

import { JsonjoyTranslationService } from '../../services/translation.service';
import {
  type JsonSchema,
  type ObjectJsonSchema,
  asObjectSchema,
} from '../../types/json-schema';
import { SchemaPropertyEditorComponent } from './schema-property-editor.component';

interface DefinitionRow {
  readonly name: string;
  readonly schema: JsonSchema;
}

@Component({
  selector: 'lib-jsonjoy-definitions-editor',
  standalone: true,
  imports: [forwardRef(() => SchemaPropertyEditorComponent)],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy block grow min-h-0' },
  template: `
    <div class="flex flex-col h-full">
      @if (!readOnly()) {
        <div class="mb-4 shrink-0 flex items-center justify-between gap-2">
          <span class="text-xs text-muted-foreground">
            {{ activeKey() }}
          </span>
          <button
            type="button"
            class="text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            (click)="addDefinition()"
          >
            + {{ t().definitionsAddButton }}
          </button>
        </div>
      }

      @if (rows().length === 0) {
        <div class="text-center py-10 text-muted-foreground">
          <p class="text-sm">{{ t().definitionsEmpty }}</p>
        </div>
      } @else {
        <div class="grow overflow-auto">
          @for (row of rows(); track row.name) {
            <lib-jsonjoy-schema-property-editor
              mode="definition"
              [name]="row.name"
              [schema]="row.schema"
              [readOnly]="readOnly()"
              [depth]="0"
              (nameChange)="renameDefinition(row.name, $event)"
              (schemaChange)="updateDefinition(row.name, $event)"
              (delete)="deleteDefinition(row.name)"
            />
          }
        </div>
      }
    </div>
  `,
})
export class DefinitionsEditorComponent {
  readonly schema = input.required<JsonSchema>();
  readonly readOnly = input.required<boolean>();

  readonly schemaChange = output<ObjectJsonSchema>();

  protected readonly t = inject(JsonjoyTranslationService).providerLocale;

  protected readonly activeKey = computed<'$defs' | 'definitions'>(() => {
    const s = asObjectSchema(this.schema());
    if (s.definitions && !s.$defs) return 'definitions';
    return '$defs';
  });

  protected readonly rows = computed<DefinitionRow[]>(() => {
    const s = asObjectSchema(this.schema());
    const source = s[this.activeKey()] ?? {};
    return Object.entries(source).map(([name, sub]) => ({ name, schema: sub }));
  });

  protected addDefinition(): void {
    const base = asObjectSchema(this.schema());
    const key = this.activeKey();
    const existing = base[key] ?? {};
    const baseName = 'NewDefinition';
    let candidate = baseName;
    let i = 1;
    while (candidate in existing) {
      i += 1;
      candidate = `${baseName}${i}`;
    }
    this.schemaChange.emit({
      ...base,
      [key]: { ...existing, [candidate]: { type: 'object' } },
    });
  }

  protected renameDefinition(currentName: string, newName: string): void {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === currentName) return;
    const base = asObjectSchema(this.schema());
    const key = this.activeKey();
    const existing = { ...(base[key] ?? {}) };
    if (trimmed in existing) return;
    const value = existing[currentName];
    delete existing[currentName];
    existing[trimmed] = value;
    this.schemaChange.emit({ ...base, [key]: existing });
  }

  protected updateDefinition(name: string, updated: ObjectJsonSchema): void {
    const base = asObjectSchema(this.schema());
    const key = this.activeKey();
    const existing = { ...(base[key] ?? {}) };
    existing[name] = updated;
    this.schemaChange.emit({ ...base, [key]: existing });
  }

  protected deleteDefinition(name: string): void {
    const base = asObjectSchema(this.schema());
    const key = this.activeKey();
    const existing = { ...(base[key] ?? {}) };
    delete existing[name];
    if (Object.keys(existing).length === 0) {
      const { [key]: _omit, ...rest } = base;
      this.schemaChange.emit(rest);
      return;
    }
    this.schemaChange.emit({ ...base, [key]: existing });
  }
}
