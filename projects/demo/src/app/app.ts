import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { SchemaBuilderComponent, type JsonSchema } from 'ngx-jsonjoy-builder';

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
  imports: [SchemaBuilderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="max-w-5xl mx-auto p-6 space-y-6">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold">ngx-jsonjoy-builder demo</h1>
        <p class="text-sm text-muted-foreground">
          Edit any property type (string, number, boolean, object, array, anyOf/oneOf/allOf) and watch the JSON Schema update live.
        </p>
      </header>

      <section class="rounded-lg border bg-card shadow-sm">
        <lib-jsonjoy-schema-builder [(value)]="schema" />
      </section>

      <section class="space-y-2">
        <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wide">Live schema</h2>
        <pre class="rounded-md border bg-muted/40 p-4 text-xs overflow-x-auto"><code>{{ schemaJson() }}</code></pre>
      </section>
    </main>
  `,
})
export class AppComponent {
  protected readonly schema = signal<JsonSchema>(INITIAL_SCHEMA);
  protected readonly schemaJson = computed(() => JSON.stringify(this.schema(), null, 2));
}
