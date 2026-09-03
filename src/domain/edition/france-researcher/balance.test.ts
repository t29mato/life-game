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
 * The Researcher: France board's balance, measured from scratch — and the
 * second edition suite in this repository that is not allowed to inherit
 * anything.
 *
 * The Researcher: Japan suite could not inherit the country boards' numbers
 * because it moved the volatility from one lane to the other. This one cannot
 * inherit *Japan's* either, and that is the point of the board:
 *
 *  - **The opening fork is even, and its two lanes finish equally wide.**
 *    Japan's suite asserts a one-sided inversion — the doctorate lane must
 *    finish wider than the master's exit — and this board deliberately does
 *    not reproduce it. France's risk is not on a lane. It is on a *shelf*,
 *    behind a *gate*, and the fork's own spreads come out level.
 *  - **The gate is where the volatility went.** The shelf behind the concours
 *    finishes measurably tighter than the industry shelf at every difficulty,
 *    and on the harder settings it finishes *ahead* of both other shelves —
 *    which is what a job nothing can take from you is actually worth when the
 *    board turns hostile. That is the France design's central claim, and it
 *    is the mirror image of the Japan board's.
 *  - **The gated road is a real argument.** Walking the concours road rather
 *    than the engineer's post opposite it costs a fraction of a per cent on
 *    normal — it is neither a trap nor a free win.
 *  - **The economy still lands in a playable band** at all three difficulties,
 *    with the same shape of step down between them.
 *
 * Every figure quoted in a comment below was measured by this file.
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

/**
 * Which face sends this player down one of the roads they are being pinned
 * to. A list rather than a single name, because this board's interesting
 * question spans two forks — the opening one and the gate five tiles later —
 * and a seat has to be held to a road at both of them.
 */
function laneRoll(
  board: Board,
  spaceId: SpaceId,
  wanted: readonly string[],
  entropy: number,
): SpinValue | null {
  if (!isFork(board, spaceId)) return null
  const space = board.spaces[spaceId]
  const branch = space?.next.findIndex((nextId) => wanted.includes(board.spaces[nextId]?.lane?.name ?? ''))
  if (branch === undefined || branch === -1) return null
  const offset = (((entropy % 5) + 5) % 5) + 1
  return (branch === 0 ? offset : offset + 5) as SpinValue
}

const DISPATCH_LIMIT = 5_000

interface PlayOptions {
  readonly cpuSeats?: number
  readonly difficulty?: Difficulty
  readonly laneBySeat?: readonly (readonly string[])[]
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
      editionId: 'france-researcher',
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
  expect(finalState.editionId).toBe('france-researcher')
  return { finalState, dispatches }
}

const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length
const median = (xs: number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!
const spread = (xs: number[]): number => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)))

const UNIVERSITY = 'The University'
const GRANDE_ECOLE = 'The Grande École'
const CONCOURS = 'The Concours'
const ENGINEERS_POST = "The Engineer's Post"

describe('every researcher france game reaches a conclusion', () => {
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

describe('the researcher france economy stays in a playable band', () => {
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

  it('keeps normal comfortably profitable — the country board\'s band, in the same euros', () => {
    // Measured over these 60 games: mean €734,348, median €701,700. That is
    // the same band the Researcher: Japan board measures in yen at ×100,
    // which is what a shared skeleton is supposed to produce.
    //
    // The bust line used to read `toBe(0)`, and it stopped being true the day
    // a new arrival became a die: one seat in 180 finishes in the red now.
    // It is not the child bill that put them there — the same seat goes bust
    // with the phone call priced at €0 — it is that the board no longer hands
    // every family a guaranteed child, and that seat's whole margin was the
    // one child's bonus at the final scoring. An exact zero over a sample was
    // a fact about one random sequence rather than a promise the board ever
    // made, so what is asserted now is the promise: going bust on normal
    // stays rare, on the same order as `gameBalance`'s own 15% ceiling and
    // far under it.
    expect(mean(normal.totals)).toBeGreaterThan(450_000)
    expect(mean(normal.totals)).toBeLessThan(900_000)
    expect(median(normal.totals)).toBeGreaterThan(450_000)
    expect(bustShare(normal.totals)).toBeLessThan(0.02)
    expect(mean(normal.turns)).toBeGreaterThan(6)
    expect(mean(normal.turns)).toBeLessThan(30)
  })

  it('steps the totals down at each difficulty', () => {
    expect(median(hard.totals)).toBeLessThan(median(normal.totals))
    expect(median(veryHard.totals)).toBeLessThan(median(hard.totals))
  })

  it('makes hard a clear step down that is still usually a winning game', () => {
    // Measured: median €449,800 against normal's €701,700, one player in
    // eleven bust.
    expect(median(hard.totals)).toBeLessThan(median(normal.totals) * 0.8)
    expect(median(hard.totals)).toBeGreaterThan(100_000)
    expect(bustShare(hard.totals)).toBeGreaterThan(0)
    expect(bustShare(hard.totals)).toBeLessThan(0.25)
  })

  it('puts very hard on a knife edge', () => {
    // Measured: 35.6% bust, median €183,028, mean €90,492.
    expect(bustShare(veryHard.totals)).toBeGreaterThan(0.2)
    expect(bustShare(veryHard.totals)).toBeLessThan(0.7)
    expect(median(veryHard.totals)).toBeGreaterThan(-200_000)
    expect(median(veryHard.totals)).toBeLessThan(300_000)
  })

  it('keeps every difficulty a session and not a marathon', () => {
    for (const sample of [normal, hard, veryHard]) {
      expect(mean(sample.turns)).toBeGreaterThan(6)
      expect(mean(sample.turns)).toBeLessThan(30)
    }
  })
})

describe('the opening fork: the underdog road is a road, not a mistake', () => {
  interface Split {
    readonly university: number[]
    readonly grandeEcole: number[]
    readonly universityWinRate: number
  }

  const splitOf = (seeds: readonly number[], options: PlayOptions = {}): Split => {
    // Seat 0 is held to the University at eighteen *and* to the concours road
    // at the gate, because those two decisions are one life on this board.
    const laneBySeat = [[UNIVERSITY, CONCOURS], [GRANDE_ECOLE]]
    const university: number[] = []
    const grandeEcole: number[] = []
    let universityWins = 0
    for (const seed of seeds) {
      const { finalState } = playGame(seed, 2, seed, { ...options, laneBySeat })
      const results = finalState.results!
      finalState.players.forEach((player, seat) => {
        const total = results.standings.find((s) => s.playerId === player.id)!.total
        ;(seat === 0 ? university : grandeEcole).push(total)
      })
      if (finalState.players.findIndex((p) => p.id === results.winnerId) === 0) universityWins += 1
    }
    return { university, grandeEcole, universityWinRate: universityWins / seeds.length }
  }

  const MANY = Array.from({ length: 240 }, (_, i) => i + 1)
  const sample = splitOf(MANY)

  it('splits the wins between the two lanes', () => {
    /*
     * Measured at 45.0% to the University over these 240 games — ahead of the
     * USA board's own 43.3% for College Lane, and reached by real tuning
     * rather than by luck. The first cut measured 23.3%: the doctorate's
     * shelf opened barely above the cadre shelf, and a road that forgoes
     * three paydays for a 5% raise is not a road, it is a fine. What closed
     * it: the contract shelf's door-in rungs went up by half, the cadre
     * shelf's came down 18%, and the career fair on the trunk was capped at
     * the contract shelf so that a doctorate is still worth something to
     * somebody standing in it.
     */
    expect(sample.universityWinRate).toBeGreaterThan(0.35)
    expect(sample.universityWinRate).toBeLessThan(0.62)
  })

  it('leaves neither lane the obvious money play', () => {
    // Measured at €768,645 against €807,256 — a 5.0% gap, well inside the
    // 15% every other board's opening fork is held to.
    const gap = Math.abs(mean(sample.university) - mean(sample.grandeEcole))
    expect(gap / mean(sample.university)).toBeLessThan(0.15)
  })

  it('does NOT reproduce the Japan board\'s lane inversion, and that is the finding', () => {
    /*
     * The Researcher: Japan suite asserts one-sidedly that its doctorate lane
     * finishes *wider* than the safe road, because on that board the shelf a
     * doctorate opens is five times the width of the industry shelf and the
     * whole of the life's variance sits on it.
     *
     * This board is built the other way and measures accordingly: 1.012 on
     * normal, 0.992 on hard, 0.953 on very hard — level, at every setting.
     * France's volatility is not on a lane. It is on one competition and on
     * the shelf behind it, and the block below is where that is measured. A
     * ratio that drifted far off 1 here would mean one of the two roads had
     * quietly become the gamble, which is the Japanese board's story and not
     * this one's.
     */
    const ratio = spread(sample.grandeEcole) / spread(sample.university)
    expect(ratio).toBeGreaterThan(0.85)
    expect(ratio).toBeLessThan(1.15)
  })

  it('keeps both lanes worth walking — neither is a losing move on its own', () => {
    for (const totals of [sample.university, sample.grandeEcole]) {
      expect(mean(totals)).toBeGreaterThan(100_000)
    }
  })

  it.each([
    ['hard', { difficulty: 'hard' } as PlayOptions],
    ['very hard', { difficulty: 'veryHard' } as PlayOptions],
  ])('stays an even fork on the %s', (_label, options) => {
    // Measured over 100 seeds: 47.9% on hard and 45.4% on very hard.
    const harder = splitOf(MANY.slice(0, 100), options)
    expect(harder.universityWinRate).toBeGreaterThan(0.33)
    expect(harder.universityWinRate).toBeLessThan(0.62)
  })
})

describe('after the gate, the inversion inverts', () => {
  /*
   * **The France board's own property, and the one no other edition's suite
   * can hold for us.** §10.3 of the concept document asks for a late game
   * that plays academia-safe and industry-volatile — the mirror image of
   * Japan, where the permanent shelf is both the safest *and* the
   * best-paid thing on the board.
   *
   * Measured here by grouping every finished player by the shelf they were
   * standing on at retirement.
   */
  const SEEDS = Array.from({ length: 240 }, (_, i) => i + 1)

  const shelvesAt = (difficulty?: Difficulty) => {
    const fonctionnaire: number[] = []
    const cadre: number[] = []
    const contract: number[] = []
    for (const seed of SEEDS) {
      const { finalState } = playGame(seed, 2, seed, {
        ...(difficulty ? { difficulty } : {}),
        laneBySeat: [[UNIVERSITY, CONCOURS], [GRANDE_ECOLE]],
      })
      const results = finalState.results!
      for (const player of finalState.players) {
        const total = results.standings.find((s) => s.playerId === player.id)!.total
        if (player.career?.cannotBeLaidOff) fonctionnaire.push(total)
        else if (player.career?.requiresDegree === false) cadre.push(total)
        else if (player.career) contract.push(total)
      }
    }
    return { fonctionnaire, cadre, contract }
  }

  const normal = shelvesAt()
  const hard = shelvesAt('hard')

  it('reaches the fonctionnaire shelf often enough for the measurement to mean anything', () => {
    /*
     * It is meant to be uncommon: a gated fork behind a die, a lane entered
     * on half the faces, and then two sittings that appoint on a five or a
     * six. What thins it further is the harness rather than the board — these
     * games take whichever option the seed happens to index, so about half
     * the players who *did* clear the concours then accept a contract job at
     * the industry fair, which is the one thing no real player would ever do
     * with a post nothing can take away.
     */
    expect(normal.fonctionnaire.length).toBeGreaterThan(10)
    expect(hard.fonctionnaire.length).toBeGreaterThan(10)
  })

  it('finishes the gated shelf tighter than the industry shelf, at both settings', () => {
    // Measured: €195,380 against €252,151 on normal (a ratio of 0.77), and
    // €204,059 against €304,083 on hard (0.67). Asserted one-sided, because
    // this is the property the whole edition is for: the concours converts a
    // research life's risk into a fixed, immovable, modest salary, and the
    // cadre shelf keeps its exposure to the last tile.
    expect(spread(normal.fonctionnaire)).toBeLessThan(spread(normal.cadre) * 0.95)
    expect(spread(hard.fonctionnaire)).toBeLessThan(spread(hard.cadre) * 0.95)
    // …and tighter than the contract shelf it was won from, too.
    expect(spread(normal.fonctionnaire)).toBeLessThan(spread(normal.contract) * 0.95)
  })

  it('pays for that safety on normal, and is paid back for it on hard', () => {
    /*
     * The French bargain, measured in both directions.
     *
     * On a normal board the fonctionnaire finishes *behind* the cadre shelf
     * — €624,559 against €815,061 — which is exactly the low ceiling doing
     * what a low ceiling does. Turn the difficulty up and the ranking flips:
     * €556,093 against €465,411, the best of the three shelves, because a
     * board full of layoff notices and missed payrolls cannot touch a post
     * the state appointed you to.
     */
    expect(mean(normal.fonctionnaire)).toBeLessThan(mean(normal.cadre))
    expect(mean(hard.fonctionnaire)).toBeGreaterThan(mean(hard.cadre))
    expect(mean(hard.fonctionnaire)).toBeGreaterThan(mean(hard.contract))
  })
})

describe('the gated road is an argument, not a trap', () => {
  const SEEDS = Array.from({ length: 240 }, (_, i) => i + 1)

  const roadOf = (second: string): number[] => {
    const totals: number[] = []
    for (const seed of SEEDS) {
      const { finalState } = playGame(seed, 2, seed, {
        laneBySeat: [[UNIVERSITY, second], [GRANDE_ECOLE]],
      })
      const me = finalState.players[0]!
      totals.push(finalState.results!.standings.find((s) => s.playerId === me.id)!.total)
    }
    return totals
  }

  it('costs about nothing to walk, either way', () => {
    /*
     * Six tiles with no payday on them and a bill at the top, against three
     * tiles and a payday — and at the end of the long one, two chances at a
     * post nothing can take away. Measured over the same 240 seeds and the
     * same seat: €768,645 down the concours road against €773,213 down the
     * engineer's post. Half a per cent apart, which is what a real decision
     * looks like.
     */
    const concours = mean(roadOf(CONCOURS))
    const engineers = mean(roadOf(ENGINEERS_POST))
    expect(Math.abs(concours - engineers) / engineers).toBeLessThan(0.1)
  })
})

describe('the computer can play the researcher france board unaided', () => {
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
        editionId: 'france-researcher',
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

  it('still buys houses on a board where every rung appreciates', () => {
    const owners = games.flatMap((g) => g.players).filter((p) => p.house !== null)
    expect(owners.length).toBeGreaterThan(0)
  })

  it('sits the concours, and sometimes clears it', () => {
    /*
     * The gated road is the whole payoff of this board, and a shelf nobody
     * ever reaches would be an elaborate way of writing nothing. It is a
     * gated fork behind a die with a five-or-six at the end of it, so it is
     * *meant* to be rare — this asserts it happens, not that it happens
     * often.
     */
    const appointed = games
      .flatMap((g) => g.players)
      .filter((p) => p.career?.cannotBeLaidOff === true)
    expect(appointed.length).toBeGreaterThan(0)
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
