import { cleanup, render, screen, within, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { allEditions } from '@domain/edition/registry'
import { hiringPoolFor, ladderPositionOf } from '@domain/edition/lookup'
import { editionDisplayName } from '../../format'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { ManualScreen } from './ManualScreen'

function renderManual(onClose: () => void = () => {}): RenderResult {
  return render(
    <AudioProvider audio={createFakeAudioPort()}>
      <ManualScreen onClose={onClose} />
    </AudioProvider>,
  )
}

beforeEach(() => {
  // A previous test's marker, left over from its own screen mounting here.
  history.replaceState(null, '')
})

afterEach(async () => {
  cleanup()
  // Drain `useBackDismiss`'s deferred pop before the next test starts —
  // same reasoning, in full, in ReleaseNotesScreen.test.tsx's afterEach.
  await new Promise((resolve) => setTimeout(resolve, 0))
})

describe('ManualScreen', () => {
  it('renders the masthead and the four booklet sections', () => {
    renderManual()
    expect(screen.getByRole('heading', { name: 'The Handbook' })).toBeInTheDocument()
    expect(screen.getByText('How a turn works')).toBeInTheDocument()
    expect(screen.getByText('Reading the board')).toBeInTheDocument()
    expect(screen.getByText('The careers of the world')).toBeInTheDocument()
    expect(screen.getByText('Words this game uses')).toBeInTheDocument()
  })

  it('catalogues every edition by name', () => {
    renderManual()
    for (const edition of allEditions()) {
      expect(
        screen.getByRole('heading', { name: editionDisplayName(edition) }),
      ).toBeInTheDocument()
    }
  })

  it("lists every one of an edition's careers, each with its title and art", () => {
    renderManual()
    for (const edition of allEditions()) {
      const section = screen.getByLabelText(`${editionDisplayName(edition)} careers`)
      for (const career of [...edition.careers.basic, ...edition.careers.graduate]) {
        const card = within(section).getByLabelText(career.title)
        expect(within(card).getByText(career.title)).toBeInTheDocument()
        // The plaque's bespoke portrait, not a bare text row.
        expect(card.querySelector('svg')).not.toBeNull()
      }
    }
  })

  it('lays each ladder out entry rung first, so a chain reads as a climb', () => {
    renderManual()
    for (const edition of allEditions()) {
      const section = screen.getByLabelText(`${editionDisplayName(edition)} careers`)
      for (const degree of [false, true]) {
        for (const entry of hiringPoolFor(edition, degree)) {
          const rungs = ladderPositionOf(entry.id, edition)?.rungs ?? [entry]
          if (rungs.length < 2) continue
          const cards = within(section).getAllByLabelText(/./, { selector: 'article' })
          const titles = cards.map((card) => card.getAttribute('aria-label'))
          const positions = rungs.map((career) => titles.indexOf(career.title))
          // Bottom rung strictly before every rung above it, in DOM order.
          for (let i = 1; i < positions.length; i += 1) {
            expect(positions[i]).toBeGreaterThan(positions[i - 1]!)
          }
        }
      }
    }
  })

  it('marks the ladder facts a player weighs a job by: rungs, callings, and die-paid work', () => {
    renderManual()
    // The catalogue spans five editions, so each of these appears many times
    // over — what matters is that the vocabulary is on the cards at all.
    expect(screen.getAllByText(/^Rung 1 of \d$/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('A calling').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Paid by the die').length).toBeGreaterThan(0)
  })

  it('quotes each salary in its own edition’s money', () => {
    renderManual()
    // One familiar figure per currency is enough to say the formatter ran
    // with the right edition in hand rather than defaulting to dollars.
    const japan = allEditions().find((edition) => edition.id === 'japan')
    if (japan) {
      const section = screen.getByLabelText(`${editionDisplayName(japan)} careers`)
      expect(within(section).getAllByText(/¥/).length).toBeGreaterThan(0)
    }
  })

  it('explains the tile kinds the board cannot explain itself', () => {
    renderManual()
    expect(screen.getByText('Payday')).toBeInTheDocument()
    expect(screen.getByText(/whether you land on it or drive straight past it/)).toBeInTheDocument()
    expect(screen.getByText('Stop')).toBeInTheDocument()
    expect(screen.getByText(/Movement always halts here/)).toBeInTheDocument()
  })

  it('defines the game’s own words in the glossary', () => {
    renderManual()
    const terms = screen.getAllByRole('term').map((el) => el.textContent)
    expect(terms).toContain('A calling')
    expect(terms).toContain('LIFE tiles')
    expect(terms).toContain('The Number')
    expect(terms).toContain('Seniority')
  })

  it('calls onClose when the back button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderManual(onClose)
    await user.click(screen.getByRole('button', { name: /back to title/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose on Escape, keyboard-only', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderManual(onClose)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('focuses the heading on mount, so a keyboard user arrives at the top', () => {
    renderManual()
    expect(screen.getByRole('heading', { name: 'The Handbook' })).toHaveFocus()
  })
})
