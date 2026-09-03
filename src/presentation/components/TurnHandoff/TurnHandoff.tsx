import type { CSSProperties, ReactElement } from 'react'
import { motion } from 'framer-motion'
import type { Player } from '@domain/model/types'
import { formatOrdinal } from '../../format'
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { usePrimaryAction } from '../../hooks/usePrimaryAction'
import { useUi } from '../../i18n/LocaleProvider'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import styles from './TurnHandoff.module.css'

export interface TurnHandoffProps {
  readonly player: Player
  readonly turn: number
  readonly rank: number
  readonly onReady: () => void
  /**
   * Whether this card is set to open *every* human turn, or only the ones
   * where the device actually changes hands. Omitting both this and
   * `onAlwaysAskChange` hides the control entirely, which is what a caller
   * with no preference to offer should do.
   */
  readonly alwaysAsk?: boolean
  readonly onAlwaysAskChange?: (alwaysAsk: boolean) => void
}

/**
 * Full-bleed "pass the device" beat between turns, printed in the incoming
 * player's own colour. Everyone at the table shares one screen, so this is
 * what stops a player from missing their own turn — it is impossible to
 * mistake for anything but a full stop.
 */
export function TurnHandoff({
  player,
  turn,
  rank,
  onReady,
  alwaysAsk,
  onAlwaysAskChange,
}: TurnHandoffProps): ReactElement {
  // No `onEscape`: there is no valid way to cancel a handoff.
  const containerRef = useModalFocusTrap<HTMLDivElement>()
  // The one thing this screen is for — so the same key that rolls the die
  // and dismisses a card hands the device on, too.
  const primaryRef = usePrimaryAction<HTMLButtonElement>(true)
  const reduceMotion = usePrefersReducedMotion()
  const t = useUi()

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
        <span className={styles.turnLabel}>{t.common.turn(turn)}</span>

        <div className={styles.avatar} aria-hidden="true">
          <span className={styles.avatarInitial}>{player.name.charAt(0).toUpperCase()}</span>
        </div>

        {/* The name carries this screen on its own. A "Pass the device to"
            line above it only narrated what the pawn, the colour wash and the
            name in display type had already said louder than a sentence can.
            aria-live so screen-reader users hear who is up without hunting. */}
        <p className={styles.announce} aria-live="polite">
          <span id="handoff-name" className={styles.name}>
            {player.name}
          </span>
        </p>

        {/* Just the place. The field size is on the strip behind this card,
            and a player counting themselves against it mid-handoff never was
            the point — where they stand is. */}
        <p className={styles.rank}>{t.format.ordinalPlace(formatOrdinal(rank, t))}</p>

        <div className={styles.action}>
          <ChunkyButton ref={primaryRef} variant="primary" size="lg" fullWidth onClick={onReady}>
            {t.turn.imReady}
          </ChunkyButton>
        </div>

        {/* The setting lives on the thing it controls.
            By default this card only opens a turn where the device actually
            has to change hands — a turn following a computer seat, or one
            following the same person, gets a banner instead (`TurnBanner`).
            Some tables would rather have the full stop every time regardless,
            and this is where they say so: it is the one screen where a player
            is definitely thinking about handoffs, and the only screen a table
            in either mode is guaranteed to still see. */}
        {onAlwaysAskChange ? (
          <label className={styles.always}>
            <input
              type="checkbox"
              checked={alwaysAsk ?? false}
              onChange={(event) => onAlwaysAskChange(event.currentTarget.checked)}
            />
            <span>{t.turn.showEveryTurn}</span>
          </label>
        ) : null}
      </motion.div>
    </div>
  )
}
