import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useTheme } from 'next-themes'
import { afterEach, beforeEach, vi } from 'vitest'

import { ThemeToggle } from '@/components/ui/theme-toggle'

vi.mock('next-themes', () => ({ useTheme: vi.fn() }))

const setTheme = vi.fn()

function mockTheme(resolvedTheme: 'light' | 'dark'): void {
  vi.mocked(useTheme).mockReturnValue({
    resolvedTheme,
    setTheme,
    themes: ['light', 'dark'],
  } as unknown as ReturnType<typeof useTheme>)
}

function setupUser() {
  return userEvent.setup()
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    // `shouldAdvanceTime` keeps the faked clock moving with real time, so
    // `userEvent`'s own internal timers still resolve while the component's
    // 300ms transition timer stays under the test's control.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    setTheme.mockClear()
    mockTheme('light')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should offer to switch to dark while the light theme is resolved', () => {
    render(<ThemeToggle />)

    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
  })

  it('should offer to switch to light while the dark theme is resolved', () => {
    mockTheme('dark')

    render(<ThemeToggle />)

    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument()
  })

  it('should select the dark theme when clicked from light', async () => {
    const user = setupUser()

    render(<ThemeToggle />)
    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }))

    expect(setTheme).toHaveBeenCalledWith('dark')
  })

  it('should select the light theme when clicked from dark', async () => {
    mockTheme('dark')
    const user = setupUser()

    render(<ThemeToggle />)
    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }))

    expect(setTheme).toHaveBeenCalledWith('light')
  })

  it('should enable the colour transition for the length of the animation only', async () => {
    const user = setupUser()

    render(<ThemeToggle />)
    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }))

    expect(document.documentElement).toHaveClass('theme-transition')

    await vi.advanceTimersByTimeAsync(300)

    expect(document.documentElement).not.toHaveClass('theme-transition')
  })

  it('should merge a custom class name', () => {
    render(<ThemeToggle className="ml-2" />)

    expect(screen.getByRole('button', { name: /theme/i })).toHaveClass('ml-2', 'rounded-lg')
  })
})
