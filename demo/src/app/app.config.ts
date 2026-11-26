import {
  ApplicationConfig,
  PLATFORM_ID,
  inject,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { isPlatformServer } from '@angular/common';
import {
  HttpInterceptorFn,
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

// On the server, the demo's API is this same server: its requests go to it by its own port, in its own container,
// not by the address the browser used (a proxy's, or a port of the machine the server cannot reach from inside).
const apiOnThisServer: HttpInterceptorFn = (req, next) => {
  if (!isPlatformServer(inject(PLATFORM_ID))) return next(req);
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/api/')) return next(req);
  const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
  return next(req.clone({ url: `http://127.0.0.1:${env['PORT'] ?? '4000'}${url.pathname}${url.search}` }));
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([apiOnThisServer])),
    provideClientHydration(),
  ],
};
