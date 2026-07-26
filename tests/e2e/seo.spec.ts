import { expect, test } from '@playwright/test'

test.describe('SEO surface', () => {
  test('should serve robots.txt pointing at the sitemap', async ({ request }) => {
    const response = await request.get('/robots.txt')

    expect(response.status()).toBe(200)

    const body = await response.text()

    expect(body).toContain('User-Agent: *')
    expect(body).toContain('Allow: /')
    expect(body).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/)
  })

  test('should serve sitemap.xml as XML listing the home page', async ({ request }) => {
    const response = await request.get('/sitemap.xml')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('xml')

    const body = await response.text()

    expect(body).toContain('<urlset')
    expect(body).toContain('<loc>')
  })

  test('should expose the document title and description on the home page', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/\S/)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S/)
  })

  test('should expose a single canonical link on the home page', async ({ page }) => {
    await page.goto('/')

    const canonical = page.locator('link[rel="canonical"]')

    await expect(canonical).toHaveCount(1)
    await expect(canonical).toHaveAttribute('href', /^https?:\/\//)
  })

  test('should expose the Open Graph tags on the home page', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /\S/)
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website')
    await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute(
      'content',
      /opengraph-image/
    )
  })

  test('should embed the WebSite JSON-LD node', async ({ page }) => {
    await page.goto('/')

    const script = page.locator('script[type="application/ld+json"]')

    await expect(script).toHaveCount(1)

    const jsonLd: unknown = JSON.parse((await script.textContent()) ?? '{}')

    expect(jsonLd).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      inLanguage: 'en',
      author: { '@type': 'Person' },
    })
    expect(jsonLd).toMatchObject({ name: expect.stringMatching(/\S/) })
    expect(jsonLd).toMatchObject({ url: expect.stringMatching(/^https?:\/\//) })
  })
})
