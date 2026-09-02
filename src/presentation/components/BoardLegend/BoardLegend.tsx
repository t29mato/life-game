import { type ReactElement } from 'react'
import { motion } from 'framer-motion'
import type { IconName } from '@domain/model/icons'
import { GameIcon } from '../../icons/GameIcon'
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import styles from './BoardLegend.module.css'

/**
 * The key to the board, dealt once — on the very first game, before the first
 * roll — and kept in the Handbook for ever after.
 *
 * A playtester's verdict was blunt: a red-and-white stripe on a tile with no
 * legend anywhere in the game, and pictures that did not predict their tiles.
 * The pictures are fixed at the source (`icons/effectVocabulary.ts`); this is
 * the other half — the game saying out loud, once, what its own marks mean.
 *
 * The rows are the vocabulary, not a list of tiles. Every mark here appears on
 * dozens of spaces, and none of them appears anywhere else.
 */
interface LegendMark {
  /** Any icon that draws the glyph being explained — below 34px `GameIcon` always draws the category. */
  readonly icon: IconName
  readonly name: string
  readonly rule: string
}

const LEGEND_MARKS: readonly LegendMark[] = [
  { icon: 'space:payday', name: 'The coin', rule: 'Payday. Your salary, collected landing here or driving past.' },
  { icon: 'space:first-paycheck', name: 'Arrow up', rule: 'Money in.' },
  { icon: 'space:rent-due', name: 'Arrow down', rule: 'Money out.' },
  { icon: 'space:market-crash', name: 'The triangle', rule: 'A setback — a crash, a fire, a repair bill.' },
  { icon: 'finance:bank-visit', name: 'The bank', rule: 'Borrow, or pay a loan off. Never the market.' },
  { icon: 'space:stock-tip', name: 'The chart', rule: 'The market. Shares to buy, dividends to collect.' },
  { icon: 'finance:insurance-office', name: 'The shield', rule: 'Policies, and what they cover you against.' },
  { icon: 'space:lucky-find', name: 'The star', rule: 'A LIFE tile — a keepsake, worth real money at the end.' },
  { icon: 'space:cap-and-gown', name: 'The milestones', rule: 'Cap, heart, pram, house, sunset: the five moments the game is about.' },
]

/** How a tile is *built*, as opposed to what is printed on it. */
interface LegendBuild {
  readonly swatch: 'stripe' | 'gain' | 'cost' | 'choice' | 'milestone'
  readonly name: string
  readonly rule: string
}

const LEGEND_BUILD: readonly LegendBuild[] = [
  {
    swatch: 'stripe',
    name: 'Red-and-white stripe',
    rule: 'This tile always happens — landed on or driven past. Some of them stop your turn outright.',
  },
  { swatch: 'gain', name: 'Green cut edge', rule: 'The tile pays you.' },
  { swatch: 'cost', name: 'Red cut edge', rule: 'The tile charges you.' },
  { swatch: 'choice', name: 'Purple cut edge', rule: 'You will be asked something. A house, a loan, a job.' },
  { swatch: 'milestone', name: 'Gold bezel', rule: 'A Life Milestone. Confetti included.' },
]

/** The rows on their own, so the Handbook can print the same key as the card. */
export function BoardLegendList(): ReactElement {
  return (
    <div className={styles.list}>
      <ul className={styles.marks}>
        {LEGEND_MARKS.map((mark) => (
          <li key={mark.name} className={styles.row}>
            <span className={styles.glyph} aria-hidden="true">
              <GameIcon name={mark.icon} size={26} />
            </span>
            <div className={styles.rowText}>
              <span className={styles.rowName}>{mark.name}</span>
              <p className={styles.rowRule}>{mark.rule}</p>
            </div>
          </li>
        ))}
      </ul>
      <ul className={styles.marks}>
        {LEGEND_BUILD.map((build) => (
          <li key={build.name} className={styles.row}>
            <span className={styles.swatch} data-swatch={build.swatch} aria-hidden="true" />
            <div className={styles.rowText}>
              <span className={styles.rowName}>{build.name}</span>
              <p className={styles.rowRule}>{build.rule}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export interface BoardLegendProps {
  readonly onDismiss: () => void
}

/** The once-only card. One button, and it never appears again. */
export function BoardLegend({ onDismiss }: BoardLegendProps): ReactElement {
  const containerRef = useModalFocusTrap<HTMLDivElement>(onDismiss)
  const reduceMotion = usePrefersReducedMotion()

  const entrance = reduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, scale: 0.9, y: 28 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { type: 'spring' as const, stiffness: 380, damping: 26, mass: 0.9 },
      }

  return (
    <div className={styles.backdrop}>
      <motion.div
        ref={containerRef}
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-legend-title"
        initial={entrance.initial}
        animate={entrance.animate}
        transition={entrance.transition}
      >
        <header className={styles.header}>
          <span className={styles.kind}>Reading the board</span>
          <h2 id="board-legend-title" className={styles.title}>
            One picture, one meaning
          </h2>
          <p className={styles.lede}>
            Every mark on the board means exactly one thing. Here is all of them — you will not be
            shown this again, and the Handbook keeps a copy.
          </p>
        </header>

        <BoardLegendList />

        <ChunkyButton variant="primary" size="lg" fullWidth onClick={onDismiss}>
          Got it
        </ChunkyButton>
      </motion.div>
    </div>
  )
}
