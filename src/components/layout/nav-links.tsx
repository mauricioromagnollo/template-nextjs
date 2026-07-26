import Link from 'next/link'

import { type NavItem, siteConfig } from '@/config/site'
import { cn, sanitizeHref } from '@/lib'

export type NavLinksProps = {
  /** Defaults to the site navigation; injectable for footers and tests. */
  items?: readonly NavItem[]
  /** Accessible name of the landmark. Must be unique per page. */
  label?: string
  className?: string
  linkClassName?: string
}

/**
 * Navigation landmark built from configuration. Every href goes through
 * `sanitizeHref`, so an unsafe entry — a `javascript:` URL pasted into the
 * config or pulled from a CMS — is dropped rather than rendered.
 */
export function NavLinks({
  items = siteConfig.navigation,
  label = 'Main',
  className,
  linkClassName,
}: NavLinksProps) {
  return (
    <nav aria-label={label} className={cn('flex items-center gap-6', className)}>
      {items.map((item) => {
        const href = sanitizeHref(item.href)

        if (href === undefined) return null

        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              'text-muted-foreground hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              linkClassName
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
