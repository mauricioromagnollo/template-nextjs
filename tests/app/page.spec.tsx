import { render, screen, within } from '@testing-library/react'

import HomePage from '@/app/page'
import { siteConfig } from '@/config/site/site-config'

describe('HomePage', () => {
  it('should render exactly one level one heading', () => {
    render(<HomePage />)

    const headings = screen.getAllByRole('heading', { level: 1 })

    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveAccessibleName(
      'The Next.js starter with the boring parts already finished'
    )
  })

  it('should offer the primary call to action pointing at the repository', () => {
    render(<HomePage />)

    const cta = screen.getByRole('link', { name: /Use this template/ })

    expect(cta).toHaveAttribute('href', siteConfig.links.github)
    expect(cta).toHaveAttribute('target', '_blank')
    expect(cta).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should link the secondary call to action at the setup section', () => {
    render(<HomePage />)

    expect(screen.getByRole('link', { name: 'Read the setup' })).toHaveAttribute(
      'href',
      '/#getting-started'
    )
  })

  it('should give every section heading an anchor id matching the navigation', () => {
    const { container } = render(<HomePage />)

    for (const item of siteConfig.navigation) {
      const id = item.href.replace('/#', '')

      expect(container.querySelector(`#${id}`)).not.toBeNull()
    }
  })

  it('should present each feature as a card with a title and a description', () => {
    render(<HomePage />)

    const features = screen
      .getByRole('heading', { level: 2, name: /Everything a production app/ })
      .closest('section')

    expect(features).not.toBeNull()

    const items = within(features as HTMLElement).getAllByRole('listitem')

    expect(items).toHaveLength(8)

    for (const item of items) {
      expect(within(item).getByRole('heading', { level: 3 })).toBeInTheDocument()
    }
  })

  it('should list the stack', () => {
    render(<HomePage />)

    const stack = screen
      .getByRole('heading', { level: 2, name: /Current versions/ })
      .closest('section') as HTMLElement

    const items = within(stack)
      .getAllByRole('listitem')
      .map((item) => item.textContent)

    expect(items).toContain('Next.js 16 (App Router)')
    expect(items).toContain('Playwright')
    expect(items).toHaveLength(12)
  })

  it('should number the getting started commands in order', () => {
    render(<HomePage />)

    const gettingStarted = screen
      .getByRole('heading', { level: 2, name: /Four commands/ })
      .closest('section') as HTMLElement

    const commands = within(gettingStarted).getAllByRole('heading', { level: 3 })

    expect(commands).toHaveLength(4)
    expect(commands[0]).toHaveTextContent(
      '1.git clone https://github.com/mauricioromagnollo/template-nextjs.git my-app'
    )
    expect(commands[3]).toHaveTextContent('4.npm run check')
  })

  it('should link to the source at the end of the page', () => {
    render(<HomePage />)

    expect(screen.getByRole('link', { name: /Browse the source/ })).toHaveAttribute(
      'href',
      siteConfig.links.github
    )
  })
})
