import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Hybrid rendering: public / end-user routes SSR on each request; admin + auth stay CSR
 * (heavy browser-only APIs, fewer SEO needs).
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: 'auth/**', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];
