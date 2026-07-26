export type SecurityHeader = {
  key: string
  value: string
}

/** Vercel Web Analytics and Speed Insights load their script from here. */
const VERCEL_SCRIPT_ORIGIN = 'https://va.vercel-scripts.com'

/** Beacons for Web Analytics and Speed Insights. */
const VERCEL_INSIGHTS_ORIGINS = [VERCEL_SCRIPT_ORIGIN, 'https://vitals.vercel-insights.com']

/**
 * Builds the Content-Security-Policy value.
 *
 * `'unsafe-inline'` is unavoidable for scripts and styles: Next.js emits inline
 * bootstrap scripts and inline critical CSS. `'unsafe-eval'`, on the other hand,
 * is only required by the dev server (React Refresh) and never ships.
 */
export function buildContentSecurityPolicy(isDevelopment: boolean): string {
  const scriptSrc = ["'self'", "'unsafe-inline'", VERCEL_SCRIPT_ORIGIN]
  const connectSrc = ["'self'", ...VERCEL_INSIGHTS_ORIGINS]

  if (isDevelopment) {
    scriptSrc.push("'unsafe-eval'")
    // Turbopack's hot-reload channel.
    connectSrc.push('ws:')
  }

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': scriptSrc,
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': connectSrc,
    'manifest-src': ["'self'"],
    // Clickjacking, plugin and injected-<base> protection.
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  }

  return Object.entries(directives)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ')
}

/**
 * Response headers applied to every route by `next.config.ts`.
 *
 * The development flag defaults to `NODE_ENV`, but stays injectable so tests —
 * and any consumer with a different notion of "dev" — can drive it explicitly.
 */
export function buildSecurityHeaders(
  isDevelopment: boolean = process.env.NODE_ENV !== 'production'
): SecurityHeader[] {
  return [
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy(isDevelopment) },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  ]
}
