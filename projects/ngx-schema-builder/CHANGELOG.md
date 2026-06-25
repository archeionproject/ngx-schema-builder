

## [1.0.4](https://github.com/archeionproject/ngx-schema-builder/compare/ngx-schema-builder/v1.0.3...ngx-schema-builder/v1.0.4) (2026-06-25)


### Bug Fixes

* define items schema for array type in DEFAULT_SCHEMAS ([4b6b940](https://github.com/archeionproject/ngx-schema-builder/commit/4b6b94082302b12baabe6c66d8d4154a970c756a))

## [1.0.3](https://github.com/archeionproject/ngx-schema-builder/compare/ngx-schema-builder/v1.0.2...ngx-schema-builder/v1.0.3) (2026-06-24)


### Bug Fixes

* update background color for gutters in JsonjoyEditorDirective ([d8348a3](https://github.com/archeionproject/ngx-schema-builder/commit/d8348a38fba54ec5c7b7d94b1886b2299c628a22))

## [1.0.2](https://github.com/archeionproject/ngx-schema-builder/compare/ngx-schema-builder/v1.0.1...ngx-schema-builder/v1.0.2) (2026-06-24)


### Bug Fixes

* add root node to EditorView initialization in JsonjoyEditorDirective ([92960e4](https://github.com/archeionproject/ngx-schema-builder/commit/92960e442d46cbe2b175c32effa7f34938c10277))

## [1.0.1](https://github.com/archeionproject/ngx-schema-builder/compare/ngx-schema-builder/v1.0.0...ngx-schema-builder/v1.0.1) (2026-06-24)


### Bug Fixes

* remove unnecessary justification from button alignment in definitions editor ([5ef61f4](https://github.com/archeionproject/ngx-schema-builder/commit/5ef61f420705794dd824084e59b5ec3c6085be30))

# 1.0.0 (2026-06-22)


### Bug Fixes

* $ref editor no longer concatenates ref when typing a #-prefixed URL ([5f1e5e5](https://github.com/archeionproject/ngx-schema-builder/commit/5f1e5e510221a1b2559e7f1fcbd33873b70d3045))
* adapt editor surfaces and type badges to dark mode ([bf948e0](https://github.com/archeionproject/ngx-schema-builder/commit/bf948e0f61c921f0c895f115e70d0b2c96658d89))
* add dark syntax highlighting to the JSON source editor ([2abed49](https://github.com/archeionproject/ngx-schema-builder/commit/2abed4943801ce867054223f5eac4ed8daa1e6a3))
* **build:** stop shipping jsonjoy.source.css in the npm tarball ([dc99963](https://github.com/archeionproject/ngx-schema-builder/commit/dc999637fe0d5354e6b5e021eb0db6f3e44b8804))
* center dialog components by adding margin auto to their classes ([7ddeb20](https://github.com/archeionproject/ngx-schema-builder/commit/7ddeb20e76a847472415e4db91035e9081ef94ed))
* center modal dialogs (restore margin auto zeroed by host Tailwind preflight) ([e68ebca](https://github.com/archeionproject/ngx-schema-builder/commit/e68ebca0c566e71abbcb1330729a8c7d69bc0aa4))
* drive dark mode from the document root and theme the demo page surface ([a57177c](https://github.com/archeionproject/ngx-schema-builder/commit/a57177c58dd0276620b155ece6cd88e1e152ed9a))
* **editor:** break type-editor import cycle with forwardRef ([0b81c84](https://github.com/archeionproject/ngx-schema-builder/commit/0b81c84185a07856945221feca8195224df990c0))
* handle SSR compatibility for requestAnimationFrame in dialog components ([406d38c](https://github.com/archeionproject/ngx-schema-builder/commit/406d38cf3babcc867c04f3bcb26a9a51159c72fc))
* hide input placeholders in read-only mode ([4a7f577](https://github.com/archeionproject/ngx-schema-builder/commit/4a7f5771109e0c9abfa57c17a523c8a2bd950142))
* keep required pruning immutable and remove dead hasChildren helper ([ac8e92e](https://github.com/archeionproject/ngx-schema-builder/commit/ac8e92e7691fba5209039cbc3b197810c642d04e))
* namespace spin keyframe and harden scope-styles error handling ([2586f0a](https://github.com/archeionproject/ngx-schema-builder/commit/2586f0a720cebc256f65c1b35b4dceabd1d568bc))
* **pkg:** add npm metadata and exports default condition ([fc3d198](https://github.com/archeionproject/ngx-schema-builder/commit/fc3d1980ee39ad05026cf127a0ceffe1bf440fb8))
* **pkg:** drop unused @angular/cdk peer dependency ([1873bc0](https://github.com/archeionproject/ngx-schema-builder/commit/1873bc0d06778535474138388edfb7a0abd16dea))
* preserve in-progress property edits on external schema change ([d1580dd](https://github.com/archeionproject/ngx-schema-builder/commit/d1580dd3c0da41d4e19d351c1be9b9faee3baa15))
* propagate locale and messages to inner editor components ([7254a25](https://github.com/archeionproject/ngx-schema-builder/commit/7254a25d22f49a20d1a30b891998a6c49cd62f74))
* raw JSON edits now sync to the visual editor (break value/text effect loop) ([acfb590](https://github.com/archeionproject/ngx-schema-builder/commit/acfb59021d4797222040740afa9422f3e64a9f49))
* **readme:** correct usage example, document setup, ship README + LICENSE ([40e6694](https://github.com/archeionproject/ngx-schema-builder/commit/40e669465b54a0517bd48fd885b87bf44b31064e))
* reflect array root + combinator item types in visual editor ([9935b8b](https://github.com/archeionproject/ngx-schema-builder/commit/9935b8be67dfe3399166e1772c90f5bf62884133))
* seed defaultValue once on first init ([c4ae719](https://github.com/archeionproject/ngx-schema-builder/commit/c4ae7191f183492b0e5ee12e1758badb7bec10e2))
* update CI workflow to run coverage tests and add deploy demo workflow ([fe7ef95](https://github.com/archeionproject/ngx-schema-builder/commit/fe7ef9599373f6e886abe537302a7a6336ec3b75))
* update color variables to use jsonjoy prefix for consistency ([5de3cc3](https://github.com/archeionproject/ngx-schema-builder/commit/5de3cc351d6b5814db7e2e53e546ce5f75a30013))
* wip update styles to include jsonjoy.css and improve theming variables ([adbab09](https://github.com/archeionproject/ngx-schema-builder/commit/adbab09628cd50a0fa0d483e3fcb0e8d6ee24133))


### Features

* $ref local-definition quick-pick, reference field type, empty url placeholder ([f252a85](https://github.com/archeionproject/ngx-schema-builder/commit/f252a85cc9599149e3900eb869d298d9dd931c05))
* add close button to validation dialog and translations for close action ([603bc05](https://github.com/archeionproject/ngx-schema-builder/commit/603bc05be2acd21e2cae2f49cc1f38f7b54da57e))
* add DefinitionsEditor component for managing reusable definitions in JSON schema ([e1f1a45](https://github.com/archeionproject/ngx-schema-builder/commit/e1f1a457ae1f4ff4cc70b5fc2ad0a8e729c3e245))
* add optional peer dependency for monaco-editor in package.json ([f86071f](https://github.com/archeionproject/ngx-schema-builder/commit/f86071f1c70f1ccffc473f5eb44c19852c52b8ed))
* **editor:** replace Monaco with CodeMirror 6 ([ec9da00](https://github.com/archeionproject/ngx-schema-builder/commit/ec9da005a622d756e4e207716911357c86358b72))
* export jsonSchemaType and document getEditorType precedence ([b47270d](https://github.com/archeionproject/ngx-schema-builder/commit/b47270d7a98c41ec6a3c50fdbfb969c97972063d))
* rename to ngx-schema-buidler ([bec1465](https://github.com/archeionproject/ngx-schema-builder/commit/bec1465b9b6fb545f88fec9dfb30cb17571c37d9))
* update color palette and styles for improved UI consistency ([3e22018](https://github.com/archeionproject/ngx-schema-builder/commit/3e22018ae13da824b8e177515e8cf94ceca7136b))


### Performance Improvements

* memoize AJV schema compilation ([ae08c08](https://github.com/archeionproject/ngx-schema-builder/commit/ae08c08545ede3811b9ac6548b3e9434dabc1e78))

# Changelog

All notable changes to `@archeion/ngx-schema-builder` are documented here. This
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html);
entries are generated from [Conventional Commits](https://www.conventionalcommits.org)
via `release-it`.

## 0.1.0 — 2026-06-16

Initial public release.

- Replace the embedded Monaco editor with CodeMirror 6 (no web-worker setup
  required; `monaco-editor` is no longer a peer dependency).
- Publish a standalone, self-contained stylesheet; the raw Tailwind input is no
  longer shipped in the tarball.
- Ship the README and LICENSE inside the package.
- Add ESLint config + `lint` target, a Vitest test suite, and release tooling.
