import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useTheme } from 'next-themes'

import { Providers } from '@/components/providers'
import { stubMatchMedia } from '../helpers/dom-stubs'

/** Consumer used to prove the theme context actually reaches the children. */
function ThemeProbe() {
  const { theme, setTheme } = useTheme()

  return (
    <button type="button" onClick={() => setTheme('dark')}>
      Theme: {theme ?? 'unknown'}
    </button>
  )
}

describe('Providers', () => {
  it('should render its children', () => {
    render(
      <Providers>
        <p>Application</p>
      </Providers>
    )

    expect(screen.getByText('Application')).toBeInTheDocument()
  })

  it('should default to the system theme', () => {
    render(
      <Providers>
        <ThemeProbe />
      </Providers>
    )

    expect(screen.getByRole('button', { name: 'Theme: system' })).toBeInTheDocument()
  })

  it('should write the selected theme as a class on the document element', async () => {
    const user = userEvent.setup()

    render(
      <Providers>
        <ThemeProbe />
      </Providers>
    )

    await user.click(screen.getByRole('button', { name: 'Theme: system' }))

    expect(document.documentElement).toHaveClass('dark')
    expect(screen.getByRole('button', { name: 'Theme: dark' })).toBeInTheDocument()
  })

  it('should still render when the visitor prefers reduced motion', () => {
    stubMatchMedia(true)

    render(
      <Providers>
        <p>Application</p>
      </Providers>
    )

    expect(screen.getByText('Application')).toBeInTheDocument()
  })
})
