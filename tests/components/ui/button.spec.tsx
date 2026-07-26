import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

import { Button, buttonSizes, buttonVariants } from '@/components/ui/button'

describe('Button', () => {
  it('should render a button with the primary variant and medium size by default', () => {
    render(<Button>Use this template</Button>)

    const button = screen.getByRole('button', { name: 'Use this template' })

    expect(button).toHaveClass(...buttonVariants.primary.split(' '))
    expect(button).toHaveClass(...buttonSizes.md.split(' '))
  })

  it('should call the click handler', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<Button onClick={onClick}>Try again</Button>)
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should not call the click handler while disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <Button disabled onClick={onClick}>
        Try again
      </Button>
    )
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onClick).not.toHaveBeenCalled()
  })

  it('should render every optional prop at once', () => {
    render(
      <Button
        as="a"
        href="https://example.com"
        variant="outline"
        size="lg"
        className="w-full"
        target="_blank"
        rel="noopener noreferrer"
      >
        Browse the source
      </Button>
    )

    const link = screen.getByRole('link', { name: 'Browse the source' })

    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveClass(...buttonVariants.outline.split(' '))
    expect(link).toHaveClass(...buttonSizes.lg.split(' '))
    expect(link).toHaveClass('w-full')
  })

  it('should render the ghost variant at the small size', () => {
    render(
      <Button variant="ghost" size="sm">
        Dismiss
      </Button>
    )

    const button = screen.getByRole('button', { name: 'Dismiss' })

    expect(button).toHaveClass(...buttonVariants.ghost.split(' '))
    expect(button).toHaveClass(...buttonSizes.sm.split(' '))
  })
})
