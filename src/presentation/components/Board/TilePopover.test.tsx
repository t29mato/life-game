import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Space } from '@domain/model/types'
import { TilePopover } from './TilePopover'

function makeSpace(overrides: Partial<Space> = {}): Space {
  return {
    id: 'c',
    kind: 'payday',
    title: 'Payday',
    description: 'Collect your salary.',
    effect: { type: 'payday' },
    next: [],
    layout: { x: 0, y: 0 },
    tone: 'gold',
    icon: 'space:payday',
    ...overrides,
  }
}

describe('TilePopover', () => {
  it('shows the tile’s title, kind, and description', () => {
    render(<TilePopover space={makeSpace()} anchor={{ x: 200, y: 200 }} onClose={() => {}} />)

    const card = screen.getByRole('dialog', { name: 'Payday' })
    expect(card).toHaveTextContent('Payday')
    expect(card).toHaveTextContent('Collect your salary.')
  })

  it.each([
    ['start', 'Start'],
    ['normal', 'Space'],
    ['payday', 'Payday'],
    ['stop', 'Stop'],
    ['retirement', 'Retirement'],
  ] as const)('labels a %s space as %s', (kind, label) => {
    render(<TilePopover space={makeSpace({ kind })} anchor={{ x: 200, y: 200 }} onClose={() => {}} />)

    expect(screen.getByRole('dialog')).toHaveTextContent(label)
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<TilePopover space={makeSpace()} anchor={{ x: 200, y: 200 }} onClose={onClose} />)

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when the backdrop is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<TilePopover space={makeSpace()} anchor={{ x: 200, y: 200 }} onClose={onClose} />)

    // The card's own click handler stops propagation, so only its parent —
    // the full-viewport backdrop catching everything else — is a genuine
    // "outside" click.
    const backdrop = screen.getByRole('dialog').parentElement as Element
    await user.click(backdrop)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when the card itself is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<TilePopover space={makeSpace()} anchor={{ x: 200, y: 200 }} onClose={onClose} />)

    await user.click(screen.getByRole('dialog'))

    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes via its own close button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<TilePopover space={makeSpace()} anchor={{ x: 200, y: 200 }} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /close/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
