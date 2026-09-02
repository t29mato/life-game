import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { EditionId, SpinValue } from '@domain/model/types'
import { editionFor } from '@domain/edition/registry'
import '@domain/edition/japan'
import '@domain/edition/india'
import { perPipPayout } from '@domain/rules/diePayout'
import { paydayPayFor } from '@domain/rules/player'
import { formatMoney } from '@application/usecases/format'
import { applyEffect } from '@application/usecases/applyEffect'
import { createFakeRandom } from '@application/testing/fakes'
import { fixturePlayer, fixtureSpace, fixtureState } from '@application/testing/fixtures'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { EventSpinModal } from './EventSpinModal'

/*
 * The card the owner was looking at when he asked for this:
 *
 *   THE DIE / Payday
 *   "Second Shooter — no two weeks pay the same. ¥750,000 a pip you roll,
 *    1 to 6 — higher is always better."
 *
 * Six multiplications, asked of four people around one screen, before
 * anybody is allowed to press anything. 自分で計算するのみんな大変 — so the die
 * publishes its own outcome table instead, and these tests hold that table
 * to two things: it prints the edition's own money, and every figure on it
 * comes from the function `choose.ts` will actually credit the player by.
 * A hardcoded row would pass a screenshot and fail a player.
 */

/** The decision `applyEffect` raises for `space`, played on `edition`'s board. */
function optionFor(editionId: EditionId, effect: Record<string, unknown>, player = fixturePlayer()) {
  const state = fixtureState({ editionId, players: [player] })
  const space = fixtureSpace({ effect: effect as never })
  const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
  const option = next.pendingDecision?.options[0]
  if (!option) throw new Error('applyEffect raised no decision to read a table off')
  return option
}

/** Every "Roll → Outcome" pair the rendered table actually shows. */
function renderedRows(): readonly (readonly [string, string])[] {
  return [...screen.getByRole('table').querySelectorAll('tbody tr')].map(
    (row) =>
      [...row.querySelectorAll('td')].map((cell) => cell.textContent ?? '') as unknown as readonly [
        string,
        string,
      ],
  )
}

/** The die inside this modal reaches for the audio port, so it needs one. */
function show(option: { readonly description: string; readonly table?: unknown }): void {
  render(
    <AudioProvider audio={createFakeAudioPort()}>
      <EventSpinModal
        prompt="Payday"
        stakes={option.description}
        table={option.table as never}
        result={null}
        onSpin={() => {}}
        onSpinComplete={() => {}}
      />
    </AudioProvider>,
  )
}

describe('EventSpinModal', () => {
  describe("the die's own outcome table", () => {
    /*
     * Japan and India, deliberately: yen and rupees group their digits
     * differently and neither wears a dollar sign, so a table built from a
     * hardcoded string anywhere would show it here.
     */
    it.each<[EditionId, string]>([
      ['japan', '¥'],
      ['india', '₹'],
    ])('prints a casual payday in %s money, face by face', (editionId, symbol) => {
      const edition = editionFor(editionId)
      const player = fixturePlayer({ career: null })
      show(optionFor(editionId, { type: 'payday' }, player))

      expect(renderedRows()).toEqual(
        [1, 2, 3, 4, 5, 6].map((face) => [
          String(face),
          formatMoney(paydayPayFor(player, face as SpinValue, edition.economy), edition.currency),
        ]),
      )
      for (const [, amount] of renderedRows()) expect(amount.startsWith(symbol)).toBe(true)
    })

    /* The reported card itself, end to end — ¥750,000 a pip, and the six
       sums a player used to have to work out from it. */
    it('turns the Second Shooter card that was reported into its six rows', () => {
      const shooter = editionFor('japan')
        .careers.basic.find((career) => career.title === 'Second Shooter')!
      const option = optionFor('japan', { type: 'payday' }, fixturePlayer({ career: shooter }))
      show(option)

      expect(option.description).toBe('Second Shooter — no two weeks pay the same.')
      expect(renderedRows()).toEqual([
        ['1', '¥750,000'],
        ['2', '¥1,500,000'],
        ['3', '¥2,250,000'],
        ['4', '¥3,000,000'],
        ['5', '¥3,750,000'],
        ['6', '¥4,500,000'],
      ])
    })

    /*
     * The claim that matters most: not "these six strings" but "whatever
     * `perPipPayout` says, which is what the player will be paid". Change the
     * rate and this test follows it; hardcode the rows and it stops.
     */
    it('shows a windfall as the domain prices it, not as a list written in the card', () => {
      const edition = editionFor('japan')
      show(optionFor('japan', { type: 'spinForMoney', perPip: 550_000, reason: 'Year-end Jumbo' }))

      expect(renderedRows()).toEqual(
        [1, 2, 3, 4, 5, 6].map((face) => [
          String(face),
          formatMoney(perPipPayout(550_000, face as SpinValue), edition.currency),
        ]),
      )
    })

    it('keeps the tile\'s own voice above the rows rather than replacing it', () => {
      const option = optionFor('japan', {
        type: 'spinForMoney',
        perPip: 550_000,
        reason: 'Year-end Jumbo',
      })
      show(option)
      expect(screen.getByText(/Year-end Jumbo/)).toBeInTheDocument()
      // …and the arithmetic it used to carry is gone, because six rows of it
      // are now sitting underneath.
      expect(option.description).not.toContain('a pip you roll')
    })

    /* A real table with real column headers, so the rows are not six pairs
       of bare numbers to anybody listening rather than looking. */
    it('reads as a table to a screen reader', () => {
      show(optionFor('japan', { type: 'payday' }))
      const table = screen.getByRole('table')
      expect(within(table).getByRole('columnheader', { name: 'Roll' })).toBeInTheDocument()
      expect(within(table).getByRole('columnheader', { name: 'Outcome' })).toBeInTheDocument()
      expect(table.querySelector('caption')?.textContent).toBe('What each roll of the die is worth')
    })

    /* Most rolls have nothing to tabulate — a single threshold, a flat
       charge — and must not grow an empty panel. */
    it('draws no table at all when the roll has no bands', () => {
      show({ description: "Roll — a 4 or higher and it's a yes outright." })
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })
})
