import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

const NPM_PACKAGE = '@archeion/ngx-schema-builder';
const GITHUB_URL = 'https://github.com/archeionproject/ngx-schema-builder';
const NPM_URL = `https://www.npmjs.com/package/${NPM_PACKAGE}`;
const JSONJOY_URL = 'https://github.com/lovasoa/jsonjoy-builder';
const THEME_STORAGE_KEY = 'ngx-schema-builder-demo:theme';

@Component({
  selector: 'demo-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block min-h-screen bg-background text-foreground',
  },
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent"
    ></div>

    <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <nav class="flex items-center justify-between gap-4">
        <a
          routerLink="/"
          class="flex items-center gap-2 font-semibold transition-opacity hover:opacity-80"
        >
          <span
            class="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="size-4"
            >
              <path
                d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"
              />
              <path
                d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1"
              />
            </svg>
          </span>
          <span class="hidden sm:inline">ngx-schema-builder</span>
        </a>

        <div class="flex items-center gap-1.5">
          <div
            class="flex items-center rounded-md border bg-card p-0.5 text-sm"
          >
            <a
              routerLink="/"
              routerLinkActive="bg-secondary text-foreground"
              [routerLinkActiveOptions]="{ exact: true }"
              class="rounded px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Demo
            </a>
            <a
              routerLink="/docs"
              routerLinkActive="bg-secondary text-foreground"
              class="rounded px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Docs
            </a>
          </div>

          <a
            [href]="githubUrl"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            class="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" class="size-4">
              <path
                d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.05 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.92-2.34 4.79-4.57 5.04.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.59.69.49A10.04 10.04 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z"
              />
            </svg>
          </a>

          <button
            type="button"
            (click)="toggleTheme()"
            [attr.aria-label]="
              isDark() ? 'Switch to light theme' : 'Switch to dark theme'
            "
            class="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            @if (isDark()) {
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="size-4"
              >
                <circle cx="12" cy="12" r="4" />
                <path
                  d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"
                />
              </svg>
            } @else {
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="size-4"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            }
          </button>
        </div>
      </nav>

      <router-outlet />

      <footer
        class="mt-16 border-t pt-8 text-center text-sm text-muted-foreground"
      >
        <p>
          <span class="font-medium text-foreground">{{ npmPackage }}</span>
          — released under the MIT License.
        </p>
        <p class="mt-1">
          An Angular port of
          <a
            [href]="jsonjoyUrl"
            target="_blank"
            rel="noreferrer"
            class="font-medium text-foreground underline-offset-4 hover:underline"
            >jsonjoy-builder</a
          >
          by Ophir LOJKINE.
        </p>
        <p class="mt-3">
          <a
            [href]="githubUrl"
            target="_blank"
            rel="noreferrer"
            class="underline-offset-4 hover:text-foreground hover:underline"
            >GitHub</a
          >
          ·
          <a
            [href]="npmUrl"
            target="_blank"
            rel="noreferrer"
            class="underline-offset-4 hover:text-foreground hover:underline"
            >npm</a
          >
        </p>
      </footer>
    </main>
  `,
})
export class AppComponent {
  protected readonly npmPackage = NPM_PACKAGE;
  protected readonly githubUrl = GITHUB_URL;
  protected readonly npmUrl = NPM_URL;
  protected readonly jsonjoyUrl = JSONJOY_URL;

  private readonly document = inject(DOCUMENT);
  protected readonly isDark = signal(this.readInitialTheme());

  constructor() {
    effect(() => {
      const dark = this.isDark();
      this.document.documentElement.classList.toggle('dark', dark);
      this.document.defaultView?.localStorage?.setItem(
        THEME_STORAGE_KEY,
        dark ? 'dark' : 'light',
      );
    });
  }

  protected toggleTheme(): void {
    this.isDark.set(!this.isDark());
  }

  private readInitialTheme(): boolean {
    const view = this.document.defaultView;
    if (!view) {
      return false;
    }
    const stored = view.localStorage?.getItem(THEME_STORAGE_KEY);
    if (stored) {
      return stored === 'dark';
    }
    return view.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}
