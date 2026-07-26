import { render, screen } from '@testing-library/react'
import { useTheme } from 'next-themes'
import { beforeEach, vi } from 'vitest'

import { Header } from '@/components/layout/header'
import { siteConfig } from '@/config/site/site-config'

vi.mock('next-themes', () => ({ useTheme: vi.fn() }))

describe('Header', () => {
  beforeEach(() => {
    vi.mocked(useTheme).mockReturnValue({
      resolvedTheme: 'light',
      setTheme: vi.fn(),
    } as unknown as ReturnType<typeof useTheme>)
  })

  it('should render the banner landmark', () => {
    render(<Header />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('should link the site name back to the home page', () => {
    render(<Header />)

    expect(screen.getByRole('link', { name: siteConfig.name })).toHaveAttribute('href', '/')
  })

  it('should render the main navigation', () => {
    render(<Header />)

    const nav = screen.getByRole('navigation', { name: 'Main' })

    expect(nav).toBeInTheDocument()

    for (const item of siteConfig.navigation) {
      expect(screen.getByRole('link', { name: item.label })).toBeInTheDocument()
    }
  })

  it('should render the theme toggle', () => {
    render(<Header />)

    expect(screen.getByRole('button', { name: /theme/i })).toBeInTheDocument()
  })
})
