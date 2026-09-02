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
import type { PlayerProfileRepositoryPort } from '@application/ports/PlayerProfileRepositoryPort'
import { CPU_THINK_MS, decideCpuCommand } from '@application/cpu/decideCpuCommand'
import { forkRoadNames, roadName } from '@application/usecases/branch'
import { describeScoreRoll, nextScoreRoll } from '@application/usecases/settlement'
import type {
  Decision,
  DecisionOption,
  GamePhase,
  GameState,
  LandingEvent,
  NewGameConfig,
  RollTableRow,
  ScoreRoll,
} from '@domain/model/types'
import { spinOriginOf, type SpinOrigin } from '@domain/rules/spin'

import styles from './App.module.css'
import { StatusModal } from './components/StatusModal/StatusModal'
import { SettingsSheet } from './components/SettingsSheet/SettingsSheet'
import { Board } from './components/Board/Board'
import { ChunkyButton } from './components/ChunkyButton/ChunkyButton'
import { DecisionModal } from './components/DecisionModal/DecisionModal'
import { EventCard } from './components/EventCard/EventCard'
import { EventSpinModal } from './components/EventSpinModal/EventSpinModal'
import { GameLog } from './components/GameLog/GameLog'
import { rankPlayers } from '@domain/rules/standing'
import { PlayerStrip } from './components/PlayerStrip/PlayerStrip'
import { ResultsScreen } from './components/ResultsScreen/ResultsScreen'
import { Dice } from './components/Dice/Dice'
import { MoveCounter } from './components/MoveCounter/MoveCounter'
import { TitleScreen } from './components/TitleScreen/TitleScreen'
import { TurnHandoff } from './components/TurnHandoff/TurnHandoff'
import { UpdateBanner } from './components/UpdateBanner/UpdateBanner'
import { AudioProvider } from './hooks/useAudio'
import { useGameState } from './hooks/useGameState'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'
import { UiIcon } from './icons/ui'

export interface AppProps {
  readonly store: GameStore
  readonly audio: AudioPort
  readonly profiles: PlayerProfileRepositoryPort
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
const CPU_PHASES_WITH_HUMAN: readonly GamePhase[] = [
  'awaitingSpin',
  'awaitingDistanceSpin',
  'awaitingDecision',
]
const CPU_PHASES_ALL_COMPUTER: readonly GamePhase[] = [
  'awaitingSpin',
  'awaitingDistanceSpin',
  'awaitingDecision',
  'resolved',
  'passingEvent',
]

/** Both presses a fork asks for: the road, then how far down it. */
const SPIN_PHASES: readonly GamePhase[] = ['awaitingSpin', 'awaitingDistanceSpin']

/**
 * Everything `EventSpinModal` needs to put a die on screen, plus the answer
 * the press behind it will dispatch. A decision reaches the die by two roads
 * — as its only option, or as the one option on a card that picked it — and
 * this is what makes them the same thing from the modal's side.
 */
interface EventSpinRequest {
  readonly optionId: string
  readonly prompt: string
  readonly stakes: string
  readonly table?: readonly RollTableRow[]
}

function spinRequestFor(decision: Decision, option: DecisionOption | undefined): EventSpinRequest | null {
  if (!option) return null
  return {
    optionId: option.id,
    prompt: decision.prompt,
    stakes: option.description || decision.prompt,
    // `exactOptionalPropertyTypes`: an explicit `undefined` is not the same
    // thing as the key being absent, and most rolls have nothing to tabulate.
    ...(option.table === undefined ? {} : { table: option.table }),
  }
}

const MANUAL_SLOTS = Array.from({ length: SAVE_SLOT_COUNT - 1 }, (_, index) => index + 1)

/**
 * The result behind a tile only driven past is already decided the instant
 * it is swept — `applyPassedEvent` rolled it before this modal ever
 * mounted — so a press here never dispatches anything new, unlike an
 * ordinary roll's `onSpin`. It only starts the animation that shows the
 * player (or, for a computer seat, throws itself) the number already on
 * the books. See `passedSpinVisible`.
 */
const noPress = (): void => {}

/**
 * Root component. Owns the play loop — the sequencing between the die
 * settling, the pawn finishing its hops, and the store being told to settle —
 * plus the two things only the shell can know: when a computer seat should
 * act, and when the device is being passed to the next person.
 * All game logic lives behind `store.dispatch`.
 */
export function App({ store, audio, profiles }: AppProps): ReactElement {
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
   * The die and the pawn must not move at the same time. `spin` commits the
   * whole move to the store immediately, so we hold the board back until the
   * die has visibly landed on the number it produced.
   */
  const [dieSettled, setDieSettled] = useState(true)

  /*
   * Which die is actually rolling — the board's dock (a movement roll) or the
   * modal's (an event roll) — kept from the moment a press commits the roll
   * until that die's own animation calls back, not just while a pending
   * decision names one. `state.pendingDecision` clears the instant `choose`
   * is dispatched, same tick as the roll itself; without this, the event
   * modal would unmount mid-roll; the die it was showing would vanish
   * along with it, and it would never get the chance to call back at all.
   */
  const [activeSpin, setActiveSpin] = useState<SpinOrigin | null>(null)

  const handleSpin = useCallback(() => {
    setDieSettled(false)
    setActiveSpin('movement')
    store.dispatch({ type: 'spin' })
  }, [store])

  const handleSpinComplete = useCallback(() => {
    setDieSettled(true)
    setActiveSpin(null)
  }, [])

  const reduceMotion = usePrefersReducedMotion()

  /*
   * The roll behind a tile the move only *swept past*, put back on screen.
   *
   * A tile the pawn stops on has never had this problem: its die goes up in
   * `EventSpinModal`, somebody watches it land, and only then does a card
   * exist to read. A tile crossed mid-move has no press to hang that on, so
   * `applyPassedEvent` rolls for it and hands over a finished card — and the
   * only trace of the die was the "Rolled a 3." line written on it, a fact
   * about something the player never saw happen. They said so. So the die is
   * thrown here first, on the number the outcome already used (nothing is
   * re-rolled and nothing is re-decided — see `LandingEvent.rolled`), and
   * the card becomes readable only once it has landed.
   *
   * Tracked by the card's own identity rather than by a flag: `settle`
   * builds a fresh `LandingEvent` for every item it drains off the queue, so
   * two tiles that happened to roll the same number still get a die each.
   * Reduced motion skips the whole step — the card simply arrives complete,
   * the same bargain `Dice`, `Pawn` and `Board` all strike.
   */
  const [watchedPassedEvent, setWatchedPassedEvent] = useState<LandingEvent | null>(null)
  const passedEvent = state.phase === 'passingEvent' ? state.activePassedEvent : null
  const passedRoll = passedEvent?.rolled ?? null
  const passedSpinVisible = passedRoll !== null && passedEvent !== watchedPassedEvent && !reduceMotion
  /*
   * Read through a ref, so the callback identity never changes and what it
   * marks is always the card actually on screen. `Dice` captures its
   * `onRollComplete` when it arms and calls that same closure when the die
   * lands; a callback that closed over a card the shell has since replaced
   * would tick off the wrong one, leave this one's die spinning forever and
   * take the whole turn loop with it. Board's own movement effect reads its
   * parent callbacks the same way and for the same reason.
   */
  const passedEventRef = useRef(passedEvent)
  passedEventRef.current = passedEvent
  const handlePassedSpinComplete = useCallback(() => setWatchedPassedEvent(passedEventRef.current), [])

  /*
   * How far the active car still has to travel, reported by the board as
   * each hop lands and cleared when the next turn opens. Held here rather
   * than inside `Board` because the counter is drawn in the dock alongside
   * the die, not on the map — see `.rollDock` in App.module.css.
   */
  const [spacesLeft, setSpacesLeft] = useState<number | null>(null)

  /**
   * A `none`-effect landing — nothing gained, nothing lost, no payday passed
   * on the way — ends its own turn instead of putting up a card with nothing
   * on it for someone to dismiss. Waits on `dieSettled` for the same
   * reason the card itself does: `state.lastEvent` is already the empty one
   * before the die has visibly stopped.
   *
   * A computer seat's own empty landing is left alone here, deliberately —
   * `cpuActingPhases` below already decides whether a CPU's `resolved` phase
   * advances on its own or waits for a human to press Continue, and a card
   * with nothing on it is not a special case of that rule, just a card. Only
   * ever ends a *human* seat's own turn.
   */
  useEffect(() => {
    if (state.phase !== 'resolved' || !dieSettled) return
    if (state.players[state.currentPlayerIndex]?.isCpu) return
    if (!isEmptyLandingEvent(state.lastEvent)) return
    store.dispatch({ type: 'endTurn' })
  }, [state.phase, state.lastEvent, state.players, state.currentPlayerIndex, dieSettled, store])

  /*
   * A movement roll commits its result to `state.players` the instant it is
   * dispatched — `spin()` already knows and has written the destination
   * tile before the die has visibly finished rolling, same tick as
   * `lastSpin`. `lastEvent` already waits for `dieSettled` so the result
   * *card* can't spoil itself; the player list was the other half of that
   * promise nobody kept — a debited balance, a new job title, or (worst of
   * all) the board's own "you are here" bracket jumping straight to the
   * destination tile would all give the roll away while the die was still
   * tumbling towards the number that was supposed to decide it. This
   * freezes what both the rail *and the board* show to whatever was true
   * when the die was last settled, and only lets either catch up once
   * `handleSpinComplete` says the die actually agrees.
   *
   * A swept-past tile's replayed roll is held back the same way and for the
   * identical reason: `applyPassedEvent` has already banked the money by the
   * time that die goes up, and a balance that jumps while it is still
   * tumbling gives away the number it is tumbling towards.
   */
  const [displayedPlayers, setDisplayedPlayers] = useState(state.players)
  useEffect(() => {
    if (dieSettled && !passedSpinVisible) setDisplayedPlayers(state.players)
  }, [dieSettled, passedSpinVisible, state.players])

  /*
   * A value-spin decision with nothing to weigh — the tuition bill, a
   * promotion review, a marriage proposal, career choice — is really just
   * "press Spin", same shape as the ordinary move roll: `spinOriginOf`
   * (domain layer) is what tells the two apart. The tile position means
   * something to a movement roll and nothing to an event spin, which is
   * why an event spin gets the middle of the screen instead of the rail
   * beside the board — see `EventSpinModal`. A decision that also offers a
   * real second option (Stay) still shows the ordinary card, because there
   * is an actual choice to weigh there, not just a die to press.
   */
  const singleSpinDecision =
    spinOriginOf(state.phase, state.pendingDecision) === 'event' && state.pendingDecision?.options.length === 1
      ? state.pendingDecision
      : null

  /*
   * The other way a decision asks for the die, and the one that kept
   * going wrong.
   *
   * A card with a second option to weigh keeps its card — "Roll" beside
   * "Stay as a Stylist" at the career fair, "Call it a life" beside "Keep
   * working" at The Number — but answering with the *first* of those still
   * turns the die, and `choose` resolves that roll in the very same tick it
   * is dispatched. Dispatching straight from the card therefore jumped to a
   * finished result stamped "Rolled 6", with no die ever on screen: reported
   * twice, on two different tiles, as the game rolling behind the player's
   * back.
   *
   * So an option that says it turns the die (`DecisionOption.turnsTheDie`,
   * which the domain marks because only the domain can know) does not
   * dispatch anything when it is picked. It parks the answer here, the card
   * gives way to the die, and it is the *press on the die* that dispatches —
   * exactly the shape a single-option value spin has always had. The card
   * asks whether to gamble; the die is the gamble.
   */
  const [chosenDieOptionId, setChosenDieOptionId] = useState<string | null>(null)
  const chosenDieOption =
    state.phase === 'awaitingDecision' && chosenDieOptionId
      ? (state.pendingDecision?.options.find((option) => option.id === chosenDieOptionId) ?? null)
      : null

  /*
   * What the die on screen is being thrown for, whichever way it was asked
   * for. `state.pendingDecision` clears the instant `choose` is dispatched —
   * same reasoning as `activeSpin` above — so this is latched below into
   * something the modal can still render from while its die finishes.
   *
   * Memoised because it is a freshly built object and two things downstream
   * key off its identity: the latch below, which would otherwise set state on
   * every render and spin the component forever, and the computer seat's own
   * timer, which would otherwise be cancelled and restarted just as often.
   * Everything it is built from comes straight off the store, so a stable
   * state gives a stable request.
   */
  const eventSpinRequest = useMemo<EventSpinRequest | null>(() => {
    if (singleSpinDecision) return spinRequestFor(singleSpinDecision, singleSpinDecision.options[0])
    if (chosenDieOption && state.pendingDecision) {
      return spinRequestFor(state.pendingDecision, chosenDieOption)
    }
    return null
  }, [singleSpinDecision, chosenDieOption, state.pendingDecision])

  const [displayedEventSpin, setDisplayedEventSpin] = useState<EventSpinRequest | null>(null)
  useEffect(() => {
    if (eventSpinRequest) setDisplayedEventSpin(eventSpinRequest)
  }, [eventSpinRequest])

  const handleValueSpin = useCallback(() => {
    const optionId = eventSpinRequest?.optionId
    if (!optionId) return
    setDieSettled(false)
    setActiveSpin('event')
    store.dispatch({ type: 'choose', optionId })
  }, [eventSpinRequest, store])

  /*
   * An answer picked off a decision card. Only the ones that turn the die
   * are held back for it; everything else — a decline, a house at a listed
   * price, a road at a fork — is settled by the answer itself and goes
   * straight to the store, exactly as it always did.
   */
  const handleDecisionChoose = useCallback(
    (optionId: string) => {
      const option = store.getState().pendingDecision?.options.find((entry) => entry.id === optionId)
      if (option?.turnsTheDie) {
        setChosenDieOptionId(optionId)
        return
      }
      store.dispatch({ type: 'choose', optionId })
    },
    [store],
  )

  // The parked answer is spent the moment the roll it armed is dispatched:
  // `choose` clears `pendingDecision`, and the modal keeps rendering from
  // `displayedEventSpin` until its die has landed.
  useEffect(() => {
    if (!state.pendingDecision) setChosenDieOptionId(null)
  }, [state.pendingDecision])

  /*
   * --- the closing settlement --------------------------------------------
   *
   * The last stretch of the game, and the one that had no die in it at all.
   * Every house sale and every share cash-out used to be settled inside
   * `endTurn`, synchronously, in the tick the last player retired — the
   * player met a finished results screen having pressed nothing, told a
   * house had "sold for" a number no die in the game could have produced.
   * That is the same complaint, on the same grounds, as the decision-card
   * roll fixed just before this, so it is fixed the same way: nothing is
   * decided until a die is pressed, and the die is the thing that decides it.
   *
   * The queue lives in the store (`state.scoreRolls`); this is only the
   * shell's side of it — which one is currently on screen, and the press
   * that dispatches the next throw.
   */
  const activeScoreRoll = state.phase === 'scoring' ? nextScoreRoll(state.scoreRolls) : null
  /*
   * The die on screen, latched the way `displayedEventSpin` is latched and
   * for the identical reason: `scoreRoll` advances the queue in the very tick
   * it is dispatched, so the card would otherwise change to the *next*
   * holding while the die deciding this one is still in the air — and, on the
   * last throw of all, vanish outright as the phase moves to `gameOver`. It
   * only ever moves on once `dieSettled` says the die it is showing has
   * actually landed, which is also what holds the results screen back below.
   */
  const [displayedScoreRoll, setDisplayedScoreRoll] = useState<ScoreRoll | null>(null)
  useEffect(() => {
    if (dieSettled) setDisplayedScoreRoll(activeScoreRoll)
  }, [activeScoreRoll, dieSettled])

  // Whose holding it is, what is riding on it, and the six-band ladder the
  // die will be read off — published before the throw, so the number that
  // comes up is one the player was already hoping for or dreading.
  const scoreRollPrompt = useMemo(
    () => (displayedScoreRoll ? describeScoreRoll(state, displayedScoreRoll) : null),
    [state, displayedScoreRoll],
  )

  /*
   * Armed exactly like `handleValueSpin`: `dieSettled` goes down *before* the
   * dispatch, so the shell knows a die is owed from the same tick the store
   * resolves it. `activeSpin` is deliberately left alone — that flag is what
   * keeps `EventSpinModal` mounted for a *decision's* die, and this modal is
   * held up by `displayedScoreRoll` instead.
   */
  const handleScoreRoll = useCallback(() => {
    setDieSettled(false)
    store.dispatch({ type: 'scoreRoll' })
  }, [store])

  const handleMovementComplete = useCallback(() => {
    store.dispatch({ type: 'settle' })
  }, [store])

  /**
   * Safety net: a move committed with an empty `movementPath` gives the board
   * nothing to animate, so it never reports back and the play loop has to hand
   * the move on itself. Roads are now chosen by the roll itself, so the board no
   * longer produces this in ordinary play — but if it ever recurs, the failure
   * mode is a silent mid-turn freeze, so the guard stays.
   */
  const settledEmptyMove = useRef<GameState | null>(null)
  useEffect(() => {
    if (state.phase !== 'moving' || !dieSettled) return
    if (state.movementPath.length > 0) return
    // Guard against re-running for a state we have already passed on: dispatch
    // does not change `state` synchronously, so the effect can re-fire first.
    if (settledEmptyMove.current === state) return
    settledEmptyMove.current = state
    store.dispatch({ type: 'settle' })
  }, [state, dieSettled, store])

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
    (config: NewGameConfig) => {
      // Every *human* seat is remembered for next time — a computer seat has
      // no owner to remember. Done here rather than inside TitleScreen so
      // the screen stays a presentation component that receives data and
      // callbacks, never a port.
      for (const player of config.players) {
        if (player.isCpu) continue
        profiles.upsert({
          name: player.name,
          color: player.color,
        })
      }
      store.dispatch({ type: 'startGame', config })
    },
    [store, profiles],
  )

  // Read fresh whenever the phase moves: coming back to the title screen is
  // exactly when the list has just grown by whoever started the last game.
  const savedProfiles = useMemo(() => {
    void state.phase
    return profiles.list()
  }, [profiles, state.phase])

  const handleContinue = useCallback((slot: number) => store.dispatch({ type: 'load', slot }), [store])

  // --- turn handoff ------------------------------------------------------
  // Everyone shares one screen, so a person can easily miss that it became
  // their turn. Only worth interrupting for when more than one seat is human.
  const activePlayer = state.players[state.currentPlayerIndex]
  const humanSeats = state.players.filter((player) => !player.isCpu).length
  const turnKey = activePlayer ? `${state.turn}:${activePlayer.id}` : null
  const [handoffAcknowledged, setHandoffAcknowledged] = useState<string | null>(null)
  /*
   * Every turn opens on the die now, fork or not — see `branch.ts` for why
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

  // Visible for the whole life of the die it owns — from the moment the
  // decision names the stakes through the animation `handleValueSpin` sets
  // off, which is why this checks `activeSpin` too and not just the (by
  // then already-cleared) decision. See the comment by `activeSpin` above.
  const eventSpinVisible = (eventSpinRequest !== null || activeSpin === 'event') && !handoffVisible

  // --- live standings ----------------------------------------------------
  // Tie-aware, and priced at this game's difficulty and edition: a harder
  // game settles loans at a steeper rate and each edition prices its own
  // economy, so leaving either out can rank two players holding different
  // numbers of loans in the wrong order.
  const standings = useMemo(
    () => rankPlayers(displayedPlayers, state.difficulty, state.editionId),
    [displayedPlayers, state.difficulty, state.editionId],
  )

  // --- computer seats ----------------------------------------------------
  // A computer seat pulls the same levers a person does, on a delay, so the
  // table can follow what it did. The roll goes through the die rather than
  // straight to the store, so its turn looks identical to a human's.
  const [autoSpinToken, setAutoSpinToken] = useState(0)
  const cpuActingPhases = humanSeats > 0 ? CPU_PHASES_WITH_HUMAN : CPU_PHASES_ALL_COMPUTER
  useEffect(() => {
    if (!activePlayer?.isCpu) return
    // A swept-past tile's own die is still in the air. An all-computer table
    // dismisses its own cards, and left to its timer it would dismiss this
    // one out from under the roll it exists to show.
    if (!dieSettled || handoffVisible || passedSpinVisible) return
    if (!cpuActingPhases.includes(state.phase)) return

    const timer = window.setTimeout(() => {
      // A value spin is "press Spin" with nothing left to weigh, so a
      // computer seat takes it through the same visible die a person would
      // rather than the number simply appearing — same reasoning as the
      // ordinary move roll just below.
      if (SPIN_PHASES.includes(state.phase) || eventSpinRequest) {
        setAutoSpinToken((token) => token + 1)
        return
      }
      const command = decideCpuCommand(store.getState())
      if (!command) return
      // An answer that turns the die is parked rather than dispatched, for a
      // computer seat exactly as for a person: the effect runs again, finds
      // an `eventSpinRequest` waiting, and throws the die above. Without
      // this a computer's own career fair or early retirement would resolve
      // with nothing on screen — the very thing the human path just fixed.
      if (command.type === 'choose') {
        handleDecisionChoose(command.optionId)
        return
      }
      store.dispatch(command)
    }, CPU_THINK_MS[state.phase as keyof typeof CPU_THINK_MS])

    return () => window.clearTimeout(timer)
  }, [
    state,
    activePlayer,
    dieSettled,
    handoffVisible,
    passedSpinVisible,
    store,
    cpuActingPhases,
    eventSpinRequest,
    handleDecisionChoose,
  ])

  /*
   * A fork asks two things, so the dock says two things.
   *
   * Before the first press it names both roads and the faces that take them
   * — see `forkRoadNames` in `branch.ts` for why that exists at all. Once
   * that press has settled a road, the ranges are spent history and the
   * question has changed: the dock names the road the player is standing on
   * and asks for the second throw, the one that decides how far down it they
   * actually get. Both are gated the same way `spinReady` is: no point
   * talking to somebody who is not about to press (a CPU seat, mid-handoff,
   * or a spin already spent).
   */
  const pressable = !handoffVisible && activePlayer !== undefined && !activePlayer.isCpu
  const forkAhead =
    pressable && activePlayer && state.phase === 'awaitingSpin'
      ? forkRoadNames(state.board, activePlayer.spaceId, activePlayer)
      : undefined
  const roadTaken =
    pressable && state.phase === 'awaitingDistanceSpin' && state.chosenExit
      ? roadName(state.board, state.chosenExit)
      : undefined
  /*
   * The one window where the dock's centre seat costs something: the camera
   * holds the active car near the middle of the screen, and mid-move that
   * car is the whole show. The die is spent by then — `dieSettled` is what
   * says its own animation has finished and the hops now running are the
   * board's — so it fades out of the way and leaves the centre to the car
   * and the hop counter until the move resolves.
   */
  const carDriving = state.phase === 'moving' && dieSettled

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

  // --- status modal --------------------------------------------------------
  // The strip at the foot of the screen names each seat and its wallet and
  // nothing more — a glance, on purpose. Everything else a seat used to
  // spell out on its rail card (career, net worth's own breakdown, tiles,
  // policies) lives here, and the strip itself is the way in: pressing
  // anywhere on it opens the full picture at a size meant to be read. The
  // header's old Status button is gone — an always-visible control that
  // opens the same modal made it a second name for the same door.
  const [statusOpen, setStatusOpen] = useState(false)

  // --- settings sheet ------------------------------------------------------
  // Music and SFX used to be two switches standing in the header for the
  // whole game, beside the turn display, the log, the save menu and Quit —
  // five kinds of thing in one row, and the one that matters most (whose turn
  // it is) the least able to be big. They fold into one gear here and open
  // the sheet below, which is where a setting belongs: found when wanted,
  // absent otherwise.
  const [settingsOpen, setSettingsOpen] = useState(false)

  /*
   * Whether the board's own die is the screen's A button — see
   * `usePrimaryAction`. Only when the press is genuinely this die's: not
   * while a modal has one of its own on screen, not while the device is
   * being handed over, not on a computer seat's turn, and not underneath a
   * sheet the player opened over the board.
   */
  const dieIsPrimary =
    SPIN_PHASES.includes(state.phase) &&
    !eventSpinVisible &&
    !handoffVisible &&
    !statusOpen &&
    !settingsOpen &&
    activePlayer?.isCpu !== true

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
        <TitleScreen
          slots={slots}
          records={records}
          profiles={savedProfiles}
          onStart={handleStart}
          onContinue={handleContinue}
        />
        <UpdateBanner />
      </AudioProvider>
    )
  }

  /*
   * The results wait for the last die of the settlement to finish landing.
   * `scoreRoll` assembles the standings in the same tick the final throw is
   * dispatched — it has to, that throw is the last fact it was missing — so
   * without this the screen would replace the die mid-flight and the player
   * would read the very total they were watching it decide. Same guarantee
   * `dieSettled` gives every other card in the game, applied to the biggest
   * card of all.
   */
  if (state.phase === 'gameOver' && displayedScoreRoll === null) {
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
            {/* One gear where two switches used to stand. Icon-only on
                purpose: it is the least urgent control in the row, and the
                room it gives back goes to the turn display. */}
            <ChunkyButton
              variant="secondary"
              size="sm"
              icon="gear"
              aria-label="Settings"
              aria-expanded={settingsOpen}
              aria-haspopup="dialog"
              onClick={() => setSettingsOpen(true)}
            />
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
            <div className={styles.boardStage}>
              <Board
                board={state.board}
                players={displayedPlayers}
                currentPlayerIndex={state.currentPlayerIndex}
                phase={state.phase}
                movementPath={dieSettled ? state.movementPath : []}
                pendingHops={dieSettled ? state.pendingPath.length : 0}
                /* Withheld exactly like movementPath: the store names the
                   chosen road the instant the fork roll is dispatched, and a
                   road lighting up while the die is still tumbling gives away
                   the number it is tumbling towards. */
                chosenExitId={dieSettled ? state.chosenExit : null}
                onMovementComplete={handleMovementComplete}
                onSpacesLeftChange={setSpacesLeft}
                introFlythrough={introPending}
                editionId={state.editionId}
                difficulty={state.difficulty}
              />

              {/* The die sits at the true centre of the play area now — it
                  moved once from the rail to the foot of the board, and the
                  owner said that still was not central enough. With the
                  seats gone to the strip below, the board's stage spans
                  everything between the header and that strip, so centring
                  in the stage *is* centring on the screen a player is
                  actually looking at — the strip can never pull it
                  off-centre. The camera holds the active car near this very
                  spot, which is why the die steps aside — faded out, see
                  `.dieAside` — while the car is actually driving; only the
                  hop counter rides the centre then. The wrapper spans the
                  whole stage but stays transparent to the pointer, so a
                  drag across the board still pans it. An event roll still
                  gets its own die in `EventSpinModal`; only the movement
                  roll lives here. */}
              <div className={styles.rollDock}>
                {forkAhead && !eventSpinVisible && (
                  <div
                    className={styles.forkAhead}
                    role="status"
                    aria-label="Fork ahead — this roll picks your road"
                  >
                    <span className={styles.forkAheadRoad}>
                      <span className={styles.forkAheadRange}>1–3</span>
                      {forkAhead[0]}
                    </span>
                    <span className={styles.forkAheadRoad}>
                      <span className={styles.forkAheadRange}>4–6</span>
                      {forkAhead[1]}
                    </span>
                  </div>
                )}

                {/* The other half of a fork: the road is settled, and the
                    die is owed one more throw for how far down it the car
                    actually gets. Same panel, same place on screen — the
                    question in it has simply moved on. */}
                {roadTaken && !eventSpinVisible && (
                  <div
                    className={styles.forkAhead}
                    role="status"
                    aria-label={`You're on ${roadTaken} — roll again for how far you go`}
                  >
                    <span className={styles.forkAheadRoad}>{roadTaken}</span>
                    <span className={styles.forkAheadHint}>Roll again for how far you go</span>
                  </div>
                )}

                {spacesLeft !== null && <MoveCounter spacesLeft={spacesLeft} />}

                {/* `aria-hidden` while the event modal is up: this die is
                    inert then (disabled, and correctly so — there is nothing
                    to move yet), and left findable it is a second control
                    named "Roll" a keyboard or screen-reader user would run
                    into for no reason. */}
                <div
                  className={carDriving ? `${styles.dieDock} ${styles.dieAside}` : styles.dieDock}
                  aria-hidden={eventSpinVisible || undefined}
                >
                  <Dice
                    result={state.lastSpin}
                    disabled={!SPIN_PHASES.includes(state.phase) || handoffVisible}
                    onRoll={handleSpin}
                    onRollComplete={handleSpinComplete}
                    autoRollToken={autoSpinToken}
                    primary={dieIsPrimary}
                    compact
                  />
                </div>

              </div>
            </div>
          </section>

        </main>

        {/* Every seat on one band at the foot of the screen — a glance, not
            the old rail of full cards, and the whole band opens `StatusModal`
            when pressed. Reads from `displayedPlayers` for the same
            spoiler-proofing the board gets: a balance must not move while
            the die is still tumbling towards the number that decides it. */}
        <PlayerStrip
          players={displayedPlayers}
          currentPlayerIndex={state.currentPlayerIndex}
          standings={standings}
          editionId={state.editionId}
          onOpenStatus={() => setStatusOpen(true)}
        />

        {/* What the feed would have said still reaches assistive tech while
            the drawer is closed; the drawer carries its own live list when
            open, so this announcer stands down to avoid double-speaking. */}
        {!logOpen && (
          <div className="visually-hidden" aria-live="polite">
            {state.log.length > 0 ? state.log[state.log.length - 1]?.message : ''}
          </div>
        )}

        {/* Close belongs to the panel, not to the air above it: it used to
            float outside the drawer's top-right corner, reading as a second
            header control beside Quit rather than as this panel's own. It is
            in the log's heading row now — see `GameLog`. */}
        {logOpen && (
          <div className={styles.logDrawer} id="game-log-drawer">
            <GameLog entries={state.log} onClose={() => setLogOpen(false)} />
          </div>
        )}

        {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}

        {statusOpen && (
          <StatusModal
            players={state.players}
            activePlayerId={activePlayer?.id}
            difficulty={state.difficulty}
            editionId={state.editionId}
            onClose={() => setStatusOpen(false)}
          />
        )}

        {state.phase === 'awaitingDecision' && state.pendingDecision && !handoffVisible && !eventSpinRequest && (
          <DecisionModal
            decision={state.pendingDecision}
            board={state.board}
            // A computer seat is shown the same card, but it must never look
            // like it is waiting for a person: it answers itself on a timer.
            isCpu={activePlayer?.isCpu === true}
            cpuPlayerName={activePlayer?.name ?? ''}
            onChoose={handleDecisionChoose}
          />
        )}

        {/* An event roll's own die — tuition, a promotion review, a
            marriage proposal, career choice. The tile position has nothing
            to do with any of these, so unlike the movement roll this one
            gets the middle of the screen rather than the board's own dock. */}
        {eventSpinVisible && displayedEventSpin && (
          <EventSpinModal
            prompt={displayedEventSpin.prompt}
            stakes={displayedEventSpin.stakes}
            table={displayedEventSpin.table}
            result={state.lastSpin}
            onSpin={handleValueSpin}
            onSpinComplete={handleSpinComplete}
            autoSpinToken={autoSpinToken}
          />
        )}

        {/* The hidden roll behind a swept-past tile, thrown where it can
            actually be watched — same die, same modal, same middle of the
            screen a landed tile's roll already gets. A person still presses
            it themselves, same as any other roll: the tile was never chosen,
            but the press is not what a fork or a landing asks for either —
            only a computer seat gets to skip it, on this roll exactly as on
            every other one it plays unattended. The card below waits on it. */}
        {passedSpinVisible && passedEvent && (
          <EventSpinModal
            prompt={passedEvent.title}
            stakes={passedEvent.stakes ?? passedEvent.description}
            table={passedEvent.table}
            result={passedRoll}
            onSpin={noPress}
            onSpinComplete={handlePassedSpinComplete}
            autoSpinToken={autoSpinToken}
            passedThrough
            unattended={activePlayer?.isCpu === true}
          />
        )}

        {/* One die of the closing settlement — a house going to market, or a
            player's whole shareholding cashing out. Same modal, same die,
            same middle of the screen every other roll in the game gets: the
            ladder is on the card before the throw, the die decides which rung,
            and the results screen only arrives once the last of them has
            landed. Keyed per holding so each throw gets its own die rather
            than one cube left lying on the previous number — and keyed off
            the *latched* roll, never the live queue, so a remount can never
            happen under a die still in the air. A computer's own holdings
            throw themselves, exactly as a computer's rolls do all game;
            nobody is the active player here, so the die belongs to the seat
            being scored rather than to whoever's turn it was. */}
        {displayedScoreRoll && scoreRollPrompt && (
          <EventSpinModal
            key={`${displayedScoreRoll.playerId}:${displayedScoreRoll.kind}`}
            prompt={scoreRollPrompt.prompt}
            stakes={scoreRollPrompt.stakes}
            table={scoreRollPrompt.table}
            result={state.lastSpin}
            onSpin={handleScoreRoll}
            onSpinComplete={handleSpinComplete}
            autoSpinToken={autoSpinToken}
            unattended={scoreRollPrompt.isCpu}
          />
        )}

        {/* A value roll's own result waits for `dieSettled` too — same as
            the ordinary move roll — so the card never appears before the
            die the player just threw has actually finished rolling. A
            *human* seat's empty `none`-effect landing never appears at all
            — the effect above ends that turn on its own — this guard is
            only what keeps it from flashing on screen for the one render in
            between. A computer seat's own empty landing still shows and
            still waits on Continue like any other of its cards: nothing
            else is left to end that turn while a human is at the table. */}
        {state.phase === 'resolved' &&
          state.lastEvent &&
          dieSettled &&
          !(isEmptyLandingEvent(state.lastEvent) && !activePlayer?.isCpu) && (
            <EventCard
              event={state.lastEvent}
              editionId={state.editionId}
              onDismiss={() => store.dispatch({ type: 'endTurn' })}
            />
          )}

        {/* A payday or event tile crossed on the way to wherever the pawn
            actually stopped — its own card, named for its own tile, shown
            before the destination's. Dismissing is just calling `settle`
            again: the same command that first drained this item off the
            queue also advances past it, exactly the way a fork mid-move
            already re-enters `settle` without a dedicated command of its
            own. Never folded into the landing card's notes — that was the
            whole complaint this phase exists to fix: a card with no tile of
            its own to point to. A tile whose outcome a die decided holds its
            card back until that die has been watched land, just above. */}
        {state.phase === 'passingEvent' && state.activePassedEvent && dieSettled && !passedSpinVisible && (
          <EventCard
            event={state.activePassedEvent}
            editionId={state.editionId}
            onDismiss={() => store.dispatch({ type: 'settle' })}
          />
        )}

        {handoffVisible && activePlayer && (
          <TurnHandoff
            player={activePlayer}
            turn={state.turn}
            rank={standings.get(activePlayer.id)?.rank ?? state.players.length}
            onReady={handleHandoffReady}
          />
        )}
      </div>
      <UpdateBanner />
    </AudioProvider>
  )
}
