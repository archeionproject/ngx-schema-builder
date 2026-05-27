import { bootstrapApplication } from '@angular/platform-browser';
import { provideJsonjoy } from 'ngx-jsonjoy-builder';

import { AppComponent } from './app/app';

// NOTE on Monaco workers:
// Monaco delegates JSON validation to a Web Worker. Without
// `self.MonacoEnvironment.getWorker` set, Monaco runs diagnostics on the
// main thread — still functional, slightly slower on large documents.
// Production consumers should configure `MonacoEnvironment` for their
// bundler (Vite, webpack, esbuild loaders all differ). See the JSDoc on
// `JsonjoyMonacoEditorDirective` for the recommended pattern.

bootstrapApplication(AppComponent, {
  providers: [provideJsonjoy()],
}).catch((err) => {
  console.error(err);
});
