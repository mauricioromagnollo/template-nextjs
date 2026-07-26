/**
 * `vitest.config.ts` enables `globals: true`, so specs use `describe`, `it` and
 * `expect` without importing them. This reference is what teaches TypeScript
 * about those globals; `vi` is still imported explicitly where it is used.
 */
/// <reference types="vitest/globals" />
