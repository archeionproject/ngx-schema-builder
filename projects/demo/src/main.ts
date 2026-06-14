import { bootstrapApplication } from '@angular/platform-browser';
import { provideSchemaBuilder } from '@archeion/ngx-schema-builder';

import { AppComponent } from './app/app';

bootstrapApplication(AppComponent, {
  providers: [provideSchemaBuilder()],
}).catch((err) => {
  console.error(err);
});
