import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createGameStore } from '@application/createGameStore'
import type { GameCommand, GameStore } from '@application/GameStore'
import {
  createInMemoryRepository,
  createInMemoryStatsRepository,
  createSeededRandom,
} from '@application/testing/fakes'
import type { GameState, NewGamePlayer } from '@domain/model/types'

import { App } from './App'
import { createFakeAudioPort } from './dev/fakeAudio'

/**
 * A store whose state the test sets directly, so a single phase can be examined
 * without playing a game up to it.
 */
function createStubStore(state: GameState): GameStore & { readonly commands: GameCommand[] } {
  const commands: GameCommand[] = []
  return {
    commands,
    getState: () => state,
    subscribe: () => () => {},
    dispatch: (command) => {
      commands.push(command)
    },
    canLoad: () => false,
    slots: () => [],
    records: () => [],
  }
}

function newStore(seed = 1): ReturnType<typeof createGameStore> {
  return createGameStore({
    random: createSeededRandom(seed),
    repository: createInMemoryRepository(),
    stats: createInMemoryStatsRepository(),
  })
}

/**
 * A real game driven forward to the first moment the board would animate.
 * One human seat by default: a second human would raise the pass-the-device
 * handoff, which deliberately blocks play until it is acknowledged.
 */
function startedGame(
  players: readonly NewGamePlayer[] = [
    { name: 'Ada', color: 'red', isCpu: false },
    { name: 'Ben', color: 'blue', isCpu: true },
  ],
): ReturnType<typeof createGameStore> {
  const store = newStore(7)
  store.dispatch({ type: 'startGame', config: { players, boardLength: 'standard' } })
  return store
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('App play loop', () => {
  it('shows the title screen while the game is in setup', () => {
    render(<App store={newStore()} audio={createFakeAudioPort()} />)

    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
  })

  it('shows the board and the active player once a game has started', () => {
    render(<App store={startedGame()} audio={createFakeAudioPort()} />)

    expect(screen.getByRole('img', { name: /game board/i })).toBeInTheDocument()
    expect(screen.getAllByText(/Ada/).length).toBeGreaterThan(0)
  })

  /**
   * A move committed with an empty `movementPath` gives the board nothing to
   * animate, so it never reports movement complete and the play loop has to
   * hand the move on itself — otherwise the game silently freezes mid-turn.
   *
   * This used to arise naturally from spinning at a fork. Roads are now chosen
   * before the wheel, so the real board no longer produces it; the guard still
   * has to work, so the state is built directly rather than played into.
   */
  it('settles immediately when a move has no steps to animate', async () => {
    const store = startedGame()
    const moving: GameState = { ...store.getState(), phase: 'moving', movementPath: [], stepsRemaining: 0 }

    const stub = createStubStore(moving)
    render(<App store={stub} audio={createFakeAudioPort()} />)

    await waitFor(() => {
      expect(stub.commands).toContainEqual({ type: 'settle' })
    })
  })

  it('settles an empty move exactly once, however often React re-renders', async () => {
    const store = startedGame()
    const moving: GameState = { ...store.getState(), phase: 'moving', movementPath: [], stepsRemaining: 0 }

    const stub = createStubStore(moving)
    const { rerender } = render(<App store={stub} audio={createFakeAudioPort()} />)

    // The spinner is armed by a click, so a fresh mount has already settled and
    // is free to hand the empty move straight on. Re-rendering must not repeat
    // that: exactly one settle, however many times React re-runs the effect.
    rerender(<App store={stub} audio={createFakeAudioPort()} />)
    rerender(<App store={stub} audio={createFakeAudioPort()} />)

    await waitFor(() => {
      expect(stub.commands).toContainEqual({ type: 'settle' })
    })
    expect(stub.commands.filter((c) => c.type === 'settle')).toHaveLength(1)
  })

  it('leaves a spin with real steps for the board to animate', () => {
    const store = startedGame()
    // Walk to a spin that does produce a path, so the board owns the timing.
    let guard = 0
    while (store.getState().movementPath.length === 0 && guard < 200) {
      const state = store.getState()
      if (state.phase === 'awaitingSpin') store.dispatch({ type: 'spin' })
      else if (state.phase === 'moving') store.dispatch({ type: 'settle' })
      else if (state.phase === 'awaitingDecision') {
        store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
      } else if (state.phase === 'resolved') store.dispatch({ type: 'endTurn' })
      guard += 1
    }

    const moving = store.getState()
    expect(moving.movementPath.length).toBeGreaterThan(0)

    const stub = createStubStore(moving)
    render(<App store={stub} audio={createFakeAudioPort()} />)

    // The board animates first and reports back; App must not shortcut it.
    expect(stub.commands).not.toContainEqual({ type: 'settle' })
  })
})

describe('computer seats', () => {
  /**
   * A computer seat is driven entirely by the shell: nothing inside the store
   * makes it act. If this loop stops firing, a CPU turn hangs forever and the
   * game is unplayable for anyone sharing a table with one.
   */
  it('takes its own turn without any input', async () => {
    vi.useFakeTimers()
    try {
      const store = startedGame([
        { name: 'Ada', color: 'red', isCpu: false },
        { name: 'Cee', color: 'blue', isCpu: true },
      ])
      // Hand the turn to the computer seat.
      let guard = 0
      while (store.getState().players[store.getState().currentPlayerIndex]?.isCpu !== true && guard < 50) {
        const state = store.getState()
        if (state.phase === 'awaitingSpin') store.dispatch({ type: 'spin' })
        else if (state.phase === 'moving') store.dispatch({ type: 'settle' })
        else if (state.phase === 'awaitingDecision') {
          store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
        } else if (state.phase === 'resolved') store.dispatch({ type: 'endTurn' })
        guard += 1
      }

      // A turn opens either on the wheel or on a fork, depending on where the
      // seat is standing; both are the computer's to act on.
      const phaseBefore = store.getState().phase
      expect(['awaitingSpin', 'awaitingDecision']).toContain(phaseBefore)

      render(<App store={store} audio={createFakeAudioPort()} />)

      // A computer turn cascades across several render passes — the timer sets
      // a token, the wheel reacts to it, the store notifies, the shell
      // re-renders. `act` is what flushes that whole chain deterministically;
      // advancing the clock alone leaves the assertion racing the last render.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(4_000)
      })

      // It got as far as committing a move on its own.
      expect(store.getState().phase).not.toBe('awaitingSpin')
    } finally {
      vi.useRealTimers()
    }
  })

  it('leaves a human seat alone', async () => {
    vi.useFakeTimers()
    try {
      const store = startedGame([
        { name: 'Ada', color: 'red', isCpu: false },
        { name: 'Ben', color: 'blue', isCpu: true },
      ])
      const opening = store.getState()
      render(<App store={store} audio={createFakeAudioPort()} />)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(4_000)
      })

      // Ada is human and up first: nothing may move until she acts, whether the
      // turn opens on the wheel or on a fork.
      expect(store.getState().phase).toBe(opening.phase)
      expect(store.getState().currentPlayerIndex).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('game log drawer', () => {
  it('keeps the log tucked away until asked for', () => {
    render(<App store={startedGame()} audio={createFakeAudioPort()} />)

    expect(screen.queryByRole('region', { name: /game log/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^log$/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens from the header control and closes again', () => {
    render(<App store={startedGame()} audio={createFakeAudioPort()} />)

    fireEvent.click(screen.getByRole('button', { name: /^log$/i }))
    expect(screen.getByRole('region', { name: /game log/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^log$/i })).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(screen.getByRole('button', { name: /^log$/i }))
    expect(screen.queryByRole('region', { name: /game log/i })).not.toBeInTheDocument()
  })

  it('closes on Escape', () => {
    render(<App store={startedGame()} audio={createFakeAudioPort()} />)

    fireEvent.click(screen.getByRole('button', { name: /^log$/i }))
    expect(screen.getByRole('region', { name: /game log/i })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('region', { name: /game log/i })).not.toBeInTheDocument()
  })

  it('still announces the latest happening politely while the drawer is closed', () => {
    const { container } = render(<App store={startedGame()} audio={createFakeAudioPort()} />)

    // The scrolling feed is off screen, but what it would have said must
    // still reach assistive tech the moment it happens.
    expect(container.querySelector('.visually-hidden[aria-live="polite"]')).not.toBeNull()
  })
})

describe('player status', () => {
  it('shows a status card for every seat at a four player table', () => {
    const store = startedGame([
      { name: 'Ada', color: 'red', isCpu: false },
      { name: 'Ben', color: 'blue', isCpu: true },
      { name: 'Cy', color: 'green', isCpu: true },
      { name: 'Dee', color: 'yellow', isCpu: true },
    ])
    render(<App store={store} audio={createFakeAudioPort()} />)

    // One card per player, all mounted at once — the layout may never hide a
    // seat behind a scrollbar or below the fold.
    expect(screen.getAllByRole('article')).toHaveLength(4)
  })

  // The players share one rail with the spinner — the old separate left rail
  // and its standings strip are gone, so each card must now carry the rank
  // and net worth the strip used to show.
  it('seats every player under the spinner, each with rank and net worth', () => {
    render(<App store={startedGame()} audio={createFakeAudioPort()} />)

    const rail = screen.getByRole('complementary', { name: /spinner and players/i })
    expect(within(rail).getAllByRole('article')).toHaveLength(2)
    expect(within(rail).getAllByText('Net worth')).toHaveLength(2)
    // Nobody has moved yet, so both seats hold identical net worth — a tie
    // shares 1st place rather than inventing an order.
    expect(within(rail).getAllByText(/1st place/)).toHaveLength(2)
  })
})

describe('passing the device', () => {
  it('interrupts between turns when more than one seat is human', () => {
    const store = startedGame([
      { name: 'Ada', color: 'red', isCpu: false },
      { name: 'Ben', color: 'blue', isCpu: false },
    ])
    render(<App store={store} audio={createFakeAudioPort()} />)

    expect(screen.getByRole('button', { name: /ready/i })).toBeInTheDocument()
  })

  it('stays out of the way when only one person is playing', () => {
    const store = startedGame([
      { name: 'Ada', color: 'red', isCpu: false },
      { name: 'Cee', color: 'blue', isCpu: true },
    ])
    render(<App store={store} audio={createFakeAudioPort()} />)

    expect(screen.queryByRole('button', { name: /ready/i })).not.toBeInTheDocument()
  })
})

describe('a computer turn waits for a person', () => {
  /*
   * The player asked that the game not run past a computer's event card on its
   * own — they want to read what it did. The computer still spins and chooses
   * for itself; only the dismissal waits.
   */
  it('does not dismiss a CPU event card while a human is at the table', async () => {
    vi.useFakeTimers()
    try {
      const store = startedGame([
        { name: 'Ada', color: 'red', isCpu: false },
        { name: 'Cee', color: 'blue', isCpu: true },
      ])
      // Drive to a point where the computer seat has resolved something.
      let guard = 0
      while (guard < 80) {
        const state = store.getState()
        const active = state.players[state.currentPlayerIndex]
        if (active?.isCpu && state.phase === 'resolved') break
        if (state.phase === 'awaitingSpin') store.dispatch({ type: 'spin' })
        else if (state.phase === 'moving') store.dispatch({ type: 'settle' })
        else if (state.phase === 'awaitingDecision') {
          store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
        } else if (state.phase === 'resolved') store.dispatch({ type: 'endTurn' })
        guard += 1
      }
      expect(store.getState().phase).toBe('resolved')

      render(<App store={store} audio={createFakeAudioPort()} />)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(6_000)
      })

      // Still waiting: nothing dismissed it.
      expect(store.getState().phase).toBe('resolved')
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps an all-computer table moving, since nobody can press Continue', async () => {
    vi.useFakeTimers()
    try {
      const store = startedGame([
        { name: 'Cee', color: 'red', isCpu: true },
        { name: 'Dee', color: 'blue', isCpu: true },
      ])
      render(<App store={store} audio={createFakeAudioPort()} />)
      const before = store.getState()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(12_000)
      })
      expect(store.getState()).not.toBe(before)
    } finally {
      vi.useRealTimers()
    }
  })
})
