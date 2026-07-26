'use client'

import { useEffect } from 'react'

import { Button, Container, SectionHeading } from '@/components/ui'

export type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Route-level error boundary. Must be a Client Component: React needs an
 * interactive boundary to catch the render error and to run `reset`.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Swap this for your reporting service (Sentry, Axiom, Datadog…).
    console.error(error)
  }, [error])

  return (
    <Container className="flex flex-col items-center gap-8 py-24 text-center sm:py-32">
      <SectionHeading
        as="h1"
        align="center"
        eyebrow="Error"
        title="Something went wrong"
        description="An unexpected error interrupted this page. Trying again is usually enough; if it keeps happening, the details below help us track it down."
      />

      {error.digest === undefined ? null : (
        <p className="text-muted-foreground font-mono text-sm">Digest: {error.digest}</p>
      )}

      <Button onClick={reset} size="lg">
        Try again
      </Button>
    </Container>
  )
}
