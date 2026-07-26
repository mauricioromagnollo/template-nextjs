import sitemap from '@/app/sitemap'
import { SITE_URL } from '@/lib/seo'

describe('sitemap', () => {
  it('should list the home page as the only route', () => {
    const entries = sitemap()

    expect(entries).toHaveLength(1)
    expect(entries[0]?.url).toBe(`${SITE_URL}/`)
  })

  it('should describe the home page as monthly and top priority', () => {
    const entry = sitemap()[0]

    expect(entry?.changeFrequency).toBe('monthly')
    expect(entry?.priority).toBe(1)
  })

  it('should stamp every entry with the current date', () => {
    const before = Date.now()
    const entry = sitemap()[0]
    const lastModified = new Date(entry?.lastModified ?? 0).getTime()

    expect(lastModified).toBeGreaterThanOrEqual(before)
    expect(lastModified).toBeLessThanOrEqual(Date.now())
  })
})
