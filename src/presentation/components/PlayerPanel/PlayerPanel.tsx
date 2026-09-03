import type { CSSProperties, ReactElement } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Career, Player, Difficulty, EditionId } from '@domain/model/types'
import type { CurrencySpec } from '@domain/edition/types'
import { editionFor } from '@domain/edition/registry'
import { loanRepaymentFor } from '@domain/rules/difficulty'
import { estimateNetWorth } from '@domain/rules/scoring'
import { formatMoney, formatOrdinal, formatSalary } from '../../format'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useEditionText, useUi } from '../../i18n/LocaleProvider'
import type { UiText } from '../../i18n/en'
import { GameIcon } from '../../icons/GameIcon'
import { INSURANCE_ICON, insuranceLabel } from '../../icons/insurance'
import { UiIcon, type UiIconName } from '../../icons/ui'
import { RollingNumber } from '../RollingNumber/RollingNumber'
import styles from './PlayerPanel.module.css'

export interface PlayerPanelProps {
  readonly player: Player
  readonly isActive: boolean
  /**
   * Denser spacing and type for tables of three or four, so every seat's
   * card stays fully on screen at once without the rail scrolling.
   */
  readonly compact?: boolean
  /**
   * The tightest tier, for four seats sharing the rail under the spinner.
   * Implies `compact`; still drops no facts — only spacing and type scale.
   */
  readonly dense?: boolean
  /**
   * A harder game settles loans at a steeper rate, so the debt this panel
   * quotes has to be the rate this game actually charges. Optional, defaulting
   * to `normal`, so nothing that does not care about difficulty has to know.
   */
  readonly difficulty?: Difficulty
  /**
   * This player's live standing, 1-based, as ranked by whoever can see the
   * whole table. Rendered as a medal or ordinal beside net worth — the number
   * the standing is computed from. Omitted, the card shows no standing.
   */
  readonly rank?: number
  /**
   * Which edition's money this seat is counted in — the symbol on every
   * figure, and the casual rate quoted when they are between jobs. Optional
   * and defaulting to the original board, on the same terms as `difficulty`:
   * nothing that does not care about editions has to know.
   */
  readonly editionId?: EditionId
}

/** The tooltip a wage carries: what decides it, in the player's own terms. */
function variablePayNote(career: Career, title: string, currency: CurrencySpec, t: UiText): string {
  return career.payPerPip === undefined
    ? t.panel.fixedPayNote(title)
    : t.panel.variablePayNote(title, formatMoney(career.payPerPip, currency))
}

const MEDAL_ICON: Record<1 | 2 | 3, UiIconName> = {
  1: 'medal-gold',
  2: 'medal-silver',
  3: 'medal-bronze',
}

/**
 * One status card per player, printed in that player's own colour: identity
 * and career at the top, the cash balance as the loudest thing on the card,
 * and the life milestones as a strip of chips beneath it.
 */
export function PlayerPanel({
  player,
  isActive,
  compact = false,
  dense = false,
  difficulty = 'normal',
  rank,
  editionId,
}: PlayerPanelProps): ReactElement {
  const reduceMotion = usePrefersReducedMotion()
  const t = useUi()
  const text = useEditionText(editionId)
  const edition = editionFor(editionId)
  const { currency, economy } = edition
  // The trade and the house are catalogue entries carried on the player, so
  // they translate by id — no sentence-matching needed, unlike a tile.
  const careerTitle = player.career
    ? (text.career(player.career.id)?.title ?? player.career.title)
    : null
  const houseName = player.house ? (text.house(player.house.id)?.name ?? player.house.name) : null
  const money = (amount: number): string => formatMoney(amount, currency)
  const totalShares = player.stocks.reduce((sum, holding) => sum + holding.shares, 0)
  const loanPayoff = player.loans * loanRepaymentFor(difficulty, edition)
  // What the bank actually handed over. The chip has room for one figure and
  // the retirement cost is the one that decides the game, so the principal
  // lives in the tooltip — where a player asking "how much did I borrow?" looks.
  const loanPrincipal = player.loans * economy.loanPrincipal
  const netWorth = estimateNetWorth(player, difficulty, edition)
  const medal = rank === 1 || rank === 2 || rank === 3 ? MEDAL_ICON[rank] : null

  const colorVars = {
    '--player-base': `var(--player-${player.color})`,
    '--player-light': `var(--player-${player.color}-light)`,
    '--player-dark': `var(--player-${player.color}-dark)`,
    '--player-glow': `var(--player-${player.color})`,
    '--player-border': `var(--player-${player.color}-dark)`,
  } as CSSProperties

  return (
    <article
      className={[
        styles.card,
        compact || dense ? styles.compact : '',
        dense ? styles.dense : '',
        isActive ? styles.active : '',
        player.isRetired ? styles.retired : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={colorVars}
      aria-current={isActive ? 'true' : undefined}
    >
      <span className={styles.spine} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.avatar} aria-hidden="true">
          <span className={styles.avatarInitial}>{player.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className={styles.identity}>
          <span className={styles.name}>{player.name}</span>
          <span className={styles.career}>
            <span className={styles.careerEmoji} aria-hidden="true">
              {player.career ? <GameIcon name={player.career.icon} size={16} /> : null}
            </span>
            {careerTitle ?? t.panel.unemployed}
          </span>
        </div>
        {player.isRetired ? (
          <span className={styles.retiredBadge}>
            {player.retirementRank ? t.panel.retiredRank(player.retirementRank) : t.panel.retired}
          </span>
        ) : isActive ? (
          <span className={styles.turnFlag}>{t.panel.nowPlaying}</span>
        ) : null}
      </header>

      <div className={styles.money}>
        <span className={styles.moneyLabel}>{t.panel.cash}</span>
        <RollingNumber
          className={player.money < 0 ? `${styles.cash} ${styles.debt}` : styles.cash}
          value={player.money}
          format={money}
        />
        {/* Pay the wheel decides has to read differently from a contract, or a
            quoted figure the packet rarely matches looks like a bug. An
            unsteady wage is labelled as the average it is, and a player between
            jobs is quoted the casual rate they are actually picking up — they
            are earning something now, and the card has to say so. */}
        {player.career ? (
          <span
            className={styles.salary}
            title={variablePayNote(player.career, careerTitle ?? player.career.title, currency, t)}
          >
            {player.career.payPerPip === undefined
              ? formatSalary(player.career.salary, currency, t)
              : t.panel.onAverage(formatSalary(player.career.salary, currency, t))}
          </span>
        ) : (
          <span className={styles.salary} title={t.panel.casualNote(money(economy.casualWagePerPip))}>
            {t.panel.casualShifts(money(economy.casualWagePerPip))}
          </span>
        )}
      </div>

      {/* Cash above is the wallet — the number that moves when something
          happens. This band is the running score: it also counts the house at
          its price, shares at mid-range and child bonuses, minus loan payoffs,
          so it barely flinches when cash is traded for an asset. Kept visually
          nothing like the cash well, with its own label, so the two can never
          be read as one number disagreeing with itself. */}
      <div
        className={styles.worthStrip}
        title={t.panel.worthTitle}
      >
        {rank !== undefined && (
          <span className={styles.rankSlot}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={rank}
                className={styles.rankBadge}
                aria-hidden="true"
                initial={reduceMotion ? false : { y: -8, opacity: 0, scale: 0.5 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 32, mass: 0.7 }}
                // `exit` is only meaningful when animated — omitted entirely
                // (rather than passed as `undefined`) so a reduced-motion
                // viewer sees the old rank vanish and the new one appear with
                // no transition at all.
                {...(reduceMotion ? {} : { exit: { y: 8, opacity: 0, scale: 0.5 } })}
              >
                {medal ? <UiIcon name={medal} size={14} /> : formatOrdinal(rank, t)}
              </motion.span>
            </AnimatePresence>
            <span className="visually-hidden">{t.format.ordinalPlace(formatOrdinal(rank, t))}</span>
          </span>
        )}
        <span className={styles.worthLabel}>{t.panel.netWorth}</span>
        {netWorth === player.money ? (
          // Worth equals cash for a player who owns and owes nothing — true
          // for every seat at the start of a game. Printing the same figure
          // twice under two labels invites "why is this here twice?", and
          // teaches players to skip one of them — so the band explains the
          // relationship instead, and its number *appearing* later is itself
          // the news that worth and wallet have parted company.
          <span className={styles.worthSame}>{t.panel.sameAsCash}</span>
        ) : (
          <RollingNumber className={`${styles.worth} tabular-num`} value={netWorth} format={money} />
        )}
      </div>

      <div className={styles.chips}>
        <span className={`${styles.chip} ${styles.tileChip}`}>
          <span className={styles.chipIcon} aria-hidden="true">
            <UiIcon name="ribbon" size={15} />
          </span>
          <span className={styles.chipText}>{t.panel.tiles(player.lifeTiles.length)}</span>
        </span>
        {player.hasDegree ? (
          <span className={`${styles.chip} ${styles.degreeChip}`}>
            <span className={styles.chipIcon} aria-hidden="true">
              <GameIcon name="space:cap-and-gown" size={16} />
            </span>
            <span className={styles.chipText}>{t.panel.graduate}</span>
          </span>
        ) : null}
        {player.isMarried ? (
          <span className={`${styles.chip} ${styles.familyChip}`}>
            <span className={styles.chipIcon} aria-hidden="true">
              <GameIcon name="space:wedding-day" size={16} />
            </span>
            <span className={styles.chipText}>{t.panel.married}</span>
          </span>
        ) : null}
        {player.children > 0 ? (
          <span className={`${styles.chip} ${styles.familyChip}`}>
            <span className={styles.chipIcon} aria-hidden="true">
              <GameIcon name="space:new-baby" size={16} />
            </span>
            <span className={styles.chipText}>{t.panel.kids(player.children)}</span>
          </span>
        ) : null}
        {player.house ? (
          <span className={`${styles.chip} ${styles.houseChip}`}>
            <span className={styles.chipIcon} aria-hidden="true">
              <GameIcon name={player.house.icon} size={16} />
            </span>
            <span className={styles.chipText}>{houseName}</span>
          </span>
        ) : null}
        {player.loans > 0 ? (
          <span
            className={`${styles.chip} ${styles.loanChip}`}
            title={t.panel.loanTitle(money(loanPrincipal), money(loanPayoff))}
          >
            <span className={styles.chipIcon} aria-hidden="true">
              <GameIcon name="space:interest-payout" size={16} />
            </span>
            <span className={styles.chipText}>{t.panel.loans(player.loans)}</span>
            <span className={styles.chipSub}>{t.panel.atRetirement(money(loanPayoff))}</span>
          </span>
        ) : null}
        {totalShares > 0 ? (
          <span className={`${styles.chip} ${styles.stockChip}`}>
            <span className={styles.chipIcon} aria-hidden="true">
              <GameIcon name="finance:trading-floor" size={16} />
            </span>
            <span className={styles.chipText}>{t.panel.shares(totalShares)}</span>
          </span>
        ) : null}
        {player.insurance.map((kind) => (
          <span key={kind} className={`${styles.chip} ${styles.insuranceChip}`}>
            <span className={styles.chipIcon} aria-hidden="true">
              <GameIcon name={INSURANCE_ICON[kind]} size={16} />
            </span>
            <span className={styles.chipText}>{t.panel.policy(insuranceLabel(kind, t))}</span>
          </span>
        ))}
      </div>
    </article>
  )
}
