import { cn } from '@/lib'

const ALIGNMENT_CLASSES = {
  left: 'text-left',
  center: 'mx-auto text-center',
} as const

export type SectionHeadingAlign = keyof typeof ALIGNMENT_CLASSES

export type SectionHeadingProps = {
  /** Small label above the title. */
  eyebrow?: string
  title: string
  description?: string
  align?: SectionHeadingAlign
  /** Heading level. Pick the one that keeps the document outline correct. */
  as?: 'h1' | 'h2' | 'h3'
  /** Applied to the heading element so it can be an anchor target. */
  id?: string
  className?: string
}

/** Eyebrow + title + description block shared by every section of the page. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  as: Heading = 'h2',
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn('flex max-w-2xl flex-col gap-4', ALIGNMENT_CLASSES[align], className)}>
      {eyebrow === undefined ? null : (
        <p className="text-accent text-sm font-semibold tracking-wide uppercase">{eyebrow}</p>
      )}

      <Heading
        id={id}
        className="text-foreground text-3xl font-bold tracking-tight text-balance sm:text-4xl"
      >
        {title}
      </Heading>

      {description === undefined ? null : (
        <p className="text-muted-foreground text-lg leading-relaxed text-pretty">{description}</p>
      )}
    </div>
  )
}
