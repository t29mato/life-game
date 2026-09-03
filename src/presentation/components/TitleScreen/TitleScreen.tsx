import { useRef, useState, type CSSProperties, type ReactElement } from 'react'
import type { IconName } from '@domain/model/icons'
import type { Difficulty, EditionId, NewGameConfig } from '@domain/model/types'
import { DEFAULT_EDITION_ID, editionFor } from '@domain/edition/registry'
import type { SaveSlotInfo } from '@application/ports/GameRepositoryPort'
import type { GameRecord } from '@application/ports/StatsRepositoryPort'
import type { PlayerProfile } from '@application/ports/PlayerProfileRepositoryPort'
import { useAudio } from '../../hooks/useAudio'
import { usePrimaryAction } from '../../hooks/usePrimaryAction'
import { TEMPO } from '../../tempo'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import { GameIcon } from '../../icons/GameIcon'
import { UiIcon } from '../../icons/ui'
import { ManualScreen } from '../ManualScreen/ManualScreen'
import { RecordsScreen } from '../RecordsScreen/RecordsScreen'
import { ReleaseNotesScreen } from '../ReleaseNotes/ReleaseNotesScreen'
import { SettingsSheet } from '../SettingsSheet/SettingsSheet'
import { ContinueStep } from './ContinueStep'
import { CountryStep } from './CountryStep'
import { DifficultyStep } from './DifficultyStep'
import { LifeStep } from './LifeStep'
import { PlayersStep } from './PlayersStep'
import {
  countryOptions,
  defaultPlayers,
  researcherEditionFor,
  resolveEditionId,
  type DraftPlayer,
} from './setupDraft'
import styles from './TitleScreen.module.css'

export interface TitleScreenProps {
  readonly slots: readonly SaveSlotInfo[]
  readonly records: readonly GameRecord[]
  /** The remembered regulars, most recent first. Empty on a first-ever run. */
  readonly profiles: readonly PlayerProfile[]
  readonly onStart: (config: NewGameConfig) => void
  readonly onContinue: (slot: number) => void
}

/**
 * Life-moment illustrations drifting around the edges of the box art — never
 * over the wordmark. Drawn from the game's own icon set (the same art a
 * player will actually land on) rather than emoji, so the title screen and
 * the board read as one object.
 *
 * Laid out as a *ring*: three down each side and one at each end, balanced
 * left against right. They used to sit at `left: 0–3%` on one side and
 * `88–95%` on the other, which is not the symmetry it looks like on paper —
 * an icon's `left` is its own left edge, so the right-hand ones ran past the
 * screen's `overflow-x: clip` and were quietly trimmed, leaving a composition
 * visibly heavy on the left (the playtest's own words). Nothing here now
 * reaches past ~90% plus its own width, so the ring is whole on both sides.
 *
 * Durations are long and deliberately unrelated to each other: a ring of
 * pieces all breathing at 5s in near-lockstep reads as one mechanism rather
 * than as several loose objects on a table.
 */
const FLOATER_LAYOUT: readonly {
  readonly icon: IconName | 'ui:dice'
  readonly top: string
  readonly left: string
  readonly size: string
  readonly delay: string
  readonly duration: string
}[] = [
  { icon: 'ui:dice', top: '2%', left: '8%', size: '2.5rem', delay: '0s', duration: '13s' },
  { icon: 'space:start-of-life', top: '4%', left: '83%', size: '2.2rem', delay: '1.1s', duration: '17s' },
  { icon: 'space:cap-and-gown', top: '34%', left: '2%', size: '1.8rem', delay: '2.3s', duration: '15s' },
  { icon: 'space:corner-office', top: '30%', left: '89%', size: '1.7rem', delay: '3.4s', duration: '19s' },
  { icon: 'house:cozy-bungalow', top: '62%', left: '4%', size: '2rem', delay: '1.7s', duration: '16s' },
  { icon: 'space:wedding-day', top: '66%', left: '85%', size: '1.7rem', delay: '4.2s', duration: '14s' },
  { icon: 'space:car-trouble', top: '88%', left: '12%', size: '1.6rem', delay: '2.9s', duration: '18s' },
]

/** Slow-drifting confetti shapes behind everything, giving the canvas life. */
const DRIFTERS = [
  { tone: 'coral', size: '17rem', top: '-6%', left: '4%', delay: '0s' },
  { tone: 'sky', size: '11rem', top: '14%', left: '76%', delay: '2.4s' },
  { tone: 'mint', size: '14rem', top: '58%', left: '2%', delay: '1.2s' },
  { tone: 'sun', size: '9rem', top: '76%', left: '70%', delay: '3.1s' },
  { tone: 'grape', size: '12rem', top: '36%', left: '88%', delay: '4s' },
]

/**
 * Where the player is. `'title'` is the box lid — the attract screen with two
 * buttons on it; `'continue'` is the shelf of saves; the rest are the rungs of
 * the new-game flow.
 */
type Step = 'title' | 'continue' | 'players' | 'country' | 'life' | 'difficulty'
type FlowStep = Extract<Step, 'players' | 'country' | 'life' | 'difficulty'>

/**
 * Where Back goes, said out loud, per step it goes *to*.
 *
 * The flow's shape is computed rather than written down — a country with no
 * researcher board has no life step — so the label a step's Back button wears
 * cannot be written down on the step either. It is read off whatever the
 * previous rung turns out to be, which is the only way "Back to the country"
 * stays true on a screen that sometimes sits behind the life choice instead.
 */
const BACK_LABELS: Readonly<Record<Step, string>> = {
  title: 'Back to title',
  continue: 'Back to the saves',
  players: 'Back to the players',
  country: 'Back to the country',
  life: 'Back to the life choice',
  difficulty: 'Back to the difficulty',
}

/**
 * --- the title screen ------------------------------------------------------
 *
 * `phase === 'setup'`, and the first ten seconds anybody spends with this
 * game. Issue #36's complaint, in the playtester's own words: token pick →
 * edition → difficulty → Start → saves → handbook, all in one column, with
 * "Start Game" buried offscreen. Five decisions and six sections is not a
 * title screen; it is a settings page with a logo on it.
 *
 * So it is a small machine now instead of a scroll:
 *
 *   title ──▶ Continue ──▶ the save shelf
 *         └─▶ New Game ──▶ players ──▶ country ──▶ difficulty ──▶ Start
 *                                          └──▶ life ──┘
 *
 * The life rung — the classic board, or the researcher board set in the same
 * country — is there only for a country that has a researcher board written
 * for it (Japan and France today). The country step's table says which do, so
 * the extra rung is announced before it appears; the countries that do not
 * have one simply are not asked, which is the same rule that drops the
 * country step itself when only one country is registered.
 *
 * One decision per screen, each screen with one A button (Space and Enter,
 * via `usePrimaryAction`) and one Back — and Back is a required prop of
 * `StepFrame`, so a step that cannot be left is not a thing this file can
 * express. Every door the old page carried is still here: the saves, the
 * handbook, the hall, the release notes, the audio settings and the build
 * stamp all hang off the title view, one press from the front.
 *
 * The draft — names, colours, seats, country, life, difficulty — lives up here
 * rather than in the steps, so backing all the way out to the title and
 * walking in again finds the table exactly as it was left. Abandoning a
 * half-finished setup should cost a player nothing; it is a menu, not a form
 * submission.
 */
export function TitleScreen({ slots, records, profiles, onStart, onContinue }: TitleScreenProps): ReactElement {
  const audio = useAudio()
  const unlockedRef = useRef(false)
  const [step, setStep] = useState<Step>('title')
  const [players, setPlayers] = useState<DraftPlayer[]>(defaultPlayers)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [countryId, setCountryId] = useState<EditionId>(DEFAULT_EDITION_ID)
  const [researcher, setResearcher] = useState(false)
  const countries = countryOptions()
  const researcherEdition = researcherEditionFor(countryId)
  const [showRecords, setShowRecords] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  /*
   * The rungs of the new-game flow, and the reason "Step 2 of 3" is computed
   * rather than written down: a picker with one option is a label, so a
   * question with a single possible answer drops out of the flow entirely
   * rather than being asked.
   *
   * That rule now decides two rungs. The country step is skipped if only one
   * country is ever registered. The life step — classic board or the
   * researcher board set in the same country — is offered only for a country
   * that actually has one, which today is Japan and France; for the other
   * three there is no second life to choose between, so there is no step, no
   * disabled card and no dead end. The country step's own table says which
   * countries have one, so a flow that grows a fourth rung under Japan is
   * announced a screen before it happens rather than sprung.
   */
  const flow: readonly FlowStep[] = [
    'players',
    ...(countries.length > 1 ? (['country'] as const) : []),
    ...(researcherEdition === undefined ? [] : (['life'] as const)),
    'difficulty',
  ]

  const goForward = (from: FlowStep): void => {
    setStep(flow[flow.indexOf(from) + 1] ?? 'difficulty')
  }
  const goBack = (from: FlowStep): void => {
    const previous = flow[flow.indexOf(from) - 1]
    setStep(previous ?? 'title')
  }
  /** What the step before `from` is called, for that step's Back button. */
  const backLabel = (from: FlowStep): string => BACK_LABELS[flow[flow.indexOf(from) - 1] ?? 'title']

  const hasSave = slots.some((slot) => slot.occupied)

  /*
   * The A button on the box lid. A console puts the cursor on Continue when
   * there is something to continue and on New Game when there is not, which
   * is the same rule as "the obvious thing" everywhere else in this game.
   * Stood down whenever anything is layered over the title, so Space can
   * never press a button the player cannot currently see.
   */
  const titlePrimaryRef = usePrimaryAction<HTMLButtonElement>(
    step === 'title' && !showSettings && !showRecords && !showNotes && !showManual,
  )

  const unlockAudioOnce = (): void => {
    if (unlockedRef.current) return
    unlockedRef.current = true
    void audio.unlock()
  }

  const handleStart = (): void => {
    unlockAudioOnce()
    const config: NewGameConfig = {
      players: players.map((p, i) => ({
        name: p.name.trim() || `Player ${i + 1}`,
        color: p.color,
        isCpu: p.isCpu,
      })),
      difficulty,
      // Two answers, one id: `japan` + the researcher life is the board
      // registered as `japan-researcher`. A researcher answer left behind on a
      // country that has no researcher board resolves to that country's own
      // board rather than to an id nothing can load — see `resolveEditionId`.
      editionId: resolveEditionId(countryId, researcher),
    }
    onStart(config)
  }

  const handleContinue = (slot: SaveSlotInfo): void => {
    if (!slot.occupied) return
    unlockAudioOnce()
    onContinue(slot.slot)
  }

  if (showRecords) {
    return <RecordsScreen records={records} onClose={() => setShowRecords(false)} />
  }

  if (showNotes) {
    return <ReleaseNotesScreen onClose={() => setShowNotes(false)} />
  }

  if (showManual) {
    return <ManualScreen onClose={() => setShowManual(false)} />
  }

  return (
    <div
      className={`${styles.screen} ${step === 'title' ? '' : styles.screenStep}`}
      onClickCapture={unlockAudioOnce}
      style={
        {
          // Pacing lives in `tempo.ts`, including the pacing of a screen
          // nobody has pressed anything on yet — handed to the stylesheet as
          // variables so the animations below are tuned in the same file as
          // the die's throw and the pawn's hop, not in a keyframe nobody
          // thinks to look at.
          '--title-idle': `${TEMPO.titleIdleSeconds}s`,
          '--title-step-in': `${TEMPO.titleStepSeconds}s`,
        } as CSSProperties
      }
    >
      <div className={styles.scenery} aria-hidden="true">
        {DRIFTERS.map((d) => (
          <span
            key={d.tone}
            className={styles.drifter}
            style={
              {
                '--drift-color': `var(--candy-${d.tone})`,
                '--drift-size': d.size,
                top: d.top,
                left: d.left,
                animationDelay: d.delay,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* The box art. Smaller once the player is inside the flow — the logo
          has already done its job by then, and the decision on screen should
          own the room. It never leaves, so there is never a moment where the
          player cannot see what game they are setting up. */}
      <div className={`${styles.logoWrap} ${step === 'title' ? '' : styles.logoWrapCompact}`}>
        {step === 'title' ? (
          <div className={styles.floaters} aria-hidden="true">
            {FLOATER_LAYOUT.map((f) => (
              <span
                key={f.icon}
                className={styles.floater}
                style={{
                  top: f.top,
                  left: f.left,
                  width: f.size,
                  height: f.size,
                  animationDelay: f.delay,
                  animationDuration: f.duration,
                }}
              >
                {f.icon === 'ui:dice' ? (
                  <UiIcon name="dice" size={28} className={styles.floaterGlyph} />
                ) : (
                  <GameIcon name={f.icon} size={28} />
                )}
              </span>
            ))}
          </div>
        ) : null}

        {step === 'title' ? (
          <span className={styles.eyebrow} aria-hidden="true">
            A board game of chance &amp; ambition
          </span>
        ) : null}
        <h1 className={styles.wordmark}>LIFE JOURNEY</h1>
        {step === 'title' ? (
          <p className={styles.tagline}>Roll, hop, and build a life worth bragging about.</p>
        ) : null}
      </div>

      {step === 'title' ? (
        <>
          <div className={styles.menu}>
            {/* Continue first: a table that already has a game going means to
                get back to it, and the button they want should be the one the
                cursor is already sitting on. It stays on the screen when there
                is nothing to continue, disabled and saying why — a button that
                appears out of nowhere on the second visit is a menu that
                changes shape under the player. */}
            <ChunkyButton
              {...(hasSave ? { ref: titlePrimaryRef } : {})}
              variant="primary"
              size="lg"
              icon="folder"
              fullWidth
              disabled={!hasSave}
              aria-label={hasSave ? 'Continue a saved game' : 'Continue: no saved games yet'}
              onClick={() => setStep('continue')}
            >
              Continue
            </ChunkyButton>
            <ChunkyButton
              {...(hasSave ? {} : { ref: titlePrimaryRef })}
              variant={hasSave ? 'secondary' : 'primary'}
              size="lg"
              icon="rocket"
              fullWidth
              onClick={() => setStep('players')}
            >
              New Game
            </ChunkyButton>
          </div>

          <p className={styles.menuHint}>
            {hasSave
              ? 'Three quick choices and you are on the board.'
              : 'No saved games yet — three quick choices and you are on the board.'}
          </p>

          {/* The handbook is always on offer — a first-time table is exactly
              who it exists for — where the hall only appears once there is a
              record to hang in it. The gear keeps the audio switches folded
              away in the same drawer the game itself puts them in (#38),
              rather than parking two toggles on the box lid. */}
          <div className={styles.doorsRow}>
            <ChunkyButton variant="ghost" size="md" icon="book" onClick={() => setShowManual(true)}>
              The Handbook
            </ChunkyButton>
            {records.length > 0 ? (
              <ChunkyButton variant="ghost" size="md" icon="ribbon" onClick={() => setShowRecords(true)}>
                Hall of Records
              </ChunkyButton>
            ) : null}
            <ChunkyButton variant="ghost" size="md" onClick={() => setShowNotes(true)}>
              What&rsquo;s New
            </ChunkyButton>
            <ChunkyButton
              variant="ghost"
              size="md"
              icon="gear"
              aria-label="Settings"
              onClick={() => setShowSettings(true)}
            >
              Settings
            </ChunkyButton>
          </div>

          {/* The build stamp, in the footer where a build stamp belongs.
              It used to be absolutely positioned in the top-right corner —
              except that `.screen > *` (which it is one of) resets
              `position: relative` on every child, so `right: 26px` was read as
              a *relative* offset and shunted the whole full-width row 26px to
              the left, off the padded edge and under `overflow-x: clip`. That
              is what ate the leading "v" the playtest reported: not a
              truncation, a nudge. Nothing here is positioned any more, so
              there is nothing left to clip. */}
          <footer className={styles.footer}>
            <span className={styles.versionTag} title="The exact commit this build came from">
              {__APP_BUILD__}
            </span>
          </footer>
        </>
      ) : null}

      {step === 'continue' ? (
        <ContinueStep slots={slots} onContinue={handleContinue} onBack={() => setStep('title')} />
      ) : null}

      {step === 'players' ? (
        <PlayersStep
          players={players}
          setPlayers={setPlayers}
          profiles={profiles}
          stepNumber={flow.indexOf('players') + 1}
          stepCount={flow.length}
          onBack={() => goBack('players')}
          onNext={() => goForward('players')}
        />
      ) : null}

      {step === 'country' ? (
        <CountryStep
          editions={countries}
          editionId={countryId}
          onChoose={setCountryId}
          stepNumber={flow.indexOf('country') + 1}
          stepCount={flow.length}
          onBack={() => goBack('country')}
          onNext={() => goForward('country')}
        />
      ) : null}

      {/* Only ever built with a researcher board in hand: the step is not in
          the flow at all for a country that has none, so the player can never
          arrive here to be told there is nothing to choose. */}
      {step === 'life' && researcherEdition !== undefined ? (
        <LifeStep
          country={editionFor(countryId)}
          researcherEdition={researcherEdition}
          researcher={researcher}
          onChoose={setResearcher}
          stepNumber={flow.indexOf('life') + 1}
          stepCount={flow.length}
          onBack={() => goBack('life')}
          backLabel={backLabel('life')}
          onNext={() => goForward('life')}
        />
      ) : null}

      {step === 'difficulty' ? (
        <DifficultyStep
          difficulty={difficulty}
          onChoose={setDifficulty}
          players={players}
          stepNumber={flow.indexOf('difficulty') + 1}
          stepCount={flow.length}
          onBack={() => goBack('difficulty')}
          backLabel={backLabel('difficulty')}
          onStart={handleStart}
        />
      ) : null}

      {showSettings ? <SettingsSheet onClose={() => setShowSettings(false)} /> : null}
    </div>
  )
}
