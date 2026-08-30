import { useRef, useState, type CSSProperties, type ReactElement } from 'react'
import type { IconName } from '@domain/model/icons'
import type { Difficulty, EditionId, NewGameConfig, PlayerColor } from '@domain/model/types'
import { DIFFICULTIES } from '@domain/rules/difficulty'
import type { Edition } from '@domain/edition/types'
import { allEditions, DEFAULT_EDITION_ID, editionFor } from '@domain/edition/registry'
import { AUTOSAVE_SLOT, type SaveSlotInfo } from '@application/ports/GameRepositoryPort'
import type { GameRecord } from '@application/ports/StatsRepositoryPort'
import type { PlayerProfile } from '@application/ports/PlayerProfileRepositoryPort'
import { editionDisplayName, formatMoney, salaryPeriod, salaryRate } from '../../format'
import { useAudio } from '../../hooks/useAudio'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import { AudioToggle } from '../AudioToggle/AudioToggle'
import { GameIcon } from '../../icons/GameIcon'
import { UiIcon } from '../../icons/ui'
import { PLAYER_COLORS } from '../Pawn/designs'
import { RecordsScreen } from '../RecordsScreen/RecordsScreen'
import { ReleaseNotesScreen } from '../ReleaseNotes/ReleaseNotesScreen'
import { estimatePlaytime } from './estimatePlaytime'
import styles from './TitleScreen.module.css'

export interface TitleScreenProps {
  readonly slots: readonly SaveSlotInfo[]
  readonly records: readonly GameRecord[]
  /** The remembered regulars, most recent first. Empty on a first-ever run. */
  readonly profiles: readonly PlayerProfile[]
  readonly onStart: (config: NewGameConfig) => void
  readonly onContinue: (slot: number) => void
}

const MIN_PLAYERS = 2
const MAX_PLAYERS = 4

/**
 * Life-moment illustrations drifting around the edges of the box art — never
 * over the wordmark. Drawn from the game's own icon set (the same art a
 * player will actually land on) rather than emoji, so the title screen and
 * the board read as one object.
 */
const FLOATER_LAYOUT: readonly {
  readonly icon: IconName | 'ui:dice'
  readonly top: string
  readonly left: string
  readonly size: string
  readonly delay: string
  readonly duration: string
}[] = [
  { icon: 'ui:dice', top: '6%', left: '3%', size: '2.6rem', delay: '0s', duration: '5.2s' },
  { icon: 'space:start-of-life', top: '2%', left: '88%', size: '2.2rem', delay: '0.9s', duration: '6.4s' },
  { icon: 'space:cap-and-gown', top: '58%', left: '92%', size: '1.7rem', delay: '2.1s', duration: '5.8s' },
  { icon: 'space:wedding-day', top: '70%', left: '86%', size: '1.5rem', delay: '1.4s', duration: '4.6s' },
  { icon: 'house:cozy-bungalow', top: '64%', left: '1%', size: '2rem', delay: '1.8s', duration: '6s' },
  { icon: 'space:corner-office', top: '34%', left: '95%', size: '1.4rem', delay: '3s', duration: '5s' },
  { icon: 'space:car-trouble', top: '40%', left: '0%', size: '1.5rem', delay: '2.6s', duration: '5.5s' },
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
 * The difference between difficulties is dramatic — measured over seeded
 * games, median retirements go roughly $591k → $349k → $40k, and on Very Hard
 * close to half the table finishes in the red. The copy here says so plainly:
 * a player should choose that fate, never discover it thirty minutes in.
 * `aria` carries the same warning on the control itself for screen readers.
 */
const DIFFICULTY_COPY: Record<
  Difficulty,
  {
    readonly label: string
    readonly hint: string
    readonly detail: string
    readonly aria: string
    readonly tone: 'mint' | 'tangerine' | 'coral'
  }
> = {
  normal: {
    label: 'Normal',
    hint: 'a fair life',
    detail: "The standard journey: setbacks happen, but they won't ruin you.",
    aria: "Normal difficulty: setbacks happen, but they won't ruin you",
    tone: 'mint',
  },
  hard: {
    label: 'Hard',
    hint: 'money runs tight',
    detail: 'Twice the setbacks of Normal — about one player in ten retires in the red.',
    aria: 'Hard difficulty: twice the setbacks, about one player in ten retires in the red',
    tone: 'tangerine',
  },
  veryHard: {
    label: 'Very Hard',
    hint: 'survival is a win',
    detail:
      'Setbacks at nearly every turn, and finishing in the black at all is close to a coin flip. Retiring with anything is bragging rights.',
    aria: 'Very hard difficulty: finishing in the black at all is close to a coin flip',
    tone: 'coral',
  },
}

/**
 * Editions as the picker offers them: the classic USA game first — it is the
 * default, and the id every save without one resolves to — then the rest
 * alphabetically by place name, so the shelf reads the same however the
 * registry happened to be assembled. Computed per render rather than at module
 * load because the registry can grow after this module is imported (tests
 * register variants, and future editions may arrive the same way).
 */
function editionOptions(): readonly Edition[] {
  return [...allEditions()].sort((a, b) => {
    if (a.id === DEFAULT_EDITION_ID) return b.id === DEFAULT_EDITION_ID ? 0 : -1
    if (b.id === DEFAULT_EDITION_ID) return 1
    return editionDisplayName(a).localeCompare(editionDisplayName(b))
  })
}

/**
 * One true sentence about the selected edition, derived from its own data —
 * never authored copy, so the editions being written in parallel get an honest
 * line here with no further edit. The three facts a player can size a country
 * up by before ever playing it: the money it counts in, what they start
 * holding, and what its careers pay.
 */
function editionBlurb(edition: Edition): string {
  const { currency, economy, careers } = edition
  const start = formatMoney(economy.startingMoney, currency)
  const salaries = [...careers.basic, ...careers.graduate].map((career) => career.salary)
  if (salaries.length === 0) return `Counts in ${currency.symbol} — start with ${start}.`
  const low = formatMoney(salaryRate(Math.min(...salaries), currency), currency)
  const high = formatMoney(salaryRate(Math.max(...salaries), currency), currency)
  return `Counts in ${currency.symbol} — start with ${start}; salaries run ${low} to ${high} a ${salaryPeriod(currency)}.`
}

interface DraftPlayer {
  readonly name: string
  readonly color: PlayerColor
  readonly isCpu: boolean
}

function nextAvailableColor(used: readonly PlayerColor[]): PlayerColor {
  return PLAYER_COLORS.find((color) => !used.includes(color)) ?? (PLAYER_COLORS[0] as PlayerColor)
}

function defaultPlayers(): DraftPlayer[] {
  return [
    { name: 'Player 1', color: 'red', isCpu: false },
    { name: 'Player 2', color: 'blue', isCpu: false },
  ]
}

/** `1970-01-01T00:00:00.000Z` → `'Jan 1, 12:00 AM'`. Always English, regardless of the host locale. */
function formatSlotTimestamp(savedAt: string): string {
  const date = new Date(savedAt)
  if (Number.isNaN(date.getTime())) return 'unknown time'
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/** `phase === 'setup'`: the wordmark, player setup, save slots, and the start CTA. */
export function TitleScreen({ slots, records, profiles, onStart, onContinue }: TitleScreenProps): ReactElement {
  const audio = useAudio()
  const unlockedRef = useRef(false)
  const [players, setPlayers] = useState<DraftPlayer[]>(defaultPlayers)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [editionId, setEditionId] = useState<EditionId>(DEFAULT_EDITION_ID)
  const editions = editionOptions()
  const [showRecords, setShowRecords] = useState(false)
  const [showNotes, setShowNotes] = useState(false)

  const unlockAudioOnce = (): void => {
    if (unlockedRef.current) return
    unlockedRef.current = true
    void audio.unlock()
  }

  const updateName = (index: number, name: string): void => {
    setPlayers((prev) => prev.map((p, i) => (i === index ? { ...p, name } : p)))
  }

  const updateColor = (index: number, color: PlayerColor): void => {
    setPlayers((prev) => {
      const usedByOthers = prev.filter((_, i) => i !== index).map((p) => p.color)
      if (usedByOthers.includes(color)) return prev
      return prev.map((p, i) => (i === index ? { ...p, color } : p))
    })
  }

  const updateIsCpu = (index: number, isCpu: boolean): void => {
    setPlayers((prev) => prev.map((p, i) => (i === index ? { ...p, isCpu } : p)))
  }

  /**
   * One tap fills the whole row from a remembered player: name and colour.
   * The saved colour yields if a rival is already holding it — two regulars
   * who both saved red still get a legal table, and the one who tapped
   * second keeps the colour their row already had.
   */
  const applyProfile = (index: number, profile: PlayerProfile): void => {
    setPlayers((prev) => {
      const usedByOthers = prev.filter((_, i) => i !== index).map((p) => p.color)
      return prev.map((p, i) =>
        i === index
          ? {
              ...p,
              name: profile.name,
              color: usedByOthers.includes(profile.color) ? p.color : profile.color,
            }
          : p,
      )
    })
  }

  const addPlayer = (): void => {
    if (players.length >= MAX_PLAYERS) return
    setPlayers((prev) => [
      ...prev,
      {
        name: `Player ${prev.length + 1}`,
        color: nextAvailableColor(prev.map((p) => p.color)),
        isCpu: false,
      },
    ])
  }

  const removePlayer = (index: number): void => {
    if (players.length <= MIN_PLAYERS) return
    setPlayers((prev) => prev.filter((_, i) => i !== index))
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
      editionId,
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

  return (
    <div className={styles.screen} onClickCapture={unlockAudioOnce}>
      {/* The build and its notes used to sit at the very bottom of a screen
          1,600px tall — present, but below the fold on every laptop, which is
          the same as absent. They live up here now. */}
      <div className={styles.buildBar}>
        <span className={styles.versionTag} title="The exact commit this build came from">{__APP_BUILD__}</span>
        <button type="button" className={styles.notesLink} onClick={() => setShowNotes(true)}>
          What&rsquo;s New
        </button>
      </div>

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

      <div className={styles.logoWrap}>
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

        <span className={styles.eyebrow} aria-hidden="true">
          A board game of chance &amp; ambition
        </span>
        <h1 className={styles.wordmark} data-text="LIFE JOURNEY">
          LIFE JOURNEY
        </h1>
        <p className={styles.tagline}>Roll, hop, and build a life worth bragging about.</p>
      </div>

      <section className={styles.setup} aria-label="Player setup">
        <div className={styles.setupHeading}>
          <span className={styles.setupLabel}>Choose your token</span>
          <span className={styles.setupCount}>
            {players.length} / {MAX_PLAYERS}
          </span>
        </div>

        <div className={styles.players}>
          {players.map((player, index) => {
            const usedByOthers = players.filter((_, i) => i !== index).map((p) => p.color)
            return (
              <div
                className={`${styles.playerRow} ${player.isCpu ? styles.playerRowCpu : ''}`}
                key={index}
                style={
                  {
                    '--pawn-light': `var(--player-${player.color}-light)`,
                    '--pawn-base': `var(--player-${player.color})`,
                    '--pawn-dark': `var(--player-${player.color}-dark)`,
                  } as CSSProperties
                }
              >
                <span className={`${styles.pawn} ${player.isCpu ? styles.pawnCpu : ''}`} aria-hidden="true">
                  <span className={styles.pawnHead} />
                  <span className={styles.pawnBase} />
                  {player.isCpu ? <span className={styles.cpuChip}>CPU</span> : null}
                </span>

                <div className={styles.playerFields}>
                  <div className={styles.playerFieldsTop}>
                    <input
                      className={styles.nameInput}
                      type="text"
                      value={player.name}
                      maxLength={18}
                      aria-label={`Player ${index + 1} name`}
                      onChange={(event) => updateName(index, event.target.value)}
                    />
                    <div
                      className={styles.swatches}
                      role="group"
                      aria-label={`Player ${index + 1} colour`}
                    >
                      {PLAYER_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`${styles.swatch} ${player.color === color ? styles.swatchSelected : ''}`}
                          style={
                            {
                              '--swatch-light': `var(--player-${color}-light)`,
                              '--swatch-color': `var(--player-${color})`,
                              '--swatch-dark': `var(--player-${color}-dark)`,
                            } as CSSProperties
                          }
                          aria-label={color}
                          aria-pressed={player.color === color}
                          disabled={usedByOthers.includes(color)}
                          onClick={() => updateColor(index, color)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* One tap re-seats a regular: name and colour. Absent
                      entirely on a first-ever run — a strip of nobody is
                      noise — and on a computer seat, which has no owner to
                      remember or recall. */}
                  {profiles.length > 0 && !player.isCpu ? (
                    <div
                      className={styles.recentRow}
                      role="group"
                      aria-label={`Player ${index + 1} recent players`}
                    >
                      <span className={styles.recentLabel} aria-hidden="true">
                        Recent
                      </span>
                      {profiles.map((profile) => (
                        <button
                          key={profile.name.trim().toLowerCase()}
                          type="button"
                          className={styles.recentChip}
                          style={
                            {
                              '--chip-base': `var(--player-${profile.color})`,
                              '--chip-dark': `var(--player-${profile.color}-dark)`,
                            } as CSSProperties
                          }
                          onClick={() => applyProfile(index, profile)}
                        >
                          <span className={styles.recentDot} aria-hidden="true" />
                          {profile.name}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <div
                    className={styles.seatToggle}
                    role="group"
                    aria-label={`Player ${index + 1} seat type`}
                  >
                    <button
                      type="button"
                      className={`${styles.seatOption} ${!player.isCpu ? styles.seatSelected : ''}`}
                      aria-pressed={!player.isCpu}
                      onClick={() => updateIsCpu(index, false)}
                    >
                      Human
                    </button>
                    <button
                      type="button"
                      className={`${styles.seatOption} ${player.isCpu ? styles.seatSelected : ''}`}
                      aria-pressed={player.isCpu}
                      onClick={() => updateIsCpu(index, true)}
                    >
                      CPU
                    </button>
                  </div>
                </div>

                {players.length > MIN_PLAYERS ? (
                  <button
                    type="button"
                    className={styles.removeButton}
                    aria-label={`Remove player ${index + 1}`}
                    onClick={() => removePlayer(index)}
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            )
          })}
        </div>

        <div className={styles.actionsRow}>
          <ChunkyButton
            variant="secondary"
            size="sm"
            icon="plus"
            disabled={players.length >= MAX_PLAYERS}
            onClick={addPlayer}
          >
            Add player
          </ChunkyButton>
        </div>
      </section>

      {/* Which country's board the game is played on. Hidden while there is
          only one edition to name — a picker with one option is a label. */}
      {editions.length > 1 ? (
        <section className={styles.editionSection} aria-label="Edition">
          <div className={styles.setupHeading}>
            <span className={styles.setupLabel}>Edition</span>
          </div>
          <div className={styles.editionGroup} role="group" aria-label="Edition">
            {editions.map((edition) => (
              <button
                key={edition.id}
                type="button"
                className={`${styles.editionOption} ${editionId === edition.id ? styles.editionSelected : ''}`}
                aria-pressed={editionId === edition.id}
                aria-label={`${editionDisplayName(edition)} edition, counts in ${edition.currency.symbol}`}
                onClick={() => setEditionId(edition.id)}
              >
                <span className={styles.editionLabel} aria-hidden="true">
                  {editionDisplayName(edition)}
                </span>
                <span className={styles.editionHint} aria-hidden="true">
                  counts in {edition.currency.symbol}
                </span>
              </button>
            ))}
          </div>
          <p className={styles.editionDetail}>{editionBlurb(editionFor(editionId))}</p>
        </section>
      ) : null}

      <section className={styles.difficultySection} aria-label="Difficulty">
        <div className={styles.setupHeading}>
          <span className={styles.setupLabel}>Difficulty</span>
        </div>
        <div className={styles.difficultyGroup} role="group" aria-label="Difficulty">
          {DIFFICULTIES.map((value) => {
            const copy = DIFFICULTY_COPY[value]
            return (
              <button
                key={value}
                type="button"
                className={`${styles.difficultyOption} ${difficulty === value ? styles.difficultySelected : ''}`}
                style={
                  {
                    '--pick-base': `var(--candy-${copy.tone})`,
                    '--pick-dark': `var(--candy-${copy.tone}-dark)`,
                  } as CSSProperties
                }
                aria-pressed={difficulty === value}
                aria-label={copy.aria}
                onClick={() => setDifficulty(value)}
              >
                <span className={styles.difficultyLabel} aria-hidden="true">
                  {copy.label}
                </span>
                <span className={styles.difficultyHint} aria-hidden="true">
                  {copy.hint}
                </span>
              </button>
            )
          })}
        </div>
        <p
          className={styles.difficultyDetail}
          style={
            { '--pick-detail': `var(--candy-${DIFFICULTY_COPY[difficulty].tone}-dark)` } as CSSProperties
          }
        >
          {DIFFICULTY_COPY[difficulty].detail}
        </p>
      </section>

      <div className={styles.cta}>
        {/* Roughly how long this table will sit, priced from the seat mix and
            difficulty — see estimatePlaytime.ts for where every figure comes
            from. Recomputed on render, so it tracks each row and picker the
            way the difficulty detail line does. */}
        <p className={styles.playtimeHint}>
          {estimatePlaytime(
            players.filter((p) => !p.isCpu).length,
            players.filter((p) => p.isCpu).length,
            difficulty,
          )}
        </p>
        <ChunkyButton variant="primary" size="lg" icon="rocket" fullWidth onClick={handleStart}>
          Start Game
        </ChunkyButton>
      </div>

      <section className={styles.slotsSection} aria-label="Saved games">
        <div className={styles.setupHeading}>
          <span className={styles.setupLabel}>Continue a game</span>
        </div>
        <div className={styles.slotsGrid}>
          {slots.map((slot) => {
            const isAutosave = slot.slot === AUTOSAVE_SLOT
            const title = isAutosave ? 'Autosave' : `Slot ${slot.slot}`
            // Four slots against five countries: without this, two half-finished
            // games are the same three names and a turn number.
            const slotEdition = slot.editionId === null ? null : editionDisplayName(editionFor(slot.editionId))
            const label = slot.occupied
              ? `Continue ${title}: ${slot.playerNames.join(' and ')}${slotEdition === null ? '' : ` on the ${slotEdition} board`}, turn ${slot.turn ?? '?'}, saved ${formatSlotTimestamp(slot.savedAt ?? '')}`
              : `${title}, empty`
            return (
              <button
                key={slot.slot}
                type="button"
                className={`${styles.slotCard} ${slot.occupied ? '' : styles.slotEmpty}`}
                disabled={!slot.occupied}
                aria-label={label}
                onClick={() => handleContinue(slot)}
              >
                <span className={styles.slotTitle}>{title}</span>
                {slot.occupied ? (
                  <>
                    <span className={styles.slotPlayers}>{slot.playerNames.join(' & ')}</span>
                    <span className={styles.slotMeta}>
                      {slotEdition === null ? null : `${slotEdition} · `}Turn {slot.turn} ·{' '}
                      {formatSlotTimestamp(slot.savedAt ?? '')}
                    </span>
                  </>
                ) : (
                  <span className={styles.slotEmptyLabel}>Empty</span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {records.length > 0 ? (
        <div className={styles.recordsRow}>
          <ChunkyButton variant="ghost" size="md" icon="ribbon" onClick={() => setShowRecords(true)}>
            Hall of Records
          </ChunkyButton>
        </div>
      ) : null}

      <div className={styles.audioRow}>
        <AudioToggle />
      </div>
    </div>
  )
}
