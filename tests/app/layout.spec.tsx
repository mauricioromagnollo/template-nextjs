import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import RootLayout, { metadata, viewport } from '@/app/layout'
import { siteConfig } from '@/config/site/site-config'
import { buildWebSiteJsonLd } from '@/lib/seo'

vi.mock('next/font/google', () => ({
  Inter: () => ({ variable: '--font-sans-google' }),
  JetBrains_Mono: () => ({ variable: '--font-mono-google' }),
}))

vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => <div data-analytics="web" />,
}))

vi.mock('@vercel/speed-insights/next', () => ({
  SpeedInsights: () => <div data-analytics="speed-insights" />,
}))

/**
 * React 19 applies the attributes of a rendered `<html>` / `<body>` to the real
 * document elements instead of creating nested ones, so the document itself is
 * what the structural assertions below inspect.
 */
function renderLayout(children = <p>Page content</p>) {
  return render(<RootLayout>{children}</RootLayout>)
}

describe('root layout metadata', () => {
  it('should use the shared metadata builder', () => {
    expect(metadata.title).toBe(siteConfig.name)
    expect(metadata.description).toBe(siteConfig.description)
  })

  it('should declare a theme colour for each colour scheme', () => {
    expect(viewport.themeColor).toEqual([
      { media: '(prefers-color-scheme: light)', color: '#ffffff' },
      { media: '(prefers-color-scheme: dark)', color: '#020617' },
    ])
  })
})

describe('RootLayout', () => {
  it('should declare the document language', () => {
    renderLayout()

    expect(document.documentElement).toHaveAttribute('lang', 'en')
  })

  it('should expose the font variables on the document element', () => {
    renderLayout()

    expect(document.documentElement).toHaveClass('--font-sans-google', '--font-mono-google')
  })

  it('should lay the body out as a full-height column', () => {
    renderLayout()

    expect(document.body).toHaveClass('flex', 'min-h-dvh', 'flex-col', 'font-sans')
  })

  it('should embed the WebSite JSON-LD node', () => {
    const { container } = renderLayout()

    const script = container.querySelector('script[type="application/ld+json"]')

    expect(script).not.toBeNull()
    expect(JSON.parse(script?.textContent ?? '')).toEqual(buildWebSiteJsonLd())
  })

  it('should render a skip link targeting the main landmark', () => {
    renderLayout()

    const skipLink = screen.getByRole('link', { name: 'Skip to main content' })

    expect(skipLink).toHaveAttribute('href', '#main-content')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })

  it('should wrap the page in the header and footer landmarks', () => {
    renderLayout()

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('should render its children inside the main landmark', () => {
    renderLayout(<p>Home page</p>)

    expect(screen.getByRole('main')).toHaveTextContent('Home page')
  })

  it('should mount the Vercel analytics and speed insights islands', () => {
    const { container } = renderLayout()

    expect(container.querySelector('[data-analytics="web"]')).not.toBeNull()
    expect(container.querySelector('[data-analytics="speed-insights"]')).not.toBeNull()
  })
})
