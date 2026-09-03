import { type ReactElement } from 'react'

import type { RollOfferRow, RollTableRow } from '@domain/model/types'
import { GameIcon } from '../../icons/GameIcon'
import { useUi } from '../../i18n/LocaleProvider'
import { CareerPlaque } from '../CareerPlaque/CareerPlaque'
import { isCareerIcon } from '../CareerPlaque/families'
import styles from './RollTable.module.css'

export interface RollTableProps {
  readonly rows: readonly RollTableRow[]
  /** Sized down to sit inside one option row rather than a whole card. */
  readonly compact?: boolean
}

/** A face that deals a job rather than a sum — see `RollOfferRow`. */
function isOffer(row: RollTableRow): row is RollOfferRow {
  return 'career' in row
}

/**
 * Above this many money rows, the table is set tighter.
 *
 * Four is where the two shapes part company. A tuition bill deals four bands
 * and a career fair two, and both are a glance at the base sizing. A die that
 * pays per pip deals one row per face — six of them — and six rows at that
 * sizing is 250-odd pixels of table wedged between the card's stakes line and
 * the die the player came here to press, which on a phone pushes the die off
 * the bottom of the screen.
 *
 * The obvious way to buy that height back is to lay the six faces out side by
 * side, and it does not survive contact with the editions: the widest sum a
 * die can deal is ₹6,00,00,000 in India and ¥60,000,000 in Japan — twelve and
 * eleven characters — and six of those in a row want a screen no phone has.
 * So the rows stay stacked and lose their leading instead.
 */
const DENSE_ABOVE_ROWS = 4

/**
 * The die's own outcome table — what each face is actually worth, as rows a
 * player scans once. One component for both homes it has (`EventSpinModal`'s
 * whole-card panel, `DecisionModal`'s in-option insert, which used to carry
 * a hand copy each of the same sunken-panel CSS) so a row that carries art
 * carries it in both places for free.
 *
 * A die that deals money keeps the quiet two columns it always had. A die
 * that deals *jobs* gets a column per fact — the trade with its plaque, the
 * pay, and the rung — because that is what a career fair is actually asking:
 * not "read these two sentences", but "which of these two numbers, at which
 * of these two heights". The columns come from the rows themselves, so the
 * pay heading reads "Per payday" or "Per month" wherever an edition says so,
 * and the rung column simply is not built when neither offer has one (a
 * calling, a one-rung trade) rather than standing there full of dashes.
 */
export function RollTable({ rows, compact = false }: RollTableProps): ReactElement {
  const t = useUi()
  const offers = rows.filter(isOffer)
  const dealsJobs = offers.length > 0
  // Every offer in one table is quoted by the same period — it is the
  // edition's, not the trade's — so the heading is read off whichever row
  // came first rather than repeated in every cell underneath it.
  const period = offers[0]?.period ?? ''
  const showRung = offers.some((row) => row.rung !== undefined)
  // What a plain money band has to span if it ever shares a table with
  // offers. No die in the game mixes them; this only keeps such a row from
  // sliding silently under the wrong heading if one ever does.
  const spannedColumns = showRung ? 3 : 2

  // A die with a row per face, rather than two or four bands — see
  // `DENSE_ABOVE_ROWS`. Decided here, off the rows themselves, because how
  // tall a table is allowed to be is a question about the screen and nothing
  // the layer that priced the payouts could answer.
  const dense = !dealsJobs && rows.length > DENSE_ABOVE_ROWS

  const className = [
    styles.table,
    compact ? styles.compact : '',
    dealsJobs ? styles.columns : '',
    dense ? styles.dense : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <table className={className}>
      {/* Read out before the columns are, so a screen reader reaches the
          first "1 … ¥750,000" already knowing it is listening to a die and
          not to a price list. Silent on screen: the card above has just said
          all of this in words. */}
      <caption className="visually-hidden">{t.rollTable.caption}</caption>
      <thead>
        {dealsJobs ? (
          <tr>
            <th scope="col">{t.rollTable.roll}</th>
            <th scope="col">{t.rollTable.career}</th>
            <th scope="col" className={styles.pay}>
              {t.rollTable.per(t.format.unit(period))}
            </th>
            {showRung ? (
              <th scope="col" className={styles.rung}>
                {t.rollTable.rung}
              </th>
            ) : null}
          </tr>
        ) : (
          <tr>
            <th scope="col">{t.rollTable.roll}</th>
            <th scope="col">{t.rollTable.outcome}</th>
          </tr>
        )}
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.range}>
            <td>{row.range}</td>
            {isOffer(row) ? (
              <>
                <td>
                  <span className={styles.subject}>
                    {isCareerIcon(row.icon) ? (
                      <CareerPlaque icon={row.icon} size={compact ? 46 : 56} />
                    ) : (
                      <GameIcon name={row.icon} size={compact ? 40 : 48} />
                    )}
                    <span className={styles.subjectName}>{row.career}</span>
                  </span>
                </td>
                <td className={styles.pay}>{row.pay}</td>
                {showRung ? <td className={styles.rung}>{row.rung ?? '—'}</td> : null}
              </>
            ) : (
              <td colSpan={dealsJobs ? spannedColumns : 1}>{row.amount}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
