import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { GameState } from '@domain/model/types'
import type { GameStore } from '@application/GameStore'
import { useGameState } from './useGameState'

function makeState(phase: GameState['phase']): GameState {
  return {
    board: { spaces: {}, startSpaceId: 'start', retirementSpaceId: 'end', width: 100, height: 100 },
    editionId: 'usa',
    difficulty: 'normal',
    players: [],
    currentPlayerIndex: 0,
    phase,
    pendingDecision: null,
    lastSpin: null,
    movementPath: [],
    pendingPath: [],
    stepsRemaining: 0,
    chosenExit: null,
    lastEvent: null,
    pendingPassedItems: [],
    activePassedEvent: null,
    log: [],
    turn: 1,
    results: null,
  }
}

function makeFakeStore(initial: GameState): GameStore {
  let state = initial
  const listeners = new Set<() => void>()
  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    dispatch: () => {
      state = makeState('awaitingSpin')
      listeners.forEach((l) => l())
    },
    canLoad: () => false,
    slots: () => [],
    records: () => [],
  }
}

describe('useGameState', () => {
  it('returns the store state on first render', () => {
    const store = makeFakeStore(makeState('setup'))
    const { result } = renderHook(() => useGameState(store))
    expect(result.current.phase).toBe('setup')
  })

  it('re-renders with the new state after a dispatch notifies listeners', () => {
    const store = makeFakeStore(makeState('setup'))
    const { result } = renderHook(() => useGameState(store))

    act(() => {
      store.dispatch({ type: 'spin' })
    })

    expect(result.current.phase).toBe('awaitingSpin')
  })
})
