import type { ReactElement } from 'react'
import type { Edition } from '@domain/edition/types'
import { editionDisplayName } from '../../format'
import { useUi } from '../../i18n/LocaleProvider'
import { StepFrame } from './StepFrame'
import { editionSalarySentence } from './setupDraft'
import styles from './TitleScreen.module.css'

export interface LifeStepProps {
  /** The country board just chosen — the classic life, and the default. */
  readonly country: Edition
  /** The researcher board set in that same country. This step is not built without one. */
  readonly researcherEdition: Edition
  readonly researcher: boolean
  readonly onChoose: (researcher: boolean) => void
  readonly stepNumber: number
  readonly stepCount: number
  readonly onBack: () => void
  readonly backLabel: string
  readonly onNext: () => void
}

/**
 * --- the second axis -------------------------------------------------------
 *
 * Which *life* is played in the country just chosen.
 *
 * The researcher boards used to be cards on the country grid, which read as a
 * claim that "Researcher — Japan" is a place — and put Japan on that screen
 * twice. `docs/researcher-edition-concept.md` §7 and §10 say what they
 * actually are: a different life, crossed with a country, on a second axis.
 * This screen is that axis, asked as its own question and only where there is
 * a question to ask — a country with no researcher board never reaches here
 * (see `researcherEditionFor`), so nothing on this screen is ever a dead end
 * or a disabled tease.
 *
 * The owner's constraint from #7 and #8 applies harder here than anywhere:
 * **the classic board must not read as declining an upsell.** So the classic
 * life is a card of exactly the same size, in the same grid, in the first and
 * default position, carrying its own figures — not a "No thanks" under a
 * banner. Neither card is a yes and neither is a no; both are lives, both are
 * the full game, and the step is skipped entirely rather than defaulted
 * through when only one exists.
 *
 * Both detail lines are derived from the boards' own data. The two share a
 * currency and a starting purse by construction — they are the same country —
 * so what each card quotes is the one figure that genuinely differs: what the
 * work on that board pays.
 */
export function LifeStep({
  country,
  researcherEdition,
  researcher,
  onChoose,
  stepNumber,
  stepCount,
  onBack,
  backLabel,
  onNext,
}: LifeStepProps): ReactElement {
  const t = useUi()
  const place = editionDisplayName(country, t)

  const options = [
    {
      key: 'classic',
      chosen: !researcher,
      name: t.life.classicName,
      hint: t.life.classicHint(place),
      detail: t.life.classicDetail(editionSalarySentence(country, t)),
      onClick: () => onChoose(false),
    },
    {
      key: 'researcher',
      chosen: researcher,
      name: t.life.researcherName,
      hint: t.life.researcherHint,
      detail: t.life.researcherDetail(place, editionSalarySentence(researcherEdition, t)),
      onClick: () => onChoose(true),
    },
  ] as const

  return (
    <StepFrame
      stepNumber={stepNumber}
      stepCount={stepCount}
      heading={t.life.heading(place)}
      lead={t.life.lead(place)}
      onBack={onBack}
      backLabel={backLabel}
      primary={{ label: t.life.next, onClick: onNext }}
    >
      <div className={styles.choiceGrid} role="group" aria-label={t.life.groupLabel}>
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`${styles.choiceCard} ${option.chosen ? styles.choiceSelected : ''}`}
            aria-pressed={option.chosen}
            aria-label={t.life.cardAria(option.name, place, option.detail)}
            onClick={option.onClick}
          >
            <span className={styles.choiceName} aria-hidden="true">
              {option.name}
            </span>
            <span className={styles.choiceHint} aria-hidden="true">
              {option.hint}
            </span>
            <span className={styles.choiceDetail} aria-hidden="true">
              {option.detail}
            </span>
          </button>
        ))}
      </div>
    </StepFrame>
  )
}
