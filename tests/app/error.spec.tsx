import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, vi } from 'vitest'

import ErrorPage, { type ErrorPageProps } from '@/app/error'

function makeError(overrides: Partial<Error & { digest?: string }> = {}): ErrorPageProps['error'] {
  return Object.assign(new Error('Boom'), overrides)
}

describe('ErrorPage', () => {
  let consoleError: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it('should render a single level one heading', () => {
    render(<ErrorPage error={makeError()} reset={vi.fn()} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Something went wrong' })
    ).toBeInTheDocument()
  })

  it('should report the error once', () => {
    const error = makeError()

    render(<ErrorPage error={error} reset={vi.fn()} />)

    expect(consoleError).toHaveBeenCalledWith(error)
  })

  it('should show the digest when the error carries one', () => {
    render(<ErrorPage error={makeError({ digest: 'abc123' })} reset={vi.fn()} />)

    expect(screen.getByText('Digest: abc123')).toBeInTheDocument()
  })

  it('should omit the digest paragraph when the error has none', () => {
    render(<ErrorPage error={makeError()} reset={vi.fn()} />)

    expect(screen.queryByText(/Digest:/)).not.toBeInTheDocument()
  })

  it('should retry the render when "Try again" is pressed', async () => {
    const user = userEvent.setup()
    const reset = vi.fn()

    render(<ErrorPage error={makeError()} reset={reset} />)
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(reset).toHaveBeenCalledTimes(1)
  })
})
