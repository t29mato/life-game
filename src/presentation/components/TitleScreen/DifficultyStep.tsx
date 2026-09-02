import type { CSSProperties, ReactElement } from 'react'
import type { Difficulty } from '@domain/model/types'
import { DIFFICULTIES } from '@domain/rules/difficulty'
import { StepFrame } from './StepFrame'
import { estimatePlaytime } from './estimatePlaytime'
import { DIFFICULTY_COPY, type DraftPlayer } from './setupDraft'
import styles from './TitleScreen.module.css'

export interface DifficultyStepProps {
  readonly difficulty: Difficulty
  readonly onChoose: (difficulty: Difficulty) => void
  readonly players: readonly DraftPlayer[]
  readonly stepNumber: number
  readonly stepCount: number
  readonly onBack: () => void
  readonly onStart: () => void
}

/**
 * Step three, and the last: how hard a life.
 *
 * The odds each card quotes are measured, not adjectives — see
 * `setupDraft.ts`. They used to be printed one at a time, under the picker,
 * for whichever level was selected; all three are on the table at once here,
 * because "close to a coin flip" is a fact you want *while comparing*, not
 * after committing.
 *
 * This is also where Start Game finally lives. The complaint that opened
 * issue #36 was that it was buried offscreen below five other sections; it is
 * the primary action of the last step now, one press from the bottom of a
 * screen with one decision on it, and Space or Enter presses it from anywhere.
 */
export function DifficultyStep({
  difficulty,
  onChoose,
  players,
  stepNumber,
  stepCount,
  onBack,
  onStart,
}: DifficultyStepProps): ReactElement {
  return (
    <StepFrame
      stepNumber={stepNumber}
      stepCount={stepCount}
      heading="How hard a life?"
      lead="The same board, dealt kinder or crueller. Every figure below was measured over seeded games."
      onBack={onBack}
      backLabel="Back to the country"
      primary={{ label: 'Start Game', icon: 'rocket', onClick: onStart }}
      aside={
        /* Roughly how long this table will sit, priced from the seat mix and
           difficulty — see estimatePlaytime.ts for where every figure comes
           from. Recomputed on render, so it tracks the chosen difficulty the
           way the cards themselves do. */
        <p className={styles.playtimeHint}>
          {estimatePlaytime(
            players.filter((p) => !p.isCpu).length,
            players.filter((p) => p.isCpu).length,
            difficulty,
          )}
        </p>
      }
    >
      <div className={styles.choiceGrid} role="group" aria-label="Difficulty">
        {DIFFICULTIES.map((value) => {
          const copy = DIFFICULTY_COPY[value]
          return (
            <button
              key={value}
              type="button"
              className={`${styles.choiceCard} ${difficulty === value ? styles.choiceSelected : ''}`}
              style={
                {
                  '--pick-base': `var(--candy-${copy.tone})`,
                  '--pick-dark': `var(--candy-${copy.tone}-dark)`,
                } as CSSProperties
              }
              aria-pressed={difficulty === value}
              aria-label={copy.aria}
              onClick={() => onChoose(value)}
            >
              <span className={styles.choiceName} aria-hidden="true">
                {copy.label}
              </span>
              <span className={styles.choiceHint} aria-hidden="true">
                {copy.hint}
              </span>
              <span className={styles.choiceDetail} aria-hidden="true">
                {copy.detail}
              </span>
            </button>
          )
        })}
      </div>
    </StepFrame>
  )
}
