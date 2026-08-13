import type { CSSProperties, ReactElement } from 'react'
import { motion } from 'framer-motion'
import type { Player } from '@domain/model/types'
import { formatOrdinal } from '../../format'
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import styles from './TurnHandoff.module.css'

export interface TurnHandoffProps {
  readonly player: Player
  readonly turn: number
  readonly rank: number
  readonly totalPlayers: number
  readonly onReady: () => void
}

/**
 * Full-bleed "pass the device" beat between turns, printed in the incoming
 * player's own colour. Everyone at the table shares one screen, so this is
 * what stops a player from missing their own turn — it is impossible to
 * mistake for anything but a full stop.
 */
export function TurnHandoff({ player, turn, rank, totalPlayers, onReady }: TurnHandoffProps): ReactElement {
  // No `onEscape`: there is no valid way to cancel a handoff.
  const containerRef = useModalFocusTrap<HTMLDivElement>()
  const reduceMotion = usePrefersReducedMotion()

  const colorVars = {
    '--player-base': `var(--player-${player.color})`,
    '--player-light': `var(--player-${player.color}-light)`,
    '--player-dark': `var(--player-${player.color}-dark)`,
  } as CSSProperties

  const entrance = reduceMotion
    ? { initial: { opacity: 1, y: 0, scale: 1 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 46, scale: 0.94 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { type: 'spring' as const, stiffness: 320, damping: 27, mass: 1 },
      }

  return (
    <div className={styles.backdrop} style={colorVars}>
      <motion.div
        ref={containerRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="handoff-name"
        initial={entrance.initial}
        animate={entrance.animate}
        transition={entrance.transition}
      >
        <span className={styles.turnLabel}>Turn {turn}</span>

        <div className={styles.avatar} aria-hidden="true">
          <span className={styles.avatarInitial}>{player.name.charAt(0).toUpperCase()}</span>
        </div>

        <p className={styles.pass}>Pass the device to</p>
        {/* aria-live so screen-reader users hear who is up without hunting for it. */}
        <p className={styles.announce} aria-live="polite">
          <span id="handoff-name" className={styles.name}>
            {player.name}
          </span>
        </p>

        <p className={styles.rank}>
          In {formatOrdinal(rank)} place of {totalPlayers}
        </p>

        <div className={styles.action}>
          <ChunkyButton variant="primary" size="lg" fullWidth onClick={onReady}>
            I&rsquo;m ready
          </ChunkyButton>
        </div>
      </motion.div>
    </div>
  )
}
