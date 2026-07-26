import { expect, test } from '@playwright/test'

test.describe('home page', () => {
  test('should respond with 200 and render the hero heading', async ({ page }) => {
    const response = await page.goto('/')

    expect(response?.status()).toBe(200)
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'The Next.js starter with the boring parts already finished',
      })
    ).toBeVisible()
  })

  test('should render the header and footer landmarks', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('should reveal the skip link on focus and jump to the main landmark', async ({ page }) => {
    await page.goto('/')

    const skipLink = page.getByRole('link', { name: 'Skip to main content' })

    // Screen-reader only until focused: clipped to a single pixel.
    const clipped = await skipLink.boundingBox()

    expect(clipped?.width ?? 0).toBeLessThanOrEqual(1)

    await skipLink.focus()

    // `focus:not-sr-only` lifts it back into the layout at its natural size.
    const revealed = await skipLink.boundingBox()

    expect(revealed?.width ?? 0).toBeGreaterThan(1)

    await skipLink.press('Enter')

    await expect(page).toHaveURL(/#main-content$/)
    await expect(page.getByRole('main')).toHaveAttribute('id', 'main-content')
  })

  test('should navigate to a section through the header navigation', async ({ page }) => {
    await page.goto('/')

    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Stack' })
      .click()

    await expect(page).toHaveURL(/#stack$/)

    const heading = page.getByRole('heading', {
      level: 2,
      name: 'Current versions, no legacy baggage',
    })

    // The heading itself is the anchor target the link scrolled to.
    await expect(heading).toHaveAttribute('id', 'stack')
    await expect(heading).toBeInViewport()
  })

  test('should link the primary call to action at the repository', async ({ page }) => {
    await page.goto('/')

    const callToAction = page.getByRole('link', { name: 'Use this template' })

    await expect(callToAction).toHaveAttribute('href', /github\.com/)
    await expect(callToAction).toHaveAttribute('target', '_blank')
    // Opening a new tab without `noopener` hands the opener to the target page.
    await expect(callToAction).toHaveAttribute('rel', /noopener/)
  })
})
