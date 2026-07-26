'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { cn } from '@/lib'

/** Class that enables colour transitions, see `styles/globals.css`. */
const THEME_TRANSITION_CLASS = 'theme-transition'

/** Slightly longer than the CSS transition so it never cuts off mid-fade. */
const THEME_TRANSITION_DURATION_MS = 300

export type ThemeToggleProps = {
  className?: string
}

/**
 * Light/dark switch.
 *
 * The resolved theme is only known in the browser, so the first client render
 * must match the server output exactly or React reports a hydration mismatch.
 * `mounted` keeps the component on its light-theme markup until after the first
 * effect, at which point it re-renders with the real theme.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // The one legitimate "setState in an effect": it runs once, after hydration
  // has already matched the server markup, and its only job is to record that
  // reading the browser theme is now safe.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme'
  const Icon = isDark ? Moon : Sun

  function toggleTheme() {
    const root = document.documentElement

    root.classList.add(THEME_TRANSITION_CLASS)
    window.setTimeout(() => {
      root.classList.remove(THEME_TRANSITION_CLASS)
    }, THEME_TRANSITION_DURATION_MS)

    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        'border-border text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        className
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  )
}
