import { render, screen } from '@testing-library/react'

import { Footer } from '@/components/layout/footer'
import { siteConfig } from '@/config/site/site-config'

describe('Footer', () => {
  it('should render the contentinfo landmark', () => {
    render(<Footer />)

    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('should credit the author and the licence for the current year', () => {
    render(<Footer />)

    const year = new Date().getFullYear()

    expect(
      screen.getByText(`© ${year} ${siteConfig.author.name}. Released under the MIT License.`)
    ).toBeInTheDocument()
  })

  it('should expose the social links in their own navigation landmark', () => {
    render(<Footer />)

    const nav = screen.getByRole('navigation', { name: 'Social' })

    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      siteConfig.links.github
    )
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      siteConfig.links.linkedin
    )
    expect(screen.getByRole('link', { name: 'X' })).toHaveAttribute('href', siteConfig.links.x)
  })

  it('should open every social link in a new tab without leaking the referrer', () => {
    render(<Footer />)

    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })
})
