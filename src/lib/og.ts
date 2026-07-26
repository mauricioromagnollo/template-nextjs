/** Open Graph image dimensions recommended by Facebook, X and LinkedIn. */
export const OG_SIZE: { width: number; height: number } = { width: 1200, height: 630 }

export const OG_CONTENT_TYPE = 'image/png'

/** Beyond this, titles wrap past the safe area of the generated card. */
export const OG_TITLE_MAX_LENGTH = 70

/** Shortens a title to fit an Open Graph card, appending an ellipsis. */
export function truncateOgTitle(title: string, maxLength: number = OG_TITLE_MAX_LENGTH): string {
  const value = title.trim()

  if (value.length <= maxLength) return value

  return `${value.slice(0, maxLength - 1).trimEnd()}…`
}
