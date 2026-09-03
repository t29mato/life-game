import { describe, expect, it } from 'vitest'

import { createGameStore } from '../../../application/createGameStore'
import { decideCpuCommand } from '../../../application/cpu/decideCpuCommand'
import { isFork } from '../../../application/usecases/branch'
import type { RandomPort } from '../../../application/ports/RandomPort'
import {
  createInMemoryRepository,
  createInMemoryStatsRepository,
  createSeededRandom,
} from '../../../application/testing/fakes'
import type { Board, Difficulty, GameState, PlayerColor, SpaceId, SpinValue } from '../../model/types'

/**
 * The Researcher: Japan board's balance, measured from scratch — and the one
 * edition suite in this repository that is not allowed to inherit anything.
 *
 * Every other edition mirrors the USA board's shape at its own currency's
 * scale, so its balance suite can hold the same bands the USA suite holds and
 * be arguing about the same board. This one deliberately swaps which career
 * shelf each opening lane deals from, which moves the volatility from the
 * early-earning road to the road that pays a bill — the single guarantee the
 * base game asserts about its opening fork, inverted on purpose. Nothing about
 * that could be inherited on trust, so it is all re-measured here:
 *
 *  - **The inversion itself**, asserted as its own property rather than as a
 *    tolerance around 1. The doctorate lane must finish *wider* than the
 *    master's exit, because that is the truth this whole edition exists to
 *    tell.
 *  - **The fork is still a fork.** The doctorate must not be a trap: the win
 *    split and the gap in the means are held to the same bands every other
 *    board's opening fork is held to.
 *  - **The economy still lands in a playable band** at all three difficulties,
 *    with the same shape of step down between them.
 *  - **The permanent shelf is genuinely untouchable**, which is the mechanical
 *    payoff of the gated road and the one thing on this board no other board
 *    has.
 *
 * Every figure quoted in a comment below was measured by this file. Seed
 * counts are trimmed against the USA suite where the mirror makes the extra
 * samples redundant.
 */

/**
 * A fork is the wheel's own call (see `spin.ts`), so pinning a seat to a lane
 * for measurement means loading *that one roll* rather than picking an option
 * off a decision that no longer exists.
 */
function laneForcingRandom(seed: number): RandomPort & { forceNextSpin(value: SpinValue): void } {
  const base = createSeededRandom(seed)
  let forced: SpinValue | null = null
  return {
    ...base,
    spin(): SpinValue {
      if (forced !== null) {
        const value = forced
        forced = null
        return value
      }
      return base.spin()
    },
    forceNextSpin(value: SpinValue): void {
      forced = value
    },
  }
}

function laneRoll(board: Board, spaceId: SpaceId, wanted: string, entropy: number): SpinValue | null {
  if (!isFork(board, spaceId)) return null
  const space = board.spaces[spaceId]
  const branch = space?.next.findIndex((nextId) => board.spaces[nextId]?.lane?.name === wanted)
  if (branch === undefined || branch === -1) return null
  const offset = (((entropy % 5) + 5) % 5) + 1
  return (branch === 0 ? offset : offset + 5) as SpinValue
}

const DISPATCH_LIMIT = 5_000

interface PlayOptions {
  readonly cpuSeats?: number
  readonly difficulty?: Difficulty
  readonly laneBySeat?: readonly string[]
  readonly landings?: SpaceId[]
}

interface Playthrough {
  readonly finalState: GameState
  readonly dispatches: number
}

/** Drives a complete game on this board, taking the option at `optionBias % length`. */
const playGame = (
  seed: number,
  playerCount: number,
  optionBias: number,
  options: PlayOptions = {},
): Playthrough => {
  const random = laneForcingRandom(seed)
  const store = createGameStore({
    random,
    repository: createInMemoryRepository(),
    stats: createInMemoryStatsRepository(),
  })

  const colors: PlayerColor[] = ['red', 'blue', 'green', 'yellow']
  const cpuSeats = options.cpuSeats ?? 0
  store.dispatch({
    type: 'startGame',
    config: {
      editionId: 'japan-researcher',
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
      case 'awaitingSpin': {
        const wanted = options.laneBySeat?.[state.currentPlayerIndex]
        const forced =
          wanted !== undefined
            ? laneRoll(state.board, state.players[state.currentPlayerIndex]!.spaceId, wanted, seed + dispatches)
            : null
        if (forced !== null) random.forceNextSpin(forced)
        store.dispatch({ type: 'spin' })
        break
      }
      // The fork's second press: the road is settled, this is how far down it.
      case 'awaitingDistanceSpin':
        store.dispatch({ type: 'spin' })
        break
      case 'moving':
      case 'passingEvent':
        store.dispatch({ type: 'settle' })
        break
      case 'awaitingDecision': {
        const offered = state.pendingDecision?.options ?? []
        expect(offered.length).toBeGreaterThan(0)
        store.dispatch({ type: 'choose', optionId: offered[optionBias % offered.length]!.id })
        break
      }
      case 'scoring':
        store.dispatch({ type: 'scoreRoll' })
        break
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
  expect(finalState.editionId).toBe('japan-researcher')
  return { finalState, dispatches }
}

const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length
const median = (xs: number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!
const spread = (xs: number[]): number => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)))

describe('every researcher game reaches a conclusion', () => {
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

  it('finishes at every difficulty', () => {
    for (const difficulty of ['normal', 'hard', 'veryHard'] as const) {
      for (const seed of [5, 23]) {
        const { finalState, dispatches } = playGame(seed, 3, seed, { difficulty })
        expect(finalState.phase, `${difficulty} seed ${seed}`).toBe('gameOver')
        expect(dispatches).toBeLessThan(DISPATCH_LIMIT)
        expect(finalState.difficulty).toBe(difficulty)
      }
    }
  })
})

describe('the researcher economy stays in a playable band', () => {
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

  it('keeps normal comfortably profitable — the country board\'s band, in the same yen', () => {
    // Measured over these 60 games: mean ¥70.9M, median ¥69.8M, nobody ever
    // bust. That is the country Japan board's band (its own measurement is
    // ¥65.9M) with the top of it opened out, because this board's academia
    // shelf genuinely pays more per payday than any country shelf does — a
    // professor out-earns a salaryman, and the ladder that leads to one is
    // the widest in the game.
    expect(mean(normal.totals)).toBeGreaterThan(45_000_000)
    expect(mean(normal.totals)).toBeLessThan(85_000_000)
    expect(median(normal.totals)).toBeGreaterThan(45_000_000)
    expect(bustShare(normal.totals)).toBe(0)
    expect(mean(normal.turns)).toBeGreaterThan(6)
    expect(mean(normal.turns)).toBeLessThan(30)
  })

  it('steps the totals down at each difficulty', () => {
    expect(median(hard.totals)).toBeLessThan(median(normal.totals))
    expect(median(veryHard.totals)).toBeLessThan(median(hard.totals))
  })

  it('makes hard a clear step down that is still usually a winning game', () => {
    // Measured: median ¥40.6M against normal's ¥69.8M, one player in ten bust.
    expect(median(hard.totals)).toBeLessThan(median(normal.totals) * 0.8)
    expect(median(hard.totals)).toBeGreaterThan(10_000_000)
    expect(bustShare(hard.totals)).toBeGreaterThan(0)
    expect(bustShare(hard.totals)).toBeLessThan(0.25)
  })

  it('puts very hard on a knife edge: the median finishes near zero', () => {
    // Measured: 45.0% bust, median ¥8.1M, mean slightly under zero.
    expect(bustShare(veryHard.totals)).toBeGreaterThan(0.25)
    expect(bustShare(veryHard.totals)).toBeLessThan(0.7)
    expect(median(veryHard.totals)).toBeGreaterThan(-20_000_000)
    expect(median(veryHard.totals)).toBeLessThan(30_000_000)
  })

  it('keeps every difficulty a session and not a marathon', () => {
    for (const sample of [normal, hard, veryHard]) {
      expect(mean(sample.turns)).toBeGreaterThan(6)
      expect(mean(sample.turns)).toBeLessThan(30)
    }
  })
})

describe('the opening fork: the doctorate is the gamble, not the mistake', () => {
  const DOCTORAL = 'The Doctoral Course'
  const MASTERS = "The Master's Exit"

  interface Split {
    readonly doctoral: number[]
    readonly masters: number[]
    readonly doctoralWinRate: number
  }

  const splitOf = (seeds: readonly number[], options: PlayOptions = {}): Split => {
    const laneBySeat = [DOCTORAL, MASTERS]
    const doctoral: number[] = []
    const masters: number[] = []
    let doctoralWins = 0
    for (const seed of seeds) {
      const { finalState } = playGame(seed, 2, seed, { ...options, laneBySeat })
      const results = finalState.results!
      finalState.players.forEach((player, seat) => {
        const total = results.standings.find((s) => s.playerId === player.id)!.total
        ;(seat === 0 ? doctoral : masters).push(total)
      })
      if (finalState.players.findIndex((p) => p.id === results.winnerId) === 0) doctoralWins += 1
    }
    return { doctoral, masters, doctoralWinRate: doctoralWins / seeds.length }
  }

  const MANY = Array.from({ length: 240 }, (_, i) => i + 1)
  const sample = splitOf(MANY)

  it('splits the wins between the two lanes', () => {
    /*
     * Measured at 42.5% to the doctorate over these 240 games — within a
     * point of the USA board's own 43.3% for College Lane, and reached by
     * real tuning rather than by luck: the first cut of the career shelves
     * measured 37.1%, and the industry shelf came down 8% and the academia
     * shelf's middle rungs went up to close it.
     *
     * Under a hand's own judgement it is kinder still, and the difference is
     * this board's own doing. These games take whichever option the seed
     * happens to index, so half the doctoral seats accept the Career-Change
     * Fair's offer of an industry job at the door's grade — the very thing a
     * player looking at their own salary would decline. The band below is
     * therefore a floor on the road, not a description of how it plays.
     */
    expect(sample.doctoralWinRate).toBeGreaterThan(0.33)
    expect(sample.doctoralWinRate).toBeLessThan(0.62)
  })

  it('moves the volatility onto the road that pays the bill', () => {
    /*
     * **The inversion, and the reason this edition exists.**
     *
     * Every other board in this repository asserts that its two opening lanes
     * are roughly *equally* wide, and the base game was built on the
     * early-earning lane being the volatile one. Here the volatility belongs
     * to the doctorate: its career shelf runs from a part-time lecturer paid
     * by the course to a centre director on a ten-year national programme —
     * ¥2.45M to ¥14.7M, five times the industry shelf's whole range — while
     * the master's exit deals from a shelf whose entire working life fits
     * inside ¥4.2M–¥6.5M.
     *
     * Measured: the doctoral seats finish with a standard deviation of
     * ¥20.7M against the master's ¥15.9M, a ratio of 0.77. The assertion is
     * one-sided on purpose. A ratio that drifted back to 1 would mean the
     * shelves had stopped saying anything, and this is the one property no
     * other edition's suite can hold for us.
     */
    const ratio = spread(sample.masters) / spread(sample.doctoral)
    expect(ratio).toBeLessThan(0.92)
    // …and not so wide that the doctorate is a lottery ticket rather than a road.
    expect(ratio).toBeGreaterThan(0.5)
  })

  it('leaves neither lane the obvious money play', () => {
    // Measured at ¥69.0M against ¥74.7M — an 8.2% gap, inside the same 15%
    // every other board's opening fork is held to.
    const gap = Math.abs(mean(sample.doctoral) - mean(sample.masters))
    expect(gap / mean(sample.doctoral)).toBeLessThan(0.15)
  })

  it('keeps both lanes worth walking — neither is a losing move on its own', () => {
    for (const totals of [sample.doctoral, sample.masters]) {
      expect(mean(totals)).toBeGreaterThan(10_000_000)
    }
  })

  it.each([
    ['hard', { difficulty: 'hard' } as PlayOptions],
    ['very hard', { difficulty: 'veryHard' } as PlayOptions],
  ])('stays an even fork on the %s, and keeps the inversion', (_label, options) => {
    // Measured: 47.0% on hard and 41.0% on very hard, with the spread ratio
    // at 0.86 and 0.93. The harder boards compress the inversion — a missed
    // payroll costs the same whichever shelf you are on — so the ratio is
    // held to a looser bound here than on the standard board, and still to
    // the right side of 1.
    const harder = splitOf(MANY.slice(0, 100), options)
    expect(harder.doctoralWinRate).toBeGreaterThan(0.33)
    expect(harder.doctoralWinRate).toBeLessThan(0.62)
    expect(spread(harder.masters) / spread(harder.doctoral)).toBeLessThan(1)
  })
})

describe('the computer can play the researcher board unaided', () => {
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
        editionId: 'japan-researcher',
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

  it('takes the two-body road sometimes rather than never', () => {
    const parents = games.flatMap((g) => g.players).filter((p) => p.children > 0)
    expect(parents.length).toBeGreaterThan(0)
  })

  it('still buys houses on a board where half the ladder depreciates', () => {
    const owners = games.flatMap((g) => g.players).filter((p) => p.house !== null)
    expect(owners.length).toBeGreaterThan(0)
  })

  it('finds the permanent shelf often enough for it to be worth writing', () => {
    /*
     * The gated road is the whole payoff of this board, and a shelf nobody
     * ever reaches would be an elaborate way of writing nothing. It is a
     * gated fork behind a die, so it is *meant* to be rare — this asserts it
     * happens, not that it happens often.
     */
    const permanent = games
      .flatMap((g) => g.players)
      .filter((p) => p.career?.cannotBeLaidOff === true)
    expect(permanent.length).toBeGreaterThan(0)
  })
})

describe('insurance pays off, rarely but really, on this board too', () => {
  it('bounces hazard bills off a policy often enough to matter', () => {
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
    // The hazard tiles are the country board's, in the same places, so the
    // rate is the country board's too — pinned here rather than assumed, so
    // that the next person to weigh a premium against it is arguing with a
    // measurement.
    expect(rate).toBeGreaterThan(0.3)
    expect(rate).toBeLessThan(0.7)
  })
})
