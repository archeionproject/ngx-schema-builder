import { bootstrapApplication } from '@angular/platform-browser';
import { provideSchemaBuilder } from '@archeion/ngx-schema-builder';

import { AppComponent } from './app/app';

// Register Monaco's web workers. The `new Worker(new URL(…), { type: 'module' })`
// pattern is recognised by both Vite (dev server) and esbuild (prod build) via
// @angular/build, so each worker becomes its own bundled chunk and Monaco's
// JSON language service runs off the main thread.
(self as unknown as { MonacoEnvironment: object }).MonacoEnvironment = {
  getWorker(_moduleId: string, label: string): Worker {
    if (label === 'json') {
      return new Worker(
        new URL('./monaco/json.worker', import.meta.url),
        { type: 'module' },
      );
    }
    return new Worker(
      new URL('./monaco/editor.worker', import.meta.url),
      { type: 'module' },
    );
  },
};

bootstrapApplication(AppComponent, {
  providers: [provideSchemaBuilder()],
}).catch((err) => {
  console.error(err);
});
