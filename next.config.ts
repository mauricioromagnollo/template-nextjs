import type { NextConfig } from 'next'

import { buildSecurityHeaders } from './src/lib/security-headers'

const nextConfig: NextConfig = {
  // Emits a self-contained server bundle under `.next/standalone`, which is what
  // the production Dockerfile copies. Harmless on Vercel, essential everywhere else.
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    // Add the hostnames your images come from, e.g.:
    // remotePatterns: [{ protocol: 'https', hostname: 'images.example.com' }],
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: buildSecurityHeaders(),
      },
    ]
  },
}

export default nextConfig
