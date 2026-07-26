import { ImageResponse } from 'next/og'

import { siteConfig } from '@/config/site'

// Satori (the renderer behind ImageResponse) has no access to CSS variables or
// oklch, so generated images repeat the accent palette as literal hex.
const ACCENT = '#4f46e5'
const ACCENT_FOREGROUND = '#ffffff'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: ACCENT,
        color: ACCENT_FOREGROUND,
        fontSize: 20,
        fontWeight: 700,
        borderRadius: 6,
      }}
    >
      {siteConfig.name.charAt(0).toUpperCase()}
    </div>,
    size
  )
}
