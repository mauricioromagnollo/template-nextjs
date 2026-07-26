import { expect, test } from '@playwright/test'

test.describe('accessibility', () => {
  test('should render exactly one level one heading followed by section headings', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    expect(await page.getByRole('heading', { level: 2 }).count()).toBeGreaterThan(0)

    const levels = await page
      .locator('h1, h2, h3, h4, h5, h6')
      .evaluateAll((headings) => headings.map((heading) => Number(heading.tagName.slice(1))))

    // No heading may skip a level relative to the one before it.
    for (const [index, level] of levels.entries()) {
      if (index === 0) {
        expect(level).toBe(1)
        continue
      }

      expect(level - (levels[index - 1] ?? level)).toBeLessThanOrEqual(1)
    }
  })

  test('should give every link an accessible name', async ({ page }) => {
    await page.goto('/')

    const links = page.getByRole('link')
    const total = await links.count()

    expect(total).toBeGreaterThan(0)

    for (let index = 0; index < total; index += 1) {
      // The full accessible name computation, not just the text content.
      await expect(links.nth(index)).toHaveAccessibleName(/\S/)
    }
  })

  test('should give the icon-only theme toggle an accessible name', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('button', { name: /theme/i })).toBeVisible()
  })

  test('should reach the skip link with the first Tab press', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')

    const skipLink = page.getByRole('link', { name: 'Skip to main content' })

    await expect(skipLink).toBeFocused()
    await expect(skipLink).toBeVisible()
  })

  test('should walk the header in a predictable order with the keyboard', async ({ page }) => {
    await page.goto('/')

    const navigation = page.getByRole('navigation', { name: 'Main' })

    // Starts on the wordmark, the first focusable element of the banner.
    await page.getByRole('banner').getByRole('link').first().focus()

    for (const label of ['Features', 'Stack', 'Getting started']) {
      await page.keyboard.press('Tab')
      await expect(navigation.getByRole('link', { name: label })).toBeFocused()
    }

    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: /theme/i })).toBeFocused()
  })

  test('should answer an unknown URL with a rendered 404 page', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist')

    expect(response?.status()).toBe(404)
    await expect(
      page.getByRole('heading', { level: 1, name: 'This page does not exist' })
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/')
  })
})
