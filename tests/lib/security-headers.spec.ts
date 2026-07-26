import {
  type SecurityHeader,
  buildContentSecurityPolicy,
  buildSecurityHeaders,
} from '@/lib/security-headers'

function findHeader(headers: SecurityHeader[], key: string): SecurityHeader {
  const header = headers.find((candidate) => candidate.key === key)

  if (header === undefined) throw new Error(`Missing header: ${key}`)

  return header
}

describe('buildContentSecurityPolicy', () => {
  it('should always lock down the dangerous directives', () => {
    const policy = buildContentSecurityPolicy(false)

    expect(policy).toContain("default-src 'self'")
    expect(policy).toContain("frame-ancestors 'none'")
    expect(policy).toContain("object-src 'none'")
    expect(policy).toContain("base-uri 'self'")
    expect(policy).toContain("form-action 'self'")
  })

  it('should allow the Vercel analytics script and beacon origins', () => {
    const policy = buildContentSecurityPolicy(false)

    expect(policy).toContain('https://va.vercel-scripts.com')
    expect(policy).toContain('https://vitals.vercel-insights.com')
  })

  it('should not allow unsafe-eval or websockets outside development', () => {
    const policy = buildContentSecurityPolicy(false)

    expect(policy).not.toContain("'unsafe-eval'")
    expect(policy).not.toContain('ws:')
  })

  it('should allow unsafe-eval and the hot-reload websocket in development', () => {
    const policy = buildContentSecurityPolicy(true)

    expect(policy).toContain("'unsafe-eval'")
    expect(policy).toContain('ws:')
  })

  it('should join directives with a semicolon', () => {
    const directives = buildContentSecurityPolicy(false).split('; ')

    expect(directives.length).toBeGreaterThan(1)
    expect(directives.every((directive) => directive.includes(' '))).toBe(true)
  })
})

describe('buildSecurityHeaders', () => {
  it('should include every hardening header', () => {
    const headers = buildSecurityHeaders(false)

    expect(headers.map((header) => header.key)).toEqual([
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'X-DNS-Prefetch-Control',
      'Permissions-Policy',
      'Strict-Transport-Security',
    ])
  })

  it('should set the documented values for the static headers', () => {
    const headers = buildSecurityHeaders(false)

    expect(findHeader(headers, 'X-Frame-Options').value).toBe('DENY')
    expect(findHeader(headers, 'X-Content-Type-Options').value).toBe('nosniff')
    expect(findHeader(headers, 'Referrer-Policy').value).toBe('strict-origin-when-cross-origin')
    expect(findHeader(headers, 'X-DNS-Prefetch-Control').value).toBe('on')
    expect(findHeader(headers, 'Permissions-Policy').value).toBe(
      'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    )
    expect(findHeader(headers, 'Strict-Transport-Security').value).toBe(
      'max-age=63072000; includeSubDomains; preload'
    )
  })

  it('should carry the development policy when development is forced on', () => {
    const headers = buildSecurityHeaders(true)

    expect(findHeader(headers, 'Content-Security-Policy').value).toBe(
      buildContentSecurityPolicy(true)
    )
  })

  it('should derive the policy from NODE_ENV when no flag is given', () => {
    const headers = buildSecurityHeaders()
    const isDevelopment = process.env.NODE_ENV !== 'production'

    expect(findHeader(headers, 'Content-Security-Policy').value).toBe(
      buildContentSecurityPolicy(isDevelopment)
    )
  })
})
