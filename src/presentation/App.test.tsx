import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createGameStore } from '@application/createGameStore'
import type { GameCommand, GameStore } from '@application/GameStore'
import { CAREER_STAY_OPTION_ID, VALUE_SPIN_OPTION_ID } from '@application/usecases/applyEffect'
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

/*
 * A value-spin decision with nothing to weigh — the tuition bill, a
 * promotion review — used to surface as a decision-list card with exactly
 * one entry in it: "Spin", pick it, Enter. The owner reported that this
 * felt like the result appeared without ever spinning, because it did — the
 * wheel in the rail stayed disabled throughout and never turned. It now
 * hands the actual wheel to the player instead, front and centre in
 * `EventSpinModal` — the tile the pawn sits on has nothing to do with an
 * event spin, so it gets the middle of the screen the same way a decision
 * card does, rather than the rail beside the board.
 */
function withPendingValueSpin(options: GameState['pendingDecision']): GameState {
  const store = startedGame()
  return { ...store.getState(), phase: 'awaitingDecision', pendingDecision: options }
}

describe('a single-option value spin', () => {
  it('skips the decision-list card and hands the real wheel to the player, front and centre', () => {
    const state = withPendingValueSpin({
      kind: 'valueSpin',
      prompt: 'Tuition Bill',
      options: [
        {
          id: VALUE_SPIN_OPTION_ID,
          label: 'Spin',
          description: 'Spin 1 to 10 to find out what you owe.',
          icon: 'space:tuition-bill',
        },
      ],
    })
    const stub = createStubStore(state)
    render(<App store={stub} audio={createFakeAudioPort()} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/spin 1 to 10 to find out what you owe/i)).toBeInTheDocument()

    // The rail's own wheel sits disabled and hidden from the accessibility
    // tree behind the modal's — only one "Spin" button should ever resolve.
    const spinButton = screen.getByRole('button', { name: /^spin$/i })
    expect(spinButton).toBeEnabled()

    fireEvent.click(spinButton)
    expect(stub.commands).toContainEqual({ type: 'choose', optionId: VALUE_SPIN_OPTION_ID })
  })

  it('still shows the decision card when there is a real second option to weigh', () => {
    const state = withPendingValueSpin({
      kind: 'valueSpin',
      prompt: 'Two other trades would take you at the level you are on.',
      options: [
        { id: VALUE_SPIN_OPTION_ID, label: 'Spin', description: 'Spin for one of two offers.', icon: 'space:payday' },
        { id: CAREER_STAY_OPTION_ID, label: 'Stay put', description: '', icon: 'space:payday' },
      ],
      offeredCareerIds: ['career-a', 'career-b'],
    })
    const stub = createStubStore(state)
    render(<App store={stub} audio={createFakeAudioPort()} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    // The wheel stays disabled — pressing Spin is a choice made inside the
    // card, same as every other decision, not a direct press on the wheel.
    expect(screen.getByRole('button', { name: /^spin$/i })).toBeDisabled()
  })
})

/*
 * The wheel sits in the rail, a long mouse trip from wherever a player's
 * cursor actually is on a wide desktop screen — the owner asked for a way to
 * press it without reaching all the way over there every time.
 */
describe('spinning from the keyboard', () => {
  it('presses the wheel on Space when nothing else has focus', () => {
    const store = startedGame()
    // Whichever phase the fresh game opens on, drive it to `awaitingSpin`.
    while (store.getState().phase !== 'awaitingSpin') {
      const state = store.getState()
      if (state.phase === 'awaitingDecision') {
        store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
      } else break
    }
    const stub = createStubStore(store.getState())
    render(<App store={stub} audio={createFakeAudioPort()} />)
    expect(document.body).toHaveFocus()

    fireEvent.keyDown(window, { key: ' ' })

    expect(stub.commands).toContainEqual({ type: 'spin' })
  })

  it('does nothing when some other control already has focus, so it never double-fires', () => {
    const store = startedGame()
    while (store.getState().phase !== 'awaitingSpin') {
      const state = store.getState()
      if (state.phase === 'awaitingDecision') {
        store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
      } else break
    }
    const stub = createStubStore(store.getState())
    render(<App store={stub} audio={createFakeAudioPort()} />)

    screen.getByRole('button', { name: /^spin$/i }).focus()
    fireEvent.keyDown(window, { key: ' ' })

    expect(stub.commands).not.toContainEqual({ type: 'spin' })
  })

  it('presses a single-option value spin on Space too', async () => {
    const state = withPendingValueSpin({
      kind: 'valueSpin',
      prompt: 'Tuition Bill',
      options: [{ id: VALUE_SPIN_OPTION_ID, label: 'Spin', description: 'Spin for the bill.', icon: 'space:payday' }],
    })
    const stub = createStubStore(state)
    render(<App store={stub} audio={createFakeAudioPort()} />)

    // EventSpinModal's focus trap lands focus on the wheel's own button the
    // instant it mounts, so Space here plays out through that button's
    // native activation, not the global window handler — the same
    // deferral "does nothing when some other control already has focus"
    // above already covers for the rail's identical button.
    expect(screen.getByRole('button', { name: /^spin$/i })).toHaveFocus()
    const user = userEvent.setup()
    await user.keyboard(' ')

    expect(stub.commands).toContainEqual({ type: 'choose', optionId: VALUE_SPIN_OPTION_ID })
  })

  /*
   * A stub store only proves the right command was *dispatched* — it never
   * runs the wheel's own animation, so it could not have caught the actual
   * bug: calling `handleSpin` straight from the keyboard handler committed
   * the roll to the store without ever arming the wheel to expect it. The
   * store moved on; the wheel never did, `onSpinComplete` never fired, and
   * the game sat there permanently disabled. Only a real store, rendered for
   * real, exercises that arming step — this is deliberately not a stub test.
   */
  it('actually turns the wheel, rather than committing a roll it never animates to', async () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true, // reduced motion: both the wheel and the board settle immediately
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: () => {},
      removeEventListener: () => {},
    })
    try {
      const store = startedGame()
      while (store.getState().phase !== 'awaitingSpin') {
        const state = store.getState()
        if (state.phase === 'awaitingDecision') {
          store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
        } else break
      }
      expect(store.getState().phase).toBe('awaitingSpin')

      render(<App store={store} audio={createFakeAudioPort()} />)
      fireEvent.keyDown(window, { key: ' ' })

      // A wheel that armed and animated leaves `awaitingSpin` behind for good —
      // it never gets stuck disabled in `moving` waiting for a wheel that was
      // never told to turn.
      await waitFor(() => expect(store.getState().phase).not.toBe('awaitingSpin'))
      await waitFor(() => expect(store.getState().phase).not.toBe('moving'), { timeout: 3000 })
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  /*
   * `resolveValueSpin` commits the roll's outcome to `state.players` in the
   * same dispatch that sets `lastSpin` — long before the wheel has visibly
   * finished turning. `lastEvent` already waited for the wheel to settle;
   * the player rail did not, so a debited balance or a new job title showed
   * up in the "CASH" line while the wheel was still spinning towards the
   * number that was supposed to decide it. This drives a real game to a
   * real single-option value spin (a casual payday, reachable for an
   * unemployed player within a handful of turns on any seed) and checks the
   * rail synchronously, before the wheel has had a chance to settle.
   */
  it('does not reveal a value spin\'s result in the player rail before the wheel settles', async () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false, // real motion this time — need the "still spinning" window to exist
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: () => {},
      removeEventListener: () => {},
    })
    try {
      const store = startedGame()
      let guard = 0
      while (guard < 300) {
        const state = store.getState()
        if (
          state.phase === 'awaitingDecision' &&
          state.pendingDecision?.kind === 'valueSpin' &&
          state.pendingDecision.options.length === 1
        ) {
          break
        }
        if (state.phase === 'awaitingSpin') store.dispatch({ type: 'spin' })
        else if (state.phase === 'moving') store.dispatch({ type: 'settle' })
        else if (state.phase === 'awaitingDecision') {
          store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
        } else if (state.phase === 'resolved') store.dispatch({ type: 'endTurn' })
        guard += 1
      }
      expect(store.getState().phase).toBe('awaitingDecision')
      const before = store.getState()
      const spinner = before.players[before.currentPlayerIndex]!
      const beforeMoney = spinner.money

      render(<App store={store} audio={createFakeAudioPort()} />)
      const panel = screen.getByText(spinner.name).closest('article')!
      const panelTextBefore = panel.textContent

      fireEvent.click(screen.getByRole('button', { name: /^spin$/i }))

      // The store already knows the outcome — this is exactly the gap the
      // rail is not supposed to show.
      expect(store.getState().players[before.currentPlayerIndex]!.money).not.toBe(beforeMoney)
      // The rail itself, read from the DOM the instant after pressing Spin,
      // must not have moved yet — not the cash, not the career, nothing.
      expect(panel.textContent).toBe(panelTextBefore)

      // Once the wheel actually settles, the rail catches up.
      await waitFor(
        () => {
          expect(panel.textContent).not.toBe(panelTextBefore)
        },
        { timeout: 5000 },
      )
      expect(store.getState().players[before.currentPlayerIndex]!.money).not.toBe(beforeMoney)
    } finally {
      window.matchMedia = originalMatchMedia
    }
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

/*
 * A tab left open never re-fetches its own bundle on its own — the owner
 * reported seeing a build from well before this session's work landed,
 * still running in a tab nobody had reloaded. `useDeployedVersion` notices
 * a newer build is live; this is what App does with that fact — reload
 * where nothing is lost (the title screen, the results screen), and never
 * where something would be (mid-game).
 */
describe('picking up a new deploy', () => {
  let script: HTMLScriptElement

  beforeEach(() => {
    script = document.createElement('script')
    script.type = 'module'
    script.src = '/life-game/assets/index-AAAAAA.js'
    document.head.appendChild(script)
  })

  afterEach(() => {
    document.head.removeChild(script)
    vi.unstubAllGlobals()
  })

  function mockNewerDeploy(): void {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            '<!doctype html><html><head><script type="module" src="/life-game/assets/index-BBBBBB.js"></script></head></html>',
          ),
      }),
    )
  }

  it('reloads on its own once a newer build is live and the title screen has nothing to lose', async () => {
    vi.useFakeTimers()
    try {
      mockNewerDeploy()
      const reload = vi.fn()
      vi.stubGlobal('location', { ...window.location, reload })

      render(<App store={newStore()} audio={createFakeAudioPort()} />)
      expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(15_000)
      })

      expect(reload).toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('leaves a game in progress alone, deploy or no deploy', async () => {
    vi.useFakeTimers()
    try {
      mockNewerDeploy()
      const reload = vi.fn()
      vi.stubGlobal('location', { ...window.location, reload })

      render(<App store={startedGame()} audio={createFakeAudioPort()} />)
      expect(screen.getByRole('img', { name: /game board/i })).toBeInTheDocument()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(15_000)
      })

      expect(reload).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })
})
