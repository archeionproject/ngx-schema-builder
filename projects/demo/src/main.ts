import { bootstrapApplication } from '@angular/platform-browser';
import { provideJsonjoy } from 'ngx-jsonjoy-builder';

import { AppComponent } from './app/app';

bootstrapApplication(AppComponent, {
  providers: [provideJsonjoy()],
}).catch((err) => {
  console.error(err);
});
