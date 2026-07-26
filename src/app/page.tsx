import {
  ArrowRight,
  Boxes,
  type LucideIcon,
  MonitorCheck,
  Moon,
  Palette,
  Rocket,
  Search,
  ShieldCheck,
  TestTube,
} from 'lucide-react'
import Link from 'next/link'

import {
  Button,
  Card,
  CardDescription,
  CardTitle,
  Container,
  SectionHeading,
} from '@/components/ui'
import { siteConfig } from '@/config/site'

type Feature = {
  icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: TestTube,
    title: '100% test coverage',
    description:
      'Vitest and Testing Library run in jsdom, with the coverage floor pinned at 100% for statements, branches, functions and lines. An untested module fails CI instead of quietly eroding the suite.',
  },
  {
    icon: MonitorCheck,
    title: 'End-to-end tests',
    description:
      'Playwright builds the app and drives a real browser against the production output, so the critical path is verified the way a visitor actually experiences it.',
  },
  {
    icon: Boxes,
    title: 'Docker ready',
    description:
      'A multi-stage Dockerfile packages the Next.js standalone output into a small runtime image, so the same artifact runs on Vercel, Fly, ECS or your own box.',
  },
  {
    icon: Rocket,
    title: 'CI/CD wired up',
    description:
      'GitHub Actions checks formatting, linting, types, unit tests and end-to-end tests on every pull request before anything is allowed near production.',
  },
  {
    icon: Palette,
    title: 'Tailwind CSS v4',
    description:
      'CSS-first configuration: semantic design tokens live in one @theme block, there is no tailwind.config file, and no literal colour is scattered across components.',
  },
  {
    icon: Moon,
    title: 'Dark mode without the flash',
    description:
      'next-themes swaps a single class on the document and the tokens do the rest. There is not one dark: utility in the component layer, and no flash of the wrong theme on load.',
  },
  {
    icon: Search,
    title: 'SEO out of the box',
    description:
      'Metadata helpers, JSON-LD, a sitemap, robots.txt and generated Open Graph images all read from a single site config file. Point it at your domain and you are done.',
  },
  {
    icon: ShieldCheck,
    title: 'Hardened by default',
    description:
      'A strict Content-Security-Policy with no unsafe-eval in production, plus the usual security headers, is applied to every response straight from next.config.ts.',
  },
]

const STACK = [
  'Next.js 16 (App Router)',
  'React 19',
  'TypeScript 5.9 (strict)',
  'Tailwind CSS v4',
  'Vitest',
  'Testing Library',
  'Playwright',
  'ESLint',
  'Prettier',
  'Husky',
  'commitlint',
  'Vercel Analytics',
]

const GETTING_STARTED_STEPS = [
  {
    command: 'git clone https://github.com/mauricioromagnollo/template-nextjs.git my-app',
    description:
      'Or click "Use this template" on GitHub to start from a clean history, at github.com/mauricioromagnollo/template-nextjs/generate.',
  },
  {
    command: 'npm install && cp .env.example .env',
    description: 'Install the dependencies and copy the environment file. The defaults just work.',
  },
  {
    command: 'npm run dev',
    description: 'Start the dev server on http://localhost:3000 with Turbopack.',
  },
  {
    command: 'npm run check',
    description:
      'Run the exact gate CI runs: formatting, linting, types and the full coverage suite.',
  },
]

export default function HomePage() {
  return (
    <>
      <section className="border-border border-b">
        <Container className="flex flex-col items-center gap-8 py-24 text-center sm:py-32">
          <p className="border-border text-muted-foreground rounded-full border px-4 py-1.5 text-sm">
            Open source, MIT licensed
          </p>

          <h1 className="text-foreground max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            The Next.js starter with the boring parts already finished
          </h1>

          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed text-pretty">
            Testing, linting, formatting, commit hooks, Docker, CI/CD, security headers and SEO are
            configured and proven. Delete the demo page, keep the foundation, and start writing the
            part of the product only you can write.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button
              as="a"
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
            >
              Use this template
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>

            <Button as={Link} href="/#getting-started" variant="outline" size="lg">
              Read the setup
            </Button>
          </div>
        </Container>
      </section>

      <section className="border-border border-b">
        <Container className="flex flex-col gap-12 py-20 sm:py-24">
          <SectionHeading
            id="features"
            eyebrow="What you get"
            title="Everything a production app needs, decided once"
            description="These are not suggestions in a README. Each one is configured, enforced by the tooling and verified on every commit."
          />

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <li key={feature.title}>
                <Card className="h-full">
                  <feature.icon className="text-accent size-5" aria-hidden="true" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </Card>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-border border-b">
        <Container className="flex flex-col gap-10 py-20 sm:py-24">
          <SectionHeading
            id="stack"
            eyebrow="Stack"
            title="Current versions, no legacy baggage"
            description="Every dependency is pinned to an exact version, so a fresh install today builds exactly what CI built yesterday."
          />

          <ul className="flex flex-wrap gap-3">
            {STACK.map((item) => (
              <li
                key={item}
                className="border-border bg-muted text-muted-foreground rounded-lg border px-3 py-1.5 font-mono text-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section>
        <Container className="flex flex-col gap-10 py-20 sm:py-24">
          <SectionHeading
            id="getting-started"
            eyebrow="Getting started"
            title="Four commands to a running project"
            description="No hidden setup step, no account to create. The template runs locally with the defaults it ships with."
          />

          <ol className="flex flex-col gap-4">
            {GETTING_STARTED_STEPS.map((step, index) => (
              <li key={step.command}>
                <Card className="gap-2">
                  <CardTitle className="text-accent font-mono text-sm break-all">
                    <span className="text-muted-foreground mr-2">{index + 1}.</span>
                    {step.command}
                  </CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </Card>
              </li>
            ))}
          </ol>

          <div>
            <Button as="a" href={siteConfig.links.github} target="_blank" rel="noopener noreferrer">
              Browse the source
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </Container>
      </section>
    </>
  )
}
