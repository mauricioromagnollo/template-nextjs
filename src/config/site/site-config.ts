import { environment } from '../environment'

export type NavItem = {
  href: string
  label: string
}

export type SiteConfig = {
  name: string
  description: string
  /** Canonical origin, without a trailing slash. */
  url: string
  /** Open Graph locale, e.g. `en_US`. */
  locale: string
  author: {
    name: string
    url: string
  }
  links: {
    github: string
    linkedin: string
    x: string
  }
  navigation: readonly NavItem[]
}

/**
 * Single source of truth for everything that is "the site": metadata, the
 * header/footer navigation and the social links. Point it at your own project
 * and the whole template follows.
 */
export const siteConfig: SiteConfig = {
  name: environment.siteName,
  description:
    'An opinionated, production-ready Next.js template with 100% test coverage, end-to-end tests, Docker and CI/CD wired up from the first commit.',
  url: environment.siteUrl,
  locale: 'en_US',
  author: {
    name: 'Maurício Romagnollo',
    url: 'https://github.com/mauricioromagnollo',
  },
  links: {
    github: 'https://github.com/mauricioromagnollo/template-nextjs',
    linkedin: 'https://www.linkedin.com/in/mauricioromagnollo',
    x: 'https://x.com/mauriciormgnl',
  },
  navigation: [
    { href: '/#features', label: 'Features' },
    { href: '/#stack', label: 'Stack' },
    { href: '/#getting-started', label: 'Getting started' },
  ],
}
