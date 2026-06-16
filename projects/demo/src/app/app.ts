import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  InferSchemaDialogComponent,
  type JsonSchema,
  SchemaBuilderComponent,
  ValidateJsonDialogComponent,
} from '@archeion/ngx-schema-builder';

const INITIAL_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'Display name shown in lists',
      minLength: 1,
      maxLength: 80,
    },
    email: {
      type: 'string',
      format: 'email',
    },
    status: {
      type: 'string',
      enum: ['draft', 'published', 'archived'],
    },
    rating: {
      type: 'number',
      description: 'Score between 0.0 and 5.0',
      minimum: 0,
      maximum: 5,
      multipleOf: 0.5,
    },
    yearsExperience: {
      type: 'integer',
      minimum: 0,
      maximum: 99,
    },
    isPublished: {
      type: 'boolean',
      description: 'Whether the record is visible to viewers',
    },
    author: {
      type: 'object',
      description: 'Author information',
      properties: {
        name: { type: 'string', minLength: 1 },
        verified: { type: 'boolean' },
      },
      required: ['name'],
    },
    tags: {
      type: 'array',
      description: 'Short labels attached to this record',
      items: { type: 'string', minLength: 1 },
      minItems: 0,
      maxItems: 10,
      uniqueItems: true,
    },
    identifier: {
      description: 'Either a numeric ID or a UUID string',
      anyOf: [
        { type: 'integer', minimum: 1 },
        { type: 'string', format: 'uuid' },
      ],
    },
  },
  required: ['title'],
};

@Component({
  selector: 'demo-root',
  standalone: true,
  imports: [
    SchemaBuilderComponent,
    InferSchemaDialogComponent,
    ValidateJsonDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="max-w-6xl mx-auto p-6 space-y-6">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold">ngx-schema-builder demo</h1>
        <p class="text-sm text-muted-foreground">
          Edit any property type (string, number, boolean, object, array,
          anyOf/oneOf/allOf), toggle Visual/JSON/Both panes, infer a schema from
          JSON, or validate a JSON document against the current schema.
        </p>
      </header>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm shadow-sm hover:bg-secondary transition-colors"
          (click)="inferOpen.set(true)"
        >
          Infer schema from JSON
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm shadow-sm hover:bg-secondary transition-colors"
          (click)="validateOpen.set(true)"
        >
          Validate JSON against schema
        </button>
      </div>

      <section class="rounded-lg border bg-card shadow-sm">
        <lib-jsonjoy-schema-builder [(value)]="schema" />
      </section>

      <section class="space-y-2">
        <h2
          class="text-sm font-medium text-muted-foreground uppercase tracking-wide"
        >
          Live schema
        </h2>
        <pre
          class="rounded-md border bg-muted/40 p-4 text-xs overflow-x-auto"
        ><code>{{ schemaJson() }}</code></pre>
      </section>

      <lib-jsonjoy-infer-schema-dialog
        [(open)]="inferOpen"
        (inferred)="onInferred($event)"
      />
      <lib-jsonjoy-validate-json-dialog
        [(open)]="validateOpen"
        [schema]="schema()"
      />
    </main>
  `,
})
export class AppComponent {
  protected readonly schema = signal<JsonSchema>(INITIAL_SCHEMA);
  protected readonly schemaJson = computed(() =>
    JSON.stringify(this.schema(), null, 2),
  );

  protected readonly inferOpen = signal(false);
  protected readonly validateOpen = signal(false);

  protected onInferred(inferred: JsonSchema): void {
    this.schema.set(inferred);
  }
}
