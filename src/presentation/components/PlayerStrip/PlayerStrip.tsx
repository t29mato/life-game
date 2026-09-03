import type { CSSProperties, ReactElement } from 'react'
import type { Difficulty, EditionId, Player, PlayerId } from '@domain/model/types'
import { editionFor } from '@domain/edition/registry'
import { loanRepaymentFor } from '@domain/rules/difficulty'
import { formatMoney, formatOrdinal } from '../../format'
import { UiIcon } from '../../icons/ui'
import { useUi } from '../../i18n/LocaleProvider'
import { RollingNumber } from '../RollingNumber/RollingNumber'
import type { Standing } from '@domain/rules/standing'
import styles from './PlayerStrip.module.css'

export interface PlayerStripProps {
  readonly players: readonly Player[]
  readonly currentPlayerIndex: number
  /**
   * Live standings keyed by seat, exactly as `rankPlayers` computes them —
   * priced at the table's own difficulty and edition, so the ordinal here can
   * never disagree with the modal a press on this strip opens.
   */
  readonly standings: ReadonlyMap<PlayerId, Standing>
  /**
   * Which edition's money each wallet is counted in. Optional, defaulting to
   * the original board, on the usual terms: nothing that does not care about
   * editions has to know.
   */
  readonly editionId?: EditionId
  /**
   * What this table settles a loan at — the difference between a debt badge
   * that reads $75,000 and one that reads $138,000. Same default as
   * everywhere else this is optional.
   */
  readonly difficulty?: Difficulty
  /** Opens the full per-seat breakdown — `StatusModal`, in practice. */
  readonly onOpenStatus: () => void
}

/**
 * Every seat on one band at the foot of the screen. This is a glance, not a
 * report: who is at the table (the coloured dome and name), whose turn it is
 * (that seat lights in its own colour), and how each wallet stands.
 *
 * "How each wallet stands" used to mean cash and an ordinal, and that was a
 * band that lied by omission: the ordinal is decided by *net worth*, so a
 * player holding $12,000 wore a "1st" next to a player holding $18,000 and
 * nothing on screen accounted for the difference — the −$75,000 of loans
 * that did it was a modal away. A rank is not allowed to come out of a
 * calculation the player cannot see, so the figure it is actually computed
 * from is printed under the cash, and a debt heavy enough to move it wears
 * its own red tag. Everything else — career, tiles, policies, each holding
 * itemised — still lives one press away: the whole strip is a single button,
 * and pressing anywhere on it opens `StatusModal`.
 */
export function PlayerStrip({
  players,
  currentPlayerIndex,
  standings,
  editionId,
  difficulty = 'normal',
  onOpenStatus,
}: PlayerStripProps): ReactElement {
  const t = useUi()
  const edition = editionFor(editionId)
  const { currency } = edition
  const money = (amount: number): string => formatMoney(amount, currency)
  const loanSettlement = loanRepaymentFor(difficulty, edition)

  return (
    <button
      type="button"
      className={styles.strip}
      // The strip's contents are a wall of names and figures — as an
      // accessible name they would bury what the control actually does, so
      // the label says that instead. The modal it opens is the readable view
      // of every fact abbreviated here.
      aria-label={t.strip.aria}
      aria-haspopup="dialog"
      onClick={onOpenStatus}
    >
      {players.map((player, index) => {
        const colorVars = {
          '--seat-base': `var(--player-${player.color})`,
          '--seat-light': `var(--player-${player.color}-light)`,
          '--seat-dark': `var(--player-${player.color}-dark)`,
        } as CSSProperties
        const standing = standings.get(player.id)
        const rank = standing?.rank
        const owed = player.loans * loanSettlement
        /*
         * The whole rank, in one sentence, for a hover or a long press —
         * the same three figures the two visible lines carry, said in the
         * order they add up. A `title` rather than a custom popover because
         * this band is already one button: anything focusable inside it
         * would be a second control where the player expects one.
         */
        const breakdown =
          rank === undefined || standing === undefined
            ? undefined
            : t.strip.breakdownJoin([
                t.strip.rankOn(formatOrdinal(rank, t), money(standing.netWorth)),
                t.strip.cash(money(player.money)),
                ...(player.loans > 0 ? [t.strip.loansToSettle(player.loans, money(owed))] : []),
                t.strip.plusTheRest,
              ])
        return (
          <span
            key={player.id}
            className={index === currentPlayerIndex ? `${styles.seat} ${styles.active}` : styles.seat}
            style={colorVars}
          >
            <span className={styles.dome} aria-hidden="true">
              {player.name.charAt(0).toUpperCase()}
            </span>
            <span className={styles.facts}>
              <span className={styles.name}>{player.name}</span>
              <RollingNumber
                className={player.money < 0 ? `${styles.cash} ${styles.debt}` : styles.cash}
                value={player.money}
                format={money}
              />
              {/* The number the ordinal beside it is actually sorted on.
                  Labelled, because an unlabelled second figure under a
                  wallet is just a second wallet. */}
              {standing !== undefined ? (
                <span className={styles.worth}>
                  <span className={styles.worthLabel}>{t.strip.worth}</span>
                  <RollingNumber
                    className={standing.netWorth < 0 ? `${styles.worthValue} ${styles.debt}` : styles.worthValue}
                    value={standing.netWorth}
                    format={money}
                  />
                </span>
              ) : null}
            </span>
            <span className={styles.badges}>
              {player.isRetired ? (
                <span className={styles.retired}>{t.strip.retired}</span>
              ) : rank !== undefined ? (
                <span className={styles.rank} title={breakdown}>
                  {formatOrdinal(rank, t)}
                </span>
              ) : null}
              {/* The one holding that can make a rank look wrong, and the
                  only one that is invisible in a wallet: debt. Red, and
                  priced at what it actually takes to clear rather than at
                  how many pieces of paper it is. */}
              {player.loans > 0 ? (
                <span
                  className={styles.loans}
                  title={t.strip.loansTitle(player.loans, money(owed))}
                >
                  −{money(owed)}
                </span>
              ) : null}
            </span>
          </span>
        )
      })}
      {/* The one hint that the band is pressable at all — the seats read as
          passive chips, and a control nobody discovers may as well not
          exist. Decorative to AT: the button's own label already says it. */}
      <span className={styles.open} aria-hidden="true">
        <UiIcon name="wallet" size={15} />
        <span className={styles.openLabel}>{t.strip.status}</span>
      </span>
    </button>
  )
}
