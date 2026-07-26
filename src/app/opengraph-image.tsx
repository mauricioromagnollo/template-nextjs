import { ImageResponse } from 'next/og'

import { siteConfig } from '@/config/site'
import { OG_CONTENT_TYPE, OG_SIZE, truncateOgTitle } from '@/lib'

// Literal hex: Satori resolves neither CSS variables nor oklch.
const BACKGROUND = '#020617'
const FOREGROUND = '#f8fafc'
const MUTED_FOREGROUND = '#94a3b8'
const ACCENT = '#818cf8'

export const alt = siteConfig.name
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/** Social card served at `/opengraph-image`, referenced by `buildMetadata`. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: 80,
        background: BACKGROUND,
        color: FOREGROUND,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 88,
          height: 88,
          borderRadius: 20,
          background: ACCENT,
          color: BACKGROUND,
          fontSize: 52,
          fontWeight: 700,
        }}
      >
        {siteConfig.name.charAt(0).toUpperCase()}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>
          {truncateOgTitle(siteConfig.name)}
        </div>

        <div style={{ marginTop: 24, fontSize: 30, color: MUTED_FOREGROUND, lineHeight: 1.4 }}>
          {truncateOgTitle(siteConfig.description, 110)}
        </div>
      </div>

      <div style={{ display: 'flex', fontSize: 26, color: ACCENT }}>{siteConfig.url}</div>
    </div>,
    size
  )
}
