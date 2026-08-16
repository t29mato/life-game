import { describe, expect, it } from 'vitest'

import { createGameStore } from '../application/createGameStore'
import { decideCpuCommand } from '../application/cpu/decideCpuCommand'
import {
  createInMemoryRepository,
  createInMemoryStatsRepository,
  createSeededRandom,
} from '../application/testing/fakes'
import type { BoardLength, Difficulty, GameState, PlayerColor, SpaceId } from '../domain/model/types'
import { estimateNetWorth } from '../domain/rules/scoring'

/**
 * Whole-system property tests.
 *
 * The per-layer suites prove each rule in isolation. These play hundreds of
 * complete games across different seeds and assert the properties that only
 * emerge from the whole thing running together: that a game always terminates,
 * that nobody gets stuck, and that the economy stays in a sane band. A board or
 * balance change that makes the game unwinnable, unlosable, or endless fails
 * here even when every unit test still passes.
 */

const SEEDS = Array.from({ length: 60 }, (_, i) => i + 1)

/** Hard cap: a game needing this many dispatches is broken, not merely long. */
const DISPATCH_LIMIT = 5_000

interface Playthrough {
  readonly finalState: GameState
  readonly dispatches: number
  /** Net worth per player, sampled at each turn boundary. */
  readonly leaderHistory: readonly string[]
}

interface PlayOptions {
  readonly boardLength?: BoardLength
  readonly cpuSeats?: number
  /** Omitted plays `normal`, exactly as every call site did before difficulty existed. */
  readonly difficulty?: Difficulty
  /**
   * Lane each seat insists on at a fork, by name, keyed on seat index.
   *
   * Every other decision still follows `optionBias`, so two seats given
   * different opening lanes and the same bias play identical lives from the
   * moment the lanes rejoin — which is the only way to attribute the
   * difference in their final totals to the fork itself.
   */
  readonly laneBySeat?: readonly string[]
  /**
   * Every lane a seat insists on, so two forks can be pinned in one game.
   *
   * `laneBySeat` can hold one seat to one road, which is all the opening fork
   * needs. Measuring a fork *downstream* of another one needs both pinned at
   * once — the mid-career fork is only worth measuring with the opening lane
   * held still, or the two choices are stirred together.
   */
  readonly lanesBySeat?: readonly (readonly string[])[]
  /** Buys the first policy offered, so hazard cover can be measured in play. */
  readonly insureAlways?: boolean
  /** Every space landed on, in order, across every seat. Written, not read. */
  readonly landings?: SpaceId[]
}

/** Drives a complete game, always taking the option at `optionBias % length`. */
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
      ...(options.difficulty ? { difficulty: options.difficulty } : {}),
      players: Array.from({ length: playerCount }, (_, i) => ({
        name: `Player ${i + 1}`,
        color: colors[i] as PlayerColor,
        isCpu: i >= playerCount - cpuSeats,
      })),
    },
  })

  const leaderHistory: string[] = []
  let dispatches = 0
  while (store.getState().phase !== 'gameOver' && dispatches < DISPATCH_LIMIT) {
    const state = store.getState()

    // A computer seat decides for itself; the human seats follow the fixed
    // `optionBias` strategy so a run stays reproducible.
    if (state.phase !== 'moving' && state.players[state.currentPlayerIndex]?.isCpu) {
      if (state.phase === 'resolved') leaderHistory.push(leaderIdOf(state))
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
        const wanted: readonly string[] =
          options.lanesBySeat?.[state.currentPlayerIndex] ??
          [options.laneBySeat?.[state.currentPlayerIndex]].filter((name): name is string => !!name)
        const insisted = offered.find((option) => {
          const lane = state.board.spaces[option.id]?.lane?.name
          return lane !== undefined && wanted.includes(lane)
        })
        const policy =
          options.insureAlways && state.pendingDecision?.kind === 'insurance'
            ? offered.find((option) => option.id.startsWith('insurance-'))
            : undefined
        store.dispatch({
          type: 'choose',
          optionId: (insisted ?? policy ?? offered[optionBias % offered.length]!).id,
        })
        break
      }
      case 'resolved':
        leaderHistory.push(leaderIdOf(state))
        options.landings?.push(state.players[state.currentPlayerIndex]!.spaceId)
        store.dispatch({ type: 'endTurn' })
        break
      default:
        throw new Error(`Game stalled in phase "${state.phase}"`)
    }
    dispatches += 1
  }

  return { finalState: store.getState(), dispatches, leaderHistory }
}

/** Who is ahead right now, by the same estimate the in-game rank HUD shows. */
const leaderIdOf = (state: GameState): string =>
  [...state.players].sort((a, b) => estimateNetWorth(b) - estimateNetWorth(a))[0]?.id ?? ''

describe('every game reaches a conclusion', () => {
  it.each(SEEDS)('seed %i finishes with a complete result', (seed) => {
    const { finalState, dispatches } = playGame(seed, 3, seed)

    expect(finalState.phase).toBe('gameOver')
    expect(dispatches).toBeLessThan(DISPATCH_LIMIT)

    const results = finalState.results
    expect(results).not.toBeNull()
    expect(results!.standings).toHaveLength(3)

    for (const player of finalState.players) {
      expect(player.isRetired).toBe(true)
      expect(player.retirementRank).not.toBeNull()
      expect(player.spaceId).toBe(finalState.board.retirementSpaceId)
    }

    // Retirement ranks are a permutation of 1..n — nobody shares or skips a place.
    const ranks = finalState.players.map((p) => p.retirementRank).sort((a, b) => a! - b!)
    expect(ranks).toEqual([1, 2, 3])

    // Standings are sorted, ranks are 1-based, and the winner really is on top.
    const totals = results!.standings.map((s) => s.total)
    expect([...totals].sort((a, b) => b - a)).toEqual(totals)
    expect(results!.standings[0]!.rank).toBe(1)
    expect(results!.winnerId).toBe(results!.standings[0]!.playerId)
  })

  it('works for every legal player count', () => {
    for (const count of [2, 3, 4]) {
      const { finalState } = playGame(7, count, 1)
      expect(finalState.phase).toBe('gameOver')
      expect(finalState.results!.standings).toHaveLength(count)
    }
  })

  it('works at every board length', () => {
    for (const boardLength of ['short', 'standard', 'long'] as const) {
      for (const seed of [5, 23, 44]) {
        const { finalState } = playGame(seed, 3, seed, { boardLength })
        expect(finalState.phase, `${boardLength} seed ${seed}`).toBe('gameOver')
        expect(finalState.boardLength).toBe(boardLength)
      }
    }
  })

  it('orders the three board lengths by how long they take to play', () => {
    const meanTurns = (boardLength: BoardLength): number => {
      const turns = SEEDS.slice(0, 20).map((seed) => playGame(seed, 3, seed, { boardLength }).finalState.turn)
      return turns.reduce((a, b) => a + b, 0) / turns.length
    }
    const short = meanTurns('short')
    const standard = meanTurns('standard')
    const long = meanTurns('long')
    expect(short).toBeLessThan(standard)
    expect(standard).toBeLessThan(long)
  })
})

/**
 * The computer seats are what let someone play alone, so "the CPU never wedges
 * the game" is a whole-system property, not a unit concern. An all-CPU table
 * with no human input at all must still reach a result.
 */
describe('computer seats can play the game unaided', () => {
  const playAllCpu = (seed: number, boardLength: BoardLength = 'standard'): GameState => {
    const store = createGameStore({
      random: createSeededRandom(seed),
      repository: createInMemoryRepository(),
      stats: createInMemoryStatsRepository(),
    })
    const colors: PlayerColor[] = ['red', 'blue', 'green', 'yellow']
    store.dispatch({
      type: 'startGame',
      config: {
        boardLength,
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
      // Movement is the UI's job in the real app; everything else the CPU decides.
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

  it.each([1, 2, 3, 8, 19, 30])('seed %i plays itself to a finish', (seed) => {
    const finalState = playAllCpu(seed)
    expect(finalState.phase).toBe('gameOver')
    expect(finalState.results!.standings).toHaveLength(4)
  })

  it('never picks an option it was not offered', () => {
    // An invalid option id is swallowed by the store's error handling, which
    // leaves the phase unchanged — the game would spin forever on that turn.
    for (const seed of [4, 12, 27]) {
      const store = createGameStore({
        random: createSeededRandom(seed),
        repository: createInMemoryRepository(),
        stats: createInMemoryStatsRepository(),
      })
      store.dispatch({
        type: 'startGame',
        config: {
          boardLength: 'standard',
          players: [
            { name: 'CPU 1', color: 'red', isCpu: true },
            { name: 'CPU 2', color: 'blue', isCpu: true },
          ],
        },
      })

      let dispatches = 0
      while (store.getState().phase !== 'gameOver' && dispatches < DISPATCH_LIMIT) {
        const state = store.getState()
        if (state.phase === 'moving') {
          store.dispatch({ type: 'settle' })
        } else {
          const command = decideCpuCommand(state)!
          if (command.type === 'choose') {
            const offered = state.pendingDecision!.options.map((option) => option.id)
            expect(offered).toContain(command.optionId)
          }
          store.dispatch(command)
        }
        dispatches += 1
      }
      expect(store.getState().phase).toBe('gameOver')
    }
  })

  it('makes choices a coin flip would not — CPU seats beat indifferent play', () => {
    // Two CPU seats against two seats that always take the first option going.
    // The CPU is not required to dominate, but it must be better than nothing:
    // if it wins no more than chance, its scoring is not actually working.
    let cpuWins = 0
    for (const seed of SEEDS.slice(0, 24)) {
      const { finalState } = playGame(seed, 4, 0, { cpuSeats: 2 })
      const winner = finalState.players.find((p) => p.id === finalState.results!.winnerId)
      if (winner?.isCpu) cpuWins += 1
    }
    expect(cpuWins).toBeGreaterThan(24 * 0.5)
  })
})

describe('the economy stays in a playable band', () => {
  const games = SEEDS.map((seed) => playGame(seed, 3, seed))
  const standings = games.flatMap((g) => g.finalState.results!.standings)
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

  it('finishes in a session-sized number of turns', () => {
    const turns = games.map((g) => g.finalState.turn)
    expect(mean(turns)).toBeGreaterThan(6)
    expect(mean(turns)).toBeLessThan(30)
    expect(Math.max(...turns)).toBeLessThan(60)
  })

  it('produces scores that are large but not absurd', () => {
    const totals = standings.map((s) => s.total)
    expect(mean(totals)).toBeGreaterThan(50_000)
    expect(mean(totals)).toBeLessThan(1_000_000)
  })

  it('keeps losing scores rare rather than routine', () => {
    const negatives = standings.filter((s) => s.total < 0).length
    expect(negatives / standings.length).toBeLessThan(0.15)
  })

  it('is not decided by a single runaway leader every time', () => {
    // Winners should vary by seat, not always fall to whoever goes first.
    const winningSeats = games.map((g) => {
      const winnerId = g.finalState.results!.winnerId
      return g.finalState.players.findIndex((p) => p.id === winnerId)
    })
    expect(new Set(winningSeats).size).toBeGreaterThan(1)
  })

  it('gives essentially everyone a career', () => {
    const employed = games.flatMap((g) => g.finalState.players).filter((p) => p.career !== null)
    const all = games.flatMap((g) => g.finalState.players)
    expect(employed.length / all.length).toBeGreaterThan(0.95)
  })

  /*
   * Being out of work used to be a dead stretch of turns: paydays paid a
   * player with no career exactly nothing, so a layoff mid-board meant sitting
   * through however many spins it took to reach the next career fair with the
   * wallet frozen. Now they pick up shifts, and the wheel decides how good the
   * week was — meagre money, but the turn is still worth taking.
   */
  it('never leaves a player collecting nothing at a payday', () => {
    const everyLine = games.flatMap((game) => game.finalState.log).map((entry) => entry.message)
    expect(everyLine.some((line) => /payday pays nothing|no job yet, so payday/i.test(line))).toBe(false)
  })

  it('pays casual shifts to players between jobs, over and over across a run of games', () => {
    const shiftLines = games
      .flatMap((game) => game.finalState.log)
      .filter((entry) => /picks up (casual )?shifts/i.test(entry.message))

    // It has to actually happen — a floor nobody ever stands on is not a floor.
    expect(shiftLines.length).toBeGreaterThan(0)
    // And it has to be money, every time: `money-in`, never an `info` shrug.
    for (const line of shiftLines) expect(line.tone).toBe('money-in')
  })

  it('is not over before it is over', () => {
    // The failure mode this guards: a board where whoever leads at the
    // two-thirds mark always wins, so the last third is a formality nobody at
    // the table is still interested in. The late-game swings exist to stop it.
    const decidedEarly = games.filter((game) => {
      const history = game.leaderHistory
      if (history.length < 6) return false
      const twoThirds = history[Math.floor(history.length * (2 / 3))]
      return twoThirds === game.finalState.results!.winnerId
    })
    expect(decidedEarly.length / games.length).toBeLessThan(0.8)
  })

  it('lets the lead actually change hands during a game', () => {
    const leadChanges = games.map((game) => new Set(game.leaderHistory).size)
    expect(mean(leadChanges)).toBeGreaterThan(1.5)
  })

  it('keeps debt meaningful without making it universal ruin', () => {
    const loans = games.flatMap((g) => g.finalState.players).map((p) => p.loans)
    expect(mean(loans)).toBeGreaterThan(0)
    expect(mean(loans)).toBeLessThan(12)
  })
})

/**
 * What the three difficulties are actually worth, measured rather than assumed.
 *
 * Every number below was read off this harness before it was written down, and
 * the point of writing it down is that a future balance change cannot quietly
 * undo it: flatten the setbacks and `veryHard` stops being a coin flip; sharpen
 * them and `normal` stops being the game everybody already knows.
 */
describe('difficulty means something measurable', () => {
  const DIFFICULTY_SEEDS = SEEDS
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!

  interface Sample {
    /** Final total for every player of every seeded game. */
    readonly totals: number[]
    readonly turns: number[]
    readonly loans: number[]
    /** Winning total per game — what the best seat at the table walked away with. */
    readonly winners: number[]
    /** Money-losing events per game, the thing the player asked to see more of. */
    readonly setbacks: number[]
  }

  const sampleOf = (difficulty?: Difficulty): Sample => {
    const games = DIFFICULTY_SEEDS.map((seed) => playGame(seed, 3, seed, difficulty ? { difficulty } : {}))
    const standings = games.flatMap((g) => g.finalState.results!.standings)
    return {
      totals: standings.map((s) => s.total),
      turns: games.map((g) => g.finalState.turn),
      loans: games.flatMap((g) => g.finalState.players).map((p) => p.loans),
      winners: games.map((g) => g.finalState.results!.standings[0]!.total),
      setbacks: games.map(
        (g) => g.finalState.log.filter((entry) => entry.tone === 'money-out').length,
      ),
    }
  }

  const normal = sampleOf()
  const hard = sampleOf('hard')
  const veryHard = sampleOf('veryHard')
  const bustShare = (sample: Sample) => sample.totals.filter((t) => t < 0).length / sample.totals.length

  it('leaves normal exactly where it was — this is the regression guard', () => {
    // The band the game shipped in: comfortably profitable, nobody ever bust.
    expect(mean(normal.totals)).toBeGreaterThan(400_000)
    expect(mean(normal.totals)).toBeLessThan(700_000)
    expect(median(normal.totals)).toBeGreaterThan(400_000)
    expect(bustShare(normal)).toBe(0)
    expect(mean(normal.turns)).toBeGreaterThan(6)
    expect(mean(normal.turns)).toBeLessThan(30)
  })

  it('steps the final totals down at each setting', () => {
    expect(median(hard.totals)).toBeLessThan(median(normal.totals))
    expect(median(veryHard.totals)).toBeLessThan(median(hard.totals))
    expect(mean(hard.totals)).toBeLessThan(mean(normal.totals))
    expect(mean(veryHard.totals)).toBeLessThan(mean(hard.totals))
  })

  it('makes hard a clear step down that is still usually a winning game', () => {
    // Down by a third or so on normal, but a player still expects to profit.
    expect(median(hard.totals)).toBeLessThan(median(normal.totals) * 0.8)
    expect(median(hard.totals)).toBeGreaterThan(100_000)
    expect(bustShare(hard)).toBeGreaterThan(0)
    expect(bustShare(hard)).toBeLessThan(0.25)
  })

  it('puts very hard on a knife edge: finishing in the black is a coin flip at best', () => {
    expect(bustShare(veryHard)).toBeGreaterThan(0.3)
    expect(bustShare(veryHard)).toBeLessThan(0.7)
    // The median player finishes near nothing at all, either side of zero.
    expect(median(veryHard.totals)).toBeGreaterThan(-200_000)
    expect(median(veryHard.totals)).toBeLessThan(200_000)
  })

  it('keeps going bust common on very hard without making it universal', () => {
    expect(veryHard.totals.some((total) => total > 0)).toBe(true)
    expect(veryHard.totals.some((total) => total < 0)).toBe(true)
    expect(bustShare(veryHard)).toBeGreaterThan(bustShare(hard) * 2)
  })

  it('still leaves winning worth something on very hard', () => {
    // Somebody has to be able to play well and come out ahead, or the setting
    // is not a difficulty, it is a cutscene about losing.
    const wonInTheBlack = veryHard.winners.filter((total) => total > 0).length
    expect(wonInTheBlack / veryHard.winners.length).toBeGreaterThan(0.6)
  })

  it('makes misfortune arrive more often, not merely cost more', () => {
    // The player asked for bad things to *happen* more, so the count of
    // money-losing events per game is asserted, not just the totals.
    expect(mean(hard.setbacks)).toBeGreaterThan(mean(normal.setbacks) * 1.15)
    expect(mean(veryHard.setbacks)).toBeGreaterThan(mean(hard.setbacks) * 1.1)
  })

  it('drives players into debt harder at each step', () => {
    expect(mean(hard.loans)).toBeGreaterThan(mean(normal.loans))
    expect(mean(veryHard.loans)).toBeGreaterThan(mean(hard.loans))
    // Debt has to stay something a player reasons about, not an avalanche.
    expect(mean(veryHard.loans)).toBeLessThan(20)
  })

  it('keeps every difficulty a session and not a marathon', () => {
    for (const sample of [normal, hard, veryHard]) {
      expect(mean(sample.turns)).toBeGreaterThan(6)
      expect(mean(sample.turns)).toBeLessThan(30)
      expect(Math.max(...sample.turns)).toBeLessThan(60)
    }
  })
})

/**
 * The properties that must survive difficulty untouched. A player who is broke
 * on Very Hard still has to be able to walk to retirement — bills auto-borrow,
 * so poverty must never become a wall — and the game must still end.
 */
describe('every difficulty still terminates and never strands anyone', () => {
  const HARDER: readonly Difficulty[] = ['hard', 'veryHard']

  it.each(HARDER)('%s finishes at every board length', (difficulty) => {
    for (const boardLength of ['short', 'standard', 'long'] as const) {
      for (const seed of [5, 23, 44]) {
        const { finalState, dispatches } = playGame(seed, 3, seed, { boardLength, difficulty })
        expect(finalState.phase, `${difficulty}/${boardLength} seed ${seed}`).toBe('gameOver')
        expect(dispatches).toBeLessThan(DISPATCH_LIMIT)
        expect(finalState.difficulty).toBe(difficulty)
        expect(finalState.boardLength).toBe(boardLength)
      }
    }
  })

  it.each(HARDER)('%s finishes at every player count', (difficulty) => {
    for (const count of [2, 3, 4]) {
      const { finalState } = playGame(7, count, 1, { difficulty })
      expect(finalState.phase).toBe('gameOver')
      expect(finalState.results!.standings).toHaveLength(count)
      for (const player of finalState.players) expect(player.isRetired).toBe(true)
    }
  })

  it.each(HARDER)('%s retires even the players it has bankrupted', (difficulty) => {
    // Being broke is a score, never a dead end: a payment a player cannot make
    // borrows on their behalf, so nobody is ever stuck for want of cash.
    let seenBroke = false
    for (const seed of SEEDS.slice(0, 20)) {
      const { finalState } = playGame(seed, 3, seed, { difficulty })
      expect(finalState.phase).toBe('gameOver')
      for (const player of finalState.players) {
        expect(player.isRetired).toBe(true)
        expect(player.spaceId).toBe(finalState.board.retirementSpaceId)
        if (player.money < 0 || player.loans > 0) seenBroke = true
      }
    }
    expect(seenBroke, 'nobody ever needed to borrow — the setting is not biting').toBe(true)
  })

  it.each(HARDER)('%s lets computer seats play the whole game unaided', (difficulty) => {
    for (const seed of [1, 8, 19]) {
      const { finalState } = playGame(seed, 4, seed, { difficulty, cpuSeats: 4 })
      expect(finalState.phase).toBe('gameOver')
      expect(finalState.results!.standings).toHaveLength(4)
    }
  })

  it.each(HARDER)('%s keeps the computer better than indifferent play', (difficulty) => {
    // The CPU values spaces in dollars, and difficulty rewrites those dollars.
    // If its lane and purchase scoring stopped working under scaled losses,
    // this is where it would show: two CPU seats against two that always take
    // whatever is offered first.
    let cpuWins = 0
    for (const seed of SEEDS.slice(0, 24)) {
      const { finalState } = playGame(seed, 4, 0, { cpuSeats: 2, difficulty })
      const winner = finalState.players.find((p) => p.id === finalState.results!.winnerId)
      if (winner?.isCpu) cpuWins += 1
    }
    expect(cpuWins).toBeGreaterThan(24 * 0.5)
  })
})

/**
 * The opening fork, measured rather than asserted from the armchair.
 *
 * This is the one branch on the board every player takes, and it used to have
 * a right answer: over 120 seeded two-player games in which one seat always
 * enrolled and the other always went to work, College Lane won **111 of 120**
 * and finished on $644,498 against $314,875 — more than twice the money, and a
 * *narrower* spread than the lane that was supposed to be the gamble. Whoever
 * knew the game won it at the start space.
 *
 * What closed it was content, not a multiplier: the two career pools were given
 * different shapes rather than two rungs of one ladder, tuition became a stop
 * nobody spins past, and the First Job Fair moved to the head of Straight to
 * Work so that lane finally keeps its own promise and pays a wage while the
 * graduate is still in a lecture hall. The numbers below are what that produced,
 * and pinning them here is what stops the next balance change quietly undoing
 * it — a single game proves nothing, so every claim is a distribution.
 */
describe('neither opening lane is the right answer', () => {
  const COLLEGE = 'College Lane'
  const WORK = 'Straight to Work'

  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  const spread = (xs: number[]) => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)))

  interface Split {
    /** Final totals of every seat that enrolled, and of every seat that did not. */
    readonly college: number[]
    readonly work: number[]
    /** Share of games won by a seat that took College Lane, 0 to 1. */
    readonly collegeWinRate: number
  }

  /**
   * Seats alternate lanes — even seats enrol, odd seats go to work — and every
   * later fork is decided by the same bias for both, so the opening choice is
   * the only strategic difference between them.
   */
  const splitOf = (seeds: readonly number[], playerCount: number, options: PlayOptions = {}): Split => {
    const laneBySeat = Array.from({ length: playerCount }, (_, i) => (i % 2 === 0 ? COLLEGE : WORK))
    const college: number[] = []
    const work: number[] = []
    let collegeWins = 0

    for (const seed of seeds) {
      const { finalState } = playGame(seed, playerCount, seed, { ...options, laneBySeat })
      const results = finalState.results!
      finalState.players.forEach((player, seat) => {
        const total = results.standings.find((s) => s.playerId === player.id)!.total
        ;(seat % 2 === 0 ? college : work).push(total)
      })
      const winningSeat = finalState.players.findIndex((p) => p.id === results.winnerId)
      if (winningSeat % 2 === 0) collegeWins += 1
    }

    return { college, work, collegeWinRate: collegeWins / seeds.length }
  }

  const MANY = Array.from({ length: 300 }, (_, i) => i + 1)
  const standard = splitOf(MANY, 2)

  it('splits the wins between the two lanes', () => {
    // Measured at 56.3% over these 300 games — it was 50.0% before New Baby,
    // Twins and Another Arrival started holding for a player-pressed spin.
    // That is not the lane getting richer: the same figures held at 0
    // celebrationPerPip still measured 56.7%, so the whole shift is the extra
    // `random.spin()` call itself reshuffling every later draw in these fixed
    // seeds, not a bias either lane can play for. The band is wide enough that
    // a little content drift is allowed and narrow enough that a return to the
    // old 92.5% is impossible.
    expect(standard.collegeWinRate).toBeGreaterThan(0.45)
    expect(standard.collegeWinRate).toBeLessThan(0.58)
  })

  it('makes Straight to Work the volatile life, not merely the poorer one', () => {
    /*
     * The relationship that used to run the wrong way round. College Lane was
     * both the richer *and* the steadier road (sd 165,009 against 143,323),
     * which left the lane with no degree offering nothing at all. A life with
     * no safety net has to swing: the basic career pool is nearly three times
     * as wide as the graduate band, and this is where that shows up.
     *
     * Measured at 1.32 (sd 219,118 against 166,224). It is a relationship that
     * is easy to flatten by accident, and the thing that flattens it is a
     * career *re-draw*: a fresh salary halfway through decorrelates the second
     * half of a life from the first, and the lane with the wide pool has the
     * most to lose by it. That is why the re-draw on Job-Hopper Alley is a
     * `stop` — taken deliberately, by a player who has looked at their own
     * wage first — rather than a tile anybody might land on.
     */
    expect(spread(standard.work)).toBeGreaterThan(spread(standard.college) * 1.15)
  })

  it('leaves neither lane the obvious money play', () => {
    // Measured at $699,777 against $695,537 — within 1%. College used to earn
    // 2.05x what work did.
    const gap = Math.abs(mean(standard.college) - mean(standard.work))
    expect(gap / mean(standard.college)).toBeLessThan(0.15)
  })

  it('keeps both lanes worth walking — neither is a losing move on its own', () => {
    for (const totals of [standard.college, standard.work]) {
      expect(mean(totals)).toBeGreaterThan(100_000)
    }
  })

  /*
   * The fork has to stay even on the boards and settings people actually pick,
   * and it does not come for free: the graduate's edge is a wage multiplied by
   * every payday on the route, so it grows with the board, while the wages
   * Straight to Work banks before Main Street are a fixed few. The lane's two
   * early paydays are therefore tiered — one on short, two on standard, three
   * on long — and the harder settings cancel them exactly as they cancel every
   * other payroll. Both of those were found here, by this test failing.
   */
  const GRID: readonly (readonly [string, PlayOptions])[] = [
    ['short board', { boardLength: 'short' }],
    ['long board', { boardLength: 'long' }],
    ['hard', { difficulty: 'hard' }],
    ['very hard', { difficulty: 'veryHard' }],
  ]

  it.each(GRID)('stays an even fork on the %s', (_label, options) => {
    const sample = splitOf(MANY.slice(0, 120), 2, options)
    expect(sample.collegeWinRate).toBeGreaterThan(0.4)
    expect(sample.collegeWinRate).toBeLessThan(0.6)
  })

  it('stays an even fork at a full table', () => {
    const sample = splitOf(MANY.slice(0, 120), 4)
    expect(sample.collegeWinRate).toBeGreaterThan(0.4)
    expect(sample.collegeWinRate).toBeLessThan(0.6)
    expect(spread(sample.work)).toBeGreaterThan(spread(sample.college))
  })
})

/**
 * The fork in the middle of Main Street, measured the same way as the one at
 * the start — because a fork that is not an even bet is not a decision, it is
 * a trap with two doors on it.
 *
 * The opening lane has to be held still while this is measured, or the two
 * choices are stirred together: a seat that enrolled and stayed at one firm is
 * being compared with a seat that did neither. So each run pins both seats to
 * the same opening road and splits them only at the crossroads.
 */
describe('the mid-career fork is a decision, not decoration', () => {
  const ROAD = 'Company Road'
  const ALLEY = 'Job-Hopper Alley'

  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  const spread = (xs: number[]) => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)))

  interface Split {
    readonly road: number[]
    readonly alley: number[]
    readonly roadWinRate: number
  }

  const splitAtTheCrossroads = (opening: string, seeds: readonly number[]): Split => {
    const road: number[] = []
    const alley: number[] = []
    let roadWins = 0
    for (const seed of seeds) {
      const { finalState } = playGame(seed, 2, seed, {
        lanesBySeat: [
          [opening, ROAD],
          [opening, ALLEY],
        ],
      })
      const results = finalState.results!
      finalState.players.forEach((player, seat) => {
        const total = results.standings.find((s) => s.playerId === player.id)!.total
        ;(seat === 0 ? road : alley).push(total)
      })
      if (finalState.players.findIndex((p) => p.id === results.winnerId) === 0) roadWins += 1
    }
    return { road, alley, roadWinRate: roadWins / seeds.length }
  }

  const SEEDS_300 = Array.from({ length: 300 }, (_, i) => i + 1)
  const fromCollege = splitAtTheCrossroads('College Lane', SEEDS_300)
  const fromWork = splitAtTheCrossroads('Straight to Work', SEEDS_300)

  it.each([
    ['a graduate', () => fromCollege],
    ['a school-leaver', () => fromWork],
  ] as const)('splits its wins evenly for %s', (_who, sampleOf) => {
    // Measured at 53.7% for the graduate and 52.3% for the school-leaver.
    const sample = sampleOf()
    expect(sample.roadWinRate).toBeGreaterThan(0.42)
    expect(sample.roadWinRate).toBeLessThan(0.58)
  })

  it.each([
    ['a graduate', () => fromCollege],
    ['a school-leaver', () => fromWork],
  ] as const)('leaves neither road the obvious money play for %s', (_who, sampleOf) => {
    const sample = sampleOf()
    const gap = Math.abs(mean(sample.road) - mean(sample.alley))
    expect(gap / mean(sample.road)).toBeLessThan(0.1)
  })

  /*
   * What the fork actually trades, measured rather than asserted from the
   * copy: hopping is not the wilder road, it is the *flatter* one. A career
   * re-draw is a fresh sample from the same pool, so it pulls whoever takes it
   * toward the middle of their band — which is a gift to the player who drew
   * the pet groomer and a tax on the one who drew the surgeon. Staying keeps
   * whatever you have, good or bad, and compounds it with a raise.
   *
   * That is the argument the two summaries make, and it is the reason the
   * right answer depends on the player rather than on the board.
   */
  it.each([
    ['a graduate', () => fromCollege],
    ['a school-leaver', () => fromWork],
  ] as const)('narrows the spread for %s who moves, rather than widening it', (_who, sampleOf) => {
    const sample = sampleOf()
    expect(spread(sample.alley)).toBeLessThanOrEqual(spread(sample.road))
  })
})

/**
 * Insurance, and whether anybody ever sees it work.
 *
 * A home policy costs $25,000 and waives every `fire`-tagged bill for the rest
 * of the game. The board used to carry two hazard-tagged tiles in total, so a
 * policy holder watched a bill bounce off their cover roughly once every three
 * games — which makes insurance a line in a ledger rather than the moment the
 * whole table looks up. Fifteen tiles carry a hazard now, ten or eleven of
 * them on any one road, and this is the measurement that says what that is
 * worth: about **two bills a game** for a player carrying both policies.
 *
 * Counted by landing rather than by log line, because it is a fact about the
 * board and not about whether these particular seeds happened to buy cover.
 */
describe('insurance pays off about twice a game', () => {
  const hazardLandings = (boardLength: BoardLength, difficulty?: Difficulty): number => {
    const landings: SpaceId[] = []
    const seeds = MANY_SEEDS
    for (const seed of seeds) {
      playGame(seed, 2, 0, { boardLength, landings, ...(difficulty ? { difficulty } : {}) })
    }
    const board = playGame(1, 2, 0, { boardLength, ...(difficulty ? { difficulty } : {}) }).finalState.board
    const covered = landings.filter((id) => {
      const effect = board.spaces[id]?.effect
      return effect?.type === 'payMoney' && effect.hazard !== undefined
    })
    // Two seats per game, so this is per player per game.
    return covered.length / (seeds.length * 2)
  }

  const MANY_SEEDS = Array.from({ length: 120 }, (_, i) => i + 1)

  it('bounces roughly two bills off a policy per standard game', () => {
    const rate = hazardLandings('standard')
    // Measured at 1.91. Below one and the premium is a donation; much above
    // three and the board is a demolition derby with a wedding in it.
    expect(rate).toBeGreaterThan(1.4)
    expect(rate).toBeLessThan(3)
  })

  it('pays off at least as often on the longer board, and on the harder one', () => {
    expect(hazardLandings('long')).toBeGreaterThan(1.4)
    expect(hazardLandings('standard', 'hard')).toBeGreaterThan(1.4)
  })

  /*
   * The short board is the honest exception. It has room for the milestones
   * and very little else, so it keeps the two hazards it always had — but it
   * still has to carry one of each kind, or one of the two policies on sale in
   * that session is a product that cannot pay out.
   */
  it('still sells nothing on the short board that cannot pay out', () => {
    const { finalState } = playGame(1, 2, 0, { boardLength: 'short' })
    const hazards = Object.values(finalState.board.spaces)
      .map((space) => space.effect)
      .filter((effect) => effect.type === 'payMoney' && effect.hazard !== undefined)
      .map((effect) => (effect.type === 'payMoney' ? effect.hazard : undefined))
    expect(new Set(hazards)).toEqual(new Set(['fire', 'accident']))
  })
})

describe('game state stays internally consistent', () => {
  it('never logs a duplicate entry id across a whole game', () => {
    for (const seed of [3, 17, 42]) {
      const { finalState } = playGame(seed, 4, seed)
      const ids = finalState.log.map((entry) => entry.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('leaves no dangling decision or movement once the game is over', () => {
    const { finalState } = playGame(11, 3, 2)
    expect(finalState.pendingDecision).toBeNull()
    expect(finalState.movementPath).toEqual([])
    expect(finalState.stepsRemaining).toBe(0)
  })
})
