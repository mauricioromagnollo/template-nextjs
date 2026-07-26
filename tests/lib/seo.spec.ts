import { siteConfig } from '@/config/site/site-config'
import { OG_SIZE } from '@/lib/og'
import {
  DEFAULT_OG_IMAGE,
  SITE_URL,
  absoluteUrl,
  buildMetadata,
  buildWebSiteJsonLd,
} from '@/lib/seo'

describe('SEO constants', () => {
  it('should expose the canonical origin from the site config', () => {
    expect(SITE_URL).toBe(siteConfig.url)
    expect(SITE_URL.endsWith('/')).toBe(false)
  })

  it('should point the default social card at the generated route', () => {
    expect(DEFAULT_OG_IMAGE).toBe('/opengraph-image')
  })
})

describe('absoluteUrl', () => {
  it('should resolve the site root when no path is given', () => {
    expect(absoluteUrl()).toBe(`${SITE_URL}/`)
  })

  it('should resolve a root-relative path', () => {
    expect(absoluteUrl('/sitemap.xml')).toBe(`${SITE_URL}/sitemap.xml`)
  })

  it('should add the missing leading slash to a relative path', () => {
    expect(absoluteUrl('sitemap.xml')).toBe(`${SITE_URL}/sitemap.xml`)
  })

  it('should let an absolute http URL through untouched', () => {
    expect(absoluteUrl('http://cdn.example.com/card.png')).toBe('http://cdn.example.com/card.png')
  })

  it('should let an absolute https URL through untouched', () => {
    expect(absoluteUrl('https://cdn.example.com/card.png')).toBe('https://cdn.example.com/card.png')
  })
})

describe('buildMetadata', () => {
  it('should fall back to the site name and description for the home page', () => {
    const metadata = buildMetadata()

    expect(metadata.title).toBe(siteConfig.name)
    expect(metadata.description).toBe(siteConfig.description)
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/`)
    expect(metadata.openGraph?.images).toEqual([
      {
        url: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        alt: siteConfig.name,
      },
    ])
  })

  it('should suffix a page title with the site name', () => {
    const metadata = buildMetadata({ title: 'Page not found' })

    expect(metadata.title).toBe(`Page not found | ${siteConfig.name}`)
  })

  it('should honour every override', () => {
    const metadata = buildMetadata({
      title: 'Docs',
      description: 'How the template is put together.',
      path: '/docs',
      image: 'https://cdn.example.com/docs.png',
    })

    expect(metadata.title).toBe(`Docs | ${siteConfig.name}`)
    expect(metadata.description).toBe('How the template is put together.')
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/docs`)
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      images: ['https://cdn.example.com/docs.png'],
    })
  })

  it('should expose the site origin as the metadata base', () => {
    expect(buildMetadata().metadataBase?.toString()).toBe(new URL(SITE_URL).toString())
  })

  it('should declare the page indexable and attribute the author', () => {
    const metadata = buildMetadata()

    expect(metadata.robots).toEqual({ index: true, follow: true })
    expect(metadata.authors).toEqual([{ name: siteConfig.author.name, url: siteConfig.author.url }])
    expect(metadata.creator).toBe(siteConfig.author.name)
    expect(metadata.applicationName).toBe(siteConfig.name)
  })

  it('should describe the Open Graph website node', () => {
    const metadata = buildMetadata({ path: '/docs' })

    expect(metadata.openGraph).toMatchObject({
      type: 'website',
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      url: `${SITE_URL}/docs`,
    })
  })
})

describe('buildWebSiteJsonLd', () => {
  it('should describe the site as a schema.org WebSite', () => {
    expect(buildWebSiteJsonLd()).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteConfig.name,
      description: siteConfig.description,
      url: SITE_URL,
      inLanguage: 'en',
      author: {
        '@type': 'Person',
        name: siteConfig.author.name,
        url: siteConfig.author.url,
      },
    })
  })
})
