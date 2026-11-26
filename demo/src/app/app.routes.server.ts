import { RenderMode, ServerRoute } from '@angular/ssr';

// Every page is drawn on the server at each request, except the one drawn in the browser only; an address the app
// does not know is answered with 404.
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'about', renderMode: RenderMode.Server },
  { path: 'posts', renderMode: RenderMode.Server },
  { path: 'posts/latest', renderMode: RenderMode.Server },
  { path: 'posts/:id', renderMode: RenderMode.Server },
  { path: 'contact', renderMode: RenderMode.Server },
  { path: 'client-only', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server, status: 404 },
];
