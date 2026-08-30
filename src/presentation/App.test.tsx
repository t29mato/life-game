import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createGameStore } from '@application/createGameStore'
import type { GameCommand, GameStore } from '@application/GameStore'
import { CAREER_STAY_OPTION_ID, VALUE_SPIN_OPTION_ID } from '@application/usecases/applyEffect'
import {
  createInMemoryProfileRepository,
  createInMemoryRepository,
  createInMemoryStatsRepository,
  createSeededRandom,
} from '@application/testing/fakes'
import type { GameState, NewGamePlayer, SpinValue } from '@domain/model/types'

import { App } from './App'
import { createFakeAudioPort } from './dev/fakeAudio'

const { useRegisterSWMock } = vi.hoisted(() => ({ useRegisterSWMock: vi.fn() }))

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: useRegisterSWMock,
}))

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

/**
 * True in either phase that owes the die a press. A turn beginning on a fork
 * asks for two — the road, then how far down it — so a loop that only drives
 * `awaitingSpin` stalls halfway through one. See `spin.ts`.
 */
const awaitsRoll = (phase: GameState['phase']): boolean =>
  phase === 'awaitingSpin' || phase === 'awaitingDistanceSpin'

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
  seed = 7,
): ReturnType<typeof createGameStore> {
  const store = newStore(seed)
  store.dispatch({ type: 'startGame', config: { players } })
  return store
}

beforeEach(() => {
  // Every existing test renders `<App>` without caring about the update
  // banner at all — it should stay invisible for every one of them, same
  // as a real tab that hasn't heard about a new build. Tests about the
  // banner itself override this.
  useRegisterSWMock.mockReturnValue({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('remembering players', () => {
  /*
   * Starting a game is the moment a table's humans become worth remembering
   * — no save button, no setting. The upsert lives in App's own start
   * callback rather than inside TitleScreen, which stays a presentation
   * component that never touches a port; this drives the real button to
   * prove the wiring between the two actually carries the design across.
   */
  it('remembers every human seat when a game starts, and no computer seat', async () => {
    const user = userEvent.setup()
    const profiles = createInMemoryProfileRepository()
    render(<App store={newStore()} audio={createFakeAudioPort()} profiles={profiles} />)

    const group2 = screen.getByRole('group', { name: 'Player 2 seat type' })
    await user.click(within(group2).getByRole('button', { name: 'CPU' }))
    await user.click(screen.getByRole('button', { name: /start game/i }))

    expect(profiles.list().map((profile) => profile.name)).toEqual(['Player 1'])
    expect(profiles.list()[0]).toMatchObject({ color: 'red', face: 'classic' })
  })
})

describe('App play loop', () => {
  it('shows the title screen while the game is in setup', () => {
    render(<App store={newStore()} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
  })

  it('shows the board and the active player once a game has started', () => {
    render(<App store={startedGame()} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

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
    render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    await waitFor(() => {
      expect(stub.commands).toContainEqual({ type: 'settle' })
    })
  })

  it('settles an empty move exactly once, however often React re-renders', async () => {
    const store = startedGame()
    const moving: GameState = { ...store.getState(), phase: 'moving', movementPath: [], stepsRemaining: 0 }

    const stub = createStubStore(moving)
    const { rerender } = render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    // The spinner is armed by a click, so a fresh mount has already settled and
    // is free to hand the empty move straight on. Re-rendering must not repeat
    // that: exactly one settle, however many times React re-runs the effect.
    rerender(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)
    rerender(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

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
      if (awaitsRoll(state.phase)) store.dispatch({ type: 'spin' })
      else if (state.phase === 'moving' || state.phase === 'passingEvent') store.dispatch({ type: 'settle' })
      else if (state.phase === 'awaitingDecision') {
        store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
      } else if (state.phase === 'resolved') store.dispatch({ type: 'endTurn' })
      guard += 1
    }

    const moving = store.getState()
    expect(moving.movementPath.length).toBeGreaterThan(0)

    const stub = createStubStore(moving)
    render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    // The board animates first and reports back; App must not shortcut it.
    expect(stub.commands).not.toContainEqual({ type: 'settle' })
  })
})

describe('a landing with nothing to say', () => {
  it("ends a human seat's own turn on its own, without ever showing a card", async () => {
    const store = startedGame()
    const empty: GameState = {
      ...store.getState(),
      phase: 'resolved',
      lastEvent: {
        spaceId: 'somewhere',
        title: 'A Quiet Stretch',
        description: 'Nothing much happens.',
        icon: 'space:start-of-life',
        tone: 'slate',
        moneyDelta: 0,
        lifeTilesGained: [],
        notes: [],
        emphasis: 'normal',
        narration: 'A quiet stretch of road — nothing to do but enjoy the view.',
      },
    }

    const stub = createStubStore(empty)
    render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    expect(screen.queryByText('A Quiet Stretch')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(stub.commands).toContainEqual({ type: 'endTurn' })
    })
  })

  it("still shows a computer seat's own empty card, and waits on Continue, while a human is at the table", () => {
    const store = startedGame()
    let guard = 0
    while (guard < 80) {
      const state = store.getState()
      const active = state.players[state.currentPlayerIndex]
      if (active?.isCpu && state.phase === 'resolved') break
      if (awaitsRoll(state.phase)) store.dispatch({ type: 'spin' })
      else if (state.phase === 'moving' || state.phase === 'passingEvent') store.dispatch({ type: 'settle' })
      else if (state.phase === 'awaitingDecision') {
        store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
      } else if (state.phase === 'resolved') store.dispatch({ type: 'endTurn' })
      guard += 1
    }
    const cpuTurn = store.getState()
    const empty: GameState = {
      ...cpuTurn,
      lastEvent: {
        ...cpuTurn.lastEvent!,
        moneyDelta: 0,
        lifeTilesGained: [],
        notes: [],
        emphasis: 'normal',
      },
    }

    const stub = createStubStore(empty)
    render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    expect(stub.commands).not.toContainEqual({ type: 'endTurn' })
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
          label: 'Roll',
          description: 'Roll 1 to 10 to find out what you owe.',
          icon: 'space:tuition-bill',
        },
      ],
    })
    const stub = createStubStore(state)
    render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/roll 1 to 10 to find out what you owe/i)).toBeInTheDocument()

    // The rail's own wheel sits disabled and hidden from the accessibility
    // tree behind the modal's — only one "Spin" button should ever resolve.
    const spinButton = screen.getByRole('button', { name: /^roll$/i })
    expect(spinButton).toBeEnabled()

    fireEvent.click(spinButton)
    expect(stub.commands).toContainEqual({ type: 'choose', optionId: VALUE_SPIN_OPTION_ID })
  })

  it('still shows the decision card when there is a real second option to weigh', () => {
    const state = withPendingValueSpin({
      kind: 'valueSpin',
      prompt: 'Two other trades would take you at the level you are on.',
      options: [
        { id: VALUE_SPIN_OPTION_ID, label: 'Roll', description: 'Roll for one of two offers.', icon: 'space:payday' },
        { id: CAREER_STAY_OPTION_ID, label: 'Stay put', description: '', icon: 'space:payday' },
      ],
      offeredCareerIds: ['career-a', 'career-b'],
    })
    const stub = createStubStore(state)
    render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    // The wheel stays disabled — pressing Spin is a choice made inside the
    // card, same as every other decision, not a direct press on the wheel.
    expect(screen.getByRole('button', { name: /^roll$/i })).toBeDisabled()
  })
})

describe('a fork the next spin will settle', () => {
  /*
   * The rail names both roads before the press that picks one. It used to
   * caption them "This spin also picks your road" as well — prose narrating
   * the two rows directly beneath it, which say the same thing on their own.
   * The framing a sighted player gets free from the layout now reaches a
   * screen reader as the region's own label instead.
   */
  it('names both roads, with the framing left to the region label', () => {
    const store = startedGame()
    const base = store.getState()
    const forkId = Object.keys(base.board.spaces).find(
      (id) => (base.board.spaces[id]?.next.length ?? 0) > 1,
    )!
    const [ada, ...rest] = base.players
    const state: GameState = {
      ...base,
      phase: 'awaitingSpin',
      players: [{ ...ada!, spaceId: forkId }, ...rest],
    }
    render(<App store={createStubStore(state)} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    const panel = screen.getByRole('status', { name: /fork ahead — this roll picks your road/i })
    expect(within(panel).getByText('1–3')).toBeInTheDocument()
    expect(within(panel).getByText('4–6')).toBeInTheDocument()
    expect(screen.queryByText(/this spin also picks your road/i)).not.toBeInTheDocument()
  })

  /*
   * And once that press has landed, the ranges are spent history: the road is
   * settled, the question has become how far down it, and the dock has to say
   * so — otherwise a second die coming up out of nowhere reads as a glitch
   * rather than as the other half of one fork.
   */
  it('names the settled road and asks for the distance once the first roll has landed', () => {
    const store = startedGame()
    const base = store.getState()
    const forkId = Object.keys(base.board.spaces).find((id) => (base.board.spaces[id]?.next.length ?? 0) > 1)!
    const roadId = base.board.spaces[forkId]!.next[1]!
    const [ada, ...rest] = base.players
    const state: GameState = {
      ...base,
      phase: 'awaitingDistanceSpin',
      chosenExit: roadId,
      players: [{ ...ada!, spaceId: forkId }, ...rest],
    }
    render(<App store={createStubStore(state)} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    const road = base.board.spaces[roadId]!.lane!.name
    const panel = screen.getByRole('status', { name: new RegExp(`you're on ${road}`, 'i') })
    expect(within(panel).getByText(road)).toBeInTheDocument()
    expect(within(panel).getByText(/roll again for how far you go/i)).toBeInTheDocument()
    // The ranges belonged to a question already answered.
    expect(screen.queryByText('1–3')).not.toBeInTheDocument()
    // And the die is live for that second press, not left disabled mid-turn.
    expect(screen.getByRole('button', { name: /^roll$/i })).toBeEnabled()
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
    render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)
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
    render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    screen.getByRole('button', { name: /^roll$/i }).focus()
    fireEvent.keyDown(window, { key: ' ' })

    expect(stub.commands).not.toContainEqual({ type: 'spin' })
  })

  it('presses a single-option value spin on Space too', async () => {
    const state = withPendingValueSpin({
      kind: 'valueSpin',
      prompt: 'Tuition Bill',
      options: [{ id: VALUE_SPIN_OPTION_ID, label: 'Roll', description: 'Roll for the bill.', icon: 'space:payday' }],
    })
    const stub = createStubStore(state)
    render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    // EventSpinModal's focus trap lands focus on the wheel's own button the
    // instant it mounts, so Space here plays out through that button's
    // native activation, not the global window handler — the same
    // deferral "does nothing when some other control already has focus"
    // above already covers for the rail's identical button.
    expect(screen.getByRole('button', { name: /^roll$/i })).toHaveFocus()
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

      render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)
      fireEvent.keyDown(window, { key: ' ' })

      // A wheel that armed and animated leaves `awaitingSpin` behind for good —
      // it never gets stuck disabled in `moving` waiting for a wheel that was
      // never told to turn.
      await waitFor(() => expect(store.getState().phase).not.toBe('awaitingSpin'))

      /*
       * Every game opens standing on a fork, so that first press settled the
       * road and nothing else. The wheel has to arm and animate a second time
       * for the distance — the same single-fire path, twice in one turn, which
       * is exactly where a die that armed once and never called back would
       * strand the whole turn loop.
       */
      expect(store.getState().phase).toBe('awaitingDistanceSpin')
      fireEvent.keyDown(window, { key: ' ' })
      await waitFor(() => expect(store.getState().phase).not.toBe('awaitingDistanceSpin'))

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
      /*
       * Searched for rather than hardcoded to one seed: a value spin with a
       * single option is a specific tile reached by a specific player, and
       * whether any given seed's game passes through one before everybody
       * retires is luck. The first seed that does is as good as any other.
       */
      const store = (() => {
        for (let seed = 1; seed <= 40; seed += 1) {
          const candidate = startedGame(undefined, seed)
          let guard = 0
          while (guard < 300 && candidate.getState().phase !== 'gameOver') {
            const state = candidate.getState()
            if (
              state.phase === 'awaitingDecision' &&
              state.pendingDecision?.kind === 'valueSpin' &&
              state.pendingDecision.options.length === 1
            ) {
              return candidate
            }
            if (awaitsRoll(state.phase)) candidate.dispatch({ type: 'spin' })
            else if (state.phase === 'moving' || state.phase === 'passingEvent') {
              candidate.dispatch({ type: 'settle' })
            } else if (state.phase === 'awaitingDecision') {
              candidate.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
            } else if (state.phase === 'resolved') candidate.dispatch({ type: 'endTurn' })
            guard += 1
          }
        }
        throw new Error('no seed reached a single-option value spin')
      })()
      expect(store.getState().phase).toBe('awaitingDecision')
      const before = store.getState()
      const spinner = before.players[before.currentPlayerIndex]!

      render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)
      const panel = screen.getByText(spinner.name).closest('article')!
      const panelTextBefore = panel.textContent

      fireEvent.click(screen.getByRole('button', { name: /^roll$/i }))

      /*
       * The store already knows the outcome — this is exactly the gap the
       * rail is not supposed to show. `phase` is the proxy that works for
       * every value-spin equally: `player.money` used to serve here, but a
       * promotion review that misses still gives a raise (the salary rate
       * moves, not cash) and a career spin never carries a signing bonus
       * either, so neither reliably tells "before" and "after" apart the way
       * every value-spin's own phase transition does.
       */
      expect(store.getState().phase).not.toBe('awaitingDecision')
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
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })
})

/*
 * The complaint, verbatim from a real game: a card appeared reading "✦ Rolled
 * a 3." for a career fair the pawn had only driven over, and no die had ever
 * turned on screen for it. A tile the pawn *stops* on has never had that
 * problem — its die goes up in `EventSpinModal` and the card only exists once
 * it has landed. A tile swept past resolves its roll inside `applyPassedEvent`
 * instead, so the roll is replayed here, on the number that outcome already
 * used, before the card it produced can be read.
 */
describe('a roll the player only drove past', () => {
  function sweptPast(rolled?: SpinValue, players?: readonly NewGamePlayer[]): GameState {
    const store = startedGame(players)
    return {
      ...store.getState(),
      phase: 'passingEvent',
      activePassedEvent: {
        spaceId: 'career-fair',
        title: 'Career Fair',
        description: 'Two offers on the table.',
        icon: 'space:payday',
        tone: 'purple',
        moneyDelta: 0,
        lifeTilesGained: [],
        notes: ['Rolled a 3.', 'Ada becomes a Chef!'],
        emphasis: 'milestone',
        narration: 'A 3! Ada is hired as a Chef.',
        ...(rolled === undefined ? {} : { rolled }),
      },
    }
  }

  it('throws the die first, and holds the card back until it lands — but waits on a person to press it', async () => {
    render(
      <App
        store={createStubStore(sweptPast(3))}
        audio={createFakeAudioPort()}
        profiles={createInMemoryProfileRepository()}
      />,
    )

    // The die is on screen and named for what it is — the tile was never
    // chosen, so the modal says so — but the roll is still a person's to
    // press, the same as any other one they're at the table for.
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/passing through/i)).toBeInTheDocument()
    const rollButton = within(dialog).getByRole('button', { name: /^roll$/i })
    // …and the card's own numbers are nowhere yet.
    expect(screen.queryByText('Ada becomes a Chef!')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument()

    // Nothing happens on its own — a human seat's roll waits on the press,
    // exactly like every other roll in the game, however the tile was
    // reached. Still named "Roll", not "Rolling…" or a landed result: it
    // never armed itself.
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(within(dialog).getByRole('button', { name: /^roll$/i })).toBe(rollButton)
    expect(screen.queryByText('Ada becomes a Chef!')).not.toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(rollButton)

    // Once it settles, the card arrives with everything the roll decided.
    await waitFor(() => expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument(), {
      timeout: 5000,
    })
    expect(screen.getByText('Ada becomes a Chef!')).toBeInTheDocument()
  })

  it("throws itself for a computer seat's own swept-past roll — nobody at the table presses for them", async () => {
    const state = sweptPast(3)
    render(
      <App
        // Ben is the CPU seat `startedGame`'s default table always seats
        // second — see the `players` default above.
        store={createStubStore({ ...state, currentPlayerIndex: 1 })}
        audio={createFakeAudioPort()}
        profiles={createInMemoryProfileRepository()}
      />,
    )

    expect(within(screen.getByRole('dialog')).getByText(/passing through/i)).toBeInTheDocument()

    // No press from here — the computer seat's own roll plays out
    // unattended, same as every other one it takes.
    await waitFor(() => expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument(), {
      timeout: 5000,
    })
  })

  it('leaves a swept-past tile that never rolled exactly as it was', () => {
    render(
      <App
        store={createStubStore(sweptPast())}
        audio={createFakeAudioPort()}
        profiles={createInMemoryProfileRepository()}
      />,
    )

    // A flat payday, a fixed charge: there is no die to watch, so the card is
    // readable the instant the pawn stops on the tile, same as it always was.
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    expect(screen.queryByText(/passing through/i)).not.toBeInTheDocument()
  })

  it('hands over the finished card immediately under reduced motion', () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: () => {},
      removeEventListener: () => {},
    })
    try {
      render(
        <App
          store={createStubStore(sweptPast(3))}
          audio={createFakeAudioPort()}
          profiles={createInMemoryProfileRepository()}
        />,
      )

      // No die, no wait, no in-between state — the whole step collapses to
      // the card it was always leading to.
      expect(screen.queryByText(/passing through/i)).not.toBeInTheDocument()
      expect(screen.getByText('Ada becomes a Chef!')).toBeInTheDocument()
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  /*
   * An all-computer table dismisses its own cards on a timer, and that timer
   * is shorter than a throw. Left alone it would settle straight past the die
   * this whole thing exists to show — and then keep doing it, every swept-past
   * tile, for the rest of a game nobody can intervene in.
   */
  it('will not let a computer table settle past a die still in the air', async () => {
    const stub = createStubStore(
      sweptPast(3, [
        { name: 'Cee', color: 'red', isCpu: true },
        { name: 'Dee', color: 'blue', isCpu: true },
      ]),
    )
    render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    /*
     * Real timers on purpose: this is a race between two real durations —
     * `CPU_THINK_MS.passingEvent` is shorter than a throw, so without the
     * guard the card would be dismissed before it was ever shown. Stated as
     * an ordering rather than as a wall-clock figure: nothing may settle
     * before the card the die was leading to is actually on screen.
     */
    await waitFor(() => expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument(), {
      timeout: 5000,
    })
    expect(stub.commands).not.toContainEqual({ type: 'settle' })

    // And the loop still runs itself from there — delayed, never deadlocked.
    await waitFor(() => expect(stub.commands).toContainEqual({ type: 'settle' }), { timeout: 5000 })
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
        if (awaitsRoll(state.phase)) store.dispatch({ type: 'spin' })
        else if (state.phase === 'moving' || state.phase === 'passingEvent') store.dispatch({ type: 'settle' })
        else if (state.phase === 'awaitingDecision') {
          store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
        } else if (state.phase === 'resolved') store.dispatch({ type: 'endTurn' })
        guard += 1
      }

      // A turn opens either on the wheel or on a fork, depending on where the
      // seat is standing; both are the computer's to act on.
      const phaseBefore = store.getState().phase
      expect(['awaitingSpin', 'awaitingDistanceSpin', 'awaitingDecision']).toContain(phaseBefore)

      render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

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
      render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)
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
    render(<App store={startedGame()} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    expect(screen.queryByRole('region', { name: /game log/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^log$/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens from the header control and closes again', () => {
    render(<App store={startedGame()} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    fireEvent.click(screen.getByRole('button', { name: /^log$/i }))
    expect(screen.getByRole('region', { name: /game log/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^log$/i })).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(screen.getByRole('button', { name: /^log$/i }))
    expect(screen.queryByRole('region', { name: /game log/i })).not.toBeInTheDocument()
  })

  it('closes on Escape', () => {
    render(<App store={startedGame()} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    fireEvent.click(screen.getByRole('button', { name: /^log$/i }))
    expect(screen.getByRole('region', { name: /game log/i })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('region', { name: /game log/i })).not.toBeInTheDocument()
  })

  it('still announces the latest happening politely while the drawer is closed', () => {
    const { container } = render(<App store={startedGame()} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

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
    render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    // One card per player, all mounted at once — the layout may never hide a
    // seat behind a scrollbar or below the fold.
    expect(screen.getAllByRole('article')).toHaveLength(4)
  })

  // The players share one rail with the spinner — the old separate left rail
  // and its standings strip are gone, so each card must now carry the rank
  // and net worth the strip used to show.
  it('seats every player under the spinner, each with rank and net worth', () => {
    render(<App store={startedGame()} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    const rail = screen.getByRole('complementary', { name: /^players$/i })
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
    render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    expect(screen.getByRole('button', { name: /ready/i })).toBeInTheDocument()
  })

  it('stays out of the way when only one person is playing', () => {
    const store = startedGame([
      { name: 'Ada', color: 'red', isCpu: false },
      { name: 'Cee', color: 'blue', isCpu: true },
    ])
    render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

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
        if (awaitsRoll(state.phase)) store.dispatch({ type: 'spin' })
        else if (state.phase === 'moving' || state.phase === 'passingEvent') store.dispatch({ type: 'settle' })
        else if (state.phase === 'awaitingDecision') {
          store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
        } else if (state.phase === 'resolved') store.dispatch({ type: 'endTurn' })
        guard += 1
      }
      expect(store.getState().phase).toBe('resolved')

      render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)
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
      render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)
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
 * A tab left open never re-checks its own service worker on its own — a
 * new one only downloads on a fresh navigation, or when `UpdateBanner`
 * itself asks again periodically. What App does with that fact is much
 * simpler than the reload-on-a-timer this project used to do here: it
 * just always renders `UpdateBanner`, on every screen, and leaves the
 * decision of when it is safe to lose whatever is on screen to the one
 * person who actually knows — never reloading anything itself. See
 * `UpdateBanner.test.tsx` for the button's own behaviour once a new
 * service worker really is waiting.
 */
describe('the update banner', () => {
  function needsRefresh(): void {
    useRegisterSWMock.mockReturnValue({
      needRefresh: [true, vi.fn()],
      offlineReady: [false, vi.fn()],
      updateServiceWorker: vi.fn(),
    })
  }

  it('stays off the title screen until a new build is actually waiting', () => {
    render(<App store={newStore()} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    expect(screen.queryByRole('button', { name: /update/i })).not.toBeInTheDocument()
  })

  it('offers the update from the title screen once one is', () => {
    needsRefresh()
    render(<App store={newStore()} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument()
  })

  it('is offered during an active game too, rather than only at the title or results screen', () => {
    needsRefresh()
    render(<App store={startedGame()} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    expect(screen.getByRole('img', { name: /game board/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument()
  })
})
