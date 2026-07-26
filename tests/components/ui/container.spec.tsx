import { render, screen } from '@testing-library/react'

import { Container } from '@/components/ui/container'

describe('Container', () => {
  it('should render a div by default', () => {
    render(<Container>Page content</Container>)

    const container = screen.getByText('Page content')

    expect(container.tagName).toBe('DIV')
    expect(container).toHaveClass('mx-auto', 'w-full')
  })

  it('should render the element given by `as` and merge a custom class name', () => {
    render(
      <Container as="section" aria-label="Features" className="py-20">
        Section content
      </Container>
    )

    const section = screen.getByRole('region', { name: 'Features' })

    expect(section.tagName).toBe('SECTION')
    expect(section).toHaveClass('py-20', 'mx-auto')
  })
})
