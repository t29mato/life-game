import type { CurrencySpec } from '@domain/edition/types'
import type { LandingEvent } from '@domain/model/types'
import { formatMoneyDelta } from '../../format'
import { EN, type UiText } from '../../i18n/en'

/**
 * The footnote a landing card carries for everything the car merely drove
 * over on the way there.
 *
 * Passing tiles used to each stop the game with a card of their own
 * (v1.15.0 — see the note on `App.tsx`'s passing-event effect for why that
 * was right at the time and why it isn't now). They are shown as they happen
 * now, as a pop over the board, and this is the receipt: one line per *kind*
 * of thing passed, so the pathological case the playtest actually hit —
 * "Payday, Moving Out, Payday, Payday", four cards, three of them the same
 * card — reads as two lines instead of four dismissals.
 *
 * Grouping is by title, which is the tile's own name, because that is the
 * distinction a player is making when they say "three paydays". Order is
 * first-seen: the footnote reads in the order the car actually drove it,
 * never re-sorted by size, so it can be checked against the log.
 *
 * Money is summed across a group and *always* printed when any member of the
 * group moved money, even if the sum is zero — a payday of +$40,000 and a
 * bill of -$40,000 sharing a title is vanishingly unlikely, but "×2" with no
 * figure at all would be the one case where the aggregate hid something.
 */
export function summarizePassedEvents(
  events: readonly LandingEvent[],
  currency?: CurrencySpec,
  t: UiText = EN,
  /**
   * The tile's name in the reader's language, when there is one. Grouping
   * still happens on the English title — it is the stable key, and two tiles
   * that translate to the same words are still two tiles — so this only
   * decides what the finished line is *printed* with.
   */
  titleOf: (event: LandingEvent) => string = (event) => event.title,
): readonly string[] {
  const order: string[] = []
  const groups = new Map<string, { count: number; money: number; anyMoney: boolean; shown: string }>()

  for (const event of events) {
    const existing = groups.get(event.title)
    if (existing) {
      existing.count += 1
      existing.money += event.moneyDelta
      existing.anyMoney = existing.anyMoney || event.moneyDelta !== 0
      continue
    }
    order.push(event.title)
    groups.set(event.title, {
      count: 1,
      money: event.moneyDelta,
      anyMoney: event.moneyDelta !== 0,
      shown: titleOf(event),
    })
  }

  return order.map((title) => {
    const group = groups.get(title)!
    if (!group.anyMoney) return t.card.passed(group.shown, group.count)
    return t.card.passedWithMoney(group.shown, group.count, formatMoneyDelta(group.money, currency))
  })
}
