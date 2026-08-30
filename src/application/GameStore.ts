import type { GameState, NewGameConfig } from '@domain/model/types'
import type { SaveSlotInfo } from './ports/GameRepositoryPort'
import type { GameRecord } from './ports/StatsRepositoryPort'

/**
 * Everything the presentation layer is allowed to do to a game.
 *
 * Commands are deliberately coarse. The UI never mutates state itself and never
 * reaches into the domain; it dispatches one of these and re-renders.
 */
export type GameCommand =
  /** Build a fresh game and move to `awaitingSpin`. */
  | { readonly type: 'startGame'; readonly config: NewGameConfig }
  /**
   * Press the die for the current player — the road out of a fork
   * (`awaitingSpin`, standing on one) or the distance travelled
   * (`awaitingDistanceSpin`, and every ordinary turn's `awaitingSpin`).
   * One command either way: a press is a press.
   */
  | { readonly type: 'spin' }
  /**
   * The UI has finished animating the pawn along `movementPath`. Applies the
   * landing effect, or raises a decision. Valid only in `moving`.
   */
  | { readonly type: 'settle' }
  /** Answer `pendingDecision`. Valid only in `awaitingDecision`. */
  | { readonly type: 'choose'; readonly optionId: string }
  /** Dismiss `lastEvent` and pass play on. Valid only in `resolved`. */
  | { readonly type: 'endTurn' }
  /** Throw the game away and return to `setup`. */
  | { readonly type: 'reset' }
  | { readonly type: 'save'; readonly slot: number }
  | { readonly type: 'load'; readonly slot: number }

/**
 * A `useSyncExternalStore`-shaped store. `getState` must return a referentially
 * stable object between notifications.
 */
export interface GameStore {
  getState(): GameState
  subscribe(listener: () => void): () => void
  dispatch(command: GameCommand): void
  /** True when `slot` holds a game and `{ type: 'load', slot }` would succeed. */
  canLoad(slot: number): boolean
  /** One entry per save slot, occupied or not, in slot order. */
  slots(): readonly SaveSlotInfo[]
  /** Finished games, newest first. Appended automatically at `gameOver`. */
  records(): readonly GameRecord[]
}
