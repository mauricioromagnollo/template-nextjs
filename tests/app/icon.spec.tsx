import { render } from '@testing-library/react'
import { ImageResponse } from 'next/og'
import type { ReactElement } from 'react'
import { beforeEach, vi } from 'vitest'

import Icon, { contentType, size } from '@/app/icon'
import { siteConfig } from '@/config/site/site-config'

// Satori has no DOM, so `ImageResponse` cannot run under jsdom. Mocking it lets
// the route be exercised and its element inspected as ordinary React output.
vi.mock('next/og', () => ({ ImageResponse: vi.fn() }))

describe('icon route', () => {
  beforeEach(() => {
    vi.mocked(ImageResponse).mockClear()
  })

  it('should declare a 32x32 PNG', () => {
    expect(size).toEqual({ width: 32, height: 32 })
    expect(contentType).toBe('image/png')
  })

  it('should render the image at the declared size', () => {
    Icon()

    expect(ImageResponse).toHaveBeenCalledTimes(1)
    expect(vi.mocked(ImageResponse).mock.calls[0]?.[1]).toEqual(size)
  })

  it('should draw the initial of the site name', () => {
    Icon()

    const element = vi.mocked(ImageResponse).mock.calls[0]?.[0] as ReactElement
    const { container } = render(element)

    expect(container).toHaveTextContent(siteConfig.name.charAt(0).toUpperCase())
  })
})
