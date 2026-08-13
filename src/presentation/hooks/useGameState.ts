import { useSyncExternalStore } from 'react'
import type { GameState } from '@domain/model/types'
import type { GameStore } from '@application/GameStore'

/** Subscribes a component to the live `GameState` of an injected `GameStore`. */
export function useGameState(store: GameStore): GameState {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState)
}
