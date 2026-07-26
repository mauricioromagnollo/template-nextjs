/** URL schemes allowed in an `href`. Everything else is treated as hostile. */
const SAFE_PROTOCOLS = ['http', 'https', 'mailto']

/**
 * Guards against `javascript:` and `data:` URLs reaching an anchor. Relative
 * paths, fragments and query-only references are always accepted; anything with
 * a scheme must use one of {@link SAFE_PROTOCOLS}.
 */
export function isSafeHref(href: string): boolean {
  const value = href.trim()

  // An empty href resolves to the current page, and a protocol-relative URL
  // ("//evil.example") silently inherits the page scheme — reject both.
  if (value === '') return false
  if (value.startsWith('//')) return false

  // Same-document or same-origin references.
  if (value.startsWith('/') || value.startsWith('#') || value.startsWith('?')) return true

  const colonIndex = value.indexOf(':')

  // No scheme at all: a plain relative path such as "docs/getting-started".
  if (colonIndex === -1) return true

  return SAFE_PROTOCOLS.includes(value.slice(0, colonIndex).toLowerCase())
}

/**
 * Returns the trimmed href when it is safe, or `undefined` so the caller can
 * skip rendering the link entirely instead of emitting a dangerous one.
 */
export function sanitizeHref(href: string): string | undefined {
  return isSafeHref(href) ? href.trim() : undefined
}

/**
 * Serializes a JSON-LD payload for `<script type="application/ld+json">`.
 * Escaping `<` prevents a string value containing `</script>` from closing the
 * tag early and turning content into markup.
 */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
