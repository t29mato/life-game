import { describe, expect, it, vi } from 'vitest'
import type { GameState, NewGameConfig } from '@domain/model/types'
import { AUTOSAVE_SLOT, SAVE_SLOT_COUNT } from './ports/GameRepositoryPort'
import type { GameRepositoryPort } from './ports/GameRepositoryPort'
import type { StatsRepositoryPort } from './ports/StatsRepositoryPort'
import { createFakeRandom, createInMemoryRepository, createInMemoryStatsRepository, createSeededRandom } from './testing/fakes'
import { createGameStore } from './createGameStore'

const config: NewGameConfig = {
  players: [
    { name: 'Alex', color: 'red', isCpu: false },
    { name: 'Bo', color: 'blue', isCpu: false },
  ],
  boardLength: 'short',
}

function buildStore(
  repository: GameRepositoryPort = createInMemoryRepository(),
  stats: StatsRepositoryPort = createInMemoryStatsRepository(),
) {
  return { store: createGameStore({ random: createFakeRandom(), repository, stats }), repository, stats }
}

/** Drives a game to its natural end, answering every decision with the first option. */
function playToGameOver(store: ReturnType<typeof createGameStore>): GameState {
  for (let guard = 0; guard < 20_000; guard += 1) {
    const state = store.getState()
    switch (state.phase) {
      case 'awaitingSpin':
        store.dispatch({ type: 'spin' })
        break
      case 'moving':
        store.dispatch({ type: 'settle' })
        break
      case 'awaitingDecision':
        store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
        break
      case 'resolved':
        store.dispatch({ type: 'endTurn' })
        break
      default:
        return state
    }
  }
  throw new Error('playToGameOver: the game never finished')
}

describe('createGameStore', () => {
  it('starts in setup phase with a real, empty-of-players board', () => {
    const { store } = buildStore()
    const state = store.getState()
    expect(state.phase).toBe('setup')
    expect(state.players).toEqual([])
    expect(state.board).toBeTruthy()
    expect(state.board.spaces).toBeTruthy()
    expect(state.boardLength).toBe('standard')
  })

  it('notifies subscribers on every state change', () => {
    const { store } = buildStore()
    const listener = vi.fn()
    store.subscribe(listener)
    store.dispatch({ type: 'startGame', config })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('stops notifying after unsubscribe', () => {
    const { store } = buildStore()
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    unsubscribe()
    store.dispatch({ type: 'startGame', config })
    expect(listener).not.toHaveBeenCalled()
  })

  it('keeps getState referentially stable between notifications', () => {
    const { store } = buildStore()
    const before = store.getState()
    expect(store.getState()).toBe(before)
    store.dispatch({ type: 'startGame', config })
    const after = store.getState()
    expect(after).not.toBe(before)
    expect(store.getState()).toBe(after)
  })

  it('carries the configured board length onto the state', () => {
    const { store } = buildStore()
    store.dispatch({ type: 'startGame', config })
    expect(store.getState().boardLength).toBe('short')
  })

  it('ignores an invalid command for the current phase instead of throwing', () => {
    const { store } = buildStore()
    expect(() => store.dispatch({ type: 'spin' })).not.toThrow()
    expect(store.getState().phase).toBe('setup')
    expect(store.getState().log.some((entry) => entry.message.startsWith('Ignored:'))).toBe(true)
  })

  it('ignores an invalid choose command outside awaitingDecision', () => {
    const { store } = buildStore()
    store.dispatch({ type: 'startGame', config })
    // A game opens on the first fork, so answer that before testing the case
    // this is actually about: a `choose` arriving when nothing is being chosen.
    const opening = store.getState()
    expect(opening.phase).toBe('awaitingDecision')
    store.dispatch({ type: 'choose', optionId: opening.pendingDecision!.options[0]!.id })
    expect(store.getState().phase).toBe('awaitingSpin')

    expect(() => store.dispatch({ type: 'choose', optionId: 'anything' })).not.toThrow()
    expect(store.getState().phase).toBe('awaitingSpin')
  })

  it('resets back to a fresh setup state', () => {
    const { store } = buildStore()
    store.dispatch({ type: 'startGame', config })
    store.dispatch({ type: 'reset' })
    expect(store.getState().phase).toBe('setup')
    expect(store.getState().players).toEqual([])
  })

  describe('save slots', () => {
    it('round-trips a game through the slot it was saved to', () => {
      const { store } = buildStore()
      store.dispatch({ type: 'startGame', config })
      const savedPlayers = store.getState().players
      store.dispatch({ type: 'save', slot: 2 })

      store.dispatch({ type: 'reset' })
      expect(store.getState().phase).toBe('setup')

      store.dispatch({ type: 'load', slot: 2 })
      expect(store.getState().phase).toBe('awaitingDecision')
      expect(store.getState().players).toEqual(savedPlayers)
    })

    it('reports canLoad(slot) per slot', () => {
      const { store } = buildStore()
      expect(store.canLoad(1)).toBe(false)
      store.dispatch({ type: 'startGame', config })
      store.dispatch({ type: 'save', slot: 1 })
      expect(store.canLoad(1)).toBe(true)
      expect(store.canLoad(3)).toBe(false)
    })

    it('leaves state untouched when loading an empty slot', () => {
      const { store } = buildStore()
      const before = store.getState()
      store.dispatch({ type: 'load', slot: 3 })
      expect(store.getState()).toBe(before)
    })

    it('describes every slot through slots()', () => {
      const { store } = buildStore()
      store.dispatch({ type: 'startGame', config })
      store.dispatch({ type: 'save', slot: 1 })

      const slots = store.slots()
      expect(slots).toHaveLength(SAVE_SLOT_COUNT)
      expect(slots[1]!.occupied).toBe(true)
      expect(slots[1]!.playerNames).toEqual(['Alex', 'Bo'])
      expect(slots[2]!.occupied).toBe(false)
    })

    it('autosaves to the autosave slot after every completed turn', () => {
      const { store, repository } = buildStore()
      store.dispatch({ type: 'startGame', config })
      expect(repository.has(AUTOSAVE_SLOT)).toBe(false)

      // Walk the turn out to `resolved`, whatever the board throws in the way —
      // starting with the opening fork, which is answered before any spin.
      for (let guard = 0; guard < 50 && store.getState().phase !== 'resolved'; guard += 1) {
        const state = store.getState()
        if (state.phase === 'awaitingSpin') store.dispatch({ type: 'spin' })
        else if (state.phase === 'moving') store.dispatch({ type: 'settle' })
        else if (state.phase === 'awaitingDecision') {
          store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
        } else break
      }
      expect(store.getState().phase).toBe('resolved')
      store.dispatch({ type: 'endTurn' })

      expect(repository.has(AUTOSAVE_SLOT)).toBe(true)
      expect(repository.load(AUTOSAVE_SLOT)).toEqual(store.getState())
    })

    it('does not autosave a turn that was rejected', () => {
      const { store, repository } = buildStore()
      store.dispatch({ type: 'startGame', config })
      store.dispatch({ type: 'endTurn' }) // wrong phase
      expect(repository.has(AUTOSAVE_SLOT)).toBe(false)
    })
  })

  describe('hall of records', () => {
    it('is empty until a game finishes', () => {
      const { store } = buildStore()
      store.dispatch({ type: 'startGame', config })
      expect(store.records()).toEqual([])
    })

    it('appends exactly one record when a game reaches gameOver', () => {
      const stats = createInMemoryStatsRepository()
      const store = createGameStore({
        random: createSeededRandom(7),
        repository: createInMemoryRepository(),
        stats,
      })
      store.dispatch({ type: 'startGame', config })
      const finished = playToGameOver(store)

      expect(finished.phase).toBe('gameOver')
      const records = store.records()
      expect(records).toHaveLength(1)
      expect(records[0]!.turns).toBe(finished.turn)
      expect(records[0]!.standings.map((entry) => entry.name).sort()).toEqual(['Alex', 'Bo'])
      expect(records[0]!.winnerName).toBe(
        finished.results!.standings.find((standing) => standing.playerId === finished.results!.winnerId)!.name,
      )
    })

    it('marks which seats were played by the computer', () => {
      const store = createGameStore({
        random: createSeededRandom(11),
        repository: createInMemoryRepository(),
        stats: createInMemoryStatsRepository(),
      })
      store.dispatch({
        type: 'startGame',
        config: {
          players: [
            { name: 'Alex', color: 'red', isCpu: false },
            { name: 'Botly', color: 'blue', isCpu: true },
          ],
          boardLength: 'short',
        },
      })
      playToGameOver(store)

      const entries = store.records()[0]!.standings
      expect(entries.find((entry) => entry.name === 'Alex')!.isCpu).toBe(false)
      expect(entries.find((entry) => entry.name === 'Botly')!.isCpu).toBe(true)
    })

    it('never files the same finished game twice, even if endTurn is dispatched again', () => {
      const store = createGameStore({
        random: createSeededRandom(3),
        repository: createInMemoryRepository(),
        stats: createInMemoryStatsRepository(),
      })
      store.dispatch({ type: 'startGame', config })
      playToGameOver(store)

      store.dispatch({ type: 'endTurn' })
      store.dispatch({ type: 'endTurn' })
      expect(store.records()).toHaveLength(1)
    })

    it('does not re-file a finished game that is loaded back from a slot', () => {
      const store = createGameStore({
        random: createSeededRandom(5),
        repository: createInMemoryRepository(),
        stats: createInMemoryStatsRepository(),
      })
      store.dispatch({ type: 'startGame', config })
      playToGameOver(store)
      store.dispatch({ type: 'save', slot: 1 })
      store.dispatch({ type: 'reset' })
      store.dispatch({ type: 'load', slot: 1 })

      expect(store.getState().phase).toBe('gameOver')
      expect(store.records()).toHaveLength(1)
    })

    it('files a second game separately', () => {
      const store = createGameStore({
        random: createSeededRandom(13),
        repository: createInMemoryRepository(),
        stats: createInMemoryStatsRepository(),
      })
      store.dispatch({ type: 'startGame', config })
      playToGameOver(store)
      store.dispatch({ type: 'startGame', config })
      playToGameOver(store)

      expect(store.records()).toHaveLength(2)
    })
  })
})
