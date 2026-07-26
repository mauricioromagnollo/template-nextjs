'use client'

import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'

export type ProvidersProps = {
  children: ReactNode
}

/**
 * Single client boundary for every app-wide provider. Keeping it here means the
 * root layout, the header and the footer all stay Server Components.
 *
 * `disableTransitionOnChange` suppresses next-themes' own transition blocker —
 * `ThemeToggle` drives the animation explicitly through `.theme-transition`.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )
}
