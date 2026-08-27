import { describe, expect, it } from 'vitest'

import { createGameStore } from '../../../application/createGameStore'
import { decideCpuCommand } from '../../../application/cpu/decideCpuCommand'
import {
  createInMemoryRepository,
  createInMemoryStatsRepository,
  createSeededRandom,
} from '../../../application/testing/fakes'
import type { BoardLength, Difficulty, GameState, PlayerColor, SpaceId } from '../../model/types'
import { registerEdition } from '../registry'
import { EDITION_BOLIVIA } from './index'

/**
 * The Bolivia edition's balance, measured rather than inherited on trust.
 *
 * The route mirrors the USA skeleton at ×1 (`edition.test.ts` pins that
 * mechanically) and — unlike Japan — this edition carries no sanctioned
 * mechanical deviation at all, so in principle every measured USA property
 * carries over digit for digit. A principle nobody measures is a hope, so
 * this suite plays the same seeded games the USA suite plays, on the Bolivia
 * board, and asserts the same bands in bolivianos: the even opening fork,
 * Straight to Work as the volatile road, the playable economy at every
 * difficulty, and a computer that still sometimes chooses a house full of
 * noise.
 *
 * The edition is registered here because the game store resolves editions by
 * id — this is exactly the test-side hook `registerEdition` documents.
 */

registerEdition(EDITION_BOLIVIA)

const DISPATCH_LIMIT = 5_000

interface PlayOptions {
  readonly boardLength?: BoardLength
  readonly cpuSeats?: number
  readonly difficulty?: Difficulty
  readonly laneBySeat?: readonly string[]
  readonly landings?: SpaceId[]
}

interface Playthrough {
  readonly finalState: GameState
  readonly dispatches: number
}

/** Drives a complete Bolivia game, taking the option at `optionBias % length`. */
const playGame = (
  seed: number,
  playerCount: number,
  optionBias: number,
  options: PlayOptions = {},
): Playthrough => {
  const store = createGameStore({
    random: createSeededRandom(seed),
    repository: createInMemoryRepository(),
    stats: createInMemoryStatsRepository(),
  })

  const colors: PlayerColor[] = ['red', 'blue', 'green', 'yellow']
  const cpuSeats = options.cpuSeats ?? 0
  store.dispatch({
    type: 'startGame',
    config: {
      boardLength: options.boardLength ?? 'standard',
      editionId: 'bolivia',
      ...(options.difficulty ? { difficulty: options.difficulty } : {}),
      players: Array.from({ length: playerCount }, (_, i) => ({
        name: `Player ${i + 1}`,
        color: colors[i] as PlayerColor,
        isCpu: i >= playerCount - cpuSeats,
      })),
    },
  })

  let dispatches = 0
  while (store.getState().phase !== 'gameOver' && dispatches < DISPATCH_LIMIT) {
    const state = store.getState()

    if (state.phase !== 'moving' && state.players[state.currentPlayerIndex]?.isCpu) {
      const command = decideCpuCommand(state)
      expect(command, `CPU had nothing to do in phase "${state.phase}"`).not.toBeNull()
      store.dispatch(command!)
      dispatches += 1
      continue
    }

    switch (state.phase) {
      case 'awaitingSpin':
        store.dispatch({ type: 'spin' })
        break
      case 'moving':
        store.dispatch({ type: 'settle' })
        break
      case 'awaitingDecision': {
        const offered = state.pendingDecision?.options ?? []
        expect(offered.length).toBeGreaterThan(0)
        const wanted = options.laneBySeat?.[state.currentPlayerIndex]
        const insisted = offered.find(
          (option) => wanted !== undefined && state.board.spaces[option.id]?.lane?.name === wanted,
        )
        store.dispatch({ type: 'choose', optionId: (insisted ?? offered[optionBias % offered.length]!).id })
        break
      }
      case 'resolved':
        options.landings?.push(state.players[state.currentPlayerIndex]!.spaceId)
        store.dispatch({ type: 'endTurn' })
        break
      default:
        throw new Error(`Game stalled in phase "${state.phase}"`)
    }
    dispatches += 1
  }

  const finalState = store.getState()
  expect(finalState.editionId).toBe('bolivia')
  return { finalState, dispatches }
}

const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length
const median = (xs: number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!
const spread = (xs: number[]): number => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)))

describe('every bolivia game reaches a conclusion', () => {
  it.each([1, 7, 13, 22, 31, 44])('seed %i finishes with a complete result', (seed) => {
    const { finalState, dispatches } = playGame(seed, 3, seed)
    expect(finalState.phase).toBe('gameOver')
    expect(dispatches).toBeLessThan(DISPATCH_LIMIT)
    expect(finalState.results!.standings).toHaveLength(3)
    for (const player of finalState.players) {
      expect(player.isRetired).toBe(true)
      expect(player.spaceId).toBe(finalState.board.retirementSpaceId)
    }
  })

  it('finishes at every board length and difficulty', () => {
    for (const boardLength of ['short', 'standard', 'long'] as const) {
      for (const difficulty of ['normal', 'hard', 'veryHard'] as const) {
        for (const seed of [5, 23]) {
          const { finalState, dispatches } = playGame(seed, 3, seed, { boardLength, difficulty })
          expect(finalState.phase, `${boardLength}/${difficulty} seed ${seed}`).toBe('gameOver')
          expect(dispatches).toBeLessThan(DISPATCH_LIMIT)
          expect(finalState.boardLength).toBe(boardLength)
          expect(finalState.difficulty).toBe(difficulty)
        }
      }
    }
  })
})

describe('the boliviano economy stays in a playable band', () => {
  const SEEDS = Array.from({ length: 60 }, (_, i) => i + 1)

  const sampleOf = (difficulty?: Difficulty) => {
    const games = SEEDS.map((seed) => playGame(seed, 3, seed, difficulty ? { difficulty } : {}))
    const standings = games.flatMap((g) => g.finalState.results!.standings)
    return {
      totals: standings.map((s) => s.total),
      turns: games.map((g) => g.finalState.turn),
      games,
    }
  }

  const normal = sampleOf()
  const hard = sampleOf('hard')
  const veryHard = sampleOf('veryHard')
  const bustShare = (totals: number[]) => totals.filter((t) => t < 0).length / totals.length

  it('keeps normal comfortably profitable — the USA band, in bolivianos', () => {
    // Measured: mean Bs 661k, median Bs 646k over these 60 games, and nobody
    // ever bust on normal — the USA band digit for digit, as a ×1 mirror
    // with no catalogue deviation must be.
    expect(mean(normal.totals)).toBeGreaterThan(400_000)
    expect(mean(normal.totals)).toBeLessThan(700_000)
    expect(median(normal.totals)).toBeGreaterThan(400_000)
    expect(bustShare(normal.totals)).toBe(0)
    expect(mean(normal.turns)).toBeGreaterThan(6)
    expect(mean(normal.turns)).toBeLessThan(30)
  })

  it('steps the totals down at each difficulty', () => {
    expect(median(hard.totals)).toBeLessThan(median(normal.totals))
    expect(median(veryHard.totals)).toBeLessThan(median(hard.totals))
  })

  it('makes hard a clear step down that is still usually a winning game', () => {
    expect(median(hard.totals)).toBeLessThan(median(normal.totals) * 0.8)
    expect(median(hard.totals)).toBeGreaterThan(100_000)
    expect(bustShare(hard.totals)).toBeGreaterThan(0)
    expect(bustShare(hard.totals)).toBeLessThan(0.25)
  })

  it('puts very hard on a knife edge: the median finishes near zero', () => {
    // The fast-track lane now guarantees a payday between a headhunting and
    // the very-hard-only reorganisation that used to follow it with no wage
    // in between (see bo-fast-payday-severance) — a small, deliberate
    // softening for the players who draw that specific stretch, re-measured
    // here.
    expect(bustShare(veryHard.totals)).toBeGreaterThan(0.25)
    expect(bustShare(veryHard.totals)).toBeLessThan(0.7)
    expect(median(veryHard.totals)).toBeGreaterThan(-200_000)
        // A small, uniform softening: four hard/very-hard setback tiles
    // (overdraft, late rent, parking fine, policy excess) had amounts far
    // beyond what those bills actually cost in real life and are now
    // realistic instead, which nudges the very-hard median up slightly.
    expect(median(veryHard.totals)).toBeLessThan(300_000)
  })

  it('keeps every difficulty a session and not a marathon', () => {
    for (const sample of [normal, hard, veryHard]) {
      expect(mean(sample.turns)).toBeGreaterThan(6)
      expect(mean(sample.turns)).toBeLessThan(30)
    }
  })
})

describe('neither opening lane is the right answer, in bolivianos either', () => {
  const UNIVERSITY = 'University Lane'
  const WORK = 'Straight to Work'

  interface Split {
    readonly university: number[]
    readonly work: number[]
    readonly universityWinRate: number
  }

  const splitOf = (seeds: readonly number[], options: PlayOptions = {}): Split => {
    const laneBySeat = [UNIVERSITY, WORK]
    const university: number[] = []
    const work: number[] = []
    let universityWins = 0
    for (const seed of seeds) {
      const { finalState } = playGame(seed, 2, seed, { ...options, laneBySeat })
      const results = finalState.results!
      finalState.players.forEach((player, seat) => {
        const total = results.standings.find((s) => s.playerId === player.id)!.total
        ;(seat === 0 ? university : work).push(total)
      })
      if (finalState.players.findIndex((p) => p.id === results.winnerId) === 0) universityWins += 1
    }
    return { university, work, universityWinRate: universityWins / seeds.length }
  }

  const MANY = Array.from({ length: 240 }, (_, i) => i + 1)
  const standard = splitOf(MANY)

  it('splits the wins between the two lanes on the standard board', () => {
    // Measured at 53.8% over these 240 games. Re-measured at 44.2% after the
    // stop-spacing pass added one flavour tile to each opening lane
    // (bo-uni-farewell, bo-work-first-night) — a fixed-seed sample is
    // sensitive to exactly this kind of tile-count shift even when both
    // lanes grew by the same one tile. Still comfortably neither lane's game.
    expect(standard.universityWinRate).toBeGreaterThan(0.4)
    expect(standard.universityWinRate).toBeLessThan(0.6)
  })

  it('keeps Straight to Work the volatile life, not merely the poorer one', () => {
    // Measured at 1.29 — the trade ladders swing, the professional band does not.
    expect(spread(standard.work)).toBeGreaterThan(spread(standard.university) * 1.15)
  })

  it('leaves neither lane the obvious money play', () => {
    const gap = Math.abs(mean(standard.university) - mean(standard.work))
    expect(gap / mean(standard.university)).toBeLessThan(0.15)
  })

  it.each([
    ['short board', { boardLength: 'short' } as PlayOptions],
    ['long board', { boardLength: 'long' } as PlayOptions],
    ['hard', { difficulty: 'hard' } as PlayOptions],
    ['very hard', { difficulty: 'veryHard' } as PlayOptions],
  ])('stays an even fork on the %s', (_label, options) => {
    const sample = splitOf(MANY.slice(0, 100), options)
    expect(sample.universityWinRate).toBeGreaterThan(0.4)
    expect(sample.universityWinRate).toBeLessThan(0.6)
  })
})

describe('the computer can play the bolivia board unaided', () => {
  const playAllCpu = (seed: number): GameState => {
    const store = createGameStore({
      random: createSeededRandom(seed),
      repository: createInMemoryRepository(),
      stats: createInMemoryStatsRepository(),
    })
    const colors: PlayerColor[] = ['red', 'blue', 'green', 'yellow']
    store.dispatch({
      type: 'startGame',
      config: {
        boardLength: 'standard',
        editionId: 'bolivia',
        players: Array.from({ length: 4 }, (_, i) => ({
          name: `CPU ${i + 1}`,
          color: colors[i] as PlayerColor,
          isCpu: true,
        })),
      },
    })
    let dispatches = 0
    while (store.getState().phase !== 'gameOver' && dispatches < DISPATCH_LIMIT) {
      const state = store.getState()
      if (state.phase === 'moving') {
        store.dispatch({ type: 'settle' })
      } else {
        const command = decideCpuCommand(state)
        expect(command, `CPU had nothing to do in phase "${state.phase}"`).not.toBeNull()
        store.dispatch(command!)
      }
      dispatches += 1
    }
    return store.getState()
  }

  const games = [1, 2, 3, 8, 19, 30, 42, 55, 61, 77, 84, 96].map(playAllCpu)

  it('plays itself to a finish, every seat retired', () => {
    for (const finalState of games) {
      expect(finalState.phase).toBe('gameOver')
      expect(finalState.results!.standings).toHaveLength(4)
      for (const player of finalState.players) expect(player.isRetired).toBe(true)
    }
  })

  it('takes Family Lane sometimes rather than never', () => {
    // Children only arrive on Family Lane, so a computer seat with children is
    // a computer seat that chose the house full of noise. Measured: 27 of the
    // 48 seats across these twelve games.
    const parents = games.flatMap((g) => g.players).filter((p) => p.children > 0)
    expect(parents.length).toBeGreaterThan(0)
  })

  it('still buys houses on a board where the ladder tops out at a cholet', () => {
    const owners = games.flatMap((g) => g.players).filter((p) => p.house !== null)
    expect(owners.length).toBeGreaterThan(0)
  })
})

describe('insurance pays off about twice a game, in bolivianos', () => {
  it('bounces roughly two hazard bills per player per standard game', () => {
    const landings: SpaceId[] = []
    const seeds = Array.from({ length: 80 }, (_, i) => i + 1)
    for (const seed of seeds) {
      playGame(seed, 2, 0, { landings })
    }
    const board = playGame(1, 2, 0, {}).finalState.board
    const covered = landings.filter((id) => {
      const effect = board.spaces[id]?.effect
      return effect?.type === 'payMoney' && effect.hazard !== undefined
    })
    const rate = covered.length / (seeds.length * 2)
    // Measured at 1.81 — the same hazard density the mirror promised.
    expect(rate).toBeGreaterThan(1.4)
    expect(rate).toBeLessThan(3)
  })
})
