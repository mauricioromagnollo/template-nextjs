import { Container } from '@/components/ui'
import { siteConfig } from '@/config/site'

/**
 * Social destinations. Text labels rather than brand icons: lucide dropped its
 * brand set, and the labels are more accessible anyway.
 */
const SOCIAL_LINKS = [
  { href: siteConfig.links.github, label: 'GitHub' },
  { href: siteConfig.links.linkedin, label: 'LinkedIn' },
  { href: siteConfig.links.x, label: 'X' },
]

const LINK_CLASSES =
  'rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

/** Site footer. A Server Component — the copyright year is rendered per request. */
export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-border border-t">
      <Container className="flex flex-col items-center justify-between gap-6 py-10 sm:flex-row">
        <p className="text-muted-foreground text-sm">
          © {year} {siteConfig.author.name}. Released under the MIT License.
        </p>

        <nav aria-label="Social" className="flex items-center gap-6">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASSES}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </Container>
    </footer>
  )
}
