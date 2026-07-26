import { render, screen } from '@testing-library/react'

import { Card, CardDescription, CardTitle } from '@/components/ui/card'

describe('Card', () => {
  it('should render its children', () => {
    render(
      <Card>
        <CardTitle>Docker ready</CardTitle>
        <CardDescription>A multi-stage Dockerfile.</CardDescription>
      </Card>
    )

    expect(screen.getByRole('heading', { level: 3, name: 'Docker ready' })).toBeInTheDocument()
    expect(screen.getByText('A multi-stage Dockerfile.')).toBeInTheDocument()
  })

  it('should merge a custom class name and forward the remaining props', () => {
    render(
      <Card className="h-full" aria-label="Feature">
        Body
      </Card>
    )

    const card = screen.getByLabelText('Feature')

    expect(card).toHaveClass('h-full')
    expect(card).toHaveClass('rounded-xl')
  })
})

describe('CardTitle', () => {
  it('should render a level three heading', () => {
    render(<CardTitle>Hardened by default</CardTitle>)

    expect(screen.getByRole('heading', { level: 3 })).toHaveAccessibleName('Hardened by default')
  })

  it('should merge a custom class name', () => {
    render(<CardTitle className="font-mono">Command</CardTitle>)

    expect(screen.getByRole('heading', { level: 3 })).toHaveClass('font-mono', 'font-semibold')
  })
})

describe('CardDescription', () => {
  it('should render a paragraph', () => {
    render(<CardDescription>Everything is configured.</CardDescription>)

    expect(screen.getByText('Everything is configured.').tagName).toBe('P')
  })

  it('should merge a custom class name', () => {
    render(<CardDescription className="italic">Everything is configured.</CardDescription>)

    expect(screen.getByText('Everything is configured.')).toHaveClass('italic', 'text-sm')
  })
})
