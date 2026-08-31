import type { CSSProperties, ReactElement } from 'react'
import type { EditionId, Player, PlayerId } from '@domain/model/types'
import { editionFor } from '@domain/edition/registry'
import { formatMoney, formatOrdinal } from '../../format'
import { UiIcon } from '../../icons/ui'
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
  /** Opens the full per-seat breakdown — `StatusModal`, in practice. */
  readonly onOpenStatus: () => void
}

/**
 * Every seat on one band at the foot of the screen. This is a glance, not a
 * report: who is at the table (the coloured dome and name), whose turn it is
 * (that seat lights in its own colour), and how each wallet stands (cash,
 * the number that moves when something happens, plus the live ordinal).
 * Everything else the old rail cards spelled out — career, net worth's own
 * breakdown, tiles, policies — lives one press away: the whole strip is a
 * single button, and pressing anywhere on it opens `StatusModal`.
 */
export function PlayerStrip({
  players,
  currentPlayerIndex,
  standings,
  editionId,
  onOpenStatus,
}: PlayerStripProps): ReactElement {
  const { currency } = editionFor(editionId)
  const money = (amount: number): string => formatMoney(amount, currency)

  return (
    <button
      type="button"
      className={styles.strip}
      // The strip's contents are a wall of names and figures — as an
      // accessible name they would bury what the control actually does, so
      // the label says that instead. The modal it opens is the readable view
      // of every fact abbreviated here.
      aria-label="Players — open full status"
      aria-haspopup="dialog"
      onClick={onOpenStatus}
    >
      {players.map((player, index) => {
        const colorVars = {
          '--seat-base': `var(--player-${player.color})`,
          '--seat-light': `var(--player-${player.color}-light)`,
          '--seat-dark': `var(--player-${player.color}-dark)`,
        } as CSSProperties
        const rank = standings.get(player.id)?.rank
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
            </span>
            {player.isRetired ? (
              <span className={styles.retired}>Retired</span>
            ) : rank !== undefined ? (
              <span className={styles.rank}>{formatOrdinal(rank)}</span>
            ) : null}
          </span>
        )
      })}
      {/* The one hint that the band is pressable at all — the seats read as
          passive chips, and a control nobody discovers may as well not
          exist. Decorative to AT: the button's own label already says it. */}
      <span className={styles.open} aria-hidden="true">
        <UiIcon name="wallet" size={15} />
        <span className={styles.openLabel}>Status</span>
      </span>
    </button>
  )
}
