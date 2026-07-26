import type { ComponentPropsWithoutRef, ElementType } from 'react'

import { cn } from '@/lib'

const BUTTON_BASE_CLASSES =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50'

export const buttonVariants = {
  primary: 'bg-accent text-accent-foreground hover:opacity-90',
  outline: 'border border-border bg-background text-foreground hover:bg-muted',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
} as const

export const buttonSizes = {
  sm: 'h-9 px-3',
  md: 'h-10 px-4',
  lg: 'h-12 px-6 text-base',
} as const

export type ButtonVariant = keyof typeof buttonVariants
export type ButtonSize = keyof typeof buttonSizes

type ButtonOwnProps<T extends ElementType> = {
  /** Element or component to render — `Link`, `a`, `label`… Defaults to `button`. */
  as?: T
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

/**
 * Own props plus the props of whatever `as` renders, so `<Button as="a">`
 * requires an `href` and `<Button>` accepts `type` and `disabled`.
 */
export type ButtonProps<T extends ElementType = 'button'> = ButtonOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof ButtonOwnProps<T>>

/**
 * Polymorphic action. Deliberately not a client component: it holds no state,
 * so it renders on the server and only the `onClick` handlers passed by client
 * callers cross the boundary.
 */
export function Button<T extends ElementType = 'button'>({
  as,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps<T>) {
  const Component = (as ?? 'button') as ElementType

  return (
    <Component
      className={cn(BUTTON_BASE_CLASSES, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  )
}
