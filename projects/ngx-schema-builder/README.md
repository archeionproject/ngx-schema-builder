# @archeion/ngx-schema-builder

Visual JSON Schema editor for Angular. Lets users author and edit JSON Schema
definitions through a tabbed interface (RAW JSON / Visual Editor / Preview) with
first-class support for primitives, objects, arrays, combinators
(`anyOf` / `oneOf` / `allOf`) and `$ref` references.

- **Zero editor setup** — the embedded code editor is [CodeMirror 6][cm], bundled
  as a regular dependency. No web-worker bootstrap, no `MonacoEnvironment`, no
  extra peer dependency to install.
- **Theme-neutral, self-contained CSS** — ship one compiled stylesheet; no
  Tailwind setup required in the host app.
- **Signal-based, standalone, zoneless-friendly** — modern Angular APIs
  throughout (`model()` / `input()` / `output()`, `@if` / `@for`).
- **i18n-ready** — `en` and `it` ship in the box; supply your own via providers.

## Install

```bash
npm install @archeion/ngx-schema-builder
```

Peer dependencies (provided by your app):

| Package           | Range      |
| ----------------- | ---------- |
| `@angular/core`   | `^21.2.0`  |
| `@angular/common` | `^21.2.0`  |
| `@angular/cdk`    | `^21.2.0`  |

CodeMirror and the validation engine (AJV) are bundled as regular dependencies —
nothing else to install.

## Styles

The package ships a single compiled, standalone stylesheet. Add it to your
app's global styles once. In `angular.json`:

```jsonc
"styles": [
  "src/styles.css",
  "node_modules/@archeion/ngx-schema-builder/assets/styles/jsonjoy.css"
]
```

The stylesheet omits Tailwind's preflight, so it will **not** reset your app.
Design tokens and form-control resets are scoped under the `.jsonjoy` class
(every component applies it to its host automatically), so the editor's theming
does not bleed into surrounding UI.

## Usage

Register the library once at bootstrap (optional — only needed to set a default
locale or messages):

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideSchemaBuilder, en } from '@archeion/ngx-schema-builder';

bootstrapApplication(AppComponent, {
  providers: [provideSchemaBuilder({ locale: en })],
});
```

Then use the editor in a component. `value` is a two-way binding:

```ts
import { Component, signal } from '@angular/core';
import {
  SchemaBuilderComponent,
  type JsonSchema,
} from '@archeion/ngx-schema-builder';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SchemaBuilderComponent],
  template: `<lib-jsonjoy-schema-builder [(value)]="schema" />`,
})
export class AppComponent {
  protected readonly schema = signal<JsonSchema>({ type: 'object' });
}
```

If you only need the one-way form:

```html
<lib-jsonjoy-schema-builder [value]="schema()" (valueChange)="onChange($event)" />
```

### Components

| Selector                          | Component                     | Purpose                                   |
| --------------------------------- | ----------------------------- | ----------------------------------------- |
| `lib-jsonjoy-schema-builder`      | `SchemaBuilderComponent`      | Full tabbed editor (visual + JSON + both) |
| `lib-jsonjoy-schema-fields-editor`| `SchemaFieldsEditorComponent` | Visual field editor only                  |
| `lib-jsonjoy-schema-json-editor`  | `SchemaJsonEditorComponent`   | Raw JSON source editor                    |
| `lib-jsonjoy-validate-json-dialog`| `ValidateJsonDialogComponent` | Validate a JSON document against a schema |
| `lib-jsonjoy-infer-schema-dialog` | `InferSchemaDialogComponent`  | Infer a schema from sample JSON           |

### Dialogs

Both dialogs use a two-way `open` model:

```html
<lib-jsonjoy-infer-schema-dialog
  [(open)]="inferOpen"
  (inferred)="schema.set($event)"
/>

<lib-jsonjoy-validate-json-dialog
  [(open)]="validateOpen"
  [schema]="schema()"
/>
```

### `$ref` suggestions

Register a suggestion source (e.g. a list of available schemas from your
backend). The factory runs inside Angular's injection context, so it can call
`inject()`:

```ts
import { inject } from '@angular/core';
import { provideSchemaBuilderRefSuggestions } from '@archeion/ngx-schema-builder';

providers: [
  provideSchemaBuilderRefSuggestions(() =>
    inject(MyBlueprintsService).refSuggestions,
  ),
];
```

The factory returns a `Signal<readonly RefSuggestion[]>`; the reference editor
then offers those entries as a clickable list when the user selects the `$ref`
field type.

## Localization

Translations are resolved by merging, in order:
`en` (baseline) → provider `locale` → provider `messages` → component `locale`
→ component `messages`. Missing keys always fall back to `en`.

```ts
import { provideSchemaBuilder, it } from '@archeion/ngx-schema-builder';

// App-wide default:
provideSchemaBuilder({ locale: it });
```

```html
<!-- Per-instance override: -->
<lib-jsonjoy-schema-builder
  [(value)]="schema"
  [locale]="it"
  [messages]="{ visualizerSource: 'Sorgente' }"
/>
```

Supply a fully custom locale by implementing the exported `Translation`
interface.

## Theming

All colors derive from CSS custom properties scoped to `.jsonjoy`. Override any
of them on an ancestor element to retheme an instance:

```css
.jsonjoy {
  --color-primary: hsl(220 90% 56%);
  --color-border: hsl(0 0% 80%);
}
```

A dark palette ships out of the box and activates when the editor sits inside a
`.dark` ancestor (or the host has `.jsonjoy.dark`).

## Acknowledgements

This library is an Angular port of **[jsonjoy-builder][jjb]** by
[Ophir LOJKINE][ophir]. The visual editor's concept, component shape, theming
approach and most of the JSON-Schema editor semantics come directly from that
React project — without it, this Angular port would not exist. The original work
is MIT-licensed; the same notice is preserved in [`LICENSE`](./LICENSE) alongside
our derivative copyright.

## License

MIT — see [LICENSE](./LICENSE).

[cm]: https://codemirror.net/
[jjb]: https://github.com/lovasoa/jsonjoy-builder
[ophir]: https://github.com/lovasoa
