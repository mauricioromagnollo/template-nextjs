import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import type { ReactNode } from 'react'

import { Footer, Header } from '@/components/layout'
import { Providers } from '@/components/providers'
import { buildMetadata, buildWebSiteJsonLd, serializeJsonLd } from '@/lib'
import '@/styles/globals.css'

/*
 * Fonts are self-hosted by `next/font`: no request to fonts.googleapis.com at
 * runtime, which keeps the Content-Security-Policy tight and avoids a layout
 * shift. They are exposed as CSS variables consumed by the `@theme` block.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans-google',
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono-google',
})

export const metadata: Metadata = buildMetadata()

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
}

export type RootLayoutProps = {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    // next-themes writes the theme class on <html> before React hydrates, so
    // the attribute legitimately differs from the server output.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetBrainsMono.variable}`}
    >
      <body className="flex min-h-dvh flex-col font-sans">
        <script
          type="application/ld+json"
          // Serialized through `serializeJsonLd`, which escapes `<`.
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildWebSiteJsonLd()) }}
        />

        <Providers>
          <a
            href="#main-content"
            className="focus:bg-accent focus:text-accent-foreground sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
          >
            Skip to main content
          </a>

          <Header />

          <main id="main-content" className="flex-1">
            {children}
          </main>

          <Footer />
        </Providers>

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
