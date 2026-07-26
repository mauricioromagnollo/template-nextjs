import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib'

/** Presentational surface: a bordered panel on the page background. */
export function Card({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn('border-border flex flex-col gap-3 rounded-xl border p-6', className)}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: ComponentPropsWithoutRef<'h3'>) {
  return <h3 className={cn('text-foreground text-base font-semibold', className)} {...props} />
}

export function CardDescription({ className, ...props }: ComponentPropsWithoutRef<'p'>) {
  return <p className={cn('text-muted-foreground text-sm leading-relaxed', className)} {...props} />
}
