import type {
  GameResults,
  GameState,
  Money,
  Player,
  RollAmountRow,
  ScoreRoll,
  ScoreRollKind,
  SpinValue,
} from '@domain/model/types'
import type { Edition } from '@domain/edition/types'
import { editionOf } from '@domain/edition/registry'
import { findStock } from '@domain/edition/lookup'
import { scaleResale, scaleStockPayout } from '@domain/rules/difficulty'
import { computeResults } from '@domain/rules/scoring'
import { SETTLEMENT_FACES, settlementValue } from '@domain/rules/settlement'
import { formatMoney } from './format'
import type { UseCaseDeps } from './types'

/**
 * The closing settlement, from the queue of dice it owes to the results the
 * faces they land on add up to.
 *
 * All of this used to be four lines inside `endTurn`: the instant the last
 * player retired, `computeResults` ran, every house and every holding drew a
 * uniform integer out of the random port, and the player was dropped onto the
 * results screen with every figure already decided and no die ever on screen.
 * The log even called it a roll. See `@domain/rules/settlement` for why a
 * six-band ladder is what makes a real die able to decide these at all.
 *
 * Nothing here is edition-specific: the ladder spans whatever `resaleRange`
 * and `payoutRange` the edition's own catalogue carries, in whatever unit its
 * currency rounds payouts to, so all five editions get this the moment it
 * lands with no content of their own to write.
 */

/** What `player`'s home fetches on `face`, after difficulty takes its cut. */
function houseValueAt(player: Player, face: SpinValue, state: GameState, edition: Edition): Money {
  if (!player.house) return 0
  const rolled = settlementValue(player.house.resaleRange, face, edition.currency.payoutRounding)
  return scaleResale(rolled, state.difficulty, edition)
}

/**
 * What every share `player` holds fetches together on `face` — one closing
 * price read across the whole portfolio, each holding at its own band. A
 * holding whose stock has left the catalogue is worth nothing rather than
 * throwing, exactly as `cashOutStocks` treats it at scoring time.
 */
function marketValueAt(player: Player, face: SpinValue, state: GameState, edition: Edition): Money {
  return player.stocks.reduce((sum, holding) => {
    const stock = findStock(holding.stockId, edition)
    if (!stock) return sum
    const rolled = settlementValue(stock.payoutRange, face, edition.currency.payoutRounding)
    return sum + scaleStockPayout(rolled, state.difficulty, edition) * holding.shares
  }, 0)
}

/**
 * What `player`'s life policy matured into on `face`.
 *
 * Difficulty takes no cut here, unlike a house or a share. The maturity is
 * priced against the premium the player already paid, and that premium is the
 * same sum on every board — see an edition's `insurancePremium` for why it is
 * flat — so scaling one side of a fixed-price bet and not the other would
 * turn a fair product into a trap on Very Hard and a gift on Normal.
 */
function policyValueAt(player: Player, face: SpinValue, edition: Edition): Money {
  if (!player.insurance.includes('life')) return 0
  return settlementValue(edition.economy.lifeInsuranceMaturity, face, edition.currency.payoutRounding)
}

/** What one of this player's closing dice pays on `face`. */
export function scoreRollValue(
  state: GameState,
  player: Player,
  kind: ScoreRollKind,
  face: SpinValue,
  edition: Edition = editionOf(state),
): Money {
  switch (kind) {
    case 'house':
      return houseValueAt(player, face, state, edition)
    case 'market':
      return marketValueAt(player, face, state, edition)
    case 'policy':
      return policyValueAt(player, face, edition)
  }
}

/** True when this player holds shares in something the catalogue still lists. */
function holdsShares(player: Player, edition: Edition): boolean {
  return player.stocks.some((holding) => holding.shares > 0 && findStock(holding.stockId, edition) !== undefined)
}

/**
 * Every die the closing settlement owes, in seat order: house, then shares,
 * then a maturing life policy.
 *
 * A player with neither a home, a holding nor a policy contributes nothing and
 * is simply not in the queue — there is no die to throw for them, and an empty
 * step with "nothing to settle" written on it would be a press for its own
 * sake. Same bargain the rest of the engine strikes wherever there is nothing
 * to do (`driverGearFamily`, `roadIsOpenTo`): fail closed, don't invent a
 * step. A table where *nobody* holds anything therefore yields an empty
 * queue, which `endTurn` reads as "score it now" and goes straight to the
 * results screen.
 */
export function buildScoreRolls(state: GameState, edition: Edition = editionOf(state)): readonly ScoreRoll[] {
  const rolls: ScoreRoll[] = []
  for (const player of state.players) {
    if (player.house) rolls.push({ playerId: player.id, kind: 'house', face: null })
    if (holdsShares(player, edition)) rolls.push({ playerId: player.id, kind: 'market', face: null })
    if (player.insurance.includes('life')) rolls.push({ playerId: player.id, kind: 'policy', face: null })
  }
  return rolls
}

/** The next die still owed, or null once every one of them has landed. */
export function nextScoreRoll(rolls: readonly ScoreRoll[]): ScoreRoll | null {
  return rolls.find((roll) => roll.face === null) ?? null
}

/** Everything the shell needs to put one closing die on screen. */
export interface ScoreRollPrompt {
  readonly playerId: string
  /** True when the seat being scored is played by the computer. */
  readonly isCpu: boolean
  readonly prompt: string
  readonly stakes: string
  /** The ladder this die is read off — all six bands, published before the throw. */
  readonly table: readonly RollAmountRow[]
}

/**
 * The card around one closing die: whose it is, what is riding on it, and the
 * ladder it will be read off.
 *
 * The table is the whole reason this is honest rather than theatre. A player
 * sees all six bands before the throw, watches the die land, and reads their
 * own number off the row it landed on — the same contract a tuition bill or a
 * career fair has always offered, now extended to the biggest number on the
 * results screen. Null for a roll whose player has since left the state,
 * which no live game can produce but a corrupt save could.
 */
export function describeScoreRoll(state: GameState, roll: ScoreRoll): ScoreRollPrompt | null {
  const player = state.players.find((entry) => entry.id === roll.playerId)
  if (!player) return null
  const edition = editionOf(state)
  const currency = edition.currency

  const table: readonly RollAmountRow[] = SETTLEMENT_FACES.map((face) => ({
    range: String(face),
    amount: formatMoney(scoreRollValue(state, player, roll.kind, face, edition), currency),
  }))

  if (roll.kind === 'house') {
    return {
      playerId: player.id,
      isCpu: player.isCpu,
      prompt: `${player.name}'s house`,
      stakes: `${player.house?.name ?? 'The house'} goes on the market. Whatever the die says is what the buyer pays.`,
      table,
    }
  }

  if (roll.kind === 'policy') {
    return {
      playerId: player.id,
      isCpu: player.isCpu,
      prompt: `${player.name}'s life policy`,
      stakes:
        `The policy matures. What it paid for over a lifetime is what the fund made, ` +
        `and the die is the fund.`,
      table,
    }
  }

  const shares = player.stocks.reduce((sum, holding) => sum + holding.shares, 0)
  const companies = player.stocks.filter((holding) => holding.shares > 0).length
  return {
    playerId: player.id,
    isCpu: player.isCpu,
    prompt: `${player.name}'s shares`,
    stakes:
      `${shares} ${shares === 1 ? 'share' : 'shares'} in ` +
      `${companies} ${companies === 1 ? 'company' : 'companies'} cash out at whatever the market closes on.`,
    table,
  }
}

/** The line the log keeps for a die that has landed. */
export function scoreRollLogLine(state: GameState, roll: ScoreRoll, face: SpinValue): string {
  const player = state.players.find((entry) => entry.id === roll.playerId)
  const edition = editionOf(state)
  const name = player?.name ?? 'A player'
  const amount = player ? formatMoney(scoreRollValue(state, player, roll.kind, face, edition), edition.currency) : '?'
  switch (roll.kind) {
    case 'house':
      return `Rolled a ${face} — ${name}'s house sold for ${amount}.`
    case 'market':
      return `Rolled a ${face} — ${name}'s shares cashed out at ${amount}.`
    case 'policy':
      return `Rolled a ${face} — ${name}'s life policy matured at ${amount}.`
  }
}

/**
 * The final standings, read off the faces the settlement's dice landed on.
 *
 * `computeResults` already took its resale and share valuations as injected
 * functions — the domain owns no randomness — so nothing there had to change
 * beyond letting those functions see *whose* asset they are pricing, which is
 * the one question a per-player settlement has to be able to answer. What
 * arrives here is therefore not a fresh set of numbers but a lookup into dice
 * the player has already watched land.
 *
 * A holding with no face recorded against it — impossible from
 * `buildScoreRolls`, but reachable from a hand-built or corrupted state — is
 * priced at the middle of its own range rather than crashing or quietly
 * reaching for the random port again. That is the same "no dice to hand"
 * convention `scoreChildren` and `estimateNetWorth` already use, and it is
 * the one fallback that cannot reintroduce an unwatched roll.
 */
export function resultsFromScoreRolls(state: GameState, deps: UseCaseDeps): GameResults {
  const edition = editionOf(state)
  const faceFor = (player: Player, kind: ScoreRollKind): SpinValue | null =>
    state.scoreRolls.find((roll) => roll.playerId === player.id && roll.kind === kind)?.face ?? null

  /** The midpoint of a ladder with no die behind it: faces 3 and 4 averaged. */
  const midpoint = (low: Money, high: Money): Money => (low + high) / 2

  return computeResults(
    state.players,
    (_house, player) => {
      const face = faceFor(player, 'house')
      if (face !== null) return houseValueAt(player, face, state, edition)
      return midpoint(houseValueAt(player, 3, state, edition), houseValueAt(player, 4, state, edition))
    },
    (stock, player) => {
      // `computeResults` multiplies by the holding's share count itself, so
      // this is the per-share figure — one share's band, not the portfolio's
      // total, which is what `marketValueAt` above adds up for the table.
      const face = faceFor(player, 'market')
      const perShare = (at: SpinValue): Money =>
        scaleStockPayout(
          settlementValue(stock.payoutRange, at, edition.currency.payoutRounding),
          state.difficulty,
          edition,
        )
      if (face !== null) return perShare(face)
      return midpoint(perShare(3), perShare(4))
    },
    state.difficulty,
    edition,
    () => deps.random.spin(),
    (player) => {
      const face = faceFor(player, 'policy')
      if (face !== null) return policyValueAt(player, face, edition)
      return midpoint(policyValueAt(player, 3, edition), policyValueAt(player, 4, edition))
    },
  )
}
