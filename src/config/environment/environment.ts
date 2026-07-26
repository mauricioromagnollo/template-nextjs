import { type AppEnv, parseAppEnv } from './app-env'

export type Environment = {
  /** Free-form site name used in metadata and in the UI. */
  siteName: string
  /** Canonical origin, guaranteed to have no trailing slash. */
  siteUrl: string
  /** Deployment this instance belongs to. */
  appEnv: AppEnv
}

/**
 * Raw, still-unvalidated values. Reading them into an explicit shape keeps the
 * `process.env.NEXT_PUBLIC_*` accesses literal, which is what lets Next inline
 * them into the client bundle at build time.
 */
export type EnvironmentSource = {
  siteName: string | undefined
  siteUrl: string | undefined
  appEnv: string | undefined
}

export const DEFAULT_SITE_NAME = 'Next.js Template'
export const DEFAULT_SITE_URL = 'http://localhost:3000'

/** Trims the value and falls back when it is missing or blank. */
function readString(value: string | undefined, fallback: string): string {
  const trimmed = (value ?? '').trim()
  return trimmed === '' ? fallback : trimmed
}

/** Drops trailing slashes so URLs can be composed with plain concatenation. */
export function normalizeUrl(value: string): string {
  return value.replace(/\/+$/, '')
}

/**
 * Validation never throws: a missing variable degrades to a sensible default so
 * a misconfigured preview deploy still renders instead of crashing at boot.
 */
export function readEnvironment(
  source: EnvironmentSource = {
    siteName: process.env.NEXT_PUBLIC_SITE_NAME,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    appEnv: process.env.APP_ENV,
  }
): Environment {
  return {
    siteName: readString(source.siteName, DEFAULT_SITE_NAME),
    siteUrl: normalizeUrl(readString(source.siteUrl, DEFAULT_SITE_URL)),
    appEnv: parseAppEnv(source.appEnv),
  }
}

export const environment: Environment = readEnvironment()
