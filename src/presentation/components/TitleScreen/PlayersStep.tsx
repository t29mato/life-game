import type { CSSProperties, Dispatch, ReactElement, SetStateAction } from 'react'
import type { PlayerColor } from '@domain/model/types'
import type { PlayerProfile } from '@application/ports/PlayerProfileRepositoryPort'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import { PLAYER_COLORS } from '../Pawn/designs'
import { StepFrame } from './StepFrame'
import { MAX_PLAYERS, MIN_PLAYERS, nextAvailableColor, type DraftPlayer } from './setupDraft'
import styles from './TitleScreen.module.css'

export interface PlayersStepProps {
  readonly players: readonly DraftPlayer[]
  readonly setPlayers: Dispatch<SetStateAction<DraftPlayer[]>>
  /** The remembered regulars, most recent first. Empty on a first-ever run. */
  readonly profiles: readonly PlayerProfile[]
  readonly stepNumber: number
  readonly stepCount: number
  readonly onBack: () => void
  readonly onNext: () => void
}

/**
 * Step one: who is at the table.
 *
 * The tray itself is unchanged from the old single-page form — the pawns, the
 * name plates, the twelve colours, the Human/CPU switch and the one-tap recall
 * of a regular are all the same controls doing the same things. What changed
 * is that they are now the *only* thing on screen, so the tray gets the room
 * it always wanted and the forward button is never below the fold.
 */
export function PlayersStep({
  players,
  setPlayers,
  profiles,
  stepNumber,
  stepCount,
  onBack,
  onNext,
}: PlayersStepProps): ReactElement {
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
    setPlayers((prev) => {
      if (prev.length >= MAX_PLAYERS) return prev
      return [
        ...prev,
        {
          name: `Player ${prev.length + 1}`,
          color: nextAvailableColor(prev.map((p) => p.color)),
          isCpu: false,
        },
      ]
    })
  }

  const removePlayer = (index: number): void => {
    setPlayers((prev) => (prev.length <= MIN_PLAYERS ? prev : prev.filter((_, i) => i !== index)))
  }

  return (
    <StepFrame
      stepNumber={stepNumber}
      stepCount={stepCount}
      heading="Who's playing?"
      lead="Two to four seats. Name them, pick a token, and hand any seat to the computer."
      onBack={onBack}
      backLabel="Back to title"
      primary={{ label: 'Next: the country', onClick: onNext }}
    >
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
                  <div className={styles.swatches} role="group" aria-label={`Player ${index + 1} colour`}>
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

                <div className={styles.seatToggle} role="group" aria-label={`Player ${index + 1} seat type`}>
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
    </StepFrame>
  )
}
