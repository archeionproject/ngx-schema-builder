import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { Marked, type Tokens } from 'marked';

import readme from '../../../ngx-schema-builder/README.md';

const GITHUB_REPO = 'https://github.com/archeionproject/ngx-schema-builder';
const GITHUB_BLOB = `${GITHUB_REPO}/blob/main/projects/ngx-schema-builder/`;

function isLinkOrImage(
  token: Tokens.Generic,
): token is Tokens.Link | Tokens.Image {
  return token.type === 'link' || token.type === 'image';
}

function isExternal(href: string): boolean {
  return /^([a-z]+:)?\/\//i.test(href) || href.startsWith('#');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function renderReadme(markdown: string): string {
  const md = new Marked({ gfm: true });
  md.use({
    walkTokens(token) {
      if (isLinkOrImage(token) && token.href && !isExternal(token.href)) {
        token.href = GITHUB_BLOB + token.href.replace(/^\.\//, '');
      }
    },
    renderer: {
      // marked omits heading ids by default; restore them for TOC anchors.
      heading({ tokens, depth, text }) {
        const html = this.parser.parseInline(tokens);
        return `<h${depth} id="${slugify(text)}">${html}</h${depth}>\n`;
      },
    },
  });
  return md.parse(markdown, { async: false });
}

@Component({
  selector: 'demo-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="mx-auto max-w-3xl py-10">
      <div class="markdown-body" [innerHTML]="content"></div>
    </article>
  `,
})
export class DocsComponent {
  protected readonly content: SafeHtml;

  constructor() {
    // The README is bundled, trusted content — render it as-is.
    const html = renderReadme(readme);
    this.content = inject(DomSanitizer).bypassSecurityTrustHtml(html);
  }
}
