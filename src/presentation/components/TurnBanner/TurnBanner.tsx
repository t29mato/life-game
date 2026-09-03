import type { CSSProperties, ReactElement } from 'react'
import { motion } from 'framer-motion'
import type { Player } from '@domain/model/types'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useUi } from '../../i18n/LocaleProvider'
import styles from './TurnBanner.module.css'

export interface TurnBannerProps {
  readonly player: Player
  readonly turn: number
}

/**
 * "Ada's turn!" — a band that slides across the top of the board and leaves
 * again, with nothing to press.
 *
 * The quiet half of the same job `TurnHandoff` does loudly. That card exists
 * because a table sharing one screen has to physically pass the device, and
 * for a genuine human-to-human handoff it is exactly right: full stop, big
 * token, the incoming player's own colour, and a button that says the device
 * is now theirs. But it was interrupting *every* turn, including the ones
 * where nothing changes hands — the turn after a computer seat's, where the
 * same person is picking the same device back up — and a full-screen modal
 * asking permission to continue is a strange thing to meet when nobody has
 * moved. So a turn with no handoff in it gets this instead: the same
 * information, announced rather than negotiated.
 *
 * `role="status"` and not a dialog: it is not waiting on anybody, and a
 * screen reader should hear whose turn it is without being trapped in it.
 * The parent owns how long it stays (`TEMPO.turnBannerMs`) — the banner has
 * no opinion about time, only about how it arrives.
 */
export function TurnBanner({ player, turn }: TurnBannerProps): ReactElement {
  const reduceMotion = usePrefersReducedMotion()
  const t = useUi()

  const colorVars = {
    '--player-base': `var(--player-${player.color})`,
    '--player-light': `var(--player-${player.color}-light)`,
    '--player-dark': `var(--player-${player.color}-dark)`,
  } as CSSProperties

  return (
    // The colour vars sit on a `display: contents` holder rather than on the
    // motion element: framer-motion's `style` typing rejects a bare
    // `CSSProperties` under `exactOptionalPropertyTypes`. `EventCard` puts
    // its own tone vars on a backdrop for the same reason.
    <div className={styles.holder} style={colorVars}>
    <motion.div
      className={styles.banner}
      role="status"
      initial={reduceMotion ? false : { opacity: 0, y: -28, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 26 }}
    >
      <span className={styles.pip} aria-hidden="true">
        {player.name.charAt(0).toUpperCase()}
      </span>
      <span className={styles.text}>
        <span className={styles.turn}>{t.common.turn(turn)}</span>
        <span className={styles.name}>{t.turn.playersTurn(player.name)}</span>
      </span>
    </motion.div>
    </div>
  )
}
