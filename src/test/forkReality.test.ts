import { describe, expect, it } from 'vitest'

import { createGameStore } from '../application/createGameStore'
import { isFork, resolveForkBranch, roadIsOpenTo } from '../application/usecases/branch'
import {
  createInMemoryRepository,
  createInMemoryStatsRepository,
  createSeededRandom,
} from '../application/testing/fakes'
import { fixturePlayer } from '../application/testing/fixtures'
import { createBoard } from '../domain/board/createBoard'
import { allEditions } from '../domain/edition/registry'
import type { Edition } from '../domain/edition/types'
import { SPIN_FACES } from '../domain/model/constants'
import { DIFFICULTIES } from '../domain/rules/difficulty'
import type { Board, Difficulty, Player, PlayerColor, SpaceId, SpinValue } from '../domain/model/types'

/**
 * Every fork on every board, and whether it is actually a fork.
 *
 * The owner's report was one sentence: *"the second fork always sends me the
 * same way, so it is not a fork — and more forks is not automatically better."*
 * They were right, and the reason was three layers down from the route files:
 * a junction reached mid-move had its road settled by `stepsRemaining`, the
 * distance left over from a roll that had already spent pips getting there.
 * That number is never a 6, is a 5 only on a 6 thrown from the tile next door,
 * and piles up on 1, 2 and 3 — which `resolveForkBranch` reads as the *first*
 * road, the one `layoutFork` draws above the trunk. Measured across 40 seeded
 * four-player games on all seven boards at all three difficulties, the
 * mid-career junction sent 73-86% of everyone who reached it that way up the
 * first road. The two junctions a pawn always comes to rest on — the start
 * tile, and the `stop` at the estate agent's — split 50/50, because those two
 * were already settled by a press of their own.
 *
 * So the complaint was not about one board's content. It was a property of the
 * engine, it applied to every un-`stop` junction on every edition, and nothing
 * in the suite could see it: the fork balance tests pin a seat to a road by
 * loading the roll it is about to make, and a road settled without a press
 * cannot be loaded.
 *
 * This file is the guard that would have caught it. It walks every fork on
 * every edition at every difficulty and asks two things of each: that both
 * roads *exist* for somebody who qualifies for them, and that both roads
 * actually *get walked* in play, at odds near the even split the die promises.
 * Where a fork is legitimately one-sided — the grad-school and doctorate gates
 * — that is asserted as the specific gate it is, with the qualified and the
 * unqualified player checked separately, rather than skipped.
 */

interface ForkUnderTest {
  readonly forkId: SpaceId
  readonly roads: readonly [SpaceId, SpaceId]
  readonly names: readonly [string, string]
  /** The gate on each road, if any — `LaneIdentity.requires`. */
  readonly gates: readonly [string | undefined, string | undefined]
}

function forksOf(board: Board): readonly ForkUnderTest[] {
  return Object.values(board.spaces)
    .filter((space) => space.next.length > 1)
    .map((space) => {
      const [a, b] = space.next
      const roadA = board.spaces[a!]
      const roadB = board.spaces[b!]
      return {
        forkId: space.id,
        roads: [a!, b!] as const,
        names: [roadA?.lane?.name ?? a!, roadB?.lane?.name ?? b!] as const,
        gates: [roadA?.lane?.requires, roadB?.lane?.requires] as const,
      }
    })
}

/** Somebody who holds every qualification any road on any board can ask for. */
const fullyQualified = (spaceId: SpaceId): Player =>
  fixturePlayer({ spaceId, hasDegree: true, hasDoctorate: true })

/** Somebody who holds none of them. */
const unqualified = (spaceId: SpaceId): Player =>
  fixturePlayer({ spaceId, hasDegree: false, hasDoctorate: false })

const FACES: readonly SpinValue[] = Array.from(
  { length: SPIN_FACES },
  (_, i) => (i + 1) as SpinValue,
)

const CASES: readonly { readonly edition: Edition; readonly difficulty: Difficulty }[] =
  allEditions().flatMap((edition) => DIFFICULTIES.map((difficulty) => ({ edition, difficulty })))

const label = (edition: Edition, difficulty: Difficulty) => `${edition.id} @ ${difficulty}`

describe('every fork offers two roads, on every board and every difficulty', () => {
  it.each(CASES)('$edition.id @ $difficulty', ({ edition, difficulty }) => {
    const board = createBoard(difficulty, edition)
    const forks = forksOf(board)

    // A board with no fork is not a board this game plays.
    expect(forks.length, `${label(edition, difficulty)} has no forks at all`).toBeGreaterThan(0)

    for (const fork of forks) {
      const where = `${label(edition, difficulty)}, fork "${fork.forkId}"`

      // Two roads, two different roads, two different names. `validateRoute`
      // says this about the route as written; this says it about the board
      // that difficulty actually built, which is not the same statement — a
      // lane can lose every tile it had to `appearsFrom`.
      expect(fork.roads[0], `${where} points both roads at the same tile`).not.toBe(fork.roads[1])
      expect(fork.names[0], `${where} names both roads the same`).not.toBe(fork.names[1])
      for (const [index, roadId] of fork.roads.entries()) {
        const road = board.spaces[roadId]
        expect(road, `${where} road ${index} ("${roadId}") is not on the board`).toBeDefined()
        expect(
          road!.lane?.name,
          `${where} road ${index} has no lane name, so the fork offers a tile instead of a road`,
        ).toBeTruthy()
      }

      /*
       * The die itself: three faces down each road, for somebody who
       * qualifies for both. This is the assertion the mid-move bug could
       * never have failed, because it never asked the die.
       */
      const qualified = fullyQualified(fork.forkId)
      const byFace = FACES.map((face) => resolveForkBranch(board, fork.forkId, face, qualified))
      expect(
        byFace.filter((road) => road === fork.roads[0]).length,
        `${where}: "${fork.names[0]}" should take the low half of the die`,
      ).toBe(SPIN_FACES / 2)
      expect(
        byFace.filter((road) => road === fork.roads[1]).length,
        `${where}: "${fork.names[1]}" should take the high half of the die`,
      ).toBe(SPIN_FACES / 2)
    }
  })
})

/**
 * The gated roads, named and justified rather than skipped.
 *
 * Two boards' worth of junction is deliberately one-sided, and it has to stay
 * possible to tell that from a broken one. A gate is one-sided *only* for a
 * player who does not hold the qualification, it is the only reason a road may
 * be withheld, and the same fork must open both ways for somebody who does.
 */
describe('a one-sided fork is one-sided for exactly one stated reason', () => {
  it.each(CASES)('$edition.id @ $difficulty', ({ edition, difficulty }) => {
    const board = createBoard(difficulty, edition)

    for (const fork of forksOf(board)) {
      const where = `${label(edition, difficulty)}, fork "${fork.forkId}"`
      const gated = fork.gates.filter((gate) => gate !== undefined)

      // Never both: a junction nobody can leave is a broken board.
      expect(gated.length, `${where} gates both of its roads`).toBeLessThan(2)
      for (const gate of gated) {
        expect(
          gate,
          `${where} is gated on "${gate}", which is not a qualification the engine awards`,
        ).toMatch(/^(degree|doctorate)$/)
      }

      if (gated.length === 0) {
        // Ungated: open to a school-leaver, both ways, on every board.
        const nobody = unqualified(fork.forkId)
        for (const roadId of fork.roads) {
          expect(
            roadIsOpenTo(board, roadId, nobody),
            `${where} withholds "${roadId}" from a player with no qualifications, but names no gate`,
          ).toBe(true)
        }
        const byFace = new Set(
          FACES.map((face) => resolveForkBranch(board, fork.forkId, face, nobody)),
        )
        expect(
          byFace,
          `${where} is ungated but sends an unqualified player only one way`,
        ).toEqual(new Set(fork.roads))
        continue
      }

      /*
       * Gated. The whole of what a gate is allowed to do: withhold its own
       * road from a player who has not earned it, send that player down the
       * other one on every face of the die, and open normally for a player who
       * has. Anything else at this junction is a bug wearing a gate's clothes.
       */
      const gateIndex = fork.gates.findIndex((gate) => gate !== undefined)
      const gate = fork.gates[gateIndex]!
      const openRoad = fork.roads[gateIndex === 0 ? 1 : 0]

      const without = unqualified(fork.forkId)
      expect(
        roadIsOpenTo(board, fork.roads[gateIndex]!, without),
        `${where}: "${fork.names[gateIndex]}" is gated on the ${gate} and must stay shut without one`,
      ).toBe(false)
      for (const face of FACES) {
        expect(
          resolveForkBranch(board, fork.forkId, face, without),
          `${where}: a player with no ${gate} must be sent down "${fork.names[gateIndex === 0 ? 1 : 0]}" on a ${face}`,
        ).toBe(openRoad)
      }

      // And it opens for whoever earned it — the half of the promise that a
      // gate quietly turning into a wall would break.
      const qualified =
        gate === 'doctorate'
          ? fixturePlayer({ spaceId: fork.forkId, hasDegree: true, hasDoctorate: true })
          : fixturePlayer({ spaceId: fork.forkId, hasDegree: true })
      const byFace = new Set(FACES.map((face) => resolveForkBranch(board, fork.forkId, face, qualified)))
      expect(
        byFace,
        `${where}: a player holding the ${gate} must be offered both roads`,
      ).toEqual(new Set(fork.roads))
    }
  })
})

/**
 * And the part that actually catches it: both roads get walked, in play.
 *
 * Everything above reads the board and calls `resolveForkBranch` directly, and
 * every one of those assertions passed on the tree that had the bug — because
 * the bug was never in the rule, it was in what the rule got handed. This
 * plays whole games and counts which road each seat is actually sent down.
 *
 * 20 seeds x 4 seats is 80 crossings of every fork on every board (each seat
 * crosses each junction exactly once), which puts a fair 50/50 at 40 ± 4.5.
 * The bound is 20 — four and a half standard errors below the even split, and
 * comfortably above the 10-19 the old rule produced at the mid-career and
 * wedding junctions.
 */
describe('both roads out of every fork are walked in a real game', () => {
  const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1)

  const walk = (edition: Edition, difficulty: Difficulty) => {
    const board = createBoard(difficulty, edition)
    /** Road name -> times a seat was sent down it. */
    const taken = new Map<string, number>()
    /** Fork id -> times a seat reached it holding neither road's qualification. */
    const gatedShut = new Map<SpaceId, number>()

    for (const seed of SEEDS) {
      const store = createGameStore({
        random: createSeededRandom(seed),
        repository: createInMemoryRepository(),
        stats: createInMemoryStatsRepository(),
      })
      const colors: PlayerColor[] = ['red', 'blue', 'green', 'yellow']
      store.dispatch({
        type: 'startGame',
        config: {
          difficulty,
          editionId: edition.id,
          players: colors.map((color, i) => ({ name: `P${i + 1}`, color, isCpu: false })),
        },
      })

      let dispatches = 0
      while (store.getState().phase !== 'gameOver' && dispatches < 20_000) {
        const state = store.getState()
        const player = state.players[state.currentPlayerIndex]!
        switch (state.phase) {
          case 'awaitingSpin': {
            const at = player.spaceId
            const atAFork = state.chosenExit === null && isFork(state.board, at)
            const open = atAFork
              ? state.board.spaces[at]!.next.filter((road) => roadIsOpenTo(state.board, road, player))
              : []
            const before = state.log.length
            store.dispatch({ type: 'spin' })
            if (atAFork) {
              if (open.length < 2) {
                gatedShut.set(at, (gatedShut.get(at) ?? 0) + 1)
              } else {
                // `spin` names the road it sent them down, and a board's lane
                // names are unique (asserted below), so the log is the record.
                const line = store.getState().log.slice(before).map((entry) => entry.message).join(' ')
                const road = state.board.spaces[at]!.next
                  .map((id) => state.board.spaces[id]?.lane?.name)
                  .find((name) => name !== undefined && line.includes(`onto ${name}`))
                expect(road, `no road named in the log at "${at}" on ${label(edition, difficulty)}`).toBeDefined()
                taken.set(road!, (taken.get(road!) ?? 0) + 1)
              }
            }
            break
          }
          case 'awaitingDistanceSpin':
            store.dispatch({ type: 'spin' })
            break
          case 'moving':
          case 'passingEvent':
            store.dispatch({ type: 'settle' })
            break
          case 'awaitingDecision': {
            const offered = state.pendingDecision?.options ?? []
            store.dispatch({ type: 'choose', optionId: offered[seed % offered.length]!.id })
            break
          }
          case 'scoring':
            store.dispatch({ type: 'scoreRoll' })
            break
          case 'resolved':
            store.dispatch({ type: 'endTurn' })
            break
          default:
            throw new Error(`the game stalled in phase "${state.phase}"`)
        }
        dispatches += 1
      }
    }
    return { board, taken, gatedShut }
  }

  /** Four seats, twenty seeds, one crossing of each junction per seat. */
  const CROSSINGS = SEEDS.length * 4
  /** Four and a half standard errors below an even split of that. */
  const FLOOR = 20

  it.each(CASES)('$edition.id @ $difficulty', ({ edition, difficulty }) => {
    const { board, taken, gatedShut } = walk(edition, difficulty)
    const forks = forksOf(board)

    // The log is only a usable record if a road's name belongs to one road.
    const everyName = forks.flatMap((fork) => [...fork.names])
    expect(new Set(everyName).size, `${label(edition, difficulty)} reuses a lane name`).toBe(
      everyName.length,
    )

    for (const fork of forks) {
      const where = `${label(edition, difficulty)}, fork "${fork.forkId}"`
      const shut = gatedShut.get(fork.forkId) ?? 0
      const offered = CROSSINGS - shut
      const counts = fork.names.map((name) => taken.get(name) ?? 0)

      if (fork.gates.some((gate) => gate !== undefined)) {
        // A gated fork is only a fork for the qualified half of the table, so
        // the floor is scaled to how many of them there were. It still has to
        // be a fork for them: a gate that quietly swallowed the road as well
        // would show up here as a zero.
        expect(
          offered,
          `${where} is gated and nobody at all qualified in ${CROSSINGS} crossings`,
        ).toBeGreaterThan(CROSSINGS / 4)
        for (const [index, count] of counts.entries()) {
          expect(
            count,
            `${where}: only ${count} of ${offered} qualified seats took "${fork.names[index]}"`,
          ).toBeGreaterThan(offered / 5)
        }
        continue
      }

      expect(counts[0]! + counts[1]!, `${where} was not crossed by every seat`).toBe(CROSSINGS)
      for (const [index, count] of counts.entries()) {
        expect(
          count,
          `${where}: only ${count} of ${CROSSINGS} seats were sent down "${fork.names[index]}" — ` +
            'a road the die is supposed to pick half the time',
        ).toBeGreaterThanOrEqual(FLOOR)
      }
    }
  })
})
