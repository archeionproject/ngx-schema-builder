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
