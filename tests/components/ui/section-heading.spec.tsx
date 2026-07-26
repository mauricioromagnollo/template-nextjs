import { render, screen } from '@testing-library/react'

import { SectionHeading } from '@/components/ui/section-heading'

describe('SectionHeading', () => {
  it('should render a level two heading and nothing else when only a title is given', () => {
    const { container } = render(<SectionHeading title="Everything a production app needs" />)

    expect(
      screen.getByRole('heading', { level: 2, name: 'Everything a production app needs' })
    ).toBeInTheDocument()
    expect(container.querySelectorAll('p')).toHaveLength(0)
  })

  it('should left align by default', () => {
    const { container } = render(<SectionHeading title="Stack" />)

    expect(container.firstElementChild).toHaveClass('text-left')
  })

  it('should render every optional prop at once', () => {
    const { container } = render(
      <SectionHeading
        as="h1"
        align="center"
        eyebrow="404"
        title="This page does not exist"
        description="The link may be outdated."
        id="not-found"
        className="py-24"
      />
    )

    const heading = screen.getByRole('heading', { level: 1, name: 'This page does not exist' })

    expect(heading).toHaveAttribute('id', 'not-found')
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('The link may be outdated.')).toBeInTheDocument()
    expect(container.firstElementChild).toHaveClass('text-center', 'mx-auto', 'py-24')
  })

  it('should render a level three heading when asked to', () => {
    render(<SectionHeading as="h3" title="Nested section" />)

    expect(screen.getByRole('heading', { level: 3, name: 'Nested section' })).toBeInTheDocument()
  })
})
