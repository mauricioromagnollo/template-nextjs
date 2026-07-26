import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Joins conditional class names and resolves Tailwind conflicts so the last
 * utility of a group wins: `cn('p-2', 'p-4')` yields `'p-4'`.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
