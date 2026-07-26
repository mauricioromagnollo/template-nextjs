import { render } from '@testing-library/react'
import { ImageResponse } from 'next/og'
import type { ReactElement } from 'react'
import { beforeEach, vi } from 'vitest'

import OpengraphImage, { alt, contentType, size } from '@/app/opengraph-image'
import { siteConfig } from '@/config/site/site-config'
import { OG_CONTENT_TYPE, OG_SIZE, truncateOgTitle } from '@/lib/og'

vi.mock('next/og', () => ({ ImageResponse: vi.fn() }))

function renderCard() {
  OpengraphImage()

  const element = vi.mocked(ImageResponse).mock.calls[0]?.[0] as ReactElement

  return render(element)
}

describe('opengraph image route', () => {
  beforeEach(() => {
    vi.mocked(ImageResponse).mockClear()
  })

  it('should reuse the shared Open Graph size, content type and alt text', () => {
    expect(size).toEqual(OG_SIZE)
    expect(contentType).toBe(OG_CONTENT_TYPE)
    expect(alt).toBe(siteConfig.name)
  })

  it('should render the image at the Open Graph size', () => {
    OpengraphImage()

    expect(ImageResponse).toHaveBeenCalledTimes(1)
    expect(vi.mocked(ImageResponse).mock.calls[0]?.[1]).toEqual(OG_SIZE)
  })

  it('should show the site name, description and URL', () => {
    const { container } = renderCard()

    expect(container).toHaveTextContent(truncateOgTitle(siteConfig.name))
    expect(container).toHaveTextContent(truncateOgTitle(siteConfig.description, 110))
    expect(container).toHaveTextContent(siteConfig.url)
  })

  it('should show the initial of the site name as the mark', () => {
    const { container } = renderCard()

    expect(container).toHaveTextContent(siteConfig.name.charAt(0).toUpperCase())
  })
})
