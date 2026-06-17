# ngx-schema-builder — workspace

Angular workspace for **[`@archeion/ngx-schema-builder`][pkg]**, a visual JSON
Schema editor for Angular. The published package's README (install, usage,
theming, i18n) lives at [`projects/ngx-schema-builder/README.md`](./projects/ngx-schema-builder/README.md).

**▶ [Live demo](https://archeionproject.github.io/ngx-schema-builder/)**

## Layout

| Path                          | What                                          |
| ----------------------------- | --------------------------------------------- |
| `projects/ngx-schema-builder` | The publishable library.                      |
| `projects/demo`               | Demo app exercising every component.          |

## Develop

```bash
npm install
npm start            # serve the demo app
npm run build        # build:styles + ng-packagr → dist/ngx-schema-builder
npm run build:styles # recompile the Tailwind stylesheet only
npm test             # unit tests (vitest)
npm run lint         # eslint
```

The library's standalone stylesheet is compiled from
`projects/ngx-schema-builder/styles/jsonjoy.source.css` to
`projects/ngx-schema-builder/assets/styles/jsonjoy.css` by `build:styles`, which
`build` runs first. Only the compiled `assets/styles/jsonjoy.css` is published.

## License

MIT — see [LICENSE](./LICENSE). This library is an Angular port of
[jsonjoy-builder](https://github.com/lovasoa/jsonjoy-builder) by Ophir LOJKINE;
the upstream notice is preserved in the LICENSE file.

[pkg]: ./projects/ngx-schema-builder/README.md
