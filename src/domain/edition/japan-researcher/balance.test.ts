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
 * The Researcher: Japan board's balance, measured from scratch — and the one
 * edition suite in this repository that is not allowed to inherit anything.
 *
 * Every other edition mirrors the USA board's shape at its own currency's
 * scale, so its balance suite can hold the same bands the USA suite holds and
 * be arguing about the same board. This one does not: it swaps what its career
 * shelves mean, and its risk sits somewhere no country board keeps any.
 * Nothing about that could be inherited on trust, so it is all re-measured
 * here:
 *
 *  - **The gated fork is a real fork.** The Fixed-Term Ladder against The
 *    Staff Job is now the board's *first* fork with anything at stake, and it
 *    is held to the same win-split and mean-gap bands every other board's
 *    opening fork is held to.
 *  - **The volatility is on the shelf a doctorate opens**, which is where this
 *    board always kept it — see that block for why the measurement moved off
 *    the opening fork and onto the shelves themselves.
 *  - **The economy still lands in a playable band** at all three difficulties,
 *    with the same shape of step down between them.
 *  - **The permanent shelf is genuinely untouchable**, which is the mechanical
 *    payoff of the gated road and the one thing on this board no other board
 *    has.
 *
 * **The opening fork is gone and its block with it.** On a researcher's board
 * the doctorate is the premise: the player answers "which life" one screen
 * before the board is built, so the board's first tile must not ask again and
 * offer the road out of research. What that block used to measure — the
 * doctorate lane finishing wider than the master's exit — is re-sited in the
 * shelf block below, and the reason it can no longer be measured lane against
 * lane is written there rather than dropped.
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

/**
 * Which face sends this player down one of the roads they are being pinned to.
 *
 * A list rather than a single name, because a seat can need holding at more
 * than one junction in the same life.
 *
 * **This helper was wrong, and the wrongness is worth writing down.** It used
 * to build `1..5` for the first road and `6..10` for the second, which is the
 * ten-wedge wheel this game used to spin. `SPIN_FACES` has been `6` since the
 * wheel became a die, and `resolveForkBranch` reads the low *half* — so a 4 or
 * a 5 asked for the first road and got the second. A seat pinned to the first
 * road actually walked it three times in five; a seat pinned to the second
 * walked it every time. Every fork figure this file and the France one ever
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
/**
 * The value `p` of the way up the sorted sample — a floor at `p = 0.25`, a
 * ceiling at `p = 0.9`. A shelf's ceiling is a fact about the top of a lopsided
 * distribution, and neither a mean nor a standard deviation says where that is.
 */
const quantile = (xs: number[], p: number): number => {
  const sorted = [...xs].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]!
}

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
    // Measured over these 60 games: mean ¥69.0M, median ¥69.3M, nobody ever
    // bust. That is the country Japan board's band (its own measurement is
    // ¥65.9M) with the top of it opened out, because this board's academia
    // shelf genuinely pays more per payday than any country shelf does — a
    // professor out-earns a salaryman, and the ladder that leads to one is
    // the widest in the game.
    //
    // It was ¥72.8M / ¥70.3M before the master's exit was removed. Losing that
    // road costs the table about ¥3.7M of its average, and all of it is the
    // three early paydays it carried: nobody is hired at twenty-four on this
    // board any more, so every seat now spends the first nine tiles paying a
    // bill and earning a teaching fee. It is a poorer board and a truer one.
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
    // Measured: median ¥35.4M against normal's ¥69.3M, one player in six bust
    // (16.1%). It was ¥35.9M and 14.4% with the master's exit still on the
    // board, and ¥40.6M / one in ten before the layoff cost a payday.
    expect(median(hard.totals)).toBeLessThan(median(normal.totals) * 0.8)
    expect(median(hard.totals)).toBeGreaterThan(10_000_000)
    expect(bustShare(hard.totals)).toBeGreaterThan(0)
    expect(bustShare(hard.totals)).toBeLessThan(0.25)
  })

  it('puts very hard on a knife edge: the median finishes near zero', () => {
    // Measured: 44.4% bust, median ¥5.8M, mean −¥4.7M. It was 36.1%, ¥14.2M
    // and ¥4.2M with the master's exit still on the board — the road that is
    // gone was the one carrying the early paydays, and very hard is the
    // setting with the least margin to lose them from.
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

describe('the gated fork: the ladder is where this board keeps its risk', () => {
  const LADDER = 'The Fixed-Term Ladder'
  const STAFF = 'The Staff Job'

  /**
   * **Why the measurement is here and not at the opening fork.**
   *
   * This board used to open on a fork — the doctoral course against the
   * master's exit — and that fork carried two of this suite's claims: that
   * neither road was a trap, and that the road paying the bill was the wider
   * one. The fork is gone, because a researcher's board must not open by
   * offering the road out of research to a player who chose a researcher's
   * life one screen earlier.
   *
   * The first claim moves here intact: this is now the board's first junction
   * with anything at stake, and it is held to the same bands.
   *
   * The second claim cannot move here *as a lane comparison*, and the reason
   * is mechanical rather than a matter of taste. The opening fork decided
   * which career shelf a seat spent its whole life on, so the shelf's width
   * showed up in the finishing totals directly. This junction sits at segment
   * four of ten and decides only which shelf a seat *retires* on; six more
   * tiles of shared variance are added afterwards, and they swamp it.
   * Measured over 2,400 seeds, both roads pinned, the lane-against-lane
   * spread ratio here is 1.050 on normal, 0.923 on hard and 0.993 on very
   * hard — level, from either side, with no direction to assert. (At the
   * opening fork the same statistic read 0.832 on normal, and that is the
   * *corrected* figure; the 0.873 this file used to quote was measured
   * through the broken pin described on `laneRoll`.)
   *
   * So the width claim is measured where it actually lives — on the shelves —
   * in the block below, which is a better instrument for it in any case: it
   * says which shelf is wide rather than inferring it from who happened to be
   * dealt one.
   */
  interface Split {
    readonly ladder: number[]
    readonly staff: number[]
    readonly ladderWinRate: number
  }

  const splitOf = (seeds: readonly number[], options: PlayOptions = {}): Split => {
    const laneBySeat = [[LADDER], [STAFF]]
    const ladder: number[] = []
    const staff: number[] = []
    let ladderWins = 0
    for (const seed of seeds) {
      const { finalState } = playGame(seed, 2, seed, { ...options, laneBySeat })
      const results = finalState.results!
      finalState.players.forEach((player, seat) => {
        const total = results.standings.find((s) => s.playerId === player.id)!.total
        ;(seat === 0 ? ladder : staff).push(total)
      })
      if (finalState.players.findIndex((p) => p.id === results.winnerId) === 0) ladderWins += 1
    }
    return { ladder, staff, ladderWinRate: ladderWins / seeds.length }
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
     * Measured at 53.6% to the ladder over these 2,400 games, and it is the
     * same 53.6% the board read before the opening fork was removed — a seat
     * on the doctoral road plays a bit-identical game either way, confirmed
     * seed for seed at all three difficulties.
     *
     * The band is the one every opening fork on every board is held to,
     * unchanged. Under a hand's own judgement the ladder is kinder still: these
     * games take whichever option the seed happens to index, so half the seats
     * that clear the Ten-Year Cliff then accept an industry job at the
     * Career-Change Fair — the one thing nobody would ever do with a post that
     * cannot be taken away. The band is a floor on the road, not a description
     * of how it plays.
     */
    expect(sample.ladderWinRate).toBeGreaterThan(0.33)
    expect(sample.ladderWinRate).toBeLessThan(0.62)
  })

  it('leaves neither road the obvious money play', () => {
    // Measured over 2,400 seeds at ¥70.1M down the ladder against ¥68.5M down
    // the staff job — a 2.3% gap, inside the same 15% every board's opening
    // fork is held to. On hard it is 8.4% (¥35.8M against ¥32.8M), still well
    // inside. Very hard is not asserted: both means sit within a few million
    // of zero there, where a ratio of two means says nothing at all.
    const gap = Math.abs(mean(sample.ladder) - mean(sample.staff))
    expect(gap / mean(sample.ladder)).toBeLessThan(0.15)
  })

  it('keeps both roads worth walking — neither is a losing move on its own', () => {
    for (const totals of [sample.ladder, sample.staff]) {
      expect(mean(totals)).toBeGreaterThan(10_000_000)
    }
  })

  it.each([['hard', harder.hard], ['very hard', harder.veryHard]])(
    'stays an even fork on the %s',
    (_label, split) => {
      // Measured over 1,200 seeds: 54.4% on hard and 52.6% on very hard.
      expect(split.ladderWinRate).toBeGreaterThan(0.33)
      expect(split.ladderWinRate).toBeLessThan(0.62)
    },
  )
})

describe('the ladder is the only road to the post nothing can take away', () => {
  /*
   * The gate's whole purpose, asserted as an absolute rather than as a rate,
   * because it is one: the Ten-Year Cliff is the only tile on this board that
   * deals from the permanent shelf, and it stands at the end of the gated
   * road. A seat sent down The Staff Job cannot reach that shelf by any route
   * the board offers, at any difficulty, on any seed.
   *
   * This is what the `requires: 'doctorate'` gate is *for*, now that the gate
   * itself turns nobody away — every seat holds a doctorate by the time it
   * reaches this junction, so the road, not the qualification, is the thing
   * that is scarce.
   */
  const SEEDS = Array.from({ length: 1_200 }, (_, i) => i + 1)

  const roadsAt = (difficulty?: Difficulty) => {
    let ladderPermanent = 0
    let staffPermanent = 0
    for (const seed of SEEDS) {
      const { finalState } = playGame(seed, 2, seed, {
        ...(difficulty ? { difficulty } : {}),
        laneBySeat: [['The Fixed-Term Ladder'], ['The Staff Job']],
      })
      finalState.players.forEach((player, seat) => {
        if (player.career?.cannotBeLaidOff !== true) return
        if (seat === 0) ladderPermanent += 1
        else staffPermanent += 1
      })
    }
    return { ladderPermanent, staffPermanent }
  }

  // Taken out here rather than inside the tests, like every other sample in
  // this file: two thousand four hundred games do not belong on one `it`'s
  // twenty-second clock.
  const roads = { normal: roadsAt(), hard: roadsAt('hard') }

  it.each([['normal', roads.normal], ['hard', roads.hard]])(
    'reaches the permanent shelf down the ladder and never down the staff job, on %s',
    (_label, counted) => {
      // Measured over 1,200 pinned seats each: exactly half the ladder seats
      // retire on a permanent post (600 of 1,200 on normal, 600 on hard — the
      // other half trade it at the Career-Change Fair because the harness
      // takes whichever option the seed indexes), and zero staff seats do.
      expect(counted.ladderPermanent).toBeGreaterThan(SEEDS.length * 0.4)
      expect(counted.staffPermanent).toBe(0)
    },
  )
})

describe('the volatility is on the shelf a doctorate opens', () => {
  /*
   * **The claim this edition exists to make, measured where it now lives.**
   *
   * Its words have not changed since the first cut of this board: the academia
   * shelf runs from a part-time lecturer paid by the course to a centre
   * director on a ten-year national programme — ¥2.45M to ¥14.7M, five times
   * the industry shelf's whole range — and that is what makes a Japanese
   * research life a gamble. What has changed is the instrument. The claim used
   * to be read off the opening fork, because that fork decided which shelf a
   * seat was dealt; with every seat now dealt the academia shelf at The First
   * Position, the fork that measured it is gone and the shelves have to be
   * compared directly. They are the thing the claim was always about.
   *
   * Grouped by the shelf a seat was standing on at retirement, over 2,400
   * seeds with both roads out of the gated fork pinned (4,800 finishes):
   *
   *     normal            permanent      industry      academia
   *     n                    1,200          3,142           458
   *     floor  (p25)       ¥70.92M        ¥48.50M       ¥72.63M
   *     median             ¥82.59M        ¥59.58M       ¥91.71M
   *     ceiling (p90)     ¥106.10M        ¥85.84M      ¥122.75M
   *     spread             ¥18.43M        ¥18.71M       ¥29.23M
   *     in the red            0.0%           0.0%          0.0%
   *
   *     hard              permanent      industry      academia
   *     n                    1,200          3,276           324
   *     floor  (p25)       ¥39.28M         ¥7.88M       ¥41.27M
   *     median             ¥55.15M        ¥28.86M       ¥64.38M
   *     ceiling (p90)      ¥82.54M        ¥57.95M       ¥93.26M
   *     spread             ¥26.06M        ¥28.16M       ¥31.15M
   *     in the red            3.6%          18.6%          6.2%
   *
   * The academia shelf is half again as wide as either shelf a player can
   * leave it for, and it has both the highest ceiling and, on hard, a ruin
   * rate between the other two. That is the gamble.
   */
  const SEEDS = Array.from({ length: 2_400 }, (_, i) => i + 1)

  const shelvesAt = (difficulty?: Difficulty) => {
    const permanent: number[] = []
    const industry: number[] = []
    const academia: number[] = []
    for (const seed of SEEDS) {
      const { finalState } = playGame(seed, 2, seed, {
        ...(difficulty ? { difficulty } : {}),
        laneBySeat: [['The Fixed-Term Ladder'], ['The Staff Job']],
      })
      const results = finalState.results!
      for (const player of finalState.players) {
        const total = results.standings.find((s) => s.playerId === player.id)!.total
        if (player.career?.cannotBeLaidOff) permanent.push(total)
        else if (player.career?.requiresDegree === false) industry.push(total)
        else if (player.career) academia.push(total)
      }
    }
    return { permanent, industry, academia }
  }

  const normal = shelvesAt()
  const hard = shelvesAt('hard')

  it('deals every shelf often enough for the comparison to mean anything', () => {
    // The academia shelf is the thinnest sample of the three and the one every
    // bound below leans on, so it is the one pinned: 458 finishes on normal
    // and 324 on hard out of 4,800 seats. Three hundred samples put a standard
    // deviation's own error near 4%, comfortably smaller than the gaps below.
    expect(normal.academia.length).toBeGreaterThan(300)
    expect(hard.academia.length).toBeGreaterThan(300)
    expect(normal.permanent.length).toBeGreaterThan(300)
    expect(hard.industry.length).toBeGreaterThan(300)
  })

  it('finishes the academia shelf half again as wide as either shelf you can leave it for', () => {
    /*
     * Measured on normal: ¥29.23M against the industry shelf's ¥18.71M (a
     * ratio of 1.562) and the permanent shelf's ¥18.43M (1.586). With 458
     * academia finishes a standard deviation carries about 3.3% of its own
     * error, so a bound at 1.30 sits four to five standard errors below both.
     *
     * Asserted one-sided and on normal, because normal is where the board's
     * own shape shows. On hard every shelf is widened by the same bills — the
     * ratios compress to 1.106 and 1.195, which 2,400 seeds cannot carry a
     * bound against — so hard is asserted below on the statistic where hard's
     * variance actually shows up, which is who ends the game in the red.
     */
    expect(spread(normal.academia)).toBeGreaterThan(spread(normal.industry) * 1.3)
    expect(spread(normal.academia)).toBeGreaterThan(spread(normal.permanent) * 1.3)
    // …and it has the highest ceiling of the three, at both settings, which is
    // the same sentence from the other end and the reason anybody walks it.
    expect(quantile(normal.academia, 0.9)).toBeGreaterThan(quantile(normal.permanent, 0.9))
    expect(quantile(normal.academia, 0.9)).toBeGreaterThan(quantile(normal.industry, 0.9))
    expect(quantile(hard.academia, 0.9)).toBeGreaterThan(quantile(hard.permanent, 0.9))
    expect(quantile(hard.academia, 0.9)).toBeGreaterThan(quantile(hard.industry, 0.9))
  })

  it('takes the risk off whoever clears the cliff, and hard is where that shows', () => {
    /*
     * §10.3: "Success = a 無期 post: **the safest shelf in the entire game** —
     * the Layoff Notice tile explicitly cannot touch it." Measured on hard,
     * where a board with real bills on it can ruin somebody: 3.6% of permanent
     * finishes end in the red against the industry shelf's 18.6% and the
     * academia shelf's 6.2%. On 1,200 and 3,276 samples the first gap is
     * twenty-odd standard errors; the second is asserted with the looser
     * factor its 324 academia samples can carry.
     *
     * This is the *other* half of the Japanese story, and the half the opening
     * fork could never show: getting in is the gamble, and once you are in
     * there is nothing left to gamble with.
     */
    const red = (xs: number[]): number => xs.filter((t) => t < 0).length / xs.length
    expect(red(hard.permanent)).toBeLessThan(red(hard.industry) * 0.4)
    expect(red(hard.permanent)).toBeLessThan(red(hard.academia))
    // And nobody at all is ruined on a permanent post at normal.
    expect(red(normal.permanent)).toBe(0)
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
