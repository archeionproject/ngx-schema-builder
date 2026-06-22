# @archeion/ngx-schema-builder

[![npm](https://img.shields.io/npm/v/@archeion/ngx-schema-builder.svg)](https://www.npmjs.com/package/@archeion/ngx-schema-builder)
[![license](https://img.shields.io/npm/l/@archeion/ngx-schema-builder.svg)](./LICENSE)
[![live demo](https://img.shields.io/badge/demo-live-2ea44f)](https://archeionproject.github.io/ngx-schema-builder/)

> Build **JSON Schema** (draft-07) visually in Angular — through a live tree editor, a JSON source
> view, or both side by side.

`<lib-jsonjoy-schema-builder>` turns schema authoring into a point-and-click experience, so your
users never have to hand-write nested JSON Schema. It handles primitives, objects, arrays,
combinators (`anyOf` / `oneOf` / `allOf`) and `$ref` references out of the box, and adds optional
dialogs to **infer** a schema from a sample document or **validate** JSON against the current schema.

## Contents

- [Features](#features)
- [Install](#install)
- [Quick start](#quick-start)
- [Styles and theming](#styles-and-theming)
- [API reference](#api-reference)
- [Inferring and validating](#inferring-and-validating)
- [$ref suggestions](#ref-suggestions)
- [Localization](#localization)
- [Acknowledgements](#acknowledgements)
- [License](#license)

## Features

- 🌳 **Three synced views** — visual tree, raw JSON, or both at once (`mode` ∈ `visual | json | both`).
- 🧩 **Every JSON Schema type** — strings, numbers, integers, booleans, objects and arrays, with
  full constraint support (`min`/`max`, `pattern`, `format`, `enum`, `uniqueItems`, …).
- 🔀 **Combinators & references** — compose with `anyOf` / `oneOf` / `allOf` and reuse shared
  definitions through `$ref`.
- 🪄 **Infer from JSON** — paste a sample document and generate a draft-07 schema to refine.
- ✅ **Runtime validation** — validate JSON against the current schema with AJV and inline,
  line-mapped error reporting.
- 🌗 **Light & dark themes** — token-based, retheme with a handful of CSS variables.
- 🌍 **Localizable** — `en` and `it` shipped; bring your own messages.
- 🅰️ **Built for Angular 21** — standalone, signal-based, `OnPush`, tree-shakeable. No `NgModule`.

## Install

```bash
npm install @archeion/ngx-schema-builder
```

**Peer dependencies:** `@angular/common`, `@angular/core` (^21.2.0). The embedded code editor
(CodeMirror) and the validator (AJV) ship bundled — no extra peer dependency or web-worker setup.

## Quick start

**1. Register the provider** (the analog of React's `<SchemaBuilderProvider>`):

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideSchemaBuilder, en } from '@archeion/ngx-schema-builder';

bootstrapApplication(AppComponent, {
  providers: [provideSchemaBuilder({ locale: en })],
});
```

**2. Add the stylesheet** to your app's global styles (e.g. in `angular.json`):

```jsonc
"styles": [
  "node_modules/@archeion/ngx-schema-builder/assets/styles/jsonjoy.css",
  "src/styles.css" // your app styles, after jsonjoy.css
]
```

**3. Drop the component in a template** (`value` is a two-way binding):

```ts
import { Component, signal } from '@angular/core';
import { SchemaBuilderComponent, type JsonSchema } from '@archeion/ngx-schema-builder';

@Component({
  selector: 'app-root',
  imports: [SchemaBuilderComponent],
  template: `<lib-jsonjoy-schema-builder [(value)]="schema" mode="both" />`,
})
export class AppComponent {
  readonly schema = signal<JsonSchema>({
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
  });
}
```

That's it — edits flow back into your `schema` signal as immutable copies.

## Styles and theming

The library ships a **precompiled, scoped** stylesheet — not raw Tailwind. Every rule is scoped
under the `.jsonjoy` class that each component applies automatically, and Tailwind's preflight is
omitted, so the editor's styles can't collide with your app's. **Load order doesn't matter.** (The
few unavoidable global at-rules, like `@keyframes`, are namespaced to stay clash-free.)

### Theming

The base palette is light/dark and works with no configuration. The **only** override surface is
the `--jsonjoy-*` token list — set any of them on `.jsonjoy` or an ancestor to retheme the editor
(your app's own `--color-*` are intentionally not read):

```css
.jsonjoy {
  --jsonjoy-color-primary: #2563eb;
  --jsonjoy-color-border: #e5e7eb;
  --jsonjoy-radius-md: 0.5rem;
}
```

**Dark mode:** add the `dark` class to the editor or any ancestor (e.g. `<html class="dark">`) and
the editor switches to its dark palette automatically.

## API reference

### `<lib-jsonjoy-schema-builder>`

The entry component. State is signal-based — use `[(value)]` for two-way binding.

| Input          | Type                            | Default      | Description                                              |
| -------------- | ------------------------------- | ------------ | -------------------------------------------------------- |
| `value`        | `JsonSchema` (model)            | `{ type: 'object' }` | The edited schema. Two-way bindable.             |
| `mode`         | `'visual' \| 'json' \| 'both'` (model) | `'both'` | Active editing view. Two-way bindable.             |
| `defaultValue` | `JsonSchema \| undefined`       | `undefined`  | Initial schema used when `value` is not provided.        |
| `readOnly`     | `boolean`                       | `false`      | Render the editor in read-only mode.                     |
| `autoFocus`    | `boolean`                       | `true`       | Focus the first editable field on mount.                 |
| `className`    | `string \| undefined`           | `undefined`  | Extra classes merged onto the host (via `cn()`).         |
| `locale`       | `Translation \| undefined`      | `undefined`  | Per-instance locale override (see [Localization](#localization)). |
| `messages`     | `Partial<Translation> \| undefined` | `undefined` | Per-instance message overrides.                      |

### Public exports

Consumers may import only what `public-api.ts` re-exports. The most useful surface:

```ts
import {
  // Components
  SchemaBuilderComponent,
  SchemaFieldsEditorComponent, // visual tree only
  SchemaJsonEditorComponent, // JSON source only
  InferSchemaDialogComponent,
  ValidateJsonDialogComponent,

  // Providers & config
  provideSchemaBuilder,
  provideSchemaBuilderRefSuggestions,

  // Types
  type JsonSchema,
  type SchemaBuilderMode,
  type RefSuggestion,
  type Translation,

  // Pure helpers
  inferSchema,
  createSchemaFromJson,
  validateJson,
  isObjectSchema,
  getEditorType,

  // Locales
  en,
  it,
} from '@archeion/ngx-schema-builder';
```

## Inferring and validating

Two optional, standalone dialogs cover the common "round-trip" workflows.

**Infer a schema from a sample document:**

```html
<lib-jsonjoy-infer-schema-dialog
  [(open)]="inferOpen"
  (inferred)="schema.set($event)"
/>
```

| Member     | Type                  | Description                                  |
| ---------- | --------------------- | -------------------------------------------- |
| `open`     | `boolean` (model)     | Dialog visibility. Two-way bindable.         |
| `inferred` | `output<JsonSchema>`  | Emits the inferred schema on submit.         |

**Validate a JSON document against the current schema** (AJV, lazy-loaded):

```html
<lib-jsonjoy-validate-json-dialog [(open)]="validateOpen" [schema]="schema()" />
```

| Member   | Type                  | Description                          |
| -------- | --------------------- | ------------------------------------ |
| `open`   | `boolean` (model)     | Dialog visibility. Two-way bindable. |
| `schema` | `JsonSchema` (required) | Schema to validate documents against. |

Both also expose `inferSchema` / `validateJson` as pure functions if you'd rather drive them
yourself.

## $ref suggestions

Register a suggestion source (e.g. a list of available schemas from your backend). The factory
runs **inside the injection context**, so it may `inject()` host services:

```ts
import { provideSchemaBuilderRefSuggestions } from '@archeion/ngx-schema-builder';

providers: [
  provideSchemaBuilderRefSuggestions(() => inject(MyBlueprintsService).refSuggestions),
];
```

The reference editor then offers those entries as a clickable list when the user selects the
`$ref` field type.

## Localization

Localization layers in three steps: an `en` baseline ← a provider `locale` ← provider `messages`,
then optional per-component overrides. Pass a built-in locale, or your own partial messages:

```ts
import { provideSchemaBuilder, it } from '@archeion/ngx-schema-builder';

providers: [
  provideSchemaBuilder({
    locale: it,
    messages: { addField: 'Aggiungi campo' }, // override individual keys
  }),
];
```

`en` and `it` are shipped. To add a locale, implement the `Translation` interface (use `en` as the
canonical key list) and pass it as `locale`.

## Acknowledgements

This library is an Angular port of **[jsonjoy-builder](https://github.com/lovasoa/jsonjoy-builder)**
by [Ophir LOJKINE](https://github.com/lovasoa). The visual editor's concept, component shape,
theming approach and most of the JSON-Schema editor semantics come directly from that React
project — without it, this Angular port would not exist. The original work is MIT-licensed; the
same notice is preserved in [`LICENSE`](./LICENSE) alongside our derivative copyright.

## License

[MIT](./LICENSE) © Archeion
