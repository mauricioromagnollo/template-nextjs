import { cn } from '@/lib/cn'

describe('cn', () => {
  it('should join plain class names', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center')
  })

  it('should drop falsy values', () => {
    expect(cn('flex', false, null, undefined, '', 'gap-2')).toBe('flex gap-2')
  })

  it('should resolve conditional objects and arrays', () => {
    expect(cn(['flex', { 'gap-2': false, 'gap-4': true }])).toBe('flex gap-4')
  })

  it('should let the last utility of a conflicting Tailwind group win', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('should return an empty string when nothing is passed', () => {
    expect(cn()).toBe('')
  })
})
