# @archeion/ngx-schema-builder

[![CI](https://github.com/archeionproject/ngx-schema-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/archeionproject/ngx-schema-builder/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@archeion/ngx-schema-builder.svg)](https://www.npmjs.com/package/@archeion/ngx-schema-builder)
[![license](https://img.shields.io/npm/l/@archeion/ngx-schema-builder.svg)](./LICENSE)
[![live demo](https://img.shields.io/badge/demo-live-2ea44f)](https://archeionproject.github.io/ngx-schema-builder/)

Visual JSON Schema editor for Angular. Lets users author and edit JSON Schema definitions through a tabbed interface — a **Visual Editor**, a **JSON** source view, or **both** side by side (`mode` ∈ `visual | json | both`) — with first-class support for primitives, objects, arrays, combinators (`anyOf` / `oneOf` / `allOf`) and `$ref` references.

## Install

```bash
npm install @archeion/ngx-schema-builder
```

Peer dependencies: `@angular/common`, `@angular/core` (^21.2.0). The embedded code editor (CodeMirror) and the validator (AJV) ship bundled — no extra peer dependency or web-worker setup.

## Styles

Add the standalone stylesheet to your app's global styles once (e.g. in `angular.json`):

```jsonc
"styles": [
  "node_modules/@archeion/ngx-schema-builder/assets/styles/jsonjoy.css",
  "src/styles.css" // your app styles, after jsonjoy.css
]
```

The stylesheet is a sandbox: every **style rule** — utilities and tokens — is scoped under the `.jsonjoy` class that each component applies automatically, and it omits Tailwind's preflight, so its utility classes (`.flex`, `.bg-primary`, …) cannot collide with your own styles. Load order does not matter.

A few constructs are necessarily global, because the CSS spec forbids nesting them under a selector: the `@property --tw-*` registrations Tailwind emits and the `@keyframes` definitions. These do **not** add selectors to your `:root` and are namespaced (`--tw-*`, `jsonjoy-*`) to avoid clashing with your own. So while no _style rule_ leaks, those at-rules do live at the top level by design.

### Theming

The base palette is light/dark and works with no configuration. The **only** override surface is the `--jsonjoy-*` token list — set any of them on `.jsonjoy` or an ancestor to retheme the editor (your app's own `--color-*` are intentionally not read):

```css
.jsonjoy {
  --jsonjoy-color-primary: #2563eb;
  --jsonjoy-color-border: #e5e7eb;
  --jsonjoy-radius-md: 0.5rem;
}
```

**Dark mode**: add the `dark` class to the editor or any ancestor (e.g. `<html class="dark">`); the editor switches to its dark palette automatically.

## Usage

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideSchemaBuilder, en } from '@archeion/ngx-schema-builder';

bootstrapApplication(AppComponent, {
  providers: [provideSchemaBuilder({ locale: en })],
});
```

In a component template (`value` is a two-way binding):

```html
<lib-jsonjoy-schema-builder [(value)]="schema" />
```

### `$ref` suggestions

Register a suggestion source (e.g. a list of available schemas from your backend):

```ts
import { provideSchemaBuilderRefSuggestions } from '@archeion/ngx-schema-builder';

providers: [
  provideSchemaBuilderRefSuggestions(() =>
    inject(MyBlueprintsService).refSuggestions,
  ),
],
```

The reference editor then offers those entries as a clickable list when the user selects the `$ref` field type.

## Acknowledgements

This library is an Angular port of **[jsonjoy-builder](https://github.com/lovasoa/jsonjoy-builder)** by [Ophir LOJKINE](https://github.com/lovasoa). The visual editor's concept, component shape, theming approach and most of the JSON-Schema editor semantics come directly from that React project — without it, this Angular port would not exist. The original work is MIT-licensed; the same notice is preserved in [`LICENSE`](./LICENSE) alongside our derivative copyright.

## License

MIT — see [LICENSE](./LICENSE).
