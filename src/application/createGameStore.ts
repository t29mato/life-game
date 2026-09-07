import type { GameResults, GameState } from '@domain/model/types'
import { createBoard } from '@domain/board/createBoard'
import { DEFAULT_EDITION_ID } from '@domain/edition/registry'
import type { GameCommand, GameStore } from './GameStore'
import type { RandomPort } from './ports/RandomPort'
import type { GameRepositoryPort, SaveSlotInfo } from './ports/GameRepositoryPort'
import { AUTOSAVE_SLOT } from './ports/GameRepositoryPort'
import type { GameRecord, GameRecordEntry, StatsRepositoryPort } from './ports/StatsRepositoryPort'
import { EN_TEXT, type GameText } from './i18n/text'
import type { UseCaseDeps } from './usecases/types'
import { startGame } from './usecases/startGame'
import { spin } from './usecases/spin'
import { settle } from './usecases/settle'
import { choose } from './usecases/choose'
import { endTurn } from './usecases/endTurn'
import { scoreRoll } from './usecases/scoreRoll'
import { appendLog } from './usecases/logging'

export interface GameStoreDeps {
  readonly random: RandomPort
  readonly repository: GameRepositoryPort
  readonly stats: StatsRepositoryPort
  /**
   * What language the engine writes in, asked afresh on every command.
   *
   * A supplier rather than a value because the store is built once, at the
   * composition root, and outlives every language the player picks: the
   * switcher is a mid-turn setting, and a catalogue captured at construction
   * would leave the next card in the language the app happened to boot in.
   * Asking per dispatch costs one `Map` lookup — `gameTextFor` caches per
   * locale — and means the store never has to be told a preference changed.
   *
   * Omitted, the engine writes English, exactly as it always did.
   */
  readonly text?: () => GameText
}

function buildInitialState(): GameState {
  return {
    board: createBoard(),
    editionId: DEFAULT_EDITION_ID,
    difficulty: 'normal',
    players: [],
    currentPlayerIndex: 0,
    phase: 'setup',
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
    scoreRolls: [],
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

  /**
   * The `UseCaseDeps` last handed to a command, and the `GameText` it was cut
   * for. Kept so that the overwhelmingly common case — a player who has not
   * touched the language switcher since their last press — costs a comparison
   * rather than an object.
   */
  let lastText: GameText | null = null
  let lastDeps: UseCaseDeps | null = null

  /**
   * The use-case dependencies for one command, with the language resolved as
   * late as it can be: a player who changes the setting between two presses
   * gets the second card in the language they just chose.
   *
   * The supplier is still asked on *every* command — that is the whole point of
   * it being a supplier — but its answer is an identity, not a value. Every
   * catalogue this game can be read in is a singleton (`gameTextFor` keeps one
   * per locale, forever), so "same language as last press" is `===`, and the
   * deps object it was wrapped in can be handed straight back. Change the
   * language and the supplier returns a *different* object, the comparison
   * fails, and the next command is cut fresh. A supplier that manufactures a
   * new `GameText` per call still works; it simply pays for one object per
   * press, exactly as this did before.
   */
  function depsForCommand(): UseCaseDeps {
    const text = deps.text ? deps.text() : EN_TEXT
    if (lastDeps === null || text !== lastText) {
      lastText = text
      lastDeps = { random: deps.random, text }
    }
    return lastDeps
  }

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
            setState(startGame(command.config, depsForCommand()))
            return
          case 'spin':
            setState(spin(state, depsForCommand()))
            return
          case 'settle':
            setState(settle(state, depsForCommand()))
            return
          case 'choose':
            setState(choose(state, command.optionId, depsForCommand()))
            return
          case 'endTurn': {
            const next = endTurn(state, depsForCommand())
            setState(next)
            // Autosave every turn so a closed tab never costs more than one move.
            deps.repository.save(AUTOSAVE_SLOT, next)
            recordIfFinished(next)
            return
          }
          case 'scoreRoll': {
            const next = scoreRoll(state, depsForCommand())
            setState(next)
            /*
             * Saved and filed on exactly the same terms as a turn. The
             * settlement is several presses long now, so a tab closed
             * halfway through it must come back to the dice still owed
             * rather than to the turn before everybody retired — and the
             * hall of records is only written by the throw that actually
             * reaches `gameOver`, which `recordIfFinished` already checks.
             */
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
