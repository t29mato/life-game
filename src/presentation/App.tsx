import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react'

import type { GameStore } from '@application/GameStore'
import type { AudioPort, BgmTrack } from '@application/ports/AudioPort'
import { AUTOSAVE_SLOT, SAVE_SLOT_COUNT } from '@application/ports/GameRepositoryPort'
import { CPU_THINK_MS, decideCpuCommand } from '@application/cpu/decideCpuCommand'
import { forkRoadNames } from '@application/usecases/branch'
import type { Decision, GamePhase, GameState, NewGameConfig } from '@domain/model/types'
import { spinOriginOf, type SpinOrigin } from '@domain/rules/spin'

import styles from './App.module.css'
import { AssetsModal } from './components/AssetsModal/AssetsModal'
import { AudioToggle } from './components/AudioToggle/AudioToggle'
import { Board } from './components/Board/Board'
import { ChunkyButton } from './components/ChunkyButton/ChunkyButton'
import { DecisionModal } from './components/DecisionModal/DecisionModal'
import { EventCard } from './components/EventCard/EventCard'
import { EventSpinModal } from './components/EventSpinModal/EventSpinModal'
import { GameLog } from './components/GameLog/GameLog'
import { PlayerPanel } from './components/PlayerPanel/PlayerPanel'
import { rankPlayers } from './components/PlayerPanel/rankPlayers'
import { ResultsScreen } from './components/ResultsScreen/ResultsScreen'
import { Spinner } from './components/Spinner/Spinner'
import { TitleScreen } from './components/TitleScreen/TitleScreen'
import { TurnHandoff } from './components/TurnHandoff/TurnHandoff'
import { UpdateBanner } from './components/UpdateBanner/UpdateBanner'
import { AudioProvider } from './hooks/useAudio'
import { useGameState } from './hooks/useGameState'
import { UiIcon } from './icons/ui'

export interface AppProps {
  readonly store: GameStore
  readonly audio: AudioPort
}

const trackForPhase = (phase: string): BgmTrack => {
  if (phase === 'setup') return 'title'
  if (phase === 'gameOver') return 'results'
  return 'board'
}

/**
 * True for a landing that genuinely has nothing to say — a `none`-effect
 * tile with no payday passed on the way there, no life tile, and no reason
 * to cut in with `big`/`milestone` emphasis. A card built from one of these
 * is a "Continue" button in front of a blank sentence, so it never shows;
 * see the `resolved`-phase effect below.
 */
function isEmptyLandingEvent(event: GameState['lastEvent']): boolean {
  if (!event) return false
  return (
    event.moneyDelta === 0 &&
    event.notes.length === 0 &&
    event.lifeTilesGained.length === 0 &&
    event.emphasis === 'normal'
  )
}

/**
 * Phases a computer seat acts in on its own. Movement is driven by the board.
 *
 * `resolved` is deliberately absent when a person is at the table: the computer
 * spins and chooses for itself, but its event card then waits for a human to
 * press Continue, so there is time to read what it just did. With nobody human
 * playing there is nobody to press anything, so an all-computer table keeps
 * dismissing its own cards rather than deadlocking.
 */
const CPU_PHASES_WITH_HUMAN: readonly GamePhase[] = ['awaitingSpin', 'awaitingDecision']
const CPU_PHASES_ALL_COMPUTER: readonly GamePhase[] = ['awaitingSpin', 'awaitingDecision', 'resolved']

const MANUAL_SLOTS = Array.from({ length: SAVE_SLOT_COUNT - 1 }, (_, index) => index + 1)

/**
 * Root component. Owns the play loop — the sequencing between the spinner
 * settling, the pawn finishing its hops, and the store being told to settle —
 * plus the two things only the shell can know: when a computer seat should
 * act, and when the device is being passed to the next person.
 * All game logic lives behind `store.dispatch`.
 */
export function App({ store, audio }: AppProps): ReactElement {
  const state = useGameState(store)
  const [audioUnlocked, setAudioUnlocked] = useState(false)

  // Browsers refuse to start audio until the user has interacted, so the very
  // first gesture anywhere on the page is what opens the audio context.
  useEffect(() => {
    let cancelled = false

    const unlock = (): void => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      void audio.unlock().then(() => {
        if (!cancelled) setAudioUnlocked(true)
      })
    }

    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      cancelled = true
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [audio])

  const track = trackForPhase(state.phase)
  useEffect(() => {
    if (!audioUnlocked) return
    audio.playBgm(track, state.editionId)
  }, [audioUnlocked, track, state.editionId, audio])

  /**
   * The wheel and the pawn must not move at the same time. `spin` commits the
   * whole move to the store immediately, so we hold the board back until the
   * wheel has visibly landed on the number it produced.
   */
  const [wheelSettled, setWheelSettled] = useState(true)

  /*
   * Which wheel is actually turning — the rail's (a movement roll) or the
   * modal's (an event spin) — kept from the moment a press commits the roll
   * until that wheel's own animation calls back, not just while a pending
   * decision names one. `state.pendingDecision` clears the instant `choose`
   * is dispatched, same tick as the roll itself; without this, the event
   * modal would unmount mid-spin; the wheel it was showing would vanish
   * along with it, and it would never get the chance to call back at all.
   */
  const [activeSpin, setActiveSpin] = useState<SpinOrigin | null>(null)

  const handleSpin = useCallback(() => {
    setWheelSettled(false)
    setActiveSpin('movement')
    store.dispatch({ type: 'spin' })
  }, [store])

  const handleSpinComplete = useCallback(() => {
    setWheelSettled(true)
    setActiveSpin(null)
  }, [])

  /**
   * A `none`-effect landing — nothing gained, nothing lost, no payday passed
   * on the way — ends its own turn instead of putting up a card with nothing
   * on it for someone to dismiss. Waits on `wheelSettled` for the same
   * reason the card itself does: `state.lastEvent` is already the empty one
   * before the wheel has visibly stopped.
   *
   * A computer seat's own empty landing is left alone here, deliberately —
   * `cpuActingPhases` below already decides whether a CPU's `resolved` phase
   * advances on its own or waits for a human to press Continue, and a card
   * with nothing on it is not a special case of that rule, just a card. Only
   * ever ends a *human* seat's own turn.
   */
  useEffect(() => {
    if (state.phase !== 'resolved' || !wheelSettled) return
    if (state.players[state.currentPlayerIndex]?.isCpu) return
    if (!isEmptyLandingEvent(state.lastEvent)) return
    store.dispatch({ type: 'endTurn' })
  }, [state.phase, state.lastEvent, state.players, state.currentPlayerIndex, wheelSettled, store])

  /*
   * A movement roll commits its result to `state.players` the instant it is
   * dispatched — `spin()` already knows and has written the destination
   * tile before the wheel has visibly finished turning, same tick as
   * `lastSpin`. `lastEvent` already waits for `wheelSettled` so the result
   * *card* can't spoil itself; the player list was the other half of that
   * promise nobody kept — a debited balance, a new job title, or (worst of
   * all) the board's own "you are here" bracket jumping straight to the
   * destination tile would all give the roll away while the wheel was still
   * spinning towards the number that was supposed to decide it. This
   * freezes what both the rail *and the board* show to whatever was true
   * when the wheel was last settled, and only lets either catch up once
   * `onSpinComplete` says the wheel actually agrees.
   */
  const [displayedPlayers, setDisplayedPlayers] = useState(state.players)
  useEffect(() => {
    if (wheelSettled) setDisplayedPlayers(state.players)
  }, [wheelSettled, state.players])

  /*
   * A value-spin decision with nothing to weigh — the tuition bill, a
   * promotion review, a marriage proposal, career choice — is really just
   * "press Spin", same shape as the ordinary move roll: `spinOriginOf`
   * (domain layer) is what tells the two apart. The tile position means
   * something to a movement roll and nothing to an event spin, which is
   * why an event spin gets the middle of the screen instead of the rail
   * beside the board — see `EventSpinModal`. A decision that also offers a
   * real second option (Stay) still shows the ordinary card, because there
   * is an actual choice to weigh there, not just a wheel to press.
   */
  const singleSpinDecision =
    spinOriginOf(state.phase, state.pendingDecision) === 'event' && state.pendingDecision?.options.length === 1
      ? state.pendingDecision
      : null

  /*
   * The decision `EventSpinModal` shows text for. `state.pendingDecision`
   * clears the instant `choose` is dispatched — same reasoning as
   * `activeSpin` above, and updated the same way, so the modal has
   * something to render from until its own wheel finishes turning.
   */
  const [displayedEventDecision, setDisplayedEventDecision] = useState<Decision | null>(null)
  useEffect(() => {
    if (singleSpinDecision) setDisplayedEventDecision(singleSpinDecision)
  }, [singleSpinDecision])

  const handleValueSpin = useCallback(() => {
    const optionId = singleSpinDecision?.options[0]?.id
    if (!optionId) return
    setWheelSettled(false)
    setActiveSpin('event')
    store.dispatch({ type: 'choose', optionId })
  }, [singleSpinDecision, store])

  const handleMovementComplete = useCallback(() => {
    store.dispatch({ type: 'settle' })
  }, [store])

  /**
   * Safety net: a move committed with an empty `movementPath` gives the board
   * nothing to animate, so it never reports back and the play loop has to hand
   * the move on itself. Roads are now chosen before the wheel, so the board no
   * longer produces this in ordinary play — but if it ever recurs, the failure
   * mode is a silent mid-turn freeze, so the guard stays.
   */
  const settledEmptyMove = useRef<GameState | null>(null)
  useEffect(() => {
    if (state.phase !== 'moving' || !wheelSettled) return
    if (state.movementPath.length > 0) return
    // Guard against re-running for a state we have already passed on: dispatch
    // does not change `state` synchronously, so the effect can re-fire first.
    if (settledEmptyMove.current === state) return
    settledEmptyMove.current = state
    store.dispatch({ type: 'settle' })
  }, [state, wheelSettled, store])

  // --- save slots --------------------------------------------------------
  // `save` does not change the game state, so nothing would re-render on its
  // own; this counter is what refreshes the slot list after a write.
  const [slotsVersion, setSlotsVersion] = useState(0)
  const [saveMenuOpen, setSaveMenuOpen] = useState(false)
  const slots = useMemo(() => {
    void slotsVersion
    return store.slots()
  }, [store, slotsVersion])
  const records = useMemo(() => {
    void state.results
    return store.records()
  }, [store, state.results])

  const handleSave = useCallback(
    (slot: number) => {
      store.dispatch({ type: 'save', slot })
      setSlotsVersion((version) => version + 1)
      setSaveMenuOpen(false)
      audio.playSfx('stamp')
    },
    [store, audio],
  )

  const handleStart = useCallback(
    (config: NewGameConfig) => store.dispatch({ type: 'startGame', config }),
    [store],
  )

  const handleContinue = useCallback((slot: number) => store.dispatch({ type: 'load', slot }), [store])

  // --- turn handoff ------------------------------------------------------
  // Everyone shares one screen, so a person can easily miss that it became
  // their turn. Only worth interrupting for when more than one seat is human.
  const activePlayer = state.players[state.currentPlayerIndex]
  const humanSeats = state.players.filter((player) => !player.isCpu).length
  const turnKey = activePlayer ? `${state.turn}:${activePlayer.id}` : null
  const [handoffAcknowledged, setHandoffAcknowledged] = useState<string | null>(null)
  /*
   * Every turn opens on the wheel now, fork or not — see `branch.ts` for why
   * a fork stopped needing its own decision screen. This used to also cover
   * `awaitingDecision` for a player standing on a fork; that branch decision
   * no longer exists in the live path (`turnStart` never raises one), so the
   * only phase a turn opens on is `awaitingSpin`.
   */
  const startingTurn = state.phase === 'awaitingSpin'

  const handoffVisible =
    humanSeats >= 2 &&
    startingTurn &&
    activePlayer !== undefined &&
    !activePlayer.isCpu &&
    handoffAcknowledged !== turnKey

  const handleHandoffReady = useCallback(() => setHandoffAcknowledged(turnKey), [turnKey])

  // Visible for the whole life of the wheel it owns — from the moment the
  // decision names the stakes through the animation `handleValueSpin` sets
  // off, which is why this checks `activeSpin` too and not just the (by
  // then already-cleared) decision. See the comment by `activeSpin` above.
  const eventSpinVisible = (singleSpinDecision !== null || activeSpin === 'event') && !handoffVisible

  // --- live standings ----------------------------------------------------
  // Tie-aware, and priced at this game's difficulty: a harder game settles
  // loans at a steeper rate, so leaving difficulty out can rank two players
  // holding different numbers of loans in the wrong order.
  const standings = useMemo(
    () => rankPlayers(displayedPlayers, state.difficulty),
    [displayedPlayers, state.difficulty],
  )

  // --- computer seats ----------------------------------------------------
  // A computer seat pulls the same levers a person does, on a delay, so the
  // table can follow what it did. The spin goes through the wheel rather than
  // straight to the store, so its turn looks identical to a human's.
  const [autoSpinToken, setAutoSpinToken] = useState(0)
  const cpuActingPhases = humanSeats > 0 ? CPU_PHASES_WITH_HUMAN : CPU_PHASES_ALL_COMPUTER
  useEffect(() => {
    if (!activePlayer?.isCpu) return
    if (!wheelSettled || handoffVisible) return
    if (!cpuActingPhases.includes(state.phase)) return

    const timer = window.setTimeout(() => {
      // A single-option value spin is "press Spin" with nothing to weigh, so
      // a computer seat takes it through the same visible wheel a person
      // would rather than the number simply appearing — same reasoning as
      // the ordinary move roll just below.
      if (state.phase === 'awaitingSpin' || singleSpinDecision) {
        setAutoSpinToken((token) => token + 1)
        return
      }
      const command = decideCpuCommand(store.getState())
      if (command) store.dispatch(command)
    }, CPU_THINK_MS[state.phase as 'awaitingSpin' | 'awaitingDecision' | 'resolved'])

    return () => window.clearTimeout(timer)
  }, [state, activePlayer, wheelSettled, handoffVisible, store, cpuActingPhases, singleSpinDecision])

  /*
   * The wheel sits in the rail on the far side of a wide desktop screen from
   * wherever a player's cursor actually is — the owner asked for a way to
   * spin without a long mouse trip every time. Space presses the wheel from
   * anywhere on the page. It backs off the moment focus is already on some
   * other control, so it can never double-fire alongside that control's own
   * native Enter/Space handling (the wheel's own button included) and never
   * eats a Space a player meant for typing.
   *
   * Routed through `autoSpinToken` — the same trigger the computer seat
   * uses — rather than calling `handleSpin`/`handleValueSpin` directly.
   * Those are the *store* side of a press; the wheel's own `handleSpin`
   * (inside `Spinner`) is what actually arms the animation before calling
   * them. Calling them straight from here skipped that arming step
   * entirely: the store still committed the roll, but the wheel had never
   * been told to expect a result, so it never animated, never reported
   * back, and sat disabled for the rest of the game. `autoSpinToken` goes
   * through the real button-press path, so it can't skip that step again.
   */
  const spinReady = (state.phase === 'awaitingSpin' || singleSpinDecision) && !handoffVisible && !activePlayer?.isCpu

  /*
   * The rail names a fork's two roads before the press that settles one —
   * see `forkRoadNames` in `branch.ts` for why this exists at all. Gated the
   * same way `spinReady` is: no point naming a road nobody standing here is
   * about to press for (a CPU seat, mid-handoff, or a spin already spent).
   */
  const forkAhead =
    state.phase === 'awaitingSpin' && !handoffVisible && activePlayer && !activePlayer.isCpu
      ? forkRoadNames(state.board, activePlayer.spaceId)
      : undefined
  useEffect(() => {
    if (!spinReady) return
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== ' ') return
      const active = document.activeElement
      const focusedControl =
        active instanceof HTMLElement &&
        (active.tagName === 'BUTTON' ||
          active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          active.tagName === 'A' ||
          active.isContentEditable)
      if (focusedControl) return
      event.preventDefault()
      setAutoSpinToken((token) => token + 1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [spinReady])

  // --- game log drawer ---------------------------------------------------
  // The scrolling feed is rarely needed mid-turn, so it stays off screen and
  // its space belongs to the board; a header control summons it as a drawer.
  const [logOpen, setLogOpen] = useState(false)
  useEffect(() => {
    if (!logOpen) return
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setLogOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [logOpen])

  // --- assets modal --------------------------------------------------------
  // The sidebar's own cards already carry every one of these numbers, but
  // shrink further with every seat added and hide net worth's own breakdown
  // behind a hover tooltip — no help at all on a phone. A header control
  // opens the same figures at a size meant to actually be read.
  const [assetsOpen, setAssetsOpen] = useState(false)

  // --- opening camera sweep ----------------------------------------------
  const [introPending, setIntroPending] = useState(false)
  const previousPhase = useRef<GamePhase>(state.phase)
  useEffect(() => {
    // The sweep fires on leaving setup, whatever phase a game opens on.
    if (previousPhase.current === 'setup' && state.phase !== 'setup') setIntroPending(true)
    if (state.phase === 'moving') setIntroPending(false)
    previousPhase.current = state.phase
  }, [state.phase])

  if (state.phase === 'setup') {
    return (
      <AudioProvider audio={audio}>
        <TitleScreen slots={slots} records={records} onStart={handleStart} onContinue={handleContinue} />
        <UpdateBanner />
      </AudioProvider>
    )
  }

  if (state.phase === 'gameOver') {
    return (
      <AudioProvider audio={audio}>
        <ResultsScreen
          results={state.results!}
          records={records}
          editionId={state.editionId}
          onPlayAgain={() => store.dispatch({ type: 'reset' })}
        />
        <UpdateBanner />
      </AudioProvider>
    )
  }

  // The turn badge is keyed to the active player's colour — whose turn it is
  // should be readable from across the room, before any text is parsed.
  const turnColor = activePlayer?.color ?? 'purple'
  const turnStyle = {
    '--turn-base': `var(--player-${turnColor})`,
    '--turn-light': `var(--player-${turnColor}-light)`,
    '--turn-dark': `var(--player-${turnColor}-dark)`,
  } as CSSProperties

  return (
    <AudioProvider audio={audio}>
      <div className={styles.shell}>
        <header className={styles.topBar}>
          <div className={styles.brand}>
            <span className={styles.emblem} aria-hidden="true">
              <UiIcon name="dice" size={19} className={styles.emblemGlyph} />
            </span>
            <h1 className={styles.wordmark}>
              <span className={styles.wordmarkLife}>LIFE</span>
              <span className={styles.wordmarkJourney}>JOURNEY</span>
            </h1>
          </div>

          <div className={styles.turnBadge} style={turnStyle}>
            <span className={styles.turnPip} aria-hidden="true">
              {activePlayer?.name.charAt(0).toUpperCase() ?? '?'}
            </span>
            <p className={styles.turnText} aria-live="polite">
              <span className={styles.turnLabel}>
                Turn {state.turn}
                {activePlayer?.isCpu ? ' · Computer' : ''}
              </span>
              <span className={styles.turnPlayer}>{activePlayer?.name ?? '—'}&rsquo;s move</span>
            </p>
          </div>

          <div className={styles.topActions}>
            <AudioToggle />
            <ChunkyButton
              variant="secondary"
              size="sm"
              icon="wallet"
              aria-haspopup="dialog"
              onClick={() => setAssetsOpen(true)}
            >
              <span className={styles.btnLabel}>Assets</span>
            </ChunkyButton>
            <ChunkyButton
              variant="secondary"
              size="sm"
              icon="folder"
              aria-expanded={logOpen}
              aria-controls="game-log-drawer"
              onClick={() => setLogOpen((open) => !open)}
            >
              <span className={styles.btnLabel}>Log</span>
            </ChunkyButton>
            <div className={styles.saveMenuAnchor}>
              <ChunkyButton
                variant="secondary"
                size="sm"
                icon="save"
                aria-expanded={saveMenuOpen}
                aria-haspopup="menu"
                onClick={() => setSaveMenuOpen((open) => !open)}
              >
                <span className={styles.btnLabel}>Save</span>
              </ChunkyButton>
              {saveMenuOpen && (
                <div className={styles.saveMenu} role="menu" aria-label="Choose a save slot">
                  {MANUAL_SLOTS.map((slot) => {
                    const info = slots.find((entry) => entry.slot === slot)
                    return (
                      <button
                        key={slot}
                        type="button"
                        role="menuitem"
                        className={styles.saveSlot}
                        onClick={() => handleSave(slot)}
                      >
                        <span className={styles.saveSlotName}>Slot {slot}</span>
                        <span className={styles.saveSlotDetail}>
                          {info?.occupied
                            ? `Turn ${info.turn ?? '?'} · ${info.playerNames.join(', ')}`
                            : 'Empty'}
                        </span>
                      </button>
                    )
                  })}
                  <p className={styles.saveHint}>
                    Your game autosaves to slot {AUTOSAVE_SLOT} after every turn.
                  </p>
                </div>
              )}
            </div>
            <ChunkyButton
              variant="ghost"
              size="sm"
              icon="exit"
              onClick={() => store.dispatch({ type: 'reset' })}
            >
              <span className={styles.btnLabel}>Quit</span>
            </ChunkyButton>
          </div>
        </header>

        <main className={styles.main}>
          <section className={styles.boardArea} aria-label="Game board">
            <Board
              board={state.board}
              players={displayedPlayers}
              currentPlayerIndex={state.currentPlayerIndex}
              phase={state.phase}
              movementPath={wheelSettled ? state.movementPath : []}
              onMovementComplete={handleMovementComplete}
              introFlythrough={introPending}
              editionId={state.editionId}
            />
          </section>

          {/* One rail: the wheel on top, every seat beneath it. The players
              moved off the board's other flank so the board could take that
              width — see `.main` in App.module.css. */}
          <aside className={styles.controlRail} aria-label="Spinner and players">
            {/* The rail's wheel is the movement roll now and only the
                movement roll — an event spin gets its own wheel, front and
                centre, in `EventSpinModal` below. `aria-hidden` while that
                modal is up: this one is inert then (disabled, and correctly
                so — there is nothing to move yet), and left findable it is
                a second button named "Spin" a keyboard or screen-reader
                user would run into for no reason, on top of being a second
                match for anything that queries the page by that name. */}
            {forkAhead && !eventSpinVisible && (
              <p className={styles.forkAhead} role="status">
                This spin decides your road too — 1-5: {forkAhead[0]}, 6-10: {forkAhead[1]}.
              </p>
            )}
            <div className={styles.spinnerCard} aria-hidden={eventSpinVisible || undefined}>
              <Spinner
                result={state.lastSpin}
                disabled={state.phase !== 'awaitingSpin' || handoffVisible}
                onSpin={handleSpin}
                onSpinComplete={handleSpinComplete}
                autoSpinToken={autoSpinToken}
                compact
              />
            </div>

            <section className={styles.playersBlock} aria-labelledby="players-heading">
              <h2 className={styles.blockLabel} id="players-heading">
                Players
              </h2>
              <div className={styles.players}>
                {displayedPlayers.map((player, index) => (
                  <PlayerPanel
                    key={player.id}
                    difficulty={state.difficulty}
                    editionId={state.editionId}
                    player={player}
                    isActive={index === state.currentPlayerIndex}
                    compact={displayedPlayers.length > 2}
                    dense={displayedPlayers.length > 3}
                    rank={standings.get(player.id)?.rank ?? displayedPlayers.length}
                  />
                ))}
              </div>
            </section>
          </aside>
        </main>

        {/* What the feed would have said still reaches assistive tech while
            the drawer is closed; the drawer carries its own live list when
            open, so this announcer stands down to avoid double-speaking. */}
        {!logOpen && (
          <div className="visually-hidden" aria-live="polite">
            {state.log.length > 0 ? state.log[state.log.length - 1]?.message : ''}
          </div>
        )}

        {logOpen && (
          <div className={styles.logDrawer} id="game-log-drawer">
            <div className={styles.logDrawerBar}>
              <ChunkyButton variant="secondary" size="sm" icon="exit" onClick={() => setLogOpen(false)}>
                Close
              </ChunkyButton>
            </div>
            <GameLog entries={state.log} />
          </div>
        )}

        {assetsOpen && (
          <AssetsModal
            players={state.players}
            activePlayerId={activePlayer?.id}
            difficulty={state.difficulty}
            editionId={state.editionId}
            onClose={() => setAssetsOpen(false)}
          />
        )}

        {state.phase === 'awaitingDecision' && state.pendingDecision && !handoffVisible && !singleSpinDecision && (
          <DecisionModal
            decision={state.pendingDecision}
            board={state.board}
            // A computer seat is shown the same card, but it must never look
            // like it is waiting for a person: it answers itself on a timer.
            isCpu={activePlayer?.isCpu === true}
            cpuPlayerName={activePlayer?.name ?? ''}
            onChoose={(optionId) => store.dispatch({ type: 'choose', optionId })}
          />
        )}

        {/* An event spin's own wheel — tuition, a promotion review, a
            marriage proposal, career choice. The tile position has nothing
            to do with any of these, so unlike the movement roll this one
            gets the middle of the screen, not the rail beside the board. */}
        {eventSpinVisible && displayedEventDecision && (
          <EventSpinModal
            decision={displayedEventDecision}
            result={state.lastSpin}
            onSpin={handleValueSpin}
            onSpinComplete={handleSpinComplete}
            autoSpinToken={autoSpinToken}
          />
        )}

        {/* A value spin's own result waits for `wheelSettled` too — same as
            the ordinary move roll — so the card never appears before the
            wheel the player just spun has actually finished turning. A
            *human* seat's empty `none`-effect landing never appears at all
            — the effect above ends that turn on its own — this guard is
            only what keeps it from flashing on screen for the one render in
            between. A computer seat's own empty landing still shows and
            still waits on Continue like any other of its cards: nothing
            else is left to end that turn while a human is at the table. */}
        {state.phase === 'resolved' &&
          state.lastEvent &&
          wheelSettled &&
          !(isEmptyLandingEvent(state.lastEvent) && !activePlayer?.isCpu) && (
            <EventCard
              event={state.lastEvent}
              editionId={state.editionId}
              onDismiss={() => store.dispatch({ type: 'endTurn' })}
            />
          )}

        {handoffVisible && activePlayer && (
          <TurnHandoff
            player={activePlayer}
            turn={state.turn}
            rank={standings.get(activePlayer.id)?.rank ?? state.players.length}
            totalPlayers={state.players.length}
            onReady={handleHandoffReady}
          />
        )}
      </div>
      <UpdateBanner />
    </AudioProvider>
  )
}
