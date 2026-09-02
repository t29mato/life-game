import { type ReactElement } from 'react'
import { motion } from 'framer-motion'
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { AudioToggle } from '../AudioToggle/AudioToggle'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import styles from './SettingsSheet.module.css'

export interface SettingsSheetProps {
  readonly onClose: () => void
}

/**
 * Where the settings went.
 *
 * Music and SFX were two switches parked in the game's header for the whole
 * match, sharing a row with whose turn it is, the log, the save menu and
 * Quit. They are the two controls a table touches once, if ever — and they
 * were costing the one control the table reads every single turn the room to
 * be big. So they fold behind a gear, and this is what the gear opens.
 *
 * A sheet rather than a full-bleed modal: nothing here decides anything about
 * the game, so it should not feel like the game has stopped. Escape closes it
 * (there is always a valid way out of a settings screen), and the focus trap
 * keeps a keyboard inside it while it is up.
 */
export function SettingsSheet({ onClose }: SettingsSheetProps): ReactElement {
  const containerRef = useModalFocusTrap<HTMLDivElement>(onClose)
  const reduceMotion = usePrefersReducedMotion()

  const entrance = reduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, scale: 0.92, y: 26 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { type: 'spring' as const, stiffness: 400, damping: 28, mass: 0.9 },
      }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <motion.div
        ref={containerRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-heading"
        onClick={(event) => event.stopPropagation()}
        initial={entrance.initial}
        animate={entrance.animate}
        transition={entrance.transition}
      >
        <header className={styles.header}>
          <h2 id="settings-heading" className={styles.heading}>
            Settings
          </h2>
          <ChunkyButton variant="secondary" size="sm" icon="exit" onClick={onClose}>
            Close
          </ChunkyButton>
        </header>

        <div className={styles.body}>
          <AudioToggle />
        </div>

        <p className={styles.hint}>Esc closes this.</p>
      </motion.div>
    </div>
  )
}
