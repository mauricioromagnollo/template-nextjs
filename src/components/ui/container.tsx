import type { ComponentPropsWithoutRef, ElementType } from 'react'

import { cn } from '@/lib'

type ContainerOwnProps<T extends ElementType> = {
  /** Element or component to render. Defaults to `div`. */
  as?: T
  className?: string
}

export type ContainerProps<T extends ElementType = 'div'> = ContainerOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof ContainerOwnProps<T>>

/**
 * Horizontal page shell: centres content at `--container-content` and applies
 * the responsive gutters. Polymorphic so a section can be its own container
 * without an extra wrapper element.
 */
export function Container<T extends ElementType = 'div'>({
  as,
  className,
  ...props
}: ContainerProps<T>) {
  const Component = (as ?? 'div') as ElementType

  return (
    <Component
      className={cn('max-w-content mx-auto w-full px-4 sm:px-6 lg:px-8', className)}
      {...props}
    />
  )
}
