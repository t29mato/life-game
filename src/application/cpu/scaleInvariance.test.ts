import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import type { GameState, Player, PlayerColor, Space } from '@domain/model/types'
import { EDITION_USA } from '@domain/edition/usa'
import { registerEdition } from '@domain/edition/registry'
import { scaleBoard, scaleEdition, scaleEffect } from '@domain/edition/scale'
import { createSeededRandom } from '../testing/fakes'
import { fixturePlayer, fixtureSpace, fixtureState } from '../testing/fixtures'
import { startGame } from '../usecases/startGame'
import { spin } from '../usecases/spin'
import { settle } from '../usecases/settle'
import { choose } from '../usecases/choose'
import { endTurn } from '../usecases/endTurn'
import { decideCpuCommand, valueOfSpace } from './decideCpuCommand'

/**
 * The computer must not know what a dollar is.
 *
 * `decideCpuCommand` carried a handful of raw dollar figures — the cash it
 * likes to keep free, the balance below which it starts flinching, and the
 * flat prices in its effect-valuation table. On an edition counting in a unit
 * a hundred times larger those figures are silently a hundred times too small,
 * and *nothing fails*: no exception, no wrong type, no red test. The computer
 * simply plays like a mouse — never insures, never buys a house, never keeps a
 * reserve — and the only way to notice is to watch a whole game and wonder why
 * the CPU seats lost.
 *
 * So this is the test that makes a second edition safe to build: the same
 * board, priced in a hundred-times unit, must produce the identical decision
 * from the identical position. Every seat is a computer seat, so the games are
 * *nothing but* CPU decisions from the first fork to retirement.
 */

const FACTOR = 100

const EDITION_X100 = scaleEdition(EDITION_USA, FACTOR, { id: 'test-usa-x100' })
registerEdition(EDITION_X100)

const COLORS: PlayerColor[] = ['red', 'blue', 'green', 'yellow']

interface Transcript {
  /** Every command the computer issued, in order. */
  readonly commands: readonly string[]
  /** Every seat's cash, loans and wage at each of those moments. */
  readonly money: readonly number[][]
  readonly loans: readonly number[][]
  readonly salaries: readonly (number | null)[][]
}

/**
 * Plays a whole all-CPU game and records what the computer did and what it had
 * to work with.
 *
 * The ×100 game is built by starting the USA game and multiplying it, rather
 * than by asking the scaled edition for a board of its own. That is not a
 * shortcut around the seam: an edition owns its route now, but a route is
 * written by hand in one country's money, so `scaleEdition` — which exists to
 * make a *test double*, not a country — carries the USA route unchanged.
 * Multiplying the finished board gives exactly the board a hand-written ×100
 * route would build, because rounding to a unit a hundred times coarser after
 * multiplying by a hundred is the same figure either way round.
 */
const cpuTranscript = (seed: number, scaled: boolean, difficulty: 'normal' | 'hard' | 'veryHard'): Transcript => {
  const deps = { random: createSeededRandom(seed) }
  let state = startGame(
    {
      boardLength: 'standard',
      difficulty,
      editionId: EDITION_USA.id,
      players: COLORS.map((color, i) => ({ name: `Player ${i + 1}`, color, isCpu: true })),
    },
    deps,
  )
  if (scaled) {
    state = {
      ...state,
      editionId: EDITION_X100.id,
      board: scaleBoard(state.board, FACTOR),
      players: state.players.map((player) => ({ ...player, money: player.money * FACTOR })),
    }
  }

  const commands: string[] = []
  const money: number[][] = []
  const loans: number[][] = []
  const salaries: (number | null)[][] = []
  let steps = 0
  while (state.phase !== 'gameOver' && steps < 5_000) {
    steps += 1
    if (state.phase === 'moving') {
      state = settle(state, deps)
      continue
    }
    const command = decideCpuCommand(state)
    expect(command, `CPU had nothing to do in phase "${state.phase}"`).not.toBeNull()
    commands.push(command!.type === 'choose' ? `choose:${command!.optionId}` : command!.type)
    money.push(state.players.map((player) => player.money))
    loans.push(state.players.map((player) => player.loans))
    salaries.push(state.players.map((player) => player.career?.salary ?? null))

    switch (command!.type) {
      case 'spin':
        state = spin(state, deps)
        break
      case 'choose':
        state = choose(state, command!.optionId, deps)
        break
      case 'endTurn':
        state = endTurn(state, deps)
        break
      default:
        throw new Error(`unexpected CPU command ${command!.type}`)
    }
  }
  expect(state.phase).toBe('gameOver')
  return { commands, money, loans, salaries }
}

const expectSameGame = (seed: number, difficulty: 'normal' | 'hard' | 'veryHard'): void => {
  const dollars = cpuTranscript(seed, false, difficulty)
  const scaled = cpuTranscript(seed, true, difficulty)

  // A real game, not an empty one: these run to well over a hundred commands.
  expect(dollars.commands.length).toBeGreaterThan(50)
  expect(scaled.commands).toEqual(dollars.commands)

  // The decisions matching is the headline, but it could in principle match by
  // luck. What the seats are holding when they decide has to line up too, or
  // the two games only look alike. Loans and wages are exact.
  expect(scaled.loans).toEqual(dollars.loans)
  dollars.salaries.forEach((row, step) => {
    row.forEach((salary, seat) => {
      expect(scaled.salaries[step]![seat]).toBe(salary === null ? null : salary * FACTOR)
    })
  })

  /*
   * Cash comes within the equivalent of $100 over a whole game rather than
   * matching to the penny, and there is exactly one reason for the gap:
   * `applyPayRaise` moves an unsteady trade's pip rate by
   * `Math.round(raiseStep / AVERAGE_SPIN)`, and rounding to a whole unit is
   * not a linear operation — a courier's rate lands on 14,473 here and on
   * 1,447,273 rather than 1,447,300 there. Multiplied by a spin and collected
   * a dozen times, that compounds to a few hundred yen-equivalent, which is
   * $5.40 of the board this is measured against.
   *
   * It is a rounding rule the USA board already has, not a dollar figure left
   * behind, and straightening it would change what a raise is worth on the
   * board that exists today. The bound is still worth asserting because it is
   * two orders of magnitude tighter than any leak could hide in: a constant
   * still quoted in dollars puts a seat out by a whole premium, a whole loan
   * or a factor of a hundred.
   */
  const tolerance = FACTOR * 100
  dollars.money.forEach((row, step) => {
    row.forEach((amount, seat) => {
      expect(Math.abs(scaled.money[step]![seat]! - amount * FACTOR)).toBeLessThanOrEqual(tolerance)
    })
  })
}

describe('the CPU decides the same game in any currency', () => {
  it.each(Array.from({ length: 40 }, (_, i) => i + 1))('plays seed %i identically at ×100', (seed) => {
    expectSameGame(seed, 'normal')
  })

  it.each(['hard', 'veryHard'] as const)('plays %s identically at ×100', (difficulty) => {
    // Difficulty is where the money is easiest to leave behind: the loan rates
    // and the tile-rounding unit are both edition data now, and a board that
    // rounded scaled bills to $100 in a ×100 world would drift immediately.
    for (const seed of [4, 5]) expectSameGame(seed, difficulty)
  })
})

describe('the CPU holds no sum of money of its own', () => {
  /*
   * A fitness function, in the style of `src/test/architecture.test.ts`, and
   * the belt to the games' braces.
   *
   * Playing whole games proves the computer *behaves* the same at another
   * scale, but only where a seat actually reaches the position a given weight
   * decides. The lane-risk floor, for instance, only bites on a fork taken by
   * a seat that is short of cash, which forty seeded games do not always
   * arrange. So this asserts the property directly at the source: after the
   * comments and the animation timings are removed, no number large enough to
   * be a sum of money is left in the file at all. Every such figure is now a
   * count of units, and the unit comes from the edition.
   */
  it('leaves no absolute money figure in decideCpuCommand.ts', () => {
    const file = resolve(process.cwd(), 'src/application/cpu/decideCpuCommand.ts')
    const source = readFileSync(file, 'utf8')
      // Comments quote plenty of real dollar figures, and should: they are the
      // record of why the weights are what they are.
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      // Milliseconds, not money — the only numbers here that are not a price.
      .replace(/export const CPU_THINK_MS[\s\S]*?\n}/, '')

    const suspicious = [...source.matchAll(/\b\d[\d_]*\b/g)]
      .map((match) => match[0])
      .filter((literal) => Number(literal.replace(/_/g, '')) >= 1_000)

    expect(suspicious).toEqual([])
  })
})

describe('every effect the CPU prices scales with the edition', () => {
  const scaledState = (state: GameState): GameState => ({ ...state, editionId: EDITION_X100.id })

  const scaledSpace = (space: Space): Space => ({ ...space, effect: scaleEffect(space.effect, FACTOR) })

  /** The same player, with every sum on them multiplied. */
  const scaledPlayer = (player: Player): Player => ({
    ...player,
    money: player.money * FACTOR,
    career: player.career
      ? {
          ...player.career,
          salary: player.career.salary * FACTOR,
          raiseStep: player.career.raiseStep * FACTOR,
        }
      : null,
    lifeTiles: player.lifeTiles.map((tile) => ({ ...tile, value: tile.value * FACTOR })),
  })

  const CASES: readonly { readonly name: string; readonly space: Space }[] = [
    { name: 'gainMoney', space: fixtureSpace({ effect: { type: 'gainMoney', amount: 3_000, reason: 'Prize' } }) },
    { name: 'payMoney', space: fixtureSpace({ effect: { type: 'payMoney', amount: 2_000, reason: 'Bill' } }) },
    { name: 'payday', space: fixtureSpace({ kind: 'payday', effect: { type: 'payday' } }) },
    { name: 'payRaise', space: fixtureSpace({ effect: { type: 'payRaise' } }) },
    { name: 'tuition', space: fixtureSpace({ effect: { type: 'tuition', reason: 'College tuition' } }) },
    { name: 'gainLifeTiles', space: fixtureSpace({ effect: { type: 'gainLifeTiles', count: 2 } }) },
    { name: 'chooseCareer', space: fixtureSpace({ effect: { type: 'chooseCareer', pool: 'basic' } }) },
    { name: 'graduate', space: fixtureSpace({ effect: { type: 'graduate' } }) },
    { name: 'getMarried', space: fixtureSpace({ effect: { type: 'getMarried' } }) },
    { name: 'haveChildren', space: fixtureSpace({ effect: { type: 'haveChildren', count: 2, celebrationPerPip: 500 } }) },
    { name: 'buyHouse', space: fixtureSpace({ effect: { type: 'buyHouse' } }) },
    { name: 'upgradeHouse', space: fixtureSpace({ effect: { type: 'upgradeHouse' } }) },
    { name: 'collectFromEach', space: fixtureSpace({ effect: { type: 'collectFromEach', amount: 800, reason: 'Whip-round' } }) },
    { name: 'payEach', space: fixtureSpace({ effect: { type: 'payEach', amount: 800, reason: 'Round' } }) },
    { name: 'spinForMoney', space: fixtureSpace({ effect: { type: 'spinForMoney', perPip: 700, reason: 'Scratch card' } }) },
    { name: 'retire', space: fixtureSpace({ kind: 'retirement', effect: { type: 'retire' } }) },
    { name: 'careerChange', space: fixtureSpace({ effect: { type: 'careerChange', reason: 'Restructure' } }) },
    { name: 'loseCareer', space: fixtureSpace({ effect: { type: 'loseCareer', reason: 'Layoff' } }) },
    { name: 'buyStock', space: fixtureSpace({ effect: { type: 'buyStock' } }) },
    { name: 'stockDividend', space: fixtureSpace({ effect: { type: 'stockDividend', perShare: 400, reason: 'Dividend' } }) },
    { name: 'buyInsurance', space: fixtureSpace({ effect: { type: 'buyInsurance', kinds: ['home'] } }) },
    { name: 'bank', space: fixtureSpace({ effect: { type: 'bank' } }) },
    { name: 'payPerChild', space: fixtureSpace({ effect: { type: 'payPerChild', amount: 900, reason: 'School' } }) },
    { name: 'collectPerChild', space: fixtureSpace({ effect: { type: 'collectPerChild', amount: 900, reason: 'Allowance' } }) },
    { name: 'swapMoneyWithLeader', space: fixtureSpace({ effect: { type: 'swapMoneyWithLeader', reason: 'Swap' } }) },
    { name: 'stealLifeTile', space: fixtureSpace({ effect: { type: 'stealLifeTile', reason: 'Steal' } }) },
    { name: 'none', space: fixtureSpace({ effect: { type: 'none' } }) },
  ]

  it.each(CASES)('values $name a hundred times higher on a ×100 board', ({ space }) => {
    const player = fixturePlayer({
      money: 30_000,
      loans: 1,
      children: 2,
      career: EDITION_USA.careers.basic[0]!,
      lifeTiles: [EDITION_USA.lifeTiles[0]!],
      stocks: [{ stockId: EDITION_USA.stocks[0]!.id, shares: 2 }],
    })
    const rival = fixturePlayer({ id: 'p2', name: 'Bo', money: 90_000, lifeTiles: [EDITION_USA.lifeTiles[1]!] })
    const base = fixtureState({ players: [player, rival] })

    const scaledPlayers = [scaledPlayer(player), scaledPlayer(rival)]
    const scaled = scaledState({ ...base, players: scaledPlayers })

    const dollars = valueOfSpace(space, player, base, 8)
    const yen = valueOfSpace(scaledSpace(space), scaledPlayers[0]!, scaled, 8)

    // A floating-point tolerance, not a fudge: the averages behind a few of
    // these are means over a catalogue, so the product can differ in the last
    // representable bit. A missed constant would be out by a factor of a
    // hundred, not by an ulp.
    expect(yen).toBeCloseTo(dollars * FACTOR, 6)
  })
})
