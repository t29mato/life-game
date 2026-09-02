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
import { findCareer } from '@domain/edition/lookup'
import { HOUSES, STOCKS } from '@domain/edition/usa'
import type { GameState, NewGamePlayer, Player, SpinValue } from '@domain/model/types'

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
    expect(profiles.list()[0]).toMatchObject({ color: 'red' })
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

  it("carries an option's roll-to-outcome table through to the wheel screen", () => {
    const state = withPendingValueSpin({
      kind: 'valueSpin',
      prompt: 'Tuition Bill',
      options: [
        {
          id: VALUE_SPIN_OPTION_ID,
          label: 'Roll',
          description: 'Roll to find out what you owe.',
          icon: 'space:tuition-bill',
          table: [
            { range: '1-2', amount: '$90,000' },
            { range: '6', amount: 'Full ride' },
          ],
        },
      ],
    })
    render(
      <App store={createStubStore(state)} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />,
    )

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('table')).toBeInTheDocument()
    expect(within(dialog).getByText('1-2')).toBeInTheDocument()
    expect(within(dialog).getByText('$90,000')).toBeInTheDocument()
    expect(within(dialog).getByText('Full ride')).toBeInTheDocument()
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
/*
 * "The A button is always the primary action, whatever screen you are on" —
 * issue #33. The old arrangement was two half answers: a window-level Space
 * listener that stood down the moment anything had focus, and each modal's
 * focus trap putting focus wherever its DOM happened to start. Between them,
 * the board die answered Space only in the narrow window where nothing at all
 * was focused, and Enter never rolled anything. Both keys now go to the same
 * one control on every screen — see `usePrimaryAction`.
 */
describe('spinning from the keyboard', () => {
  function atAwaitingSpin(): GameState {
    const store = startedGame()
    // Whichever phase the fresh game opens on, drive it to `awaitingSpin`.
    while (store.getState().phase !== 'awaitingSpin') {
      const state = store.getState()
      if (state.phase === 'awaitingDecision') {
        store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
      } else break
    }
    return store.getState()
  }

  it('puts focus on the die the moment the turn is waiting for it', () => {
    const stub = createStubStore(atAwaitingSpin())
    render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    expect(screen.getByRole('button', { name: /^roll$/i })).toHaveFocus()
  })

  it.each([' ', 'Enter'])('rolls the board die on %s, wherever focus has ended up', (key) => {
    const stub = createStubStore(atAwaitingSpin())
    render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)
    // Focus dropped back to the page — where it lands whenever a modal that
    // held it unmounts, and precisely the state the die used to be
    // unreachable from.
    screen.getByRole('button', { name: /^roll$/i }).blur()

    fireEvent.keyDown(window, { key })

    expect(stub.commands).toContainEqual({ type: 'spin' })
  })

  it('rolls exactly once, never twice, when the die itself holds focus', () => {
    const stub = createStubStore(atAwaitingSpin())
    render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    fireEvent.keyDown(window, { key: ' ' })

    expect(stub.commands.filter((command) => command.type === 'spin')).toHaveLength(1)
  })

  it('leaves the press to a control the player deliberately focused', () => {
    const stub = createStubStore(atAwaitingSpin())
    render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    screen.getByRole('button', { name: /quit/i }).focus()
    fireEvent.keyDown(window, { key: ' ' })

    expect(stub.commands).not.toContainEqual({ type: 'spin' })
  })

  it.each([' ', 'Enter'])('presses a single-option value spin on %s too', (key) => {
    const state = withPendingValueSpin({
      kind: 'valueSpin',
      prompt: 'Tuition Bill',
      options: [{ id: VALUE_SPIN_OPTION_ID, label: 'Roll', description: 'Roll for the bill.', icon: 'space:payday' }],
    })
    const stub = createStubStore(state)
    render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    // The die inside the modal is the screen's primary action: it takes focus
    // as the card opens, and answers the key from the window whether or not
    // it still holds it. This was the reported half that did not work at all
    // — the modal's die wanted a click.
    expect(screen.getByRole('button', { name: /^roll$/i })).toHaveFocus()
    fireEvent.keyDown(window, { key })

    expect(stub.commands).toContainEqual({ type: 'choose', optionId: VALUE_SPIN_OPTION_ID })
  })

  it("answers the key even when focus never reached the modal's die", () => {
    const state = withPendingValueSpin({
      kind: 'valueSpin',
      prompt: 'Tuition Bill',
      options: [{ id: VALUE_SPIN_OPTION_ID, label: 'Roll', description: 'Roll for the bill.', icon: 'space:payday' }],
    })
    const stub = createStubStore(state)
    render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    screen.getByRole('button', { name: /^roll$/i }).blur()
    fireEvent.keyDown(window, { key: ' ' })

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
   * strip synchronously, before the wheel has had a chance to settle. The
   * rail this guarded when it was written has since become the strip at the
   * foot of the screen; the promise it holds is unchanged.
   */
  it('does not reveal a value spin\'s result in the player strip before the wheel settles', async () => {
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
       * retires is luck. It must also be one whose outcome moves *cash* —
       * the strip prints nothing but the wallet, so a promotion review that
       * only moves the salary rate would leave this test staring at text
       * that never changes for the right reason. Each candidate is probed
       * to its outcome first, then replayed fresh on the same seed: the
       * seeded random is deterministic, so the replay lands on the same
       * decision with the roll still unspent.
       */
      const driveToValueSpin = (seed: number): ReturnType<typeof createGameStore> | null => {
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
        return null
      }
      const store = (() => {
        for (let seed = 1; seed <= 40; seed += 1) {
          const probe = driveToValueSpin(seed)
          if (!probe) continue
          const at = probe.getState()
          const seat = at.currentPlayerIndex
          const cashBefore = at.players[seat]!.money
          probe.dispatch({ type: 'choose', optionId: at.pendingDecision!.options[0]!.id })
          if (probe.getState().players[seat]!.money === cashBefore) continue
          return driveToValueSpin(seed)!
        }
        throw new Error('no seed reached a cash-moving single-option value spin')
      })()
      expect(store.getState().phase).toBe('awaitingDecision')

      render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)
      // The strip carries every seat's cash, so its text is the sum of what
      // the whole table shows — if any wallet moves early, this moves.
      const strip = screen.getByRole('button', { name: /players — open full status/i })
      const stripTextBefore = strip.textContent

      fireEvent.click(screen.getByRole('button', { name: /^roll$/i }))

      /*
       * The store already knows the outcome — this is exactly the gap the
       * strip is not supposed to show. `phase` is the proxy that works for
       * every value-spin equally: `player.money` used to serve here, but a
       * promotion review that misses still gives a raise (the salary rate
       * moves, not cash) and a career spin never carries a signing bonus
       * either, so neither reliably tells "before" and "after" apart the way
       * every value-spin's own phase transition does.
       */
      expect(store.getState().phase).not.toBe('awaitingDecision')
      // The strip itself, read from the DOM the instant after pressing Spin,
      // must not have moved yet — not the cash, not the standing, nothing.
      expect(strip.textContent).toBe(stripTextBefore)

      // Once the wheel actually settles, the strip catches up.
      await waitFor(
        () => {
          expect(strip.textContent).not.toBe(stripTextBefore)
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
  function sweptPast(
    rolled?: SpinValue,
    players?: readonly NewGamePlayer[],
    stakes?: string,
  ): GameState {
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
        ...(stakes === undefined ? {} : { stakes }),
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

  it('names what each face is worth before the die lands, same as a landed tile already does', () => {
    render(
      <App
        store={createStubStore(
          sweptPast(3, undefined, '1-3: Warehouse Picker, $32,000. 4-6: Line Cook, $28,000.'),
        )}
        audio={createFakeAudioPort()}
        profiles={createInMemoryProfileRepository()}
      />,
    )

    // The stakes a player is hoping for while the die turns — not the tile's
    // own flavour text, which says nothing about what a 3 or a 4 is worth.
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/1-3: Warehouse Picker, \$32,000\. 4-6: Line Cook, \$28,000\./)).toBeInTheDocument()
    expect(within(dialog).queryByText('Two offers on the table.')).not.toBeInTheDocument()
  })

  it('falls back to the tile\'s own description when a swept tile had nothing riding on the roll', () => {
    render(
      <App
        store={createStubStore(sweptPast(3))}
        audio={createFakeAudioPort()}
        profiles={createInMemoryProfileRepository()}
      />,
    )

    expect(within(screen.getByRole('dialog')).getByText('Two offers on the table.')).toBeInTheDocument()
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

/*
 * Issue #14. v1.15.0 gave every tile a move swept past its own full modal
 * card with its own Continue button — a real fix for a real complaint (a
 * tuition bill from three tiles back used to be folded silently into whatever
 * different tile the car finally stopped on). What it cost was the turn: one
 * five-tile move in the playtest produced "Payday → Moving Out → Payday →
 * Payday", four cards, three of them identical, four presses, for four tiles
 * nobody chose to land on.
 *
 * The tile is still named, still priced, still logged. It just stops asking.
 */
describe('a tile the car only drove over', () => {
  function droveOver(overrides: Partial<GameState['activePassedEvent']> = {}): GameState {
    const store = startedGame()
    return {
      ...store.getState(),
      phase: 'passingEvent',
      activePassedEvent: {
        spaceId: 'payday-3',
        title: 'Payday',
        description: 'Collect your pay.',
        icon: 'space:payday',
        tone: 'green',
        moneyDelta: 37_000,
        lifeTilesGained: [],
        notes: [],
        ...overrides,
      } as GameState['activePassedEvent'],
    }
  }

  it('pops on the board instead of putting up a card to dismiss', () => {
    render(
      <App
        store={createStubStore(droveOver())}
        audio={createFakeAudioPort()}
        profiles={createInMemoryProfileRepository()}
      />,
    )

    // Named and priced, exactly as the card named and priced it…
    expect(screen.getByText('Payday')).toBeInTheDocument()
    expect(screen.getByText('+$37,000')).toBeInTheDocument()
    // …and with nothing to press and nothing trapping focus.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument()
  })

  it('carries on by itself, with nobody pressing anything', async () => {
    const stub = createStubStore(droveOver())
    render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    expect(stub.commands).not.toContainEqual({ type: 'settle' })
    await waitFor(() => expect(stub.commands).toContainEqual({ type: 'settle' }), { timeout: 5000 })
  })

  /*
   * The one exception the playtest itself carved out, and the right one: a
   * Life Milestone is the game telling you something about your life rather
   * than handing you a receipt, it brings its own confetti, and a whole game
   * holds a handful of them rather than three in one move.
   */
  it('still stops for a Life Milestone', () => {
    render(
      <App
        store={createStubStore(droveOver({ title: 'Get Married', emphasis: 'milestone' }))}
        audio={createFakeAudioPort()}
        profiles={createInMemoryProfileRepository()}
      />,
    )

    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
  })

  /*
   * The dwell is not decoration — it is the entire time anybody has to read
   * the pop — so a player who has asked for less motion still gets to read
   * it. Shorter, never zero, and never skipped.
   */
  it('still gives a reduced-motion player time to read the pop', async () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: () => {},
      removeEventListener: () => {},
    })
    try {
      const stub = createStubStore(droveOver())
      render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

      expect(screen.getByText('+$37,000')).toBeInTheDocument()
      expect(stub.commands).not.toContainEqual({ type: 'settle' })
      await waitFor(() => expect(stub.commands).toContainEqual({ type: 'settle' }), { timeout: 5000 })
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  /*
   * An all-computer table already dismisses its own cards on a timer. With
   * the pop's own timer now doing the same job, two of them would race to
   * dispatch the same `settle` — and the loser does not land on a no-op: it
   * resolves the landing at the far end of the move, several tiles early.
   */
  it('dispatches exactly one settle at an all-computer table', async () => {
    const state = droveOver()
    const stub = createStubStore({
      ...state,
      players: state.players.map((player) => ({ ...player, isCpu: true })),
    })
    render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    await waitFor(() => expect(stub.commands).toContainEqual({ type: 'settle' }), { timeout: 5000 })
    // Long enough for the CPU timer (`CPU_THINK_MS.passingEvent`) to have
    // fired too, had it not been held off.
    await new Promise((resolve) => setTimeout(resolve, 1500))
    expect(stub.commands.filter((command) => command.type === 'settle')).toHaveLength(1)
  })
})

/*
 * The other half of the same promise, and the half that kept breaking.
 *
 * A single-option value spin gets `EventSpinModal` and a die somebody has to
 * press. But a decision card with a *second* option to weigh — Career Fair's
 * "Roll" beside "Stay as a Stylist", The Number's "Call it a life" beside
 * "Keep working" — is answered inside `DecisionModal`, and the store resolves
 * that answer's roll in the very same dispatch. Nothing in the shell knew the
 * answer was going to turn the die, so nothing held the outcome back: the
 * card arrived already stamped "Rolled 6", career switched or retirement
 * final, with no die ever on screen. The player reported it, twice, as the
 * game rolling for them behind their back.
 *
 * These run the *real* use cases against the *real* board rather than a
 * hand-written decision, because the bug was never in what the card said —
 * it was in which options actually reach for the die, which is exactly the
 * thing a hand-written stand-in gets to assume.
 */
describe('a decision card answered by turning the die', () => {
  /**
   * A real store parked on one tile with `settle` already run, so the pending
   * decision under test is the one the game genuinely raises there.
   */
  function standingOn(spaceId: string, overrides: Partial<Player>, seed = 4): GameStore {
    const repository = createInMemoryRepository()
    const store = createGameStore({
      random: createSeededRandom(seed),
      repository,
      stats: createInMemoryStatsRepository(),
    })
    const base = startedGame().getState()
    const player: Player = { ...base.players[0]!, ...overrides, spaceId }
    repository.save(1, {
      ...base,
      players: [player, ...base.players.slice(1)],
      currentPlayerIndex: 0,
      phase: 'moving',
      movementPath: [],
      pendingPath: [],
      pendingPassedItems: [],
      stepsRemaining: 0,
      pendingDecision: null,
      lastEvent: null,
    })
    store.dispatch({ type: 'load', slot: 1 })
    store.dispatch({ type: 'settle' })
    return store
  }

  it('throws a die the player can watch before the Career Fair card says what they rolled', async () => {
    const store = standingOn('main-career-fair', {
      career: findCareer('career-stylist')!,
      money: 120_000,
    })
    // Two offers *and* the option to stay put, which is what routes this
    // through the decision card rather than straight to the die.
    expect(store.getState().pendingDecision?.options).toHaveLength(2)

    render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('option', { name: /^roll/i }))

    // The die, not the answer. Before the fix the outcome card was already
    // here, "Rolled 6" and a new job printed on it, one tick after the press.
    // Awaited rather than read straight off: an answer is now held on the
    // card for `TEMPO.choiceConfirmMs` before it reaches the store, so the
    // die takes that long to arrive. See `DecisionModal`'s confirm beat.
    const die = await waitFor(
      () => within(screen.getByRole('dialog')).getByRole('button', { name: /^roll$/i }),
      { timeout: 8000 },
    )
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/^Rolled$/)).not.toBeInTheDocument()

    // Nothing happens on its own: it is a person's roll, so it waits on them.
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument()

    // …and only once they throw it and it lands does the card arrive.
    await user.click(die)
    await waitFor(() => expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument(), {
      timeout: 8000,
    })
    expect(screen.getByText(/^Rolled$/)).toBeInTheDocument()
  })

  it('throws a die the player can watch before The Number pays their fund out', async () => {
    const store = standingOn('sunset-number', { money: 900_000 })
    const decision = store.getState().pendingDecision
    expect(decision?.kind).toBe('retire')
    // Affordable, so the card offers stopping *and* walking on — a real
    // choice, made on the card, whose "yes" then turns the die.
    expect(decision?.options).toHaveLength(2)

    render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('option', { name: /call it a life/i }))

    // Through the card's own confirm beat first — see the Career Fair test
    // just above.
    const die = await waitFor(
      () => within(screen.getByRole('dialog')).getByRole('button', { name: /^roll$/i }),
      { timeout: 8000 },
    )
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/^Rolled$/)).not.toBeInTheDocument()

    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument()

    await user.click(die)
    await waitFor(() => expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument(), {
      timeout: 8000,
    })
    expect(screen.getByText(/^Rolled$/)).toBeInTheDocument()
  })

  /*
   * The other half of the same change, and the one that would deadlock if it
   * were wrong: a computer seat's answer is parked exactly the way a person's
   * is, so it has to reach the die by itself from there. Nothing in this test
   * ever presses anything.
   */
  it("plays a computer seat's own die-turning answer through the same die, unattended", async () => {
    const store = standingOn('sunset-number', { money: 900_000, isCpu: true })
    expect(store.getState().pendingDecision?.kind).toBe('retire')

    render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    // It picks, the die throws itself, the card arrives — a seat that parked
    // its answer and never got to the die would simply hang here for good.
    await waitFor(() => expect(screen.getByText(/^Rolled$/)).toBeInTheDocument(), { timeout: 15000 })
    expect(store.getState().players[0]!.isRetired).toBe(true)
  })

  it('leaves a decision that never touches the die exactly as it was', async () => {
    const store = standingOn('main-career-fair', {
      career: findCareer('career-stylist')!,
      money: 120_000,
    })
    render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('option', { name: /^stay as a/i }))

    // Staying put decides nothing a die could have decided, so there is
    // nothing to watch and the card is readable straight away.
    await waitFor(() => expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument())
    expect(screen.queryByText(/^Rolled$/)).not.toBeInTheDocument()
  })
})

/*
 * The last thing the game decides, and for a long time the only thing it
 * decided with no die anywhere.
 *
 * Every house sale and every share cash-out used to be settled inside
 * `endTurn` — one synchronous `computeResults`, a uniform integer drawn per
 * asset, in the tick the last player retired — and the player was dropped
 * onto the results screen with the biggest numbers of their game already
 * printed, having pressed nothing. The log even called it a roll. Same shape
 * as the decision-card bug above, on the same grounds; these are the tests
 * that hold it closed.
 *
 * Placed here, beside the decision-card die tests, rather than at the foot of
 * the file: both throw a real die on a real clock, and framer-motion's frame
 * loop does not survive a round trip through the faked `requestAnimationFrame`
 * that `describe('computer seats')` below installs — a die thrown after those
 * never finishes its animation. Every test in this file that waits on a die
 * landing therefore belongs above them.
 */
describe('the closing settlement', () => {
  /** A real store with everybody retired, one press away from the results. */
  function retiredTable(holdings: Partial<Player>, bothComputers = false): GameStore {
    const repository = createInMemoryRepository()
    const store = createGameStore({
      random: createSeededRandom(3),
      repository,
      stats: createInMemoryStatsRepository(),
    })
    const base = startedGame([
      { name: 'Ada', color: 'red', isCpu: bothComputers },
      { name: 'Ben', color: 'blue', isCpu: bothComputers },
    ]).getState()
    const [ada, ben] = base.players
    repository.save(1, {
      ...base,
      players: [
        { ...ada!, isRetired: true, retirementRank: 1, ...holdings },
        { ...ben!, isRetired: true, retirementRank: 2, house: null, stocks: [] },
      ],
      currentPlayerIndex: 0,
      phase: 'resolved',
      lastEvent: null,
      lastSpin: null,
      movementPath: [],
      pendingPath: [],
      pendingDecision: null,
    })
    store.dispatch({ type: 'load', slot: 1 })
    return store
  }

  const resultsShowing = (): boolean => screen.queryByRole('table', { name: /final standings/i }) !== null

  /** Presses the die on a settlement card, the way a person at the table would. */
  async function pressTheDie(dialog: HTMLElement): Promise<void> {
    const user = userEvent.setup()
    await user.click(within(dialog).getByRole('button', { name: /^roll$/i }))
  }

  /** Waits for whatever is in the air to come down and the results to appear. */
  async function waitForResults(timeout = 8_000): Promise<void> {
    await waitFor(() => expect(resultsShowing()).toBe(true), { timeout })
  }

  it('puts a real die and its ladder on screen before the results exist', async () => {
    const store = retiredTable({ house: HOUSES[0]! })
    render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    act(() => store.dispatch({ type: 'endTurn' }))

    // The house is not sold yet — the die that sells it has not been thrown.
    expect(store.getState().phase).toBe('scoring')
    expect(resultsShowing()).toBe(false)

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/ada's house/i)).toBeInTheDocument()
    // All six rungs published before the throw, so the number that comes up
    // is one the player was already hoping for or dreading.
    expect(within(dialog).getAllByRole('row')).toHaveLength(7)

    // Nothing resolves on its own: it is a person's die, so it waits on them.
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(store.getState().phase).toBe('scoring')
    expect(resultsShowing()).toBe(false)

    /*
     * …and only once they throw it and it *lands* do the results arrive.
     * `scoreRoll` assembles the standings in the very tick the throw is
     * dispatched — that face was the last fact it was missing — so the
     * screen has to stay away while the die is still deciding the total
     * printed on it. Pressed, mid-flight, still nothing:
     */
    await pressTheDie(dialog)
    expect(store.getState().phase).toBe('gameOver')
    expect(resultsShowing()).toBe(false)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await waitForResults()
    expect(store.getState().results!.standings.find((s) => s.name === 'Ada')!.houseValue).toBeGreaterThan(0)
  })

  /*
   * One die per asset class, never one per individual asset: a four-seat table
   * where everybody held a home and three stocks would otherwise ask for
   * sixteen presses between the last retirement and the results screen.
   */
  it('asks for one die per asset class, and holds the results back for both', async () => {
    const store = retiredTable({ house: HOUSES[0]!, stocks: [{ stockId: STOCKS[0]!.id, shares: 2 }] })
    render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    act(() => store.dispatch({ type: 'endTurn' }))
    expect(store.getState().scoreRolls).toHaveLength(2)

    await pressTheDie(screen.getByRole('dialog'))
    // The second die, for the shares — and still no results.
    await waitFor(() => expect(screen.getByText(/ada's shares/i)).toBeInTheDocument(), { timeout: 8_000 })
    expect(resultsShowing()).toBe(false)

    await pressTheDie(screen.getByRole('dialog'))
    // The last die of the game, still in the air: the standings exist by
    // now but must not be readable over the throw that decided them.
    expect(store.getState().phase).toBe('gameOver')
    expect(resultsShowing()).toBe(false)

    await waitForResults()
    expect(store.getState().scoreRolls.map((roll) => roll.face)).not.toContain(null)
  })

  /*
   * Nobody is the active player once everybody has retired, so "who presses"
   * is answered by the die itself: it belongs to the seat it is scoring, and a
   * computer's own holdings throw unattended exactly as a computer's rolls do
   * all game. Nothing in this test presses anything.
   */
  it("throws a computer seat's own settlement dice unattended", async () => {
    const store = retiredTable({ house: HOUSES[0]!, stocks: [{ stockId: STOCKS[0]!.id, shares: 1 }] }, true)
    render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    act(() => store.dispatch({ type: 'endTurn' }))
    expect(store.getState().phase).toBe('scoring')

    await waitForResults(20_000)
    // Thrown, not skipped: every die on the queue landed on a real face.
    expect(store.getState().scoreRolls.map((roll) => roll.face)).not.toContain(null)
  })

  /*
   * And nothing to settle means no ceremony. A player who bought neither a
   * home nor a share has no die owed, so the results are where the last
   * retirement leads — never an empty press with nothing riding on it.
   */
  it('goes straight to the results when nobody owns anything to value', () => {
    const store = retiredTable({ house: null, stocks: [] })
    render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    act(() => store.dispatch({ type: 'endTurn' }))

    expect(store.getState().phase).toBe('gameOver')
    expect(store.getState().scoreRolls).toEqual([])
    expect(resultsShowing()).toBe(true)
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

  /*
   * Issue #35: Close used to be a button of its own floating above the
   * drawer's top-right corner, where it read as one more header control
   * beside Quit rather than as this panel's own way out.
   */
  it('carries its own Close inside the panel, on the log’s heading row', () => {
    render(<App store={startedGame()} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    fireEvent.click(screen.getByRole('button', { name: /^log$/i }))
    const panel = screen.getByRole('region', { name: /game log/i })
    const close = screen.getByRole('button', { name: /close the log/i })
    expect(panel).toContainElement(close)

    fireEvent.click(close)
    expect(screen.queryByRole('region', { name: /game log/i })).not.toBeInTheDocument()
  })

  it('still announces the latest happening politely while the drawer is closed', () => {
    const { container } = render(<App store={startedGame()} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    // The scrolling feed is off screen, but what it would have said must
    // still reach assistive tech the moment it happens.
    expect(container.querySelector('.visually-hidden[aria-live="polite"]')).not.toBeNull()
  })
})

/*
 * Issue #38: Music and SFX were two switches standing in the header for the
 * whole game, sharing a row with the turn display, Log, Save and Quit. They
 * fold into one gear, and the row gives the turn display its room back.
 */
describe('the settings sheet', () => {
  const renderGame = (): void => {
    render(<App store={startedGame()} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)
  }

  it('keeps the audio switches out of the header', () => {
    renderGame()

    expect(screen.queryByRole('button', { name: /music/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sfx/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
  })

  it('opens both audio switches behind the gear', () => {
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: /settings/i }))

    const sheet = screen.getByRole('dialog', { name: /settings/i })
    expect(within(sheet).getByRole('button', { name: /music/i })).toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: /sfx/i })).toBeInTheDocument()
  })

  it('closes on Escape, and on its own Close', () => {
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    fireEvent.keyDown(screen.getByRole('dialog', { name: /settings/i }), { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: /settings/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    fireEvent.click(within(screen.getByRole('dialog', { name: /settings/i })).getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('dialog', { name: /settings/i })).not.toBeInTheDocument()
  })

  it('takes the die out of the A button while it is open', () => {
    const store = startedGame()
    while (store.getState().phase !== 'awaitingSpin') {
      const state = store.getState()
      if (state.phase === 'awaitingDecision') {
        store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
      } else break
    }
    const stub = createStubStore(store.getState())
    render(<App store={stub} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    fireEvent.keyDown(window, { key: ' ' })

    expect(stub.commands).not.toContainEqual({ type: 'spin' })
  })
})

/*
 * The tall per-seat cards left the default view entirely — the owner asked
 * for the players along the bottom of the screen as a simplified band, with
 * the full detail one press away. The strip is a glance (name, wallet,
 * standing, whose turn); StatusModal is the report, and the strip itself is
 * now the way in.
 */
describe('the player strip', () => {
  const strip = (): HTMLElement => screen.getByRole('button', { name: /players — open full status/i })

  it('names every seat and its wallet at a four player table', () => {
    const store = startedGame([
      { name: 'Ada', color: 'red', isCpu: false },
      { name: 'Ben', color: 'blue', isCpu: true },
      { name: 'Cy', color: 'green', isCpu: true },
      { name: 'Dee', color: 'yellow', isCpu: true },
    ])
    render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    // Every seat on the band at once — the strip may never hide a player.
    for (const name of ['Ada', 'Ben', 'Cy', 'Dee']) {
      expect(within(strip()).getByText(name)).toBeInTheDocument()
    }
    // Two figures per seat now: the cash, which is what moves this turn, and
    // the net worth, which is what the ordinal beside it is actually sorted
    // on. The second one is there because a rank decided by a number the
    // player cannot see is a rank with no reason on it.
    expect(within(strip()).getAllByText(/\$/).length).toBe(8)
  })

  it('carries each seat\'s live standing — a tie shares 1st rather than inventing an order', () => {
    render(<App store={startedGame()} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    // Nobody has moved yet, so both seats hold identical net worth.
    expect(within(strip()).getAllByText('1st')).toHaveLength(2)
  })

  it('opens the full status picture when the strip itself is pressed, and closes again', () => {
    render(<App store={startedGame()} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    expect(screen.queryByRole('dialog', { name: /player status/i })).not.toBeInTheDocument()
    fireEvent.click(strip())

    // The same StatusModal the header button used to open: every seat's
    // complete breakdown, side by side.
    const dialog = screen.getByRole('dialog', { name: /player status/i })
    expect(within(dialog).getAllByText('Net worth')).toHaveLength(2)
    expect(within(dialog).getByLabelText(/ada's status/i)).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/ben's status/i)).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('dialog', { name: /player status/i })).not.toBeInTheDocument()
  })

  // The strip is always on screen and visibly pressable, which made the
  // header's own Status button a second name for the same door — it went
  // rather than leaving two controls doing one job.
  it('is the only way into the status modal — the header button is gone', () => {
    render(<App store={startedGame()} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    expect(screen.queryByRole('button', { name: /^status$/i })).not.toBeInTheDocument()
  })
})

describe('the die stepping aside for the driving car', () => {
  /*
   * The die sits at the centre of the screen, which is exactly where the
   * camera holds the driving car, so mid-move the dock has to step aside —
   * `.dieAside` fades it out and drops its pointer events. The window is
   * sub-second in a real game, which is why it is pinned here rather than
   * screenshotted.
   */
  it('steps the die aside while the car is actually driving', () => {
    const store = startedGame()
    const base = store.getState()
    const dieDockOf = (): HTMLElement =>
      screen.getByRole('button', { name: /^roll/i }).closest('[class*="dieDock"]') as HTMLElement

    const { unmount } = render(
      <App
        store={createStubStore({ ...base, phase: 'awaitingSpin' })}
        audio={createFakeAudioPort()}
        profiles={createInMemoryProfileRepository()}
      />,
    )
    expect(dieDockOf().className).not.toMatch(/dieAside/)
    unmount()

    // Real steps for the board to animate, so nothing settles from under us.
    const moving = { ...base, phase: 'moving' as const, movementPath: [base.players[0]!.spaceId] }
    render(
      <App store={createStubStore(moving)} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />,
    )
    expect(dieDockOf().className).toMatch(/dieAside/)
  })
})

/*
 * The card is for the moment a device physically changes hands, and it used
 * to fire on every human turn regardless — including the turn after a
 * computer seat's, where nobody has moved and there is nothing to hand over.
 * A full-screen modal asking permission to continue at a table where nothing
 * happened is the interruption issue #15 is about.
 */
describe('passing the device', () => {
  /**
   * Walks a real store to the opening of the next turn — the only phase the
   * handoff decision is ever made in — dispatching straight to the store
   * rather than through the UI, so this stays about *which* turn opens and
   * not about how a die is pressed.
   */
  function advanceToNextTurn(store: ReturnType<typeof createGameStore>): void {
    const startedOn = store.getState().currentPlayerIndex
    let guard = 0
    while (guard < 200) {
      const state = store.getState()
      if (state.phase === 'awaitingSpin' && state.currentPlayerIndex !== startedOn) return
      if (awaitsRoll(state.phase)) store.dispatch({ type: 'spin' })
      else if (state.phase === 'moving' || state.phase === 'passingEvent') store.dispatch({ type: 'settle' })
      else if (state.phase === 'awaitingDecision') {
        store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
      } else if (state.phase === 'resolved') store.dispatch({ type: 'endTurn' })
      else return
      guard += 1
    }
  }

  it('announces the opening turn rather than asking for it — nobody has handed anything over yet', () => {
    const store = startedGame([
      { name: 'Ada', color: 'red', isCpu: false },
      { name: 'Ben', color: 'blue', isCpu: false },
    ])
    render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    expect(screen.queryByRole('button', { name: /ready/i })).not.toBeInTheDocument()
    expect(screen.getByText('Ada’s turn')).toBeInTheDocument()
  })

  it('interrupts when the device really does pass from one person to another', async () => {
    const store = startedGame([
      { name: 'Ada', color: 'red', isCpu: false },
      { name: 'Ben', color: 'blue', isCpu: false },
    ])
    render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

    await act(async () => {
      advanceToNextTurn(store)
    })

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

  it('lets a table that wants the beat every turn keep it', () => {
    window.localStorage.setItem('life-journey:handoff-mode', 'always')
    try {
      const store = startedGame([
        { name: 'Ada', color: 'red', isCpu: false },
        { name: 'Ben', color: 'blue', isCpu: false },
      ])
      render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

      // Even the opening turn, which no device changed hands for.
      expect(screen.getByRole('button', { name: /ready/i })).toBeInTheDocument()
    } finally {
      window.localStorage.clear()
    }
  })

  it('offers the preference on the card itself, where a table is already thinking about handoffs', () => {
    window.localStorage.setItem('life-journey:handoff-mode', 'always')
    try {
      const store = startedGame([
        { name: 'Ada', color: 'red', isCpu: false },
        { name: 'Ben', color: 'blue', isCpu: false },
      ])
      render(<App store={store} audio={createFakeAudioPort()} profiles={createInMemoryProfileRepository()} />)

      expect(screen.getByRole('checkbox', { name: /every turn/i })).toBeChecked()
    } finally {
      window.localStorage.clear()
    }
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
