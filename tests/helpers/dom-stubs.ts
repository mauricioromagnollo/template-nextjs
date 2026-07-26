import { vi } from 'vitest'

/**
 * Browser APIs jsdom does not implement, stubbed once and installed before
 * every test by `tests/setup-tests.ts`.
 *
 * They are installed through `vi.stubGlobal` (rather than assigned directly to
 * `window`) so a single `vi.unstubAllGlobals()` in `afterEach` guarantees no
 * stub leaks from one spec into the next.
 */

function createMediaQueryList(query: string, matches: boolean): MediaQueryList {
  return {
    matches,
    media: query,
    onchange: null,
    // Deprecated pair, still called by some libraries.
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }
}

/**
 * Stubs `window.matchMedia`. `next-themes` calls it on mount, so without this
 * every spec that renders `Providers` or `Header` throws.
 *
 * Every query reports `matches: false` — the light, full-motion default —
 * except `prefers-reduced-motion`, which follows the argument.
 */
export function stubMatchMedia(prefersReducedMotion: boolean = false): void {
  vi.stubGlobal('matchMedia', (query: string): MediaQueryList => {
    const matches = query.includes('prefers-reduced-motion') ? prefersReducedMotion : false

    return createMediaQueryList(query, matches)
  })
}

class IntersectionObserverStub implements IntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = '0px'
  readonly thresholds: readonly number[] = [0]

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/** Installs every DOM stub the suite relies on. */
export function installDomStubs(): void {
  stubMatchMedia()
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
}
