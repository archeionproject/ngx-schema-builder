# @archeion/ngx-schema-builder

Visual JSON Schema editor for Angular. Lets users author and edit JSON Schema definitions through a tabbed interface (RAW JSON / Visual Editor / Preview) with first-class support for primitives, objects, arrays, combinators (`anyOf` / `oneOf` / `allOf`) and `$ref` references.

## Install

```bash
npm install @archeion/ngx-schema-builder
```

Peer dependencies: `@angular/cdk`, `@angular/common`, `@angular/core` (^21.2.0), `monaco-editor` (>=0.50.0 <1).

## Usage

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideSchemaBuilder, en } from '@archeion/ngx-schema-builder';

bootstrapApplication(AppComponent, {
  providers: [provideSchemaBuilder({ locale: en })],
});
```

In a component template:

```html
<lib-jsonjoy-schema-builder
  [schema]="schema"
  (schemaChange)="onSchemaChange($event)"
/>
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
