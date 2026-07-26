import { OG_CONTENT_TYPE, OG_SIZE, OG_TITLE_MAX_LENGTH, truncateOgTitle } from '@/lib/og'

describe('Open Graph constants', () => {
  it('should expose the 1200x630 social card size', () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 })
  })

  it('should expose the PNG content type', () => {
    expect(OG_CONTENT_TYPE).toBe('image/png')
  })

  it('should expose the default title budget', () => {
    expect(OG_TITLE_MAX_LENGTH).toBe(70)
  })
})

describe('truncateOgTitle', () => {
  it('should return a short title untouched', () => {
    expect(truncateOgTitle('Next.js Template')).toBe('Next.js Template')
  })

  it('should trim surrounding whitespace', () => {
    expect(truncateOgTitle('  Next.js Template  ')).toBe('Next.js Template')
  })

  it('should keep a title of exactly the maximum length', () => {
    const title = 'a'.repeat(OG_TITLE_MAX_LENGTH)

    expect(truncateOgTitle(title)).toBe(title)
  })

  it('should truncate a title longer than the default maximum', () => {
    const truncated = truncateOgTitle('a'.repeat(OG_TITLE_MAX_LENGTH + 10))

    expect(truncated).toHaveLength(OG_TITLE_MAX_LENGTH)
    expect(truncated.endsWith('…')).toBe(true)
  })

  it('should honour an explicit maximum length', () => {
    expect(truncateOgTitle('production ready', 10)).toBe('productio…')
  })

  it('should not leave a trailing space before the ellipsis', () => {
    expect(truncateOgTitle('abcd efghij', 6)).toBe('abcd…')
  })
})
