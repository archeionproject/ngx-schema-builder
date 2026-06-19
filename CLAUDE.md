# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@archeion/ngx-schema-builder` — a visual JSON Schema (draft-07) editor for Angular 21,
published as a library. It is an **Angular port of the React project
[jsonjoy-builder](https://github.com/lovasoa/jsonjoy-builder)**. The original's component
shape, theming, and editor semantics are preserved on purpose, so when in doubt about a
behavior or naming choice, the React source is the reference. The public API maps
React components → Angular components/providers; that mapping is documented at the top of
`projects/ngx-schema-builder/src/public-api.ts`.

## Workspace layout

Angular CLI multi-project workspace (`newProjectRoot: projects`):

- `projects/ngx-schema-builder` — the publishable library (`projectType: library`, ng-packagr).
- `projects/demo` — a demo app that consumes the library, used for local dev/serve.

The TS path alias `@archeion/ngx-schema-builder` → `projects/ngx-schema-builder/src/public-api.ts`
lets the demo import the library by its package name without building it first.

## Commands

```bash
npm start              # serve the demo app (ng serve demo)
npm run build          # ng build ngx-schema-builder (library); prebuild runs build:styles first
npm run build:styles   # compile Tailwind: jsonjoy.source.css -> jsonjoy.css (minified)
npm run build:demo     # build the demo app
npm run watch          # rebuild library on change (development config)
npm test               # run unit tests (Angular unit-test builder, vitest runner)
npm run lint           # ng lint
```

**`build:styles` is wired as `build`'s `prebuild` hook**, so `npm run build` always recompiles
the precompiled `jsonjoy.css` first (the library ships that file, not raw Tailwind). If you edit
`jsonjoy.source.css` outside a `build`, rerun `npm run build:styles` or the published styles go
stale. The compiled CSS is unlayered and scoped under `.jsonjoy` (a `jsonjoy` cascade layer was
dropped — per spec, layered rules lose to a host's unlayered framework resets like Ionic's, which
left the editor unstyled); design tokens are declared once in `@theme`.

Tests use **vitest** via `@angular/build:unit-test`. Spec files are `src/**/*.spec.ts`. To run
a single test, pass a vitest filter through ng, e.g. `ng test -- -t "name of test"` or scope by
file path; `vitest/globals` and `node` types are enabled in `tsconfig.spec.json`.

## Architecture

### Component conventions (apply to every component you add)
- **Standalone** components only, `ChangeDetectionStrategy.OnPush`, selector prefix
  `lib-jsonjoy-*` (configured `prefix: lib`).
- **Signals everywhere**: `input()` / `model()` for I/O, `computed()` / `effect()` for derived
  state. No `@Input`/`@Output` decorators, no `NgModule`. `model()` is how two-way state like
  the builder `mode` and editor schema flow.
- Class strings are composed with `cn()` (`internal/cn.ts`, clsx + tailwind-merge). Host
  elements carry `class: 'jsonjoy ...'` — all styling is scoped under the `.jsonjoy` root.

### The schema model (`types/json-schema.ts`)
`JsonSchema = boolean | <object schema>`. The boolean form is valid JSON Schema (`true`/`false`),
so **every consumer must guard** with `isObjectSchema` / `asObjectSchema` before touching
properties. The object schema and its `JsonSchema` recursion are defined with **`zod/mini`**
(`import * as z from 'zod/mini'`) — keep using `zod/mini`, not the full `zod` import, for tree-shaking.
`getEditorType()` collapses a schema into a `SchemaEditorType`
(`string|number|...|anyOf|oneOf|allOf|$ref`) that drives which type-editor renders.

### Immutable schema edits (`internal/schema-editor.ts`)
All schema mutations are **pure, copy-then-modify** functions (`copySchema` via
`structuredClone`, `updateObjectProperty`, `renameObjectProperty`, `updateArrayItems`, …).
Never mutate a schema in place — components feed the returned copy back through their `model()`.
This mirrors React's `schemaEditor.ts`.

### Editor composition
`SchemaBuilderComponent` (`lib-jsonjoy-schema-builder`) is the entry point: a tabbed shell with
`mode` ∈ `visual | json | both` that hosts `SchemaFieldsEditorComponent` (visual tree) and
`SchemaJsonEditorComponent` (CodeMirror). The visual tree recurses through
`components/schema-editor-internal/*` (field rows, type selector, dropdowns) which delegate to a
per-type editor in `components/type-editors/*` (string/number/boolean/object/array/combinator/ref).
`components/ui/*` are shadcn-style primitive directives/components (button, input, badge, switch, label).

### Localization (`services/translation.service.ts` + `i18n/`)
No NgModule i18n. `JsonjoyTranslationService` (root-provided) merges translations in strict order:
`en (baseline) → provider locale → provider messages → component locale → component messages`.
Components call `withOverrides(localeInput, messagesInput)` to get a `computed<Translation>`.
`formatTranslation()` does `{token}` substitution. Locales live in `i18n/locales/` (`en`, `it`
shipped; others noted as pending). Add new keys to `i18n/translation-keys.ts` and to `en` first.

### Dependency injection / public providers (`provide.ts`, `tokens/`)
- `provideSchemaBuilder({ locale, messages })` → `SCHEMA_BUILDER_CONFIG` (replaces React's
  `<SchemaBuilderProvider>`).
- `provideSchemaBuilderRefSuggestions(factory)` → `SCHEMA_BUILDER_REF_SUGGESTIONS`. The factory
  runs **inside the injection context**, so it may call `inject()` to pull `$ref` suggestions from
  host services and return a `Signal<readonly RefSuggestion[]>`. The ref editor renders these as a
  clickable list.

### Lazy-loaded heavy deps
- **CodeMirror 6** (`internal/editor.directive.ts`) backs the JSON source editor. It needs no
  web-worker bootstrap or `MonacoEnvironment` wiring, and its update callbacks run outside
  Angular's zone (signal writes auto-schedule change detection).
- **AJV** (`internal/json-validator.ts`) is dynamically imported and memoized
  (`ajvPromise`) — runtime JSON-against-schema validation, separate from the editor.
- **zod/mini** (`types/validation.ts`) does type-level *constraint* validation (e.g. min/max
  consistency) and builds the `ValidationTreeNode` shown in the editor — distinct from AJV's
  data validation.

## Adding to the public API
Anything consumers should import must be re-exported from
`projects/ngx-schema-builder/src/public-api.ts`. Internal-only classes (e.g. the
`schema-editor-internal/*` components) stay unexported even when their *payload types* are
surfaced — see how `EnumChangeContext` is exported as a type while its component is not.
