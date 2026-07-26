import { render, screen } from '@testing-library/react'

import { NavLinks } from '@/components/layout/nav-links'
import { type NavItem, siteConfig } from '@/config/site/site-config'

function makeNavItem(overrides: Partial<NavItem> = {}): NavItem {
  return { href: '/#features', label: 'Features', ...overrides }
}

describe('NavLinks', () => {
  it('should render the site navigation inside a landmark named "Main" by default', () => {
    render(<NavLinks />)

    const nav = screen.getByRole('navigation', { name: 'Main' })

    expect(nav).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(siteConfig.navigation.length)

    for (const item of siteConfig.navigation) {
      expect(screen.getByRole('link', { name: item.label })).toHaveAttribute('href', item.href)
    }
  })

  it('should name the landmark from the label prop', () => {
    render(<NavLinks label="Footer" items={[makeNavItem()]} />)

    expect(screen.getByRole('navigation', { name: 'Footer' })).toBeInTheDocument()
  })

  it('should render the items it is given instead of the site navigation', () => {
    render(<NavLinks items={[makeNavItem({ href: '/docs', label: 'Docs' })]} />)

    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
  })

  it('should drop an unsafe href instead of rendering it', () => {
    render(
      <NavLinks
        items={[
          makeNavItem({ href: 'javascript:alert(1)', label: 'Hostile' }),
          makeNavItem({ href: '/docs', label: 'Docs' }),
        ]}
      />
    )

    expect(screen.queryByRole('link', { name: 'Hostile' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('should merge the navigation and link class names', () => {
    render(
      <NavLinks items={[makeNavItem()]} className="hidden sm:flex" linkClassName="uppercase" />
    )

    expect(screen.getByRole('navigation')).toHaveClass('hidden', 'items-center')
    expect(screen.getByRole('link', { name: 'Features' })).toHaveClass('uppercase', 'text-sm')
  })
})
