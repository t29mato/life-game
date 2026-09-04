import { cleanup, render, screen, within, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { allEditions, DEFAULT_EDITION_ID } from '@domain/edition/registry'
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
  // jsdom has no layout, so the contents bar's scroll jump is a stub here —
  // the tests assert the focus handoff, which is the part jsdom can see.
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(async () => {
  cleanup()
  // Drain `useBackDismiss`'s deferred pop before the next test starts —
  // same reasoning, in full, in ReleaseNotesScreen.test.tsx's afterEach.
  await new Promise((resolve) => setTimeout(resolve, 0))
})

describe('the Handbook agrees with the rules', () => {
  /*
   * D4: the booklet still said "A fork asks twice: pick the road first, then
   * spin again" long after roads went onto the wheel. `resolveForkBranch`
   * splits the six faces in half and nobody picks anything, so the booklet
   * says that instead — and this test is what stops it drifting back.
   */
  it('says the wheel picks the road, not the player', () => {
    renderManual()

    const steps = screen.getByText('How a turn works').closest('section') as HTMLElement
    expect(steps).toHaveTextContent(/the first picks the road for you/i)
    expect(steps).toHaveTextContent(/1 to 3 one way, 4 to 6 the other/i)
    expect(steps).not.toHaveTextContent(/pick the road first/i)
  })

  it('keeps the key to the board where a player can find it again', () => {
    renderManual()

    expect(screen.getByText('What the marks mean')).toBeInTheDocument()
    expect(screen.getByText(/red-and-white stripe/i)).toBeInTheDocument()
  })
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

  it('offers every edition as a tab, the classic USA page open first', () => {
    renderManual()
    for (const edition of allEditions()) {
      expect(screen.getByRole('tab', { name: editionDisplayName(edition) })).toBeInTheDocument()
    }
    const usa = allEditions().find((edition) => edition.id === DEFAULT_EDITION_ID)!
    expect(screen.getByRole('tab', { name: editionDisplayName(usa) })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByLabelText(`${editionDisplayName(usa)} careers`)).toBeInTheDocument()
  })

  it("shows one country's catalogue at a time — picking a tab swaps the page", async () => {
    const user = userEvent.setup()
    renderManual()
    const usa = allEditions().find((edition) => edition.id === DEFAULT_EDITION_ID)!
    const other = allEditions().find((edition) => edition.id !== DEFAULT_EDITION_ID)!
    expect(screen.queryByLabelText(`${editionDisplayName(other)} careers`)).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: editionDisplayName(other) }))
    expect(screen.getByLabelText(`${editionDisplayName(other)} careers`)).toBeInTheDocument()
    expect(screen.queryByLabelText(`${editionDisplayName(usa)} careers`)).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: editionDisplayName(other) }),
    ).toBeInTheDocument()
  })

  it('walks the country tabs with arrow keys, keyboard-only', async () => {
    const user = userEvent.setup()
    renderManual()
    const tabs = screen.getAllByRole('tab')
    tabs[0]!.focus()
    await user.keyboard('{ArrowRight}')
    expect(tabs[1]).toHaveFocus()
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName(`${tabs[1]!.textContent} careers`)
    await user.keyboard('{ArrowLeft}')
    expect(tabs[0]).toHaveFocus()
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{End}')
    expect(tabs[tabs.length - 1]).toHaveFocus()
    expect(tabs[tabs.length - 1]).toHaveAttribute('aria-selected', 'true')
  })

  describe("lists every one of an edition's careers, each with its title and art", () => {
    it.each(allEditions().map((edition) => [editionDisplayName(edition), edition] as const))(
      '%s',
      async (name, edition) => {
        const user = userEvent.setup()
        renderManual()
        await user.click(screen.getByRole('tab', { name }))
        const section = screen.getByLabelText(`${name} careers`)
        for (const career of [
          ...edition.careers.basic,
          ...edition.careers.graduate,
          ...(edition.careers.doctorate ?? []),
        ]) {
          const card = within(section).getByLabelText(career.title)
          expect(within(card).getByText(career.title)).toBeInTheDocument()
          // The plaque's bespoke portrait, not a bare text row.
          expect(card.querySelector('svg')).not.toBeNull()
        }
      },
    )
  })

  describe('lays each ladder out entry rung first, so a chain reads as a climb', () => {
    it.each(allEditions().map((edition) => [editionDisplayName(edition), edition] as const))(
      '%s',
      async (name, edition) => {
        const user = userEvent.setup()
        renderManual()
        await user.click(screen.getByRole('tab', { name }))
        const section = screen.getByLabelText(`${name} careers`)
        for (const tier of ['basic', 'graduate', 'doctorate'] as const) {
          for (const entry of hiringPoolFor(edition, tier)) {
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
      },
    )
  })

  it('marks the ladder facts a player weighs a job by: rungs, callings, and wheel-paid work', () => {
    renderManual()
    // The default page (the USA catalogue) carries every kind of marker on
    // its own — what matters is that the vocabulary is on the cards at all.
    expect(screen.getAllByText(/^Rung 1 of \d$/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('A calling').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Paid by the wheel').length).toBeGreaterThan(0)
  })

  it('quotes each salary in its own edition’s money', async () => {
    const user = userEvent.setup()
    renderManual()
    // One familiar figure per currency is enough to say the formatter ran
    // with the right edition in hand rather than defaulting to dollars.
    const japan = allEditions().find((edition) => edition.id === 'japan')
    if (japan) {
      await user.click(screen.getByRole('tab', { name: editionDisplayName(japan) }))
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

  it('offers a contents bar whose buttons hand focus to their section', async () => {
    const user = userEvent.setup()
    renderManual()
    const contents = screen.getByRole('navigation', { name: 'Contents' })
    for (const label of ['Turns', 'The board', 'Careers', 'Glossary']) {
      expect(within(contents).getByRole('button', { name: label })).toBeInTheDocument()
    }
    await user.click(within(contents).getByRole('button', { name: 'Glossary' }))
    expect(screen.getByRole('heading', { name: 'Words this game uses' })).toHaveFocus()
    await user.click(within(contents).getByRole('button', { name: 'The board' }))
    expect(screen.getByRole('heading', { name: 'Reading the board' })).toHaveFocus()
  })
})
