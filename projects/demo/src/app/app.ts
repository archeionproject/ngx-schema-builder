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

const NPM_PACKAGE = '@archeion/ngx-schema-builder';
const NPM_INSTALL = `npm install ${NPM_PACKAGE}`;
const GITHUB_URL = 'https://github.com/archeionproject/ngx-schema-builder';
const NPM_URL = `https://www.npmjs.com/package/${NPM_PACKAGE}`;
const JSONJOY_URL = 'https://github.com/lovasoa/jsonjoy-builder';

interface Feature {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

const FEATURES: readonly Feature[] = [
  {
    title: 'Three synced views',
    description:
      'Author in a visual tree, hand-edit RAW JSON, or watch a live Preview — every pane stays in sync.',
    icon: 'M3 5h18M3 12h18M3 19h18',
  },
  {
    title: 'Every JSON Schema type',
    description:
      'Strings, numbers, booleans, objects and arrays with full constraint support (min/max, formats, enums).',
    icon: 'M4 7V4h16v3M9 20h6M12 4v16',
  },
  {
    title: 'Combinators & $ref',
    description:
      'Compose schemas with anyOf / oneOf / allOf and reference shared definitions through $ref.',
    icon: 'M6 3v12a3 3 0 0 0 3 3h6M6 9h6a3 3 0 0 1 3 3v6',
  },
  {
    title: 'Infer from JSON',
    description:
      'Paste a sample JSON document and generate a draft-07 schema you can refine in place.',
    icon: 'M12 3v12m0 0 4-4m-4 4-4-4M5 21h14',
  },
  {
    title: 'Runtime validation',
    description:
      'Validate any JSON document against the current schema with AJV and clear, inline error reporting.',
    icon: 'm9 12 2 2 4-4M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z',
  },
  {
    title: 'Built for Angular 21',
    description:
      'Standalone, signal-based, OnPush, tree-shakeable. Drop it into any consumer app by package name.',
    icon: 'M12 2 3 6l1.5 12L12 22l7.5-4L21 6 12 2Z',
  },
];

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
  host: {
    '[class.dark]': 'isDark()',
    class: 'block min-h-screen',
  },
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent"
    ></div>

    <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <nav class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2 font-semibold">
          <span
            class="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="size-4"
            >
              <path
                d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"
              />
              <path
                d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1"
              />
            </svg>
          </span>
          <span class="hidden sm:inline">ngx-schema-builder</span>
        </div>
        <div class="flex items-center gap-1.5">
          <a
            [href]="githubUrl"
            target="_blank"
            rel="noreferrer"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" class="size-4">
              <path
                d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.05 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.92-2.34 4.79-4.57 5.04.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.59.69.49A10.04 10.04 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z"
              />
            </svg>
            <span class="hidden sm:inline">GitHub</span>
          </a>
          <button
            type="button"
            (click)="isDark.set(!isDark())"
            [attr.aria-label]="
              isDark() ? 'Switch to light theme' : 'Switch to dark theme'
            "
            class="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            @if (isDark()) {
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="size-4"
              >
                <circle cx="12" cy="12" r="4" />
                <path
                  d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"
                />
              </svg>
            } @else {
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="size-4"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            }
          </button>
        </div>
      </nav>

      <header class="mx-auto max-w-3xl py-12 text-center sm:py-16">
        <span
          class="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
        >
          <span class="size-1.5 rounded-full bg-primary"></span>
          Angular 21 · JSON Schema draft-07
        </span>
        <h1 class="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
          Visual JSON Schema editing for Angular
        </h1>
        <p
          class="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg"
        >
          A signal-based, standalone editor that lets your users author and
          refine JSON Schema through a tree view, raw JSON, or a live preview —
          no handwritten schema required.
        </p>

        <div
          class="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <a
            href="#demo"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            Try the live demo
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="size-4"
            >
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </a>
          <button
            type="button"
            (click)="copyInstall()"
            class="group inline-flex h-11 items-center gap-3 rounded-md border bg-card px-4 font-mono text-sm shadow-sm transition-colors hover:bg-secondary"
          >
            <span class="select-none text-muted-foreground">$</span>
            <span>{{ npmInstall }}</span>
            <span class="text-muted-foreground">
              @if (copied()) {
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="size-4 text-primary"
                >
                  <path d="m20 6-11 11-5-5" />
                </svg>
              } @else {
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="size-4"
                >
                  <rect width="13" height="13" x="9" y="9" rx="2" />
                  <path
                    d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                  />
                </svg>
              }
            </span>
          </button>
        </div>

        <div
          class="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs"
        >
          <a
            [href]="npmUrl"
            target="_blank"
            rel="noreferrer"
            class="rounded-full border bg-card px-3 py-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            npm
          </a>
          <span
            class="rounded-full border bg-card px-3 py-1 font-medium text-muted-foreground"
          >
            MIT License
          </span>
          <a
            [href]="jsonjoyUrl"
            target="_blank"
            rel="noreferrer"
            class="rounded-full border bg-card px-3 py-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Port of jsonjoy-builder
          </a>
        </div>
      </header>

      <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (feature of features; track feature.title) {
          <div
            class="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <span
              class="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="size-5"
              >
                <path [attr.d]="feature.icon" />
              </svg>
            </span>
            <h3 class="mt-4 font-semibold">{{ feature.title }}</h3>
            <p class="mt-1.5 text-sm text-muted-foreground">
              {{ feature.description }}
            </p>
          </div>
        }
      </section>

      <section id="demo" class="mt-14 scroll-mt-6">
        <div class="mb-4">
          <h2 class="text-2xl font-bold tracking-tight">Live editor</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            Edit the schema below. Switch panes, infer from a sample, or
            validate a document — the preview updates in real time.
          </p>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-secondary"
              (click)="inferOpen.set(true)"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="size-4"
              >
                <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
              </svg>
              Infer from JSON
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-secondary"
              (click)="validateOpen.set(true)"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="size-4"
              >
                <path
                  d="m9 12 2 2 4-4M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z"
                />
              </svg>
              Validate JSON
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <div class="overflow-hidden rounded-xl border bg-card shadow-sm">
            <lib-jsonjoy-schema-builder [(value)]="schema" />
          </div>

          <div class="flex flex-col rounded-xl border bg-card shadow-sm">
            <div class="flex items-center justify-between border-b px-4 py-2.5">
              <h3
                class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Live schema
              </h3>
              <button
                type="button"
                (click)="copySchema()"
                class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                @if (schemaCopied()) {
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="size-3.5 text-primary"
                  >
                    <path d="m20 6-11 11-5-5" />
                  </svg>
                  Copied
                } @else {
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="size-3.5"
                  >
                    <rect width="13" height="13" x="9" y="9" rx="2" />
                    <path
                      d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                    />
                  </svg>
                  Copy
                }
              </button>
            </div>
            <pre
              class="max-h-[480px] flex-1 overflow-auto p-4 text-xs leading-relaxed"
            ><code>{{ schemaJson() }}</code></pre>
          </div>
        </div>
      </section>

      <footer
        class="mt-16 border-t pt-8 text-center text-sm text-muted-foreground"
      >
        <p>
          <span class="font-medium text-foreground">{{ npmPackage }}</span>
          — released under the MIT License.
        </p>
        <p class="mt-1">
          An Angular port of
          <a
            [href]="jsonjoyUrl"
            target="_blank"
            rel="noreferrer"
            class="font-medium text-foreground underline-offset-4 hover:underline"
            >jsonjoy-builder</a
          >
          by Ophir LOJKINE.
        </p>
        <p class="mt-3">
          <a
            [href]="githubUrl"
            target="_blank"
            rel="noreferrer"
            class="underline-offset-4 hover:text-foreground hover:underline"
            >GitHub</a
          >
          ·
          <a
            [href]="npmUrl"
            target="_blank"
            rel="noreferrer"
            class="underline-offset-4 hover:text-foreground hover:underline"
            >npm</a
          >
        </p>
      </footer>
    </main>

    <lib-jsonjoy-infer-schema-dialog
      [(open)]="inferOpen"
      (inferred)="onInferred($event)"
    />
    <lib-jsonjoy-validate-json-dialog
      [(open)]="validateOpen"
      [schema]="schema()"
    />
  `,
})
export class AppComponent {
  protected readonly features = FEATURES;
  protected readonly npmPackage = NPM_PACKAGE;
  protected readonly npmInstall = NPM_INSTALL;
  protected readonly githubUrl = GITHUB_URL;
  protected readonly npmUrl = NPM_URL;
  protected readonly jsonjoyUrl = JSONJOY_URL;

  protected readonly schema = signal<JsonSchema>(INITIAL_SCHEMA);
  protected readonly schemaJson = computed(() =>
    JSON.stringify(this.schema(), null, 2),
  );

  protected readonly inferOpen = signal(false);
  protected readonly validateOpen = signal(false);
  protected readonly isDark = signal(false);
  protected readonly copied = signal(false);
  protected readonly schemaCopied = signal(false);

  protected onInferred(inferred: JsonSchema): void {
    this.schema.set(inferred);
  }

  protected copyInstall(): void {
    void this.copy(this.npmInstall, this.copied);
  }

  protected copySchema(): void {
    void this.copy(this.schemaJson(), this.schemaCopied);
  }

  private async copy(
    text: string,
    flag: { set: (v: boolean) => void },
  ): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      flag.set(true);
      setTimeout(() => flag.set(false), 1500);
    } catch {
      flag.set(false);
    }
  }
}
