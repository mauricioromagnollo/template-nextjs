import { render } from '@testing-library/react'
import { ImageResponse } from 'next/og'
import type { ReactElement } from 'react'
import { beforeEach, vi } from 'vitest'

import AppleIcon, { contentType, size } from '@/app/apple-icon'
import { siteConfig } from '@/config/site/site-config'

vi.mock('next/og', () => ({ ImageResponse: vi.fn() }))

describe('apple icon route', () => {
  beforeEach(() => {
    vi.mocked(ImageResponse).mockClear()
  })

  it('should declare the 180x180 PNG iOS expects', () => {
    expect(size).toEqual({ width: 180, height: 180 })
    expect(contentType).toBe('image/png')
  })

  it('should render the image at the declared size', () => {
    AppleIcon()

    expect(ImageResponse).toHaveBeenCalledTimes(1)
    expect(vi.mocked(ImageResponse).mock.calls[0]?.[1]).toEqual(size)
  })

  it('should draw the initial of the site name', () => {
    AppleIcon()

    const element = vi.mocked(ImageResponse).mock.calls[0]?.[0] as ReactElement
    const { container } = render(element)

    expect(container).toHaveTextContent(siteConfig.name.charAt(0).toUpperCase())
  })
})
