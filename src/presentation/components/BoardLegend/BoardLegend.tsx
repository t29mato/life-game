import { type ReactElement } from 'react'
import { motion } from 'framer-motion'
import type { IconName } from '@domain/model/icons'
import { GameIcon } from '../../icons/GameIcon'
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useUi } from '../../i18n/LocaleProvider'
import type { UiText } from '../../i18n/en'
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

/**
 * The nine marks, built from the catalogue rather than written here.
 *
 * The pairing of a glyph with its sentence is the part that belongs to this
 * component; the sentence itself is prose a player reads, so it lives where
 * every other sentence in the game lives.
 */
function legendMarks(t: UiText): readonly LegendMark[] {
  return [
    { icon: 'space:payday', name: t.legend.coinName, rule: t.legend.coinRule },
    { icon: 'space:first-paycheck', name: t.legend.upName, rule: t.legend.upRule },
    { icon: 'space:rent-due', name: t.legend.downName, rule: t.legend.downRule },
    { icon: 'space:market-crash', name: t.legend.triangleName, rule: t.legend.triangleRule },
    { icon: 'finance:bank-visit', name: t.legend.bankName, rule: t.legend.bankRule },
    { icon: 'space:stock-tip', name: t.legend.chartName, rule: t.legend.chartRule },
    { icon: 'finance:insurance-office', name: t.legend.shieldName, rule: t.legend.shieldRule },
    { icon: 'space:lucky-find', name: t.legend.starName, rule: t.legend.starRule },
    { icon: 'space:cap-and-gown', name: t.legend.milestonesName, rule: t.legend.milestonesRule },
  ]
}

/** How a tile is *built*, as opposed to what is printed on it. */
interface LegendBuild {
  readonly swatch: 'stripe' | 'gain' | 'cost' | 'choice' | 'milestone'
  readonly name: string
  readonly rule: string
}

function legendBuild(t: UiText): readonly LegendBuild[] {
  return [
    { swatch: 'stripe', name: t.legend.stripeName, rule: t.legend.stripeRule },
    { swatch: 'gain', name: t.legend.gainName, rule: t.legend.gainRule },
    { swatch: 'cost', name: t.legend.costName, rule: t.legend.costRule },
    { swatch: 'choice', name: t.legend.choiceName, rule: t.legend.choiceRule },
    { swatch: 'milestone', name: t.legend.milestoneName, rule: t.legend.milestoneRule },
  ]
}

/** The rows on their own, so the Handbook can print the same key as the card. */
export function BoardLegendList(): ReactElement {
  const t = useUi()
  const LEGEND_MARKS = legendMarks(t)
  const LEGEND_BUILD = legendBuild(t)
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
  const t = useUi()

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
          <span className={styles.kind}>{t.legend.kind}</span>
          <h2 id="board-legend-title" className={styles.title}>
            {t.legend.title}
          </h2>
          <p className={styles.lede}>{t.legend.lede}</p>
        </header>

        <BoardLegendList />

        <ChunkyButton variant="primary" size="lg" fullWidth onClick={onDismiss}>
          {t.common.gotIt}
        </ChunkyButton>
      </motion.div>
    </div>
  )
}
