import type { Metadata } from 'next'
import Link from 'next/link'

import { Button, Container, SectionHeading } from '@/components/ui'
import { buildMetadata } from '@/lib'

export const metadata: Metadata = buildMetadata({
  title: 'Page not found',
  description: 'The page you are looking for does not exist or has been moved.',
  path: '/404',
})

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center gap-8 py-24 text-center sm:py-32">
      <SectionHeading
        as="h1"
        align="center"
        eyebrow="404"
        title="This page does not exist"
        description="The link may be outdated, or the page has moved somewhere else. Everything else is still where you left it."
      />

      <Button as={Link} href="/" size="lg">
        Back to home
      </Button>
    </Container>
  )
}
