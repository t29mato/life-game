import type { ReactElement } from 'react'
import type { EditionId } from '@domain/model/types'
import type { Edition } from '@domain/edition/types'
import { editionDisplayName } from '../../format'
import { useUi } from '../../i18n/LocaleProvider'
import { StepFrame } from './StepFrame'
import { editionBlurb, editionFacts, researcherEditionFor } from './setupDraft'
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
 * This screen carries an explicit constraint from the owner, recorded on #7
 * and #8: the classic country boards are not a legacy option and must never
 * read as one. So the country is a *step of its own* rather than a strip of
 * tabs buried between the token tray and the difficulty picker — one card per
 * country, all the same size, all reachable in one press. There is no "and
 * others" card, no disclosure triangle, and no country that needs one more tap
 * than another to reach.
 *
 * Two changes from the first cut of this screen, both from the same play
 * session:
 *
 * 1. **The figures are a table.** Every card used to carry its own derived
 *    paragraph — "counts in ¥ — start with ¥1,000,000; salaries run…" — five
 *    times over, in five different shapes, which is the hardest possible way
 *    to answer "which of these starts me with more?". The owner said so
 *    outright. The comparable facts are columns now, one row per country, the
 *    same markup and the same accessibility as `RollTable`: a real `<table>`,
 *    `<th scope="col">` headings, a visually-hidden caption. The cards stay
 *    the controls — the table compares, it does not choose — and each card
 *    still speaks its own sentence through `aria-label`, so a screen reader on
 *    a button hears what a sighted player reads across the row.
 * 2. **The researcher boards are gone from this grid**, because they were
 *    never countries: they sat here as siblings and put Japan on the screen
 *    twice. The table's last column says which countries have one, so the
 *    life step that follows for Japan and France is announced rather than
 *    sprung, and a country without one is honestly marked rather than
 *    silently short.
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
  // Where the forward button actually goes. A country with a researcher board
  // has one more question waiting; one without does not, and the button says
  // which — a primary action that names the wrong destination is worse than
  // one that names none.
  const nextIsLife = researcherEditionFor(editionId) !== undefined

  return (
    <StepFrame
      stepNumber={stepNumber}
      stepCount={stepCount}
      heading={t.country.heading}
      lead={t.country.lead}
      onBack={onBack}
      backLabel={t.backTo.players}
      primary={{ label: nextIsLife ? t.country.nextLife : t.country.next, onClick: onNext }}
    >
      <div className={styles.choiceGrid} role="group" aria-label={t.country.groupLabel}>
        {editions.map((edition) => {
          const researcher = researcherEditionFor(edition.id)
          /* The card's own sentence, spoken. The figures are printed in the
             table below rather than on the card, but a button whose whole
             accessible name is a place name tells a screen reader nothing it
             could compare, so the sentence rides in the label. */
          const blurb = `${editionBlurb(edition, t)}${
            researcher === undefined ? '' : ` ${t.country.alsoResearcher}`
          }`
          return (
            <button
              key={edition.id}
              type="button"
              className={`${styles.choiceCard} ${editionId === edition.id ? styles.choiceSelected : ''}`}
              aria-pressed={editionId === edition.id}
              /* The blurb used to sit outside the buttons as a `<p>` about
                 whichever one was selected, which read fine but meant a card
                 announced nothing but a place name until it was already
                 chosen. It rides in the label now, so a screen reader hears
                 the same facts a sighted player compares the cards on. */
              aria-label={t.country.cardAria(editionDisplayName(edition, t), blurb)}
              onClick={() => onChoose(edition.id)}
            >
              <span className={styles.choiceName} aria-hidden="true">
                {editionDisplayName(edition, t)}
              </span>
              <span className={styles.choiceHint} aria-hidden="true">
                {t.country.countsIn(edition.currency.symbol)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Wide content scrolls inside its own box rather than pushing the step
          sideways — four columns of money on a phone is wider than a phone. */}
      <div className={styles.compareScroll}>
        <table className={styles.compareTable}>
          <caption className="visually-hidden">{t.country.tableCaption}</caption>
          <thead>
            <tr>
              <th scope="col">{t.country.columnCountry}</th>
              <th scope="col" className={styles.compareFigure}>
                {t.country.columnStart}
              </th>
              <th scope="col" className={styles.compareFigure}>
                {t.country.columnSalaries}
              </th>
              <th scope="col">{t.country.columnResearcher}</th>
            </tr>
          </thead>
          <tbody>
            {editions.map((edition) => {
              const facts = editionFacts(edition)
              return (
                <tr
                  key={edition.id}
                  className={editionId === edition.id ? styles.compareRowOn : ''}
                >
                  <th scope="row">{editionDisplayName(edition, t)}</th>
                  <td className={styles.compareFigure}>{facts.start}</td>
                  <td className={styles.compareFigure}>{facts.salaries ?? '—'}</td>
                  {/* "Not yet" rather than a dash: three of the five countries
                      simply have no researcher board written, and saying so is
                      the honest reason the next step will not appear for them. */}
                  <td>
                    {researcherEditionFor(edition.id) === undefined
                      ? t.country.researcherNotYet
                      : t.country.researcherYes}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </StepFrame>
  )
}
