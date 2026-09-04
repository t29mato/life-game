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
    // Measured over these 60 games: mean ¥70.1M, median ¥69.7M, nobody ever
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
    // Measured: median ¥37.9M against normal's ¥69.7M, one player in nine bust
    // (11.7%). It was ¥40.6M and one in ten before the layoff cost a payday.
    expect(median(hard.totals)).toBeLessThan(median(normal.totals) * 0.8)
    expect(median(hard.totals)).toBeGreaterThan(10_000_000)
    expect(bustShare(hard.totals)).toBeGreaterThan(0)
    expect(bustShare(hard.totals)).toBeLessThan(0.25)
  })

  it('puts very hard on a knife edge: the median finishes near zero', () => {
    // Measured: 42.8% bust, median ¥11.1M, mean ¥2.7M — it was 45.0%, ¥8.1M
    // and slightly under zero before the layoff cost a payday, which is the
    // one board where charging for the layoff made the hardest setting
    // *kinder*: the payday it charges is one this board's very hard setting
    // was mostly cancelling anyway, and it now arrives half a board earlier,
    // before the bills that were bankrupting people.
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

  /**
   * Ten times the seeds, because the inversion below is a ratio of two
   * standard deviations and 240 games cannot hold the bound it is asserted
   * against.
   *
   * `spread(masters) / spread(doctoral) < 0.92` went red at 0.988 when the
   * fork fix landed — the change that stopped a junction reached mid-move
   * being settled by the distance left over (see `settle.ts`). It is not a
   * regression. A standard deviation estimated from 240 values carries ~4.6%
   * of its own error, so a *ratio* of two carries ~6.5%: at 240 seeds the
   * statistic is 0.87 ± 0.057 and the bound sits less than one standard error
   * above it, which is a coin flip rather than a guard. Re-measured over
   * 2,400 seeds, before and after:
   *
   *      difficulty   pre-change        this tree
   *      normal       0.843 ± 0.017     0.873 ± 0.018
   *      hard         0.864 ± 0.018     0.838 ± 0.017
   *      very hard    0.929 ± 0.019     0.947 ± 0.019
   *
   * The shift on normal is +0.030, about 1.2 combined standard errors, and it
   * has a mechanism rather than being pure noise: the mid-career junction now
   * genuinely splits 50/50, and Leave for Industry deals from the industry
   * shelf at its bottom rung — so twice as many doctoral seats as before end
   * up on the narrow shelf, which narrows the doctoral road. The inversion
   * survives it with room on every difficulty.
   *
   * The harder block below still runs on 100 seeds against a bound of 1, and
   * at very hard the true ratio is 0.947: that assertion is left exactly as it
   * was, but it is worth knowing it is the thinnest margin in this file and
   * that the difficulty comment above it — "the harder boards compress the
   * inversion" — is understating how far.
   */
  const MANY = Array.from({ length: 2_400 }, (_, i) => i + 1)
  const sample = splitOf(MANY)

  it('splits the wins between the two lanes', () => {
    /*
     * Measured at 44.1% to the doctorate over these 2,400 games (45.6% before
     * the fork fix; 46.7% off the old 240-game set) — a couple of points
     * off the USA board's own 44.7% for College Lane, and reached by real
     * tuning rather than by luck: the first cut of the career shelves
     * measured 37.1%, the industry shelf came down 8% and the academia
     * shelf's middle rungs went up to bring it to 42.5%, and the payday now
     * standing between the Layoff Notice and the career fair carried it the
     * rest of the way. That last one is not a tuning of this fork at all: it
     * lands on whichever seat is being re-hired, which is both roads, and it
     * costs the industry shelf slightly more because a salary is a bigger
     * thing to miss than a fixed-term contract's.
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
     * Re-measured over 2,400 seeds: the doctoral seats finish with a standard
     * deviation of ¥21.1M against the master's ¥18.4M, a ratio of 0.873 ±
     * 0.018 (0.843 ± 0.017 before the fork fix; 0.85 off 240 seeds, and 0.77
     * before a missed month's wages became a thing that can happen to
     * anybody, which is variance the industry shelf did not used to carry).
     * The assertion is one-sided on purpose. A ratio that drifted back to 1
     * would mean the shelves had stopped saying anything, and this is the one
     * property no other edition's suite can hold for us.
     */
    const ratio = spread(sample.masters) / spread(sample.doctoral)
    expect(ratio).toBeLessThan(0.92)
    // …and not so wide that the doctorate is a lottery ticket rather than a road.
    expect(ratio).toBeGreaterThan(0.5)
  })

  it('leaves neither lane the obvious money play', () => {
    // Re-measured over 2,400 seeds at ¥71.9M against ¥76.1M — a 5.9% gap,
    // inside the same 15% every other board's opening fork is held to (4.7%
    // before the fork fix, 6.1% off the old 240-game set, and 8.2% before the
    // layoff cost a payday).
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
    // Measured: 51.0% on hard and 48.0% on very hard, with the spread ratio
    // at 0.68 and 0.96 (47.0%/41.0% and 0.86/0.93 before the layoff cost a
    // payday). The harder boards compress the inversion — a missed
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
