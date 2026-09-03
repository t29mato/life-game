import type { ReactElement } from 'react'
import type { EditionId } from '@domain/model/types'
import type { Edition } from '@domain/edition/types'
import { editionDisplayName } from '../../format'
import { StepFrame } from './StepFrame'
import { editionBlurb } from './setupDraft'
import styles from './TitleScreen.module.css'

export interface CountryStepProps {
  readonly editions: readonly Edition[]
  readonly editionId: EditionId
  readonly onChoose: (id: EditionId) => void
  readonly stepNumber: number
  readonly stepCount: number
  readonly onBack: () => void
  readonly onNext: () => void
}

/**
 * Step two: which country's board the evening is played on.
 *
 * This screen carries an explicit constraint from the owner, recorded on #7:
 * the classic country boards are not a legacy option and must never read as
 * one. So the country is a *step of its own* rather than a strip of tabs
 * buried between the token tray and the difficulty picker — five cards, all
 * the same size, each carrying the same three facts drawn from its own data
 * (what it counts in, what you start with, what the work pays). There is no
 * "and others" card, no disclosure triangle, and no country that needs one
 * more tap than another to reach.
 *
 * The one visual difference between cards is the amber stamp on the chosen
 * one, which follows the player's press rather than the shelf's order.
 */
export function CountryStep({
  editions,
  editionId,
  onChoose,
  stepNumber,
  stepCount,
  onBack,
  onNext,
}: CountryStepProps): ReactElement {
  return (
    <StepFrame
      stepNumber={stepNumber}
      stepCount={stepCount}
      heading="Where are you living it?"
      lead="Each country counts in its own money and pays its own wages. Every board is the full game."
      onBack={onBack}
      backLabel="Back to the players"
      primary={{ label: 'Next: the difficulty', onClick: onNext }}
    >
      <div className={styles.choiceGrid} role="group" aria-label="Edition">
        {editions.map((edition) => {
          const blurb = editionBlurb(edition)
          return (
            <button
              key={edition.id}
              type="button"
              className={`${styles.choiceCard} ${editionId === edition.id ? styles.choiceSelected : ''}`}
              aria-pressed={editionId === edition.id}
              /* The card's own sentence, spoken. The blurb used to sit outside
                 the buttons as a `<p>` about whichever one was selected, which
                 read fine but meant a card announced nothing but a place name
                 until it was already chosen. It rides in the label now, so a
                 screen reader hears the same three facts a sighted player
                 compares the cards on. */
              aria-label={`${editionDisplayName(edition)} edition. ${blurb}`}
              onClick={() => onChoose(edition.id)}
            >
              <span className={styles.choiceName} aria-hidden="true">
                {editionDisplayName(edition)}
              </span>
              <span className={styles.choiceHint} aria-hidden="true">
                counts in {edition.currency.symbol}
              </span>
              <span className={styles.choiceDetail} aria-hidden="true">
                {blurb}
              </span>
            </button>
          )
        })}
      </div>
    </StepFrame>
  )
}
