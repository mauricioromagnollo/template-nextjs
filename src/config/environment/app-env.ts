/**
 * The environments the application knows about. `APP_ENV` is deliberately
 * separate from `NODE_ENV`: the latter is owned by the toolchain (Next sets it
 * to `production` for every build, including staging), while the former
 * describes the deployment the running instance belongs to.
 */
export const APP_ENVS = ['development', 'test', 'production'] as const

export type AppEnv = (typeof APP_ENVS)[number]

export const DEFAULT_APP_ENV: AppEnv = 'development'

/** Narrows an unknown value — an env var, a query param — to a known `AppEnv`. */
export function isAppEnv(value: unknown): value is AppEnv {
  return typeof value === 'string' && (APP_ENVS as readonly string[]).includes(value)
}

/** Parses a raw env value, falling back instead of throwing on bad input. */
export function parseAppEnv(value: unknown, fallback: AppEnv = DEFAULT_APP_ENV): AppEnv {
  return isAppEnv(value) ? value : fallback
}

export function isProduction(appEnv: AppEnv): boolean {
  return appEnv === 'production'
}

export function isDevelopment(appEnv: AppEnv): boolean {
  return appEnv === 'development'
}

export function isTest(appEnv: AppEnv): boolean {
  return appEnv === 'test'
}
