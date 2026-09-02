import type { ReactElement } from 'react'
import { AUTOSAVE_SLOT, type SaveSlotInfo } from '@application/ports/GameRepositoryPort'
import { editionFor } from '@domain/edition/registry'
import { editionDisplayName } from '../../format'
import { usePrimaryAction } from '../../hooks/usePrimaryAction'
import { StepFrame } from './StepFrame'
import { formatSlotTimestamp } from './setupDraft'
import styles from './TitleScreen.module.css'

export interface ContinueStepProps {
  readonly slots: readonly SaveSlotInfo[]
  readonly onContinue: (slot: SaveSlotInfo) => void
  readonly onBack: () => void
}

/**
 * The door marked "Continue": every save the game holds, on one screen.
 *
 * Not a step of the new-game flow — it is the *other* branch off the title,
 * and it has no forward button of its own because the choices here are the
 * forward action. So the A button is bound to the newest occupied slot rather
 * than to a Next, which is what a console does: press A twice from a cold
 * start and you are back where you left off.
 */
export function ContinueStep({ slots, onContinue, onBack }: ContinueStepProps): ReactElement {
  /*
   * Which card the A button presses. Ordered by `savedAt` rather than by slot
   * number, because "the game I was just playing" is what a player means by
   * Continue — slot 3 saved a minute ago beats an autosave from last week.
   */
  const newest = [...slots]
    .filter((slot) => slot.occupied)
    .sort((a, b) => (b.savedAt ?? '').localeCompare(a.savedAt ?? ''))[0]
  const primaryRef = usePrimaryAction<HTMLButtonElement>(newest !== undefined)

  return (
    <StepFrame
      stepNumber={null}
      stepCount={0}
      heading="Continue a game"
      lead="Pick up any table that was left mid-journey."
      onBack={onBack}
      backLabel="Back to title"
    >
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
              {...(newest !== undefined && newest.slot === slot.slot ? { ref: primaryRef } : {})}
              onClick={() => onContinue(slot)}
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
    </StepFrame>
  )
}
