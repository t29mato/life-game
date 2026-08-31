import { type ReactElement } from 'react'

import type { RollTableRow } from '@domain/model/types'
import { GameIcon } from '../../icons/GameIcon'
import { CareerPlaque } from '../CareerPlaque/CareerPlaque'
import { isCareerIcon } from '../CareerPlaque/families'
import styles from './RollTable.module.css'

export interface RollTableProps {
  readonly rows: readonly RollTableRow[]
  /** Sized down to sit inside one option row rather than a whole card. */
  readonly compact?: boolean
}

/**
 * Splits `"Salon Apprentice ($29,750/payday, rung 1 of 3)"` into the name
 * and its bracketed terms, so an illustrated row can set the job's name
 * bold and its money quiet instead of one undifferentiated sentence. Same
 * bargain as `DecisionModal`'s `splitDetail`: typography over one display
 * string, never a second source of the facts inside it. A row with no
 * bracket — every tuition band — yields no terms and is printed as-is.
 */
function splitOutcome(amount: string): { readonly name: string; readonly terms: string | null } {
  const match = /^(.*\S)\s+\((.+)\)$/.exec(amount.trim())
  if (!match) return { name: amount.trim(), terms: null }
  return { name: match[1]!, terms: match[2]! }
}

/**
 * The die's own outcome table — what each face is actually worth, as rows a
 * player scans once. One component for both homes it has (`EventSpinModal`'s
 * whole-card panel, `DecisionModal`'s in-option insert, which used to carry
 * a hand copy each of the same sunken-panel CSS) so a row that carries art
 * carries it in both places for free.
 *
 * A row with an `icon` is dealing a *thing*, and shows it: a trade's plaque
 * beside its name, so a career fair's two futures are pictures rather than
 * prose. Rows without one — money bands — stay the quiet two columns they
 * always were.
 */
export function RollTable({ rows, compact = false }: RollTableProps): ReactElement {
  return (
    <table className={compact ? `${styles.table} ${styles.compact}` : styles.table}>
      <thead>
        <tr>
          <th scope="col">Roll</th>
          <th scope="col">Outcome</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const outcome = row.icon ? splitOutcome(row.amount) : null
          return (
            <tr key={row.range}>
              <td>{row.range}</td>
              <td>
                {row.icon && outcome ? (
                  <span className={styles.subject}>
                    {isCareerIcon(row.icon) ? (
                      <CareerPlaque icon={row.icon} size={compact ? 46 : 56} />
                    ) : (
                      <GameIcon name={row.icon} size={compact ? 40 : 48} />
                    )}
                    <span className={styles.subjectBody}>
                      <span className={styles.subjectName}>{outcome.name}</span>
                      {outcome.terms ? <span className={styles.subjectTerms}>{outcome.terms}</span> : null}
                    </span>
                  </span>
                ) : (
                  row.amount
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
