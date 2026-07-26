import {
  APP_ENVS,
  DEFAULT_APP_ENV,
  isAppEnv,
  isDevelopment,
  isProduction,
  isTest,
  parseAppEnv,
} from '@/config/environment/app-env'

describe('APP_ENVS', () => {
  it('should list the three known environments', () => {
    expect(APP_ENVS).toEqual(['development', 'test', 'production'])
  })

  it('should default to development', () => {
    expect(DEFAULT_APP_ENV).toBe('development')
  })
})

describe('isAppEnv', () => {
  it('should accept a known environment', () => {
    expect(isAppEnv('production')).toBe(true)
  })

  it('should reject an unknown string', () => {
    expect(isAppEnv('staging')).toBe(false)
  })

  it('should reject a value that is not a string', () => {
    expect(isAppEnv(undefined)).toBe(false)
    expect(isAppEnv(42)).toBe(false)
    expect(isAppEnv({ appEnv: 'production' })).toBe(false)
  })
})

describe('parseAppEnv', () => {
  it('should return a valid value unchanged', () => {
    expect(parseAppEnv('test')).toBe('test')
  })

  it('should fall back to the default on invalid input', () => {
    expect(parseAppEnv('staging')).toBe(DEFAULT_APP_ENV)
    expect(parseAppEnv(undefined)).toBe(DEFAULT_APP_ENV)
  })

  it('should use an explicit fallback when one is given', () => {
    expect(parseAppEnv('staging', 'production')).toBe('production')
  })
})

describe('environment predicates', () => {
  it('should identify production', () => {
    expect(isProduction('production')).toBe(true)
    expect(isProduction('development')).toBe(false)
  })

  it('should identify development', () => {
    expect(isDevelopment('development')).toBe(true)
    expect(isDevelopment('production')).toBe(false)
  })

  it('should identify test', () => {
    expect(isTest('test')).toBe(true)
    expect(isTest('production')).toBe(false)
  })
})
