import type { ReactElement } from 'react'
import type { EditionId } from '@domain/model/types'
import type { Edition } from '@domain/edition/types'
import { editionDisplayName } from '../../format'
import { useUi } from '../../i18n/LocaleProvider'
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
  const t = useUi()
  return (
    <StepFrame
      stepNumber={stepNumber}
      stepCount={stepCount}
      heading={t.country.heading}
      lead={t.country.lead}
      onBack={onBack}
      backLabel={t.country.backLabel}
      primary={{ label: t.country.next, onClick: onNext }}
    >
      <div className={styles.choiceGrid} role="group" aria-label={t.country.groupLabel}>
        {editions.map((edition) => {
          const blurb = editionBlurb(edition, t)
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
              aria-label={t.country.cardAria(editionDisplayName(edition, t), blurb)}
              onClick={() => onChoose(edition.id)}
            >
              <span className={styles.choiceName} aria-hidden="true">
                {editionDisplayName(edition, t)}
              </span>
              <span className={styles.choiceHint} aria-hidden="true">
                {t.country.countsIn(edition.currency.symbol)}
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
