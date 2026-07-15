import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express, { Request, Response, NextFunction } from 'express';
import { realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';

/**
 * True when this bundle should start HTTP (same rules as a typical `node …/server.mjs` entry).
 * - Compare resolved paths (relative argv vs absolute import.meta.url).
 * - Resolve symlinks (some hosts use them under /app).
 * - Scan argv: Railway or `npm start` can wrap the process so argv[1] is not server.mjs.
 */
function shouldStartHttpServer(metaUrl: string): boolean {
  const selfPath = resolve(fileURLToPath(metaUrl));
  let selfReal: string;
  try {
    selfReal = realpathSync(selfPath);
  } catch {
    selfReal = selfPath;
  }
  const candidates = process.argv.slice(1).filter((a) => a.endsWith('server.mjs'));
  for (const arg of candidates.length ? candidates : process.argv.slice(1)) {
    try {
      const r = realpathSync(resolve(arg));
      if (r === selfReal) {
        return true;
      }
    } catch {
      if (resolve(arg) === selfPath) {
        return true;
      }
    }
  }
  return false;
}

/** Railway and most PaaS set `PORT`; local / Docker can omit it (see Dockerfile). */
function listenPort(): number {
  const raw = process.env['PORT'];
  if (raw === undefined || raw === '') {
    return 4000;
  }
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 65535) {
    console.warn(`[server] Ignoring invalid PORT="${raw}", using 4000`);
    return 4000;
  }
  return n;
}

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

/** Host / host:port → hostname only (for allowlist; IPv6 host headers are rare behind typical proxies). */
function toHostname(hostHeader: string): string {
  const h = hostHeader.trim().toLowerCase();
  if (!h) return 'localhost';
  const first = h.split(',')[0].trim();
  if (first.startsWith('[')) {
    const end = first.indexOf(']');
    return end > 0 ? first.slice(0, end + 1) : first;
  }
  const colon = first.lastIndexOf(':');
  if (colon > 0 && /^\d+$/.test(first.slice(colon + 1))) {
    return first.slice(0, colon);
  }
  return first;
}

/**
 * Absolute URL passed to Angular SSR (must match @angular/platform-server `allowedHosts`).
 * Prefer `x-forwarded-*` when behind Railway / nginx / CDNs (trust proxy).
 */
function buildSsrRequestUrl(req: Request): string {
  const xfHost = req.get('x-forwarded-host');
  const hostHeader = (xfHost || req.get('host') || 'localhost').split(',')[0].trim();
  const xfProto = req.get('x-forwarded-proto');
  const proto = (xfProto || req.protocol || 'https').split(',')[0].trim().toLowerCase();
  const safeProto = proto === 'http' || proto === 'https' ? proto : 'https';
  const path = req.originalUrl || '/';
  return `${safeProto}://${hostHeader}${path}`;
}

/**
 * Hostnames permitted for SSR (SSRF guard on request URL).
 * - SSR_ALLOWED_HOSTS / NG_ALLOWED_HOSTS: comma-separated hostnames (no scheme).
 * - RAILWAY_PUBLIC_DOMAIN: appended automatically when set.
 * - SSR_TRUST_ALL_HOSTS=1: allow any host (`*`) — use only if you terminate TLS at a trusted proxy.
 */
function buildAllowedHosts(): readonly string[] {
  const defaults = [
    'localhost',
    '127.0.0.1',
    'wildvalleyfoods.in',
    'www.wildvalleyfoods.in',
    'dev.wildvalleyfoods.in',
    '*.wildvalleyfoods.in',
  ];

  const parseList = (raw: string | undefined): string[] =>
    raw
      ?.split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean)
      .map((h) => toHostname(h.replace(/^https?:\/\//, ''))) ?? [];

  const fromSsr = parseList(process.env['SSR_ALLOWED_HOSTS']);
  const fromNg = parseList(process.env['NG_ALLOWED_HOSTS']);
  const railway = process.env['RAILWAY_PUBLIC_DOMAIN']?.trim().toLowerCase();
  const vercel = process.env['VERCEL_URL']?.trim().toLowerCase();

  const merged = [...defaults, ...fromSsr, ...fromNg];
  if (railway) merged.push(toHostname(railway.replace(/^https?:\/\//, '')));
  if (vercel) merged.push(toHostname(vercel.replace(/^https?:\/\//, '')));

  if (process.env['SSR_TRUST_ALL_HOSTS'] === '1' || process.env['SSR_TRUST_ALL_HOSTS'] === 'true') {
    merged.push('*');
  }

  return Array.from(new Set(merged));
}

const ssrAllowedHosts = buildAllowedHosts();
const app = express();
app.set('trust proxy', true);

const commonEngine = new CommonEngine({
  allowedHosts: ssrAllowedHosts,
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.get(
  '**',
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html'
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get('**', (req: Request, res: Response, next: NextFunction) => {
  const ssrUrl = buildSsrRequestUrl(req);

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: ssrUrl,
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }],
    })
    .then((html: string) => res.send(html))
    .catch((err: Error) => next(err));
});

/**
 * Start HTTP when this file is the running server entry (Docker `node dist/.../server.mjs`, etc.).
 * Unlike `ng serve` (dev server on ~4200), production must bind `0.0.0.0` and Railway’s `PORT`.
 */
if (shouldStartHttpServer(import.meta.url)) {
  const port = listenPort();
  console.log(`[server] SSR allowedHosts (${ssrAllowedHosts.length}): ${ssrAllowedHosts.join(', ')}`);
  app.listen(port, '0.0.0.0', () => {
    console.log(
      `[server] Express listening on 0.0.0.0:${port} (PORT env=${JSON.stringify(process.env['PORT'] ?? '')})`,
    );
  });
}

export default app;
