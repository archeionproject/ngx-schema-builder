# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`@archeion/ngx-schema-builder` is a publishable Angular 21 library: a visual editor for
JSON Schema (draft-07). It is a hand port of the React project
[jsonjoy-builder](https://github.com/lovasoa/jsonjoy-builder) — component shapes, editor
semantics, and theming are deliberately kept parallel, so the React source is the tie-breaker
when a behavior is ambiguous. The React→Angular mapping (components→components, context
providers→DI providers) is the comment block at the top of
`projects/ngx-schema-builder/src/public-api.ts`.

## Workspace

Angular CLI multi-project workspace (`newProjectRoot: projects`):

- `projects/ngx-schema-builder` — the library (`projectType: library`, built with
  `@angular/build:ng-packagr`). Prefix `lib`, selectors `lib-jsonjoy-*`.
- `projects/demo` — consumer app for local dev/serve. Prefix `demo`.

The TS path alias `@archeion/ngx-schema-builder` resolves to
`projects/ngx-schema-builder/src/public-api.ts`, so the demo imports the library by package
name without a build step.

## Commands

```bash
npm start                 # serve demo (prestart compiles styles first)
npm run build             # build the library; prebuild compiles styles first
npm run build:styles      # Tailwind compile + scope-styles.mjs (see Styles below)
npm run watch             # rebuild library on change (development config)
npm test                  # unit tests — @angular/build:unit-test, vitest runner
npm run test:coverage     # library tests, no-watch, v8 coverage
npm run lint              # angular-eslint
npm run format            # prettier --write .
```

Run a single test by passing a vitest filter through `ng`:
`ng test -- -t "substring of test name"`. Specs are `src/**/*.spec.ts`; `tsconfig.spec.json`
enables `vitest/globals` and `node` types. There are ~18 spec files.

## Styles pipeline (read before touching CSS)

The library ships a **precompiled** stylesheet, not raw Tailwind. `build:styles` does two
steps: (1) `tailwindcss` compiles `styles/jsonjoy.source.css` → `assets/styles/jsonjoy.css`
(minified), then (2) `styles/scope-styles.mjs` rewrites every selector to be scoped under
`.jsonjoy` via `postcss-prefix-selector`. Only the compiled, scoped `assets/styles/jsonjoy.css`
is published (declared in `ng-package.json` assets).

Consequences:

- `build:styles` is the `prebuild`/`prestart` hook, so a normal `npm run build`/`npm start`
  recompiles it. If you edit `jsonjoy.source.css` and run something else, rerun `build:styles`
  or you ship stale CSS.
- Styling is **unlayered** and scoped under `.jsonjoy` rather than wrapped in a cascade layer —
  layered rules would lose to a host app's unlayered framework resets (e.g. Ionic), which left
  the editor unstyled. Design tokens live once in `@theme`. Every component host carries
  `class: 'jsonjoy …'`.

## Architecture

### Component conventions
Standalone components only, `ChangeDetectionStrategy.OnPush`, no `NgModule`. State is
**signals**: `input()`/`model()` for I/O, `computed()`/`effect()` for derived state — no
`@Input`/`@Output` decorators. `model()` carries two-way state such as the builder `mode` and
the edited schema. Class strings are merged with `cn()` (`internal/cn.ts` = clsx +
tailwind-merge).

### Schema model — `types/json-schema.ts`
`JsonSchema = boolean | <object schema>`. The boolean form (`true`/`false`) is a valid JSON
Schema, so **anything touching properties must first guard** with `isObjectSchema` /
`asObjectSchema` / `withObjectSchema`. The object schema and its recursion are defined with
**`zod/mini`** (`import * as z from 'zod/mini'`) — keep `zod/mini`, not the full `zod`, for
tree-shaking. `getEditorType()` reduces a schema to a `SchemaEditorType`
(`string|number|boolean|object|array|anyOf|oneOf|allOf|$ref`) that selects the type editor.

### Immutable edits — `internal/schema-editor.ts`
All schema mutations are **pure copy-then-modify** functions (`copySchema` uses
`structuredClone`; `updateObjectProperty`, `renameObjectProperty`, `updateArrayItems`, …).
Never mutate in place — components push the returned copy back through their `model()`. Mirrors
React's `schemaEditor.ts`. `schema-inference.ts` (exported `inferSchema` /
`createSchemaFromJson`) derives a schema from a sample JSON value.

### Editor composition
`SchemaBuilderComponent` (`lib-jsonjoy-schema-builder`) is the entry shell: a header with a
`mode` toggle (`visual | json | both`) over `SchemaFieldsEditorComponent` (visual tree) and
`SchemaJsonEditorComponent` (CodeMirror source). The visual tree recurses through
`components/schema-editor-internal/*` (field rows, type selector, dropdowns), which delegate to
per-type editors in `components/type-editors/*` (string/number/boolean/object/array/combinator/
ref). `components/ui/*` are shadcn-style primitives. Two dialogs are also public:
`InferSchemaDialogComponent` and `ValidateJsonDialogComponent`.

### Two-tier localization — `services/` + `i18n/`
- `JsonjoyTranslationService` (root): `providerLocale` merges `en` baseline ←
  config `locale` ← config `messages`. `withOverrides(localeFn, messagesFn)` layers
  per-component overrides on top, returning a `computed<Translation>`.
- `JsonjoyTranslationContextService` (**editor-scoped**, provided by entry components, not root):
  an entry component calls `setSource(effectiveTranslation)`; nested editors inject it and read
  `translation`. Falls back to `providerLocale` until a source is set — so a nested editor used
  standalone still resolves.

`formatTranslation(template, values)` does `{token}` substitution. Locales are in
`i18n/locales/` (`en`, `it` shipped). Add new keys to `i18n/translation-keys.ts` and to `en`
first, since `en` is the baseline every merge starts from.

### `$ref` definitions context
`LocalDefinitionsContextService` (editor-scoped) carries the root schema's
`$defs`/`definitions` down to deeply nested `$ref` editors via `set()`/`definitions`.

### Public DI providers — `provide.ts` + `tokens/`
- `provideSchemaBuilder({ locale?, messages? })` → `SCHEMA_BUILDER_CONFIG` (the analog of
  React's `<SchemaBuilderProvider>`); also registers the translation context service as a root
  fallback.
- `provideSchemaBuilderRefSuggestions(factory)` → `SCHEMA_BUILDER_REF_SUGGESTIONS`. The factory
  runs **inside the injection context**, so it may `inject()` host services and return a
  `Signal<readonly RefSuggestion[]>` that the ref editor renders as a clickable suggestion list.

### Lazy-loaded heavy deps
- **CodeMirror 6** (`internal/editor.directive.ts`) backs the JSON source editor — no worker
  bootstrap needed; its callbacks run outside Angular's zone (signal writes auto-schedule CD).
- **AJV** (`internal/json-validator.ts`) is dynamically imported and memoized (`ajvPromise`) for
  runtime data-against-schema validation. `findLineNumberForPath` maps errors back to source.
- **zod/mini** (`types/validation.ts`) does type-level *constraint* validation (e.g. min/max
  coherence) and builds the `ValidationTreeNode` shown in the UI — distinct from AJV's data
  validation.

## Public API discipline
Consumers may import only what `projects/ngx-schema-builder/src/public-api.ts` re-exports.
Internal components (e.g. `schema-editor-internal/*`) stay unexported even when their payload
types are public — e.g. `EnumChangeContext` is exported as a type while its component is not.
Add a re-export here whenever you intend something to be consumable.