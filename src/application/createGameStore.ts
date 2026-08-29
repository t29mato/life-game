import type { GameResults, GameState } from '@domain/model/types'
import { createBoard } from '@domain/board/createBoard'
import { DEFAULT_EDITION_ID } from '@domain/edition/registry'
import type { GameCommand, GameStore } from './GameStore'
import type { RandomPort } from './ports/RandomPort'
import type { GameRepositoryPort, SaveSlotInfo } from './ports/GameRepositoryPort'
import { AUTOSAVE_SLOT } from './ports/GameRepositoryPort'
import type { GameRecord, GameRecordEntry, StatsRepositoryPort } from './ports/StatsRepositoryPort'
import { startGame } from './usecases/startGame'
import { spin } from './usecases/spin'
import { settle } from './usecases/settle'
import { choose } from './usecases/choose'
import { endTurn } from './usecases/endTurn'
import { appendLog } from './usecases/logging'

export interface GameStoreDeps {
  readonly random: RandomPort
  readonly repository: GameRepositoryPort
  readonly stats: StatsRepositoryPort
}

function buildInitialState(): GameState {
  return {
    board: createBoard(),
    boardLength: 'standard',
    editionId: DEFAULT_EDITION_ID,
    difficulty: 'normal',
    players: [],
    currentPlayerIndex: 0,
    phase: 'setup',
    pendingDecision: null,
    lastSpin: null,
    movementPath: [],
    stepsRemaining: 0,
    chosenExit: null,
    lastEvent: null,
    passedNotes: [],
    log: [],
    turn: 1,
    results: null,
  }
}

/** Folds a finished game into the row the records screen shows. */
function toRecord(state: GameState, results: GameResults): Omit<GameRecord, 'playedAt'> {
  const standings: GameRecordEntry[] = results.standings.map((standing) => ({
    name: standing.name,
    color: standing.color,
    total: standing.total,
    rank: standing.rank,
    isCpu: state.players.find((player) => player.id === standing.playerId)?.isCpu ?? false,
  }))
  const winner = results.standings.find((standing) => standing.playerId === results.winnerId)
  return {
    winnerName: winner?.name ?? standings[0]?.name ?? 'Nobody',
    turns: state.turn,
    standings,
    editionId: state.editionId ?? DEFAULT_EDITION_ID,
  }
}

/**
 * Wires the use cases behind the frozen `GameStore` interface. Holds one
 * mutable variable — the current `GameState` — and notifies subscribers
 * whenever it is replaced. Never mutates the `GameState` object itself.
 */
export function createGameStore(deps: GameStoreDeps): GameStore {
  let state: GameState = buildInitialState()
  const listeners = new Set<() => void>()
  /**
   * The results object of the game already written to the hall of records.
   * Identity comparison is enough: `computeResults` runs once per game, and a
   * reloaded save carries the very same object back.
   */
  let recorded: GameResults | null = null

  function setState(next: GameState): void {
    state = next
    for (const listener of listeners) listener()
  }

  /** Files a finished game in the records, at most once per game. */
  function recordIfFinished(next: GameState): void {
    if (next.phase !== 'gameOver' || !next.results || next.results === recorded) return
    recorded = next.results
    deps.stats.append(toRecord(next, next.results))
  }

  /** An invalid command (wrong phase, bad input) is logged and swallowed, never thrown at the UI. */
  function reject(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error)
    setState({ ...state, log: appendLog(state, null, `Ignored: ${message}`, 'info') })
  }

  return {
    getState(): GameState {
      return state
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    dispatch(command: GameCommand): void {
      try {
        switch (command.type) {
          case 'startGame':
            recorded = null
            setState(startGame(command.config, deps))
            return
          case 'spin':
            setState(spin(state, deps))
            return
          case 'settle':
            setState(settle(state, deps))
            return
          case 'choose':
            setState(choose(state, command.optionId, deps))
            return
          case 'endTurn': {
            const next = endTurn(state, deps)
            setState(next)
            // Autosave every turn so a closed tab never costs more than one move.
            deps.repository.save(AUTOSAVE_SLOT, next)
            recordIfFinished(next)
            return
          }
          case 'reset':
            recorded = null
            setState(buildInitialState())
            return
          case 'save':
            deps.repository.save(command.slot, state)
            return
          case 'load': {
            const loaded = deps.repository.load(command.slot)
            if (loaded) {
              // A reloaded finished game must not be filed a second time.
              recorded = loaded.results
              setState(loaded)
            }
            return
          }
          default: {
            const exhaustive: never = command
            throw new Error(`unhandled command ${JSON.stringify(exhaustive)}`)
          }
        }
      } catch (error) {
        reject(error)
      }
    },

    canLoad(slot: number): boolean {
      return deps.repository.has(slot)
    },

    slots(): readonly SaveSlotInfo[] {
      return deps.repository.list()
    },

    records(): readonly GameRecord[] {
      return deps.stats.list()
    },
  }
}
