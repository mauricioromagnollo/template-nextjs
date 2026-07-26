import { render, screen } from '@testing-library/react'

import NotFound, { metadata } from '@/app/not-found'
import { siteConfig } from '@/config/site/site-config'
import { SITE_URL } from '@/lib/seo'

describe('not-found metadata', () => {
  it('should title the page and mark it as the 404 route', () => {
    expect(metadata.title).toBe(`Page not found | ${siteConfig.name}`)
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/404`)
  })

  it('should explain the page is missing', () => {
    expect(metadata.description).toBe(
      'The page you are looking for does not exist or has been moved.'
    )
  })
})

describe('NotFound', () => {
  it('should render a single level one heading', () => {
    render(<NotFound />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'This page does not exist' })
    ).toBeInTheDocument()
  })

  it('should label the page with the 404 eyebrow', () => {
    render(<NotFound />)

    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('should offer a way back to the home page', () => {
    render(<NotFound />)

    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/')
  })
})
