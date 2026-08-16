import type { Money, Player, SpinValue } from '@domain/model/types'
import type { CurrencySpec, EconomyConstants } from '@domain/edition/types'
import { USA_CURRENCY, USA_ECONOMY } from '@domain/edition/usa'
import { paydayKindOf, paydayPayFor, payPlayerSalary, type PaydayKind } from '@domain/rules/player'
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
export function describeSpins(packets: readonly PaydayPacket[]): string {
  const spins = packets.map((packet) => packet.spin).filter((spin): spin is SpinValue => spin !== null)
  if (spins.length === 0) return ''
  if (spins.length === 1) return `a ${spins[0]}`
  return `${spins.slice(0, -1).join(', ')} and ${spins[spins.length - 1]}`
}

/**
 * The log line for paydays passed mid-move — identical in `spin` and `choose`,
 * and worded so a player can tell a wage packet from a week of shifts.
 */
export function passedPaydayLine(
  playerName: string,
  collection: PaydayCollection,
  currency: CurrencySpec = USA_CURRENCY,
): string {
  const count = collection.packets.length > 1 ? ` ${collection.packets.length}x` : ''
  const money = formatMoney(collection.total, currency)
  if (collection.kind === 'salary') {
    // The × 12 breakdown only holds for one payday's worth — sweeping past
    // several in one move multiplies the total, and dividing that by 12 would
    // quote a monthly rate nobody is actually on.
    const total = collection.packets.length === 1 ? paydayReceipt(collection.total, currency) : money
    return `${playerName} passes payday${count}: ${total}.`
  }

  const spins = describeSpins(collection.packets)
  if (collection.kind === 'casual') {
    return `${playerName} picks up shifts passing payday${count}, spinning ${spins}: ${money}.`
  }
  return `${playerName} passes payday${count}, spinning ${spins}: ${money}.`
}
