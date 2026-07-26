import type { Metadata } from 'next'

import { siteConfig } from '@/config/site'

import { OG_SIZE } from './og'

/** Canonical origin, already normalized (no trailing slash) by the env layer. */
export const SITE_URL = siteConfig.url

/** Route handled by `src/app/opengraph-image.tsx`. */
export const DEFAULT_OG_IMAGE = '/opengraph-image'

/** Resolves a path against {@link SITE_URL}; absolute URLs pass through. */
export function absoluteUrl(path: string = '/'): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path

  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export type BuildMetadataInput = {
  /** Page title. Omit it on the home page to use the bare site name. */
  title?: string
  description?: string
  /** Path used for the canonical and Open Graph URLs. */
  path?: string
  /** Absolute URL or site-relative path to the social card image. */
  image?: string
}

/**
 * Builds a complete `Metadata` object: canonical URL, Open Graph and a
 * `summary_large_image` Twitter card, all pointing at the same absolute URLs.
 */
export function buildMetadata({
  title,
  description = siteConfig.description,
  path = '/',
  image = DEFAULT_OG_IMAGE,
}: BuildMetadataInput = {}): Metadata {
  const url = absoluteUrl(path)
  const imageUrl = absoluteUrl(image)
  const resolvedTitle = title === undefined ? siteConfig.name : `${title} | ${siteConfig.name}`

  return {
    metadataBase: new URL(SITE_URL),
    title: resolvedTitle,
    description,
    applicationName: siteConfig.name,
    authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
    creator: siteConfig.author.name,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      siteName: siteConfig.name,
      title: resolvedTitle,
      description,
      url,
      locale: siteConfig.locale,
      images: [{ url: imageUrl, width: OG_SIZE.width, height: OG_SIZE.height, alt: resolvedTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description,
      images: [imageUrl],
    },
  }
}

export type WebSiteJsonLd = {
  '@context': 'https://schema.org'
  '@type': 'WebSite'
  name: string
  description: string
  url: string
  inLanguage: string
  author: {
    '@type': 'Person'
    name: string
    url: string
  }
}

/** schema.org `WebSite` node embedded in the root layout. */
export function buildWebSiteJsonLd(): WebSiteJsonLd {
  return {
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
  }
}
