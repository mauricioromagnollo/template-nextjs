import Link from 'next/link'

import { Container, ThemeToggle } from '@/components/ui'
import { siteConfig } from '@/config/site'

import { NavLinks } from './nav-links'

/**
 * Sticky site header. A Server Component: only `ThemeToggle` needs the browser,
 * and it ships as its own island.
 */
export function Header() {
  return (
    <header className="border-border bg-background/80 sticky top-0 z-50 border-b backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="text-foreground focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm text-base font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          {siteConfig.name}
        </Link>

        <div className="flex items-center gap-6">
          <NavLinks className="hidden sm:flex" />
          <ThemeToggle />
        </div>
      </Container>
    </header>
  )
}
