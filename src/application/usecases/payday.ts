import type { Money, Player, SpinValue } from '@domain/model/types'
import type { CurrencySpec, EconomyConstants } from '@domain/edition/types'
import { USA_CURRENCY, USA_ECONOMY } from '@domain/edition/usa'
import { paydayKindOf, paydayPayFor, payPlayerSalary, type PaydayKind } from '@domain/rules/player'
import type { NarrationText } from '../i18n/en'
import { EN } from '../i18n/en'
import { formatMoney, paydayReceipt } from './format'
import type { UseCaseDeps } from './types'

/**
 * Where the wheel gets spun for a payday.
 *
 * Casual and unsteady pay both depend on a spin, and the domain must not own
 * randomness — so the rolling lives here, and the domain keeps a pure
 * `paydayPayFor(player, spin)`. Crucially the rolling is *per payday*: a move
 * that sweeps past three paydays is three different weeks, not one week paid
 * three times, so `collectPaydays` spins once per payday and hands back what
 * each one was worth. `payPlayerSalary` takes a single spin for exactly this
 * reason — there is no longer any way to express "pay three at once".
 */

export interface PaydayPacket {
  readonly amount: Money
  /** The spin that produced it, or `null` when the packet is a flat salary. */
  readonly spin: SpinValue | null
}

export interface PaydayCollection {
  /** The player with every packet already credited. */
  readonly player: Player
  /** One entry per payday, in the order they were passed. */
  readonly packets: readonly PaydayPacket[]
  readonly total: Money
  /** How this player is paid — the same for every packet in one collection. */
  readonly kind: PaydayKind
}

/** Collects `times` paydays, rolling each one separately when pay is not flat. */
export function collectPaydays(
  player: Player,
  times: number,
  deps: UseCaseDeps,
  economy: EconomyConstants = USA_ECONOMY,
): PaydayCollection {
  const kind = paydayKindOf(player)
  const flat = kind === 'salary'

  let paid = player
  let total = 0
  const packets: PaydayPacket[] = []

  for (let i = 0; i < times; i += 1) {
    // A flat wage must not consume a spin: the packet does not depend on one,
    // and burning a roll would shift every later draw in the game.
    const spin: SpinValue = flat ? 1 : deps.random.spin()
    const amount = paydayPayFor(paid, spin, economy)
    paid = payPlayerSalary(paid, spin, economy)
    total += amount
    packets.push({ amount, spin: flat ? null : spin })
  }

  return { player: paid, packets, total, kind }
}

/** `'a 7'`, `'3 and 8'`, `'3, 8 and 2'`; empty when nothing was spun. */
export function describeSpins(packets: readonly PaydayPacket[], say: NarrationText = EN): string {
  const spins = packets.map((packet) => packet.spin).filter((spin): spin is SpinValue => spin !== null)
  if (spins.length === 0) return ''
  return say.payday.spinList(spins)
}

/**
 * The log line for paydays passed mid-move — identical in `spin` and `choose`,
 * and worded so a player can tell a wage packet from a week of shifts. Ends
 * on the balance it left behind, the same as every event this move swept
 * past now does — an amount with nothing to compare it to is a number, not
 * news.
 *
 * The count, the sum and the balance go to the catalogue as three arguments
 * rather than as a pre-glued string: "passes payday 3x" is English word order,
 * and a language that counts with a counter word has to build the whole
 * sentence itself.
 */
export function passedPaydayLine(
  playerName: string,
  collection: PaydayCollection,
  currency: CurrencySpec = USA_CURRENCY,
  say: NarrationText = EN,
): string {
  const times = collection.packets.length
  const money = formatMoney(collection.total, currency)
  const balance = formatMoney(collection.player.money, currency)
  if (collection.kind === 'salary') {
    // The × 12 breakdown only holds for one payday's worth — sweeping past
    // several in one move multiplies the total, and dividing that by 12 would
    // quote a monthly rate nobody is actually on.
    const total = times === 1 ? paydayReceipt(collection.total, currency, say) : money
    return say.payday.passedSalaryLog(playerName, times, total, balance)
  }

  const spins = describeSpins(collection.packets, say)
  if (collection.kind === 'casual') {
    return say.payday.passedCasualLog(playerName, times, spins, money, balance)
  }
  return say.payday.passedUnsteadyLog(playerName, times, spins, money, balance)
}
