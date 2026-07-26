import { environment } from '@/config/environment/environment'
import { siteConfig } from '@/config/site/site-config'
import { isSafeHref } from '@/lib/sanitize'

describe('siteConfig', () => {
  it('should take its name and URL from the environment layer', () => {
    expect(siteConfig.name).toBe(environment.siteName)
    expect(siteConfig.url).toBe(environment.siteUrl)
  })

  it('should describe the template', () => {
    expect(siteConfig.description).toContain('Next.js template')
    expect(siteConfig.locale).toBe('en_US')
  })

  it('should credit the author with a resolvable profile URL', () => {
    expect(siteConfig.author.name).toBe('Maurício Romagnollo')
    expect(isSafeHref(siteConfig.author.url)).toBe(true)
  })

  it('should expose only safe social links', () => {
    const links = Object.values(siteConfig.links)

    expect(links).toHaveLength(3)
    expect(links.every((link) => link.startsWith('https://'))).toBe(true)
  })

  it('should expose three navigation entries with safe hrefs and labels', () => {
    expect(siteConfig.navigation).toHaveLength(3)

    for (const item of siteConfig.navigation) {
      expect(item.label.length).toBeGreaterThan(0)
      expect(isSafeHref(item.href)).toBe(true)
    }
  })

  it('should point the navigation at the home page sections', () => {
    expect(siteConfig.navigation.map((item) => item.href)).toEqual([
      '/#features',
      '/#stack',
      '/#getting-started',
    ])
  })
})
