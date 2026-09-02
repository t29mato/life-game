import { type ReactElement } from 'react'

import type { RollOfferRow, RollTableRow } from '@domain/model/types'
import { GameIcon } from '../../icons/GameIcon'
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

  const className = [styles.table, compact ? styles.compact : '', dealsJobs ? styles.columns : '']
    .filter(Boolean)
    .join(' ')

  return (
    <table className={className}>
      <thead>
        {dealsJobs ? (
          <tr>
            <th scope="col">Roll</th>
            <th scope="col">Career</th>
            <th scope="col" className={styles.pay}>
              Per {period}
            </th>
            {showRung ? (
              <th scope="col" className={styles.rung}>
                Rung
              </th>
            ) : null}
          </tr>
        ) : (
          <tr>
            <th scope="col">Roll</th>
            <th scope="col">Outcome</th>
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
