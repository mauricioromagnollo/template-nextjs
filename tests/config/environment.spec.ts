import { vi } from 'vitest'

import {
  DEFAULT_SITE_NAME,
  DEFAULT_SITE_URL,
  type EnvironmentSource,
  environment,
  normalizeUrl,
  readEnvironment,
} from '@/config/environment/environment'

function makeSource(overrides: Partial<EnvironmentSource> = {}): EnvironmentSource {
  return {
    siteName: 'Acme',
    siteUrl: 'https://acme.test',
    appEnv: 'production',
    ...overrides,
  }
}

describe('normalizeUrl', () => {
  it('should leave a URL without a trailing slash untouched', () => {
    expect(normalizeUrl('https://acme.test')).toBe('https://acme.test')
  })

  it('should drop a single trailing slash', () => {
    expect(normalizeUrl('https://acme.test/')).toBe('https://acme.test')
  })

  it('should drop repeated trailing slashes', () => {
    expect(normalizeUrl('https://acme.test///')).toBe('https://acme.test')
  })
})

describe('readEnvironment', () => {
  it('should read the provided values', () => {
    expect(readEnvironment(makeSource())).toEqual({
      siteName: 'Acme',
      siteUrl: 'https://acme.test',
      appEnv: 'production',
    })
  })

  it('should normalize a site URL that ends with a slash', () => {
    expect(readEnvironment(makeSource({ siteUrl: 'https://acme.test/' })).siteUrl).toBe(
      'https://acme.test'
    )
  })

  it('should trim the values it keeps', () => {
    expect(readEnvironment(makeSource({ siteName: '  Acme  ' })).siteName).toBe('Acme')
  })

  it('should fall back to the defaults when every value is missing', () => {
    expect(readEnvironment({ siteName: undefined, siteUrl: undefined, appEnv: undefined })).toEqual(
      {
        siteName: DEFAULT_SITE_NAME,
        siteUrl: DEFAULT_SITE_URL,
        appEnv: 'development',
      }
    )
  })

  it('should treat a blank value as missing', () => {
    expect(readEnvironment({ siteName: '   ', siteUrl: '  ', appEnv: '  ' })).toEqual({
      siteName: DEFAULT_SITE_NAME,
      siteUrl: DEFAULT_SITE_URL,
      appEnv: 'development',
    })
  })

  it('should fall back to development for an unknown APP_ENV', () => {
    expect(readEnvironment(makeSource({ appEnv: 'staging' })).appEnv).toBe('development')
  })

  it('should read from process.env when no source is given', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_NAME', 'From Env')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://from-env.test/')
    vi.stubEnv('APP_ENV', 'production')

    expect(readEnvironment()).toEqual({
      siteName: 'From Env',
      siteUrl: 'https://from-env.test',
      appEnv: 'production',
    })
  })
})

describe('environment', () => {
  it('should be resolved once at module load', () => {
    expect(environment.siteName).toEqual(expect.any(String))
    expect(environment.siteUrl.endsWith('/')).toBe(false)
    expect(['development', 'test', 'production']).toContain(environment.appEnv)
  })
})
