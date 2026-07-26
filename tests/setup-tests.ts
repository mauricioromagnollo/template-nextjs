import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

import { installDomStubs } from './helpers/dom-stubs'

// Reinstalled per test because `vi.unstubAllGlobals()` below tears them down.
beforeEach(() => {
  installDomStubs()
})

afterEach(() => {
  // Unmount every tree so a component rendered by one test can never be found
  // by the next one.
  cleanup()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  // `next-themes` writes the resolved theme onto <html>, and React 19 applies
  // the root layout's <html>/<body> attributes to the real document. Reset both
  // so a spec that renders the layout cannot influence a later assertion.
  document.documentElement.className = ''
  document.documentElement.removeAttribute('style')
  document.documentElement.removeAttribute('lang')
  document.body.className = ''
})
