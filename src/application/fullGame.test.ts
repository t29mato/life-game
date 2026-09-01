import { describe, expect, it } from 'vitest'
import type { GamePhase, GameState, NewGameConfig } from '@domain/model/types'
import { decideCpuCommand } from './cpu/decideCpuCommand'
import { nextScoreRoll } from './usecases/settlement'
import { createSeededRandom, createInMemoryRepository, createInMemoryStatsRepository } from './testing/fakes'
import { createGameStore } from './createGameStore'
import type { GameStore } from './GameStore'

const config: NewGameConfig = {
  players: [
    { name: 'Alex', color: 'red', isCpu: false },
    { name: 'Bo', color: 'blue', isCpu: false },
    { name: 'Cy', color: 'green', isCpu: false },
  ],
}

const MAX_ITERATIONS = 20_000

function buildStore(seed: number): GameStore {
  return createGameStore({
    random: createSeededRandom(seed),
    repository: createInMemoryRepository(),
    stats: createInMemoryStatsRepository(),
  })
}

/** Checks a finished game hangs together: everyone retired, standings well formed. */
function expectWellFormedGameOver(finalState: GameState, playerCount: number): void {
  expect(finalState.phase).toBe('gameOver')
  expect(finalState.players).toHaveLength(playerCount)
  for (const player of finalState.players) {
    expect(player.isRetired).toBe(true)
    expect(player.retirementRank).not.toBeNull()
  }

  const results = finalState.results
  expect(results).not.toBeNull()
  expect(results!.standings).toHaveLength(playerCount)

  // Standings are sorted by total descending.
  for (let i = 1; i < results!.standings.length; i += 1) {
    expect(results!.standings[i - 1]!.total).toBeGreaterThanOrEqual(results!.standings[i]!.total)
  }

  // Every player appears exactly once, ranks are 1-based.
  const playerIds = new Set(finalState.players.map((p) => p.id))
  const standingIds = results!.standings.map((s) => s.playerId)
  expect(new Set(standingIds)).toEqual(playerIds)
  for (const standing of results!.standings) {
    expect(standing.rank).toBeGreaterThanOrEqual(1)
  }

  // There is a winner, and they are among the standings.
  expect(standingIds).toContain(results!.winnerId)
  // The winner is whoever occupies the best (lowest-numbered) rank.
  const bestRank = Math.min(...results!.standings.map((s) => s.rank))
  const winnerStanding = results!.standings.find((s) => s.playerId === results!.winnerId)
  expect(winnerStanding!.rank).toBe(bestRank)
}

/**
 * The single most valuable test in the suite: drives a whole 3-player game,
 * turn by turn, through the real store with a seeded (but real) RandomPort,
 * and checks it always reaches a well-formed game over.
 */
describe('full game integration', () => {
  it('plays a complete game to gameOver with a seeded random port', () => {
    const store = buildStore(42)

    store.dispatch({ type: 'startGame', config })
    // A game opens on the first fork, but the road is the wheel's own call
    // now rather than a decision made before it — see `spin.ts`.
    expect(store.getState().phase).toBe('awaitingSpin')
    expect(store.getState().players).toHaveLength(3)

    let iterations = 0

    while (store.getState().phase !== 'gameOver') {
      iterations += 1
      if (iterations > MAX_ITERATIONS) {
        throw new Error(`Game did not reach gameOver within ${MAX_ITERATIONS} iterations (safety cap hit)`)
      }

      const state = store.getState()
      const phase: GamePhase = state.phase

      switch (phase) {
        // Two presses at a fork, one everywhere else — the same command
        // either way, because a press is a press. See `spin.ts`.
        case 'awaitingSpin':
        case 'awaitingDistanceSpin':
          store.dispatch({ type: 'spin' })
          break
        case 'moving':
        case 'passingEvent':
          store.dispatch({ type: 'settle' })
          break
        case 'awaitingDecision': {
          const decision = state.pendingDecision
          if (!decision) throw new Error('phase is awaitingDecision but pendingDecision is null')
          const firstOption = decision.options[0]
          if (!firstOption) throw new Error('pendingDecision has no options to choose from')
          store.dispatch({ type: 'choose', optionId: firstOption.id })
          break
        }
        // One die per house and per shareholding, thrown before the
        // results are assembled. See `scoreRoll`.
        case 'scoring':
          store.dispatch({ type: 'scoreRoll' })
          break
        case 'resolved':
          store.dispatch({ type: 'endTurn' })
          break
        default:
          throw new Error(`play loop does not expect phase "${phase}"`)
      }
    }

    expect(iterations).toBeLessThan(MAX_ITERATIONS)
    expectWellFormedGameOver(store.getState(), 3)
  })

  it('plays a complete game from a fixed seed', () => {
    const store = buildStore(2_024)
    store.dispatch({ type: 'startGame', config })

    for (let guard = 0; guard < MAX_ITERATIONS && store.getState().phase !== 'gameOver'; guard += 1) {
      const state = store.getState()
      if (state.phase === 'awaitingSpin' || state.phase === 'awaitingDistanceSpin') {
        store.dispatch({ type: 'spin' })
      } else if (state.phase === 'moving' || state.phase === 'passingEvent') store.dispatch({ type: 'settle' })
      else if (state.phase === 'awaitingDecision') {
        store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
      } else if (state.phase === 'resolved') store.dispatch({ type: 'endTurn' })
      // One die per house and per shareholding, thrown before the results
      // exist at all. See `scoreRoll`.
      else if (state.phase === 'scoring') store.dispatch({ type: 'scoreRoll' })
    }

    expectWellFormedGameOver(store.getState(), 3)
  })
})

/**
 * The proof that a person can sit down alone: four computer seats play a whole
 * game with nothing but `decideCpuCommand` driving them. If the CPU ever
 * answered with an option that was not offered, or fell silent in a phase it
 * owns, this test hangs on the safety cap instead of finishing.
 */
describe('all-computer game', () => {
  const cpuConfig: NewGameConfig = {
    players: [
      { name: 'Botly', color: 'red', isCpu: true },
      { name: 'Circuit', color: 'blue', isCpu: true },
      { name: 'Dot', color: 'green', isCpu: true },
      { name: 'Ember', color: 'yellow', isCpu: true },
    ],
  }

  it('reaches a well-formed game over with no human input at all', () => {
    const store = buildStore(1_234)
    store.dispatch({ type: 'startGame', config: cpuConfig })

    let iterations = 0
    while (store.getState().phase !== 'gameOver') {
      iterations += 1
      if (iterations > MAX_ITERATIONS) {
        throw new Error(`The computers deadlocked after ${MAX_ITERATIONS} steps`)
      }

      const state = store.getState()
      if (state.phase === 'moving') {
        // Only the pawn animation is the UI's job; the CPU never speaks for it.
        expect(decideCpuCommand(state)).toBeNull()
        store.dispatch({ type: 'settle' })
        continue
      }

      const command = decideCpuCommand(state)
      expect(command, `no command offered in phase ${state.phase}`).not.toBeNull()
      if (command!.type === 'choose') {
        expect(state.pendingDecision!.options.map((option) => option.id)).toContain(command!.optionId)
      }
      store.dispatch(command!)

      // A command the store rejected would leave the phase untouched and loop forever.
      expect(store.getState().log.some((entry) => entry.message.startsWith('Ignored:'))).toBe(false)
    }

    expectWellFormedGameOver(store.getState(), 4)
    expect(store.records()).toHaveLength(1)
    expect(store.records()[0]!.standings.every((entry) => entry.isCpu)).toBe(true)
  })

  it('plays out the same way twice from the same seed', () => {
    const play = (): GameState => {
      const store = buildStore(99)
      store.dispatch({ type: 'startGame', config: cpuConfig })
      for (let guard = 0; guard < MAX_ITERATIONS && store.getState().phase !== 'gameOver'; guard += 1) {
        const state = store.getState()
        if (state.phase === 'moving') store.dispatch({ type: 'settle' })
        else store.dispatch(decideCpuCommand(state)!)
      }
      return store.getState()
    }

    const first = play()
    const second = play()
    expect(first.results).toEqual(second.results)
    expect(first.log.map((entry) => entry.message)).toEqual(second.log.map((entry) => entry.message))
  })

  it('lets one computer seat play alongside people without stalling the humans', () => {
    const store = buildStore(7)
    store.dispatch({
      type: 'startGame',
      config: {
        players: [
          { name: 'Alex', color: 'red', isCpu: false },
          { name: 'Botly', color: 'blue', isCpu: true },
        ],
      },
    })

    for (let guard = 0; guard < MAX_ITERATIONS && store.getState().phase !== 'gameOver'; guard += 1) {
      const state = store.getState()
      const player = state.players[state.currentPlayerIndex]!

      if (state.phase === 'moving' || state.phase === 'passingEvent') {
        store.dispatch({ type: 'settle' })
        continue
      }

      /*
       * The closing settlement belongs to nobody's turn — everybody is
       * retired, so `currentPlayerIndex` says nothing about whose die is
       * owed. Each one belongs to the seat it is scoring, and the CPU keeps
       * its hands off a person's die here exactly as it does everywhere else.
       */
      if (state.phase === 'scoring') {
        const owed = nextScoreRoll(state.scoreRolls)!
        const owner = state.players.find((entry) => entry.id === owed.playerId)!
        expect(decideCpuCommand(state)).toEqual(owner.isCpu ? { type: 'scoreRoll' } : null)
        store.dispatch({ type: 'scoreRoll' })
        continue
      }

      if (player.isCpu) {
        const command = decideCpuCommand(state)
        expect(command).not.toBeNull()
        store.dispatch(command!)
        continue
      }

      // The human seat: the CPU must keep its hands off it entirely.
      expect(decideCpuCommand(state)).toBeNull()
      if (state.phase === 'awaitingSpin' || state.phase === 'awaitingDistanceSpin') {
        store.dispatch({ type: 'spin' })
      } else if (state.phase === 'awaitingDecision') {
        store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
      } else if (state.phase === 'resolved') store.dispatch({ type: 'endTurn' })
    }

    expectWellFormedGameOver(store.getState(), 2)
  })
})
