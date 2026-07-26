import { ImageResponse } from 'next/og'

import { siteConfig } from '@/config/site'

const ACCENT = '#4f46e5'
const ACCENT_FOREGROUND = '#ffffff'

/** Size iOS expects for a home-screen icon. */
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
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
        fontSize: 108,
        fontWeight: 700,
      }}
    >
      {siteConfig.name.charAt(0).toUpperCase()}
    </div>,
    size
  )
}
