import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { GameLogEntry } from '@domain/model/types'
import { GameLog } from './GameLog'

function entry(overrides: Partial<GameLogEntry>): GameLogEntry {
  return {
    id: overrides.id ?? 'e1',
    turn: overrides.turn ?? 1,
    playerId: overrides.playerId ?? null,
    message: overrides.message ?? 'Something happened',
    tone: overrides.tone ?? 'info',
  }
}

describe('GameLog', () => {
  it('shows a placeholder when there are no entries', () => {
    render(<GameLog entries={[]} />)
    expect(screen.getByText('Nothing has happened yet.')).toBeInTheDocument()
  })

  it('renders every entry message', () => {
    const entries = [
      entry({ id: 'a', message: 'Alice started her career' }),
      entry({ id: 'b', message: 'Bob got married', tone: 'event' }),
    ]
    render(<GameLog entries={entries} />)
    expect(screen.getByText('Alice started her career')).toBeInTheDocument()
    expect(screen.getByText('Bob got married')).toBeInTheDocument()
  })

  it('renders the newest entry first', () => {
    const entries = [
      entry({ id: 'a', message: 'First thing' }),
      entry({ id: 'b', message: 'Second thing' }),
      entry({ id: 'c', message: 'Third thing' }),
    ]
    render(<GameLog entries={entries} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Third thing')
    expect(items[2]).toHaveTextContent('First thing')
  })

  it('has an aria-live polite region for turn/money announcements', () => {
    const { container } = render(<GameLog entries={[entry({})]} />)
    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull()
  })

  /*
   * Issue #35. Close used to be a separate button floating above the drawer
   * this panel sits in — outside the panel entirely, reading as a header
   * control beside Quit. It belongs to the panel, on the panel's own rule.
   */
  it('carries a Close inside its heading when it is given one', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<GameLog entries={[entry({})]} onClose={onClose} />)

    const close = screen.getByRole('button', { name: /close the log/i })
    expect(screen.getByRole('heading')).toContainElement(close)

    await user.click(close)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('draws no close control at all when nothing can be closed', () => {
    render(<GameLog entries={[entry({})]} />)

    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
  })

  it('tags an upset entry distinctly from an ordinary loss', () => {
    const entries = [
      entry({ id: 'a', message: 'Alice paid $200 in rent.', tone: 'money-out' }),
      entry({ id: 'b', message: 'Bob swapped fortunes with Alice, stealing the lead!', tone: 'upset' }),
    ]
    render(<GameLog entries={entries} />)
    const items = screen.getAllByRole('listitem')
    // Newest first: Bob's upset is item 0, Alice's ordinary loss is item 1.
    expect(items[0]).toHaveTextContent('Upset')
    expect(items[1]).not.toHaveTextContent('Upset')
  })
})
