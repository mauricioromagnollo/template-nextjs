import type { MetadataRoute } from 'next'

import { absoluteUrl } from '@/lib'

/** Every indexable route. Add new pages here as the site grows. */
const STATIC_ROUTES = ['/']

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route),
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 1,
  }))
}
