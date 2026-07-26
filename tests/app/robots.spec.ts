import robots from '@/app/robots'
import { SITE_URL } from '@/lib/seo'

describe('robots', () => {
  it('should allow every crawler on every route', () => {
    expect(robots().rules).toEqual([{ userAgent: '*', allow: '/' }])
  })

  it('should point at the absolute sitemap URL', () => {
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`)
  })

  it('should declare the canonical host', () => {
    expect(robots().host).toBe(SITE_URL)
  })
})
