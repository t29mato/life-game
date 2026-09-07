import { describe, expect, it } from 'vitest'

import { createGameStore } from '../../../application/createGameStore'
import { decideCpuCommand } from '../../../application/cpu/decideCpuCommand'
import { isFork } from '../../../application/usecases/branch'
import { SPIN_FACES } from '../../model/constants'
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
 *  - **The gated fork is even, and its two roads finish equally wide.**
 *    Japan's suite once asserted a one-sided inversion at its opening fork —
 *    the doctorate lane finishing wider than the master's exit — and this
 *    board deliberately does not reproduce that anywhere. France's risk is not
 *    on a lane. It is on a *shelf*, behind a *gate*, and the fork's own
 *    spreads come out level from either side of 1.
 *  - **The gate is where the volatility went.** The shelf behind the concours
 *    finishes measurably tighter than both other shelves at both settings, and
 *    against the contract shelf it was won from it has the highest floor and
 *    the lowest ceiling — which is what a job nothing can take from you is
 *    actually worth. That is the France design's central claim, and it is the
 *    mirror image of the Japan board's. What it is *not* is the best-paid
 *    shelf on hard; see that block's own comment for the measurement, and
 *    §10.3 for the design saying so first.
 *  - **The gated road is a real argument, and a priced one.** Walking the
 *    concours road rather than the engineer's post costs about an eighth of a
 *    life on normal and a quarter of one on hard, and buys the only shelf on
 *    the board nothing can take away. It is neither a trap nor a free win, and
 *    the figure it used to quote — half a per cent — was the broken pin.
 *  - **The economy still lands in a playable band** at all three difficulties,
 *    with the same shape of step down between them.
 *
 * **The opening fork is gone and its block with it.** On a researcher's board
 * the doctorate is the premise: the player answers "which life" one screen
 * before the board is built, and this board's opening fork then offered la
 * grande école — the road that bypasses university science altogether. What
 * that block measured is re-sited below, at the concours, which is where §10.3
 * always said this country keeps its risk ("front-loaded into a single entry
 * gate").
 *
 * **Every fork figure this file used to quote was measured through a broken
 * pin** — see `laneRoll`, which built its faces for a ten-wedge wheel this game
 * stopped spinning. Two assertions in this file were passing on that blend and
 * are not true of the board; both are re-measured and rewritten below, with the
 * decomposition, rather than loosened quietly.
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
 * Which face sends this player down one of the roads they are being pinned to.
 * A list rather than a single name, because a seat can need holding at more
 * than one junction in the same life.
 *
 * **This helper was wrong, and the wrongness is worth writing down.** It used
 * to build `1..5` for the first road and `6..10` for the second, which is the
 * ten-wedge wheel this game used to spin. `SPIN_FACES` has been `6` since the
 * wheel became a die, and `resolveForkBranch` reads the low *half* — so a 4 or
 * a 5 asked for the first road and got the second. A seat pinned to the first
 * road actually walked it three times in five; a seat pinned to the second
 * walked it every time. Every fork figure this file and the Japan one ever
 * recorded was that blend, which is exactly the failure mode `AGENTS.md` §4
 * warns about: a green suite producing measurements of a board nobody was
 * playing. It is derived from `SPIN_FACES` now, so it cannot go stale again.
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
  const half = SPIN_FACES / 2
  const offset = (((entropy % half) + half) % half) + 1
  return (branch === 0 ? offset : offset + half) as SpinValue
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
/**
 * The value `p` of the way up the sorted sample — a floor at `p = 0.25`, a
 * ceiling at `p = 0.9`.
 *
 * A shelf's floor and ceiling are what §10.3 of the concept document actually
 * claims for this board, so they are measured directly rather than inferred
 * from a mean and a standard deviation, neither of which says where the bottom
 * of a lopsided distribution is.
 */
const quantile = (xs: number[], p: number): number => {
  const sorted = [...xs].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]!
}

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
    // Measured over these 60 games: mean €725,579, median €705,500, one seat
    // in 180 finishing in the red. It was €771,434 / €747,000 / nobody with la
    // grande école still on the board — losing that road costs the table about
    // 6% of its average, and all of it is the three early paydays it carried:
    // nobody is salaried at twenty-three here any more, so every seat now
    // spends the first nine tiles on a thesis. It is a poorer board and a
    // truer one.
    //
    // The bust line used to read `toBe(0)`, and it stopped being true the day
    // a new arrival became a die: a seat or so in 180 finishes in the red now.
    // It is not the child bill that puts them there — the same seat goes bust
    // with the phone call priced at €0 — it is that the board no longer hands
    // every family a guaranteed child, and that seat's whole margin was the
    // one child's bonus at the final scoring. An exact zero over a sample was
    // a fact about one random sequence rather than a promise the board ever
    // made, so what is asserted is the promise: going bust on normal stays
    // rare, on the same order as `gameBalance`'s own 15% ceiling and far under
    // it.
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
    // Measured: median €412,900 against normal's €705,500, one player in seven
    // bust (14.4%). It was €425,115 and 7.8% with la grande école still on the
    // board; the road that is gone is the one that was salaried from its first
    // square, and hard is where that mattered most.
    expect(median(hard.totals)).toBeLessThan(median(normal.totals) * 0.8)
    expect(median(hard.totals)).toBeGreaterThan(100_000)
    expect(bustShare(hard.totals)).toBeGreaterThan(0)
    expect(bustShare(hard.totals)).toBeLessThan(0.25)
  })

  it('puts very hard on a knife edge', () => {
    // Measured: 38.3% bust, median €156,800, mean €27,025. It was 41.1% and
    // €171,300 with la grande école still on the board.
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

describe('the gated fork: the concours is where this board keeps its risk', () => {
  /**
   * **Why the measurement is here and not at the opening fork.**
   *
   * This board used to open on a fork — the university against la grande école
   * — and that fork carried this suite's "neither road is a trap" claim and its
   * refusal of the Japan board's lane inversion. The fork is gone, because a
   * researcher's board must not open by offering the road that bypasses
   * university science to a player who chose a researcher's life one screen
   * earlier.
   *
   * Both claims move here, and this is the better place for them: §10.3 puts
   * France's risk "front-loaded into a single entry gate", so the junction in
   * front of the gate is the one that ought to be carrying them.
   */
  interface Split {
    readonly concours: number[]
    readonly engineers: number[]
    readonly concoursWinRate: number
  }

  const splitOf = (seeds: readonly number[], options: PlayOptions = {}): Split => {
    const laneBySeat = [[CONCOURS], [ENGINEERS_POST]]
    const concours: number[] = []
    const engineers: number[] = []
    let concoursWins = 0
    for (const seed of seeds) {
      const { finalState } = playGame(seed, 2, seed, { ...options, laneBySeat })
      const results = finalState.results!
      finalState.players.forEach((player, seat) => {
        const total = results.standings.find((s) => s.playerId === player.id)!.total
        ;(seat === 0 ? concours : engineers).push(total)
      })
      if (finalState.players.findIndex((p) => p.id === results.winnerId) === 0) concoursWins += 1
    }
    return { concours, engineers, concoursWinRate: concoursWins / seeds.length }
  }

  const MANY = Array.from({ length: 2_400 }, (_, i) => i + 1)
  const sample = splitOf(MANY)
  /*
   * Half the seeds on the harder settings, and every sample taken out here
   * rather than inside an `it`, which is this file's own pattern. A win rate
   * carries about 1.4 points of its own error at 1,200 games, against a band
   * twenty-nine points wide, so nothing is bought by the extra thousand — and
   * a 2,400-seed set inside a test's own clock times out the moment the
   * machine has anything else to do.
   */
  const FEWER = MANY.slice(0, 1_200)
  const harder = {
    hard: splitOf(FEWER, { difficulty: 'hard' }),
    veryHard: splitOf(FEWER, { difficulty: 'veryHard' }),
  }

  it('splits the wins between the two roads', () => {
    /*
     * Measured at 41.1% to the concours over these 2,400 games, and it is the
     * same 41.1% the board read before the opening fork was removed — a seat on
     * the university road plays a bit-identical game either way, confirmed seed
     * for seed at all three difficulties.
     *
     * It is the low side of the band on purpose: the concours road forgoes a
     * payday, pays a bill, and appoints two seats in six, twice. What it buys
     * is measured in the shelf block below. The band is the one every board's
     * first real fork is held to, unchanged.
     */
    expect(sample.concoursWinRate).toBeGreaterThan(0.33)
    expect(sample.concoursWinRate).toBeLessThan(0.62)
  })

  it('does NOT reproduce the Japan board\'s lane inversion, and that is still the finding', () => {
    /*
     * The Researcher: Japan suite once asserted one-sidedly that its doctorate
     * lane finished *wider* than the safe road. This board is built the other
     * way and measures accordingly at its own gated fork: 1.079 on normal,
     * 0.998 on hard, 0.974 on very hard — level, at every setting, and level
     * from *either* side of 1, which is the point.
     *
     * France's volatility is not on a road. It is on one competition and on the
     * shelf behind it, and the block below is where that is measured. A ratio
     * that drifted far off 1 here would mean one of the two roads had quietly
     * become the gamble, which is the Japanese board's story and not this one's.
     */
    const ratio = spread(sample.engineers) / spread(sample.concours)
    expect(ratio).toBeGreaterThan(0.85)
    expect(ratio).toBeLessThan(1.15)
  })

  it('keeps both roads worth walking — neither is a losing move on its own', () => {
    for (const totals of [sample.concours, sample.engineers]) {
      expect(mean(totals)).toBeGreaterThan(100_000)
    }
  })

  it.each([['hard', harder.hard], ['very hard', harder.veryHard]])(
    'stays a real fork on the %s',
    (_label, split) => {
      // Measured over 1,200 seeds: 41.6% on hard and 41.8% on very hard.
      expect(split.concoursWinRate).toBeGreaterThan(0.33)
      expect(split.concoursWinRate).toBeLessThan(0.62)
    },
  )
})

describe('after the gate, the inversion inverts', () => {
  /*
   * **The France board's own property, and the one no other edition's suite
   * can hold for us.** §10.3 asks for a late game that plays academia-safe and
   * industry-volatile — the mirror image of Japan. Its words for the
   * fonctionnaire shelf are "highest floor on any board, lowest ceiling on any
   * board … and a salary that industry's rung 2 already beats", and that last
   * clause is load-bearing: this is a claim about the *shape* of the shelf, not
   * about its average.
   *
   * Measured by grouping every finished player by the shelf they were standing
   * on at retirement, with both roads out of the gated fork pinned.
   *
   * **2,400 seeds, not 1,200, and the pin is fixed.** Two things moved under
   * this block at once. The pin that holds a seat to a road was building its
   * faces for a ten-wedge wheel (see `laneRoll`), so a third of the "concours"
   * sample was walking the engineer's post; and the opening fork's removal
   * changed *who is on the cadre shelf*. It used to be la grande école — a road
   * walked from tile one by half the table. It is now only The Move to
   * Industry, taken mid-career by one seat in seven. That is a different
   * population, not a smaller one, and two assertions that stood here were
   * true of the old one and are not true of this one. Both are rewritten
   * below, with what they read, rather than loosened quietly.
   *
   *     normal              fonctionnaire      cadre       contract
   *     n                          640          674          3,486
   *     floor  (p25)          €623,000     €560,450       €566,200
   *     median                €731,400     €724,900       €738,274
   *     ceiling (p90)       €1,002,500   €1,100,800     €1,100,600
   *     spread                €195,071     €255,456       €269,134
   *     in the red                0.0%         0.0%           0.0%
   *     mean                  €751,551     €758,036       €753,484
   *
   *     hard                fonctionnaire      cadre       contract
   *     n                          687          456          3,657
   *     floor  (p25)          €312,132     €298,600       €176,600
   *     median                €478,500     €480,383       €425,200
   *     ceiling (p90)         €727,800     €817,500       €810,100
   *     spread                €264,512     €305,330       €346,330
   *     in the red                7.4%         6.8%          13.2%
   *     mean                  €448,623     €468,795       €393,997
   *
   * Every figure above was confirmed against a second, disjoint 2,400-seed set
   * (seeds 2,401–4,800) before it was written down, and the bounds below are
   * chosen from whichever of the two sets is less favourable.
   */
  const SEEDS = Array.from({ length: 2_400 }, (_, i) => i + 1)

  const shelvesAt = (difficulty?: Difficulty) => {
    const fonctionnaire: number[] = []
    const cadre: number[] = []
    const contract: number[] = []
    for (const seed of SEEDS) {
      const { finalState } = playGame(seed, 2, seed, {
        ...(difficulty ? { difficulty } : {}),
        laneBySeat: [[CONCOURS], [ENGINEERS_POST]],
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

  it('reaches every shelf often enough for the measurement to mean anything', () => {
    /*
     * The gated shelf is meant to be uncommon: a fork entered on half the
     * faces, then two sittings that appoint on a five or a six. What thins it
     * further is the harness rather than the board — these games take whichever
     * option the seed happens to index, so some of the players who *did* clear
     * the concours then accept a contract job at the industry fair, which is
     * the one thing no real player would ever do with a post nothing can take
     * away.
     *
     * Measured: 640 fonctionnaire finishes on normal and 687 on hard out of
     * 4,800 seats each. The cadre shelf is the thin one now — 674 and 456 —
     * and the bounds below are picked with that in mind.
     */
    expect(normal.fonctionnaire.length).toBeGreaterThan(300)
    expect(hard.fonctionnaire.length).toBeGreaterThan(300)
    expect(normal.cadre.length).toBeGreaterThan(300)
    expect(hard.cadre.length).toBeGreaterThan(300)
  })

  it('finishes the gated shelf tighter than both other shelves, at both settings', () => {
    /*
     * The property the whole edition is for: the concours converts a research
     * life's risk into a fixed, immovable, modest salary.
     *
     * Against the **contract shelf it was won from**, measured over 2,400
     * seeds: €195,071 against €269,134 on normal (a ratio of 0.725) and
     * €264,512 against €346,330 on hard (0.764). The second seed set reads
     * 0.748 and 0.774. With 640-plus samples on each side the ratio carries
     * about 3% of its own error, so the 0.95 bound sits six standard errors
     * away.
     *
     * Against the **cadre shelf**, 0.764 on normal and 0.866 on hard (0.839 and
     * 0.915 on the second set). Those are asserted one-sided against 1 rather
     * than against 0.95, and the reason is the sample rather than the board:
     * with the grande école road gone the cadre shelf is one seat in seven,
     * self-selected — the mid-career leaver — and 456 samples on hard cannot
     * carry a tighter bound honestly. The claim it can carry is that the post
     * is still the narrower of the two, at both settings, which it is by three
     * to four standard errors.
     */
    expect(spread(normal.fonctionnaire)).toBeLessThan(spread(normal.contract) * 0.95)
    expect(spread(hard.fonctionnaire)).toBeLessThan(spread(hard.contract) * 0.95)
    expect(spread(normal.fonctionnaire)).toBeLessThan(spread(normal.cadre))
    expect(spread(hard.fonctionnaire)).toBeLessThan(spread(hard.cadre))
  })

  it('stands on the highest floor and under the lowest ceiling, at both settings', () => {
    /*
     * §10.3's own sentence, measured directly rather than inferred from a mean
     * and a standard deviation, neither of which says where the bottom of a
     * lopsided distribution is.
     *
     * **The floor.** Against the contract shelf: €623,000 against €566,200 on
     * normal and €312,132 against €176,600 on hard — 10% and 77% clear, and
     * the same on the second seed set (€636,050/€569,100 and
     * €307,500/€199,100). Against the cadre shelf it clears on normal
     * (€623,000 against €560,450) and is *level* on hard: €312,132 against
     * €298,600 on this seed set and €307,500 against €317,900 on the next one,
     * which is a quarter of a standard error either way. The version of this
     * test that stood here asserted the hard floor against the cadre shelf and
     * passed, and it was reading a cadre shelf half made of grande école seats
     * through a broken pin. It is not asserted now, because it is not true —
     * only the contract comparison is, and that is the one §10.3's "won from"
     * is about.
     *
     * **The ceiling.** Lowest of the three at both settings and against both
     * shelves: €1,002,500 against €1,100,800 and €1,100,600 on normal,
     * €727,800 against €817,500 and €810,100 on hard — four or more standard
     * errors on every comparison. The version of this test that stood here
     * required the cadre ceiling to be a further tenth higher; measured
     * properly the margin is 9%, not 10%, and it is asserted for what it is.
     */
    expect(quantile(normal.fonctionnaire, 0.25)).toBeGreaterThan(quantile(normal.contract, 0.25))
    expect(quantile(hard.fonctionnaire, 0.25)).toBeGreaterThan(quantile(hard.contract, 0.25))
    expect(quantile(normal.fonctionnaire, 0.25)).toBeGreaterThan(quantile(normal.cadre, 0.25))

    for (const shelves of [normal, hard]) {
      expect(quantile(shelves.fonctionnaire, 0.9)).toBeLessThan(quantile(shelves.cadre, 0.9))
      expect(quantile(shelves.fonctionnaire, 0.9)).toBeLessThan(quantile(shelves.contract, 0.9))
    }
  })

  it('pays for that safety on normal, and is paid back for it on hard', () => {
    /*
     * The French bargain, measured against the shelf the post is actually won
     * from — the contract shelf, where three-quarters of this board's finishes
     * stand.
     *
     *     mean            fonctionnaire     contract     difference
     *     normal               €751,551     €753,484          −0.3%
     *     hard                 €448,623     €393,997         +13.9%
     *
     * The second seed set reads −0.3% and +13.0%. On normal the post is dead
     * level with a contract life and buys nothing but its shape; turn the board
     * hostile and it is a seventh ahead, because the thing that ruins people on
     * hard is losing the post, and this is the post that cannot be lost. Ruin
     * on hard: 7.4% against 13.2% (6.6% against 12.7% on the second set).
     *
     * Against the **cadre** shelf the post trails at both settings — by 0.9% on
     * normal and 4.3% on hard (1.1% and 4.7% on the second set) — which is
     * §10.3's "a salary that industry's rung 2 already beats", conceded in the
     * design's own sentence. What stood here asserted that this gap *closed* on
     * hard, from 12.7% to 1.1%. It does not: it widens, and it widens because
     * the cadre shelf is a different population now (see this block's header).
     * The claim that survives is that the post never runs away from industry in
     * either direction, which is asserted two-sided.
     */
    const shareOf = (xs: number[]): number => xs.filter((t) => t < 0).length / xs.length

    // Normal: level with the contract shelf, inside three per cent either way.
    expect(
      Math.abs(mean(normal.fonctionnaire) - mean(normal.contract)) / mean(normal.contract),
    ).toBeLessThan(0.03)
    // Hard: clearly ahead of it, and clearly less often ruined.
    expect(mean(hard.fonctionnaire)).toBeGreaterThan(mean(hard.contract) * 1.05)
    expect(shareOf(hard.fonctionnaire)).toBeLessThan(shareOf(hard.contract) * 0.75)
    expect(shareOf(normal.fonctionnaire)).toBe(0)

    // And it never overtakes industry, nor falls far behind it, at either
    // setting — the mean §10.3 conceded, bounded on both sides so a change
    // that let either shelf run away from the other fails here.
    for (const shelves of [normal, hard]) {
      const gap = (mean(shelves.cadre) - mean(shelves.fonctionnaire)) / mean(shelves.cadre)
      expect(gap).toBeLessThan(0.15)
      expect(gap).toBeGreaterThan(-0.05)
    }
  })
})

describe('the gated road costs money, and buys the one thing money cannot', () => {
  // 1,200 seeds rather than 2,400, because this block plays four whole sets
  // rather than two. The statistic it asserts carries about 1.2% of its own
  // error at this size, and the nearest bound is six standard errors away.
  const SEEDS = Array.from({ length: 1_200 }, (_, i) => i + 1)

  const roadOf = (road: string, difficulty?: Difficulty): number[] => {
    const totals: number[] = []
    for (const seed of SEEDS) {
      const { finalState } = playGame(seed, 2, seed, {
        ...(difficulty ? { difficulty } : {}),
        laneBySeat: [[road]],
      })
      const me = finalState.players[0]!
      totals.push(finalState.results!.standings.find((s) => s.playerId === me.id)!.total)
    }
    return totals
  }

  /** What walking the concours road costs, as a share of the road opposite. */
  const priceOn = (difficulty?: Difficulty): number => {
    const concours = mean(roadOf(CONCOURS, difficulty))
    const engineers = mean(roadOf(ENGINEERS_POST, difficulty))
    return (engineers - concours) / engineers
  }

  // Measured outside the assertions, like every other sample in this file, so
  // that four thousand eight hundred games are not charged to one test's clock.
  const onNormal = priceOn()
  const onHard = priceOn('hard')

  it('charges a real price for the competition, and a bounded one', () => {
    /*
     * **This assertion used to say the opposite, and it was wrong.**
     *
     * It read "costs about nothing to walk, either way", bounded at 10%, quoting
     * €768,645 down the concours against €773,213 down the engineer's post —
     * half a per cent. That figure was produced by the broken pin described on
     * `laneRoll`: two of every five seats "held" to the university and to the
     * concours actually walked la grande école and the engineer's post, so the
     * two samples were substantially the same games. Decomposed over 2,400
     * seeds, seat 0 pinned and seat 1 left alone:
     *
     *                                 normal      hard
     *     as it was measured           −0.6%         —
     *     on the same commit, pin fixed  −11.0%    −23.7%
     *     on this tree, pin fixed        −12.5%    −24.3%
     *
     * Eleven of those twelve points predate the opening fork's removal
     * entirely; they were simply invisible. So what is asserted is what the
     * board does: the concours road costs money — about an eighth of a life on
     * normal and a quarter of one on hard — and that is §10.3's design in as
     * many words ("the price is a famously modest salary and a low ceiling").
     * It is bounded above so the road cannot quietly become a fine, and below
     * so a change that made it free would have to say so here.
     *
     * A quarter of a life on hard is a large price and worth a tuning pass in
     * its own right; it is left measured rather than re-shaped here, because
     * re-shaping it is a France economy pass and not a fork removal.
     */
    expect(onNormal).toBeGreaterThan(0.05)
    expect(onNormal).toBeLessThan(0.20)

    expect(onHard).toBeGreaterThan(0.05)
    expect(onHard).toBeLessThan(0.35)
    // The price rises with the difficulty, because what it buys is insurance
    // and insurance costs most where it is worth most.
    expect(onHard).toBeGreaterThan(onNormal)
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
