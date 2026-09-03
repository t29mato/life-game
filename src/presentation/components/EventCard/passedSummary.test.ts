import { describe, expect, it } from 'vitest'
import type { LandingEvent } from '@domain/model/types'
import { JAPAN_CURRENCY } from '@domain/edition/japan'
import { summarizePassedEvents } from './passedSummary'

function passed(title: string, moneyDelta: number): LandingEvent {
  return {
    spaceId: `s-${title}-${moneyDelta}`,
    title,
    description: 'Passed through.',
    icon: 'space:payday',
    tone: 'green',
    moneyDelta,
    lifeTilesGained: [],
    notes: [],
  }
}

describe('summarizePassedEvents', () => {
  it('says nothing when nothing was passed', () => {
    expect(summarizePassedEvents([])).toEqual([])
  })

  it('names a single passed tile and what it was worth', () => {
    // Rows, not sentences: the card sets these as a two-column table, so the
    // word "Passed" is a column heading printed once rather than the opening
    // word of every line.
    expect(summarizePassedEvents([passed('Payday', 37_000)])).toEqual([
      { label: 'Payday', amount: '+$37,000' },
    ])
  })

  /*
   * The case the playtest actually hit: one five-tile move crossing three
   * paydays, which used to be three separate modal cards with three Continue
   * presses and no way to tell them apart. One line.
   */
  it('aggregates repeats of the same tile into one line with a count and a total', () => {
    expect(
      summarizePassedEvents([passed('Payday', 37_000), passed('Payday', 37_000), passed('Payday', 37_000)]),
    ).toEqual([{ label: 'Payday ×3', amount: '+$111,000' }])
  })

  it('keeps different tiles apart, in the order they were driven over', () => {
    expect(
      summarizePassedEvents([
        passed('Payday', 37_000),
        passed('Moving Out', -8_000),
        passed('Payday', 37_000),
      ]),
    ).toEqual([
      { label: 'Payday ×2', amount: '+$74,000' },
      { label: 'Moving Out', amount: '-$8,000' },
    ])
  })

  it('drops the figure entirely for a tile that moved no money', () => {
    expect(summarizePassedEvents([passed('Cap and Gown', 0)])).toEqual([{ label: 'Cap and Gown' }])
  })

  /*
   * A group where *some* member moved money still prints its total, even if
   * the total happens to come out at nothing — that is the one case where
   * dropping the figure would hide a real transaction inside an aggregate.
   */
  it('still prints a total of zero when the tiles in a group did move money', () => {
    expect(summarizePassedEvents([passed('Market Day', 5_000), passed('Market Day', -5_000)])).toEqual([
      { label: 'Market Day ×2', amount: '$0' },
    ])
  })

  it('prints in the edition currency it is handed', () => {
    expect(summarizePassedEvents([passed('給料日', 250_000)], JAPAN_CURRENCY)).toEqual([
      { label: '給料日', amount: '+¥250,000' },
    ])
  })
})
