import { isSafeHref, sanitizeHref, serializeJsonLd } from '@/lib/sanitize'

describe('isSafeHref', () => {
  it('should reject an empty href', () => {
    expect(isSafeHref('')).toBe(false)
  })

  it('should reject an href made only of whitespace', () => {
    expect(isSafeHref('   ')).toBe(false)
  })

  it('should reject a protocol-relative URL that inherits the page scheme', () => {
    expect(isSafeHref('//evil.com')).toBe(false)
  })

  it('should accept a root-relative path', () => {
    expect(isSafeHref('/about')).toBe(true)
  })

  it('should accept a fragment reference', () => {
    expect(isSafeHref('#features')).toBe(true)
  })

  it('should accept a query-only reference', () => {
    expect(isSafeHref('?q=1')).toBe(true)
  })

  it('should accept a relative path without a scheme', () => {
    expect(isSafeHref('docs/getting-started')).toBe(true)
  })

  it('should accept http, https and mailto schemes', () => {
    expect(isSafeHref('http://example.com')).toBe(true)
    expect(isSafeHref('https://example.com')).toBe(true)
    expect(isSafeHref('mailto:hi@example.com')).toBe(true)
  })

  it('should accept a safe scheme written in mixed case', () => {
    expect(isSafeHref('HtTpS://example.com')).toBe(true)
  })

  it('should reject a javascript URL', () => {
    expect(isSafeHref('javascript:alert(1)')).toBe(false)
  })

  it('should reject a javascript URL disguised by mixed case', () => {
    expect(isSafeHref('JaVaScRiPt:alert(1)')).toBe(false)
  })

  it('should reject a data URL', () => {
    expect(isSafeHref('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('should ignore surrounding whitespace when judging a scheme', () => {
    expect(isSafeHref('  https://example.com  ')).toBe(true)
    expect(isSafeHref('  javascript:alert(1)  ')).toBe(false)
  })
})

describe('sanitizeHref', () => {
  it('should return the trimmed href when it is safe', () => {
    expect(sanitizeHref('  /about  ')).toBe('/about')
  })

  it('should return undefined when the href is unsafe', () => {
    expect(sanitizeHref('javascript:alert(1)')).toBeUndefined()
  })
})

describe('serializeJsonLd', () => {
  it('should serialize an object to JSON', () => {
    expect(serializeJsonLd({ name: 'Template' })).toBe('{"name":"Template"}')
  })

  it('should escape angle brackets so a value cannot close the script tag', () => {
    const serialized = serializeJsonLd({ name: '</script><img src=x>' })

    expect(serialized).not.toContain('</script>')
    expect(serialized).toContain('\\u003c/script>')
  })
})
