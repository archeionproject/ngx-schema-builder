import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'ngx-schema-builder — Visual JSON Schema editor for Angular',
    loadComponent: () => import('./landing').then((m) => m.LandingComponent),
  },
  {
    path: 'docs',
    title: 'Docs — ngx-schema-builder',
    loadComponent: () => import('./docs').then((m) => m.DocsComponent),
  },
  { path: '**', redirectTo: '' },
];
