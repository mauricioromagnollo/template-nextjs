import { expect, test } from '@playwright/test'

/*
 * `Providers` runs next-themes with `defaultTheme="system"`, so the resolved
 * theme follows `prefers-color-scheme` until the visitor picks one explicitly.
 * Each block below pins that preference with `colorScheme` instead of
 * inheriting whatever the machine running the suite happens to prefer.
 *
 * `ThemeToggle` also guards against a hydration mismatch: the server cannot
 * know the preference, so the button ships its light-theme label and only
 * swaps to the real one after mounting. Asserting on that label is therefore
 * also the point at which the island is known to be interactive.
 */

/** Matches a whole class name, so `light` never matches `highlight`. */
function themeClass(theme: 'light' | 'dark'): RegExp {
  return new RegExp(`(^|\\s)${theme}(\\s|$)`)
}

test.describe('theme switching from a light system preference', () => {
  test.use({ colorScheme: 'light' })

  test('should resolve the light theme and offer the dark one', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('html')).toHaveClass(themeClass('light'))
    await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible()
  })

  test('should switch the document class when the toggle is pressed', async ({ page }) => {
    await page.goto('/')

    const html = page.locator('html')

    await expect(html).toHaveClass(themeClass('light'))

    await page.getByRole('button', { name: 'Switch to dark theme' }).click()

    await expect(html).toHaveClass(themeClass('dark'))
    await expect(html).not.toHaveClass(themeClass('light'))
    await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()
  })

  test('should remember the chosen theme after a reload', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Switch to dark theme' }).click()
    await expect(page.locator('html')).toHaveClass(themeClass('dark'))

    await page.reload()

    await expect(page.locator('html')).toHaveClass(themeClass('dark'))
    await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()
  })

  test('should switch back to the light theme', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Switch to dark theme' }).click()
    await page.getByRole('button', { name: 'Switch to light theme' }).click()

    await expect(page.locator('html')).toHaveClass(themeClass('light'))
    await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible()
  })
})

test.describe('theme switching from a dark system preference', () => {
  test.use({ colorScheme: 'dark' })

  test('should resolve the dark theme before React hydrates', async ({ page }) => {
    await page.goto('/')

    // next-themes writes the class from its blocking inline script, so the
    // document is already dark even though the server rendered no theme.
    await expect(page.locator('html')).toHaveClass(themeClass('dark'))

    // …and the toggle catches up with the resolved theme once it mounts.
    await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()
  })

  test('should let an explicit light choice outlive a reload', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Switch to light theme' }).click()

    await expect(page.locator('html')).toHaveClass(themeClass('light'))

    await page.reload()

    await expect(page.locator('html')).toHaveClass(themeClass('light'))
    await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible()
  })
})
