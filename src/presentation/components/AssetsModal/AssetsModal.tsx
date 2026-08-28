import { type ReactElement, type CSSProperties } from 'react'
import type { Difficulty, EditionId, Player, PlayerId } from '@domain/model/types'
import { editionFor } from '@domain/edition/registry'
import { findStock } from '@domain/edition/lookup'
import { loanRepaymentFor } from '@domain/rules/difficulty'
import { expectedChildValue } from '@domain/rules/children'
import { estimateNetWorth } from '@domain/rules/scoring'
import { formatMoney, formatSalary } from '../../format'
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap'
import { GameIcon } from '../../icons/GameIcon'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import styles from './AssetsModal.module.css'

export interface AssetsModalProps {
  readonly players: readonly Player[]
  readonly activePlayerId: PlayerId | undefined
  readonly difficulty?: Difficulty
  readonly editionId?: EditionId
  readonly onClose: () => void
}

interface LedgerLine {
  readonly label: string
  readonly value: string
  readonly muted?: boolean
}

/**
 * Every number `estimateNetWorth` sums, spelled out as its own line instead
 * of folded into one total — the same figures `PlayerPanel`'s worth strip
 * already carries, but there only as a hover tooltip, which a player asking
 * "wait, why is my net worth that number" on a touch screen can never open.
 */
function ledgerFor(
  player: Player,
  difficulty: Difficulty,
  editionId: EditionId | undefined,
): readonly LedgerLine[] {
  const edition = editionFor(editionId)
  const { currency, economy } = edition
  const money = (amount: number): string => formatMoney(amount, currency)
  const lines: LedgerLine[] = [{ label: 'Cash', value: money(player.money) }]

  if (player.house) {
    lines.push({ label: `House — ${player.house.name}`, value: money(player.house.price) })
  }

  const stockValue = player.stocks.reduce((sum, holding) => {
    const stock = findStock(holding.stockId, edition)
    if (!stock) return sum
    const [low, high] = stock.payoutRange
    return sum + ((low + high) / 2) * holding.shares
  }, 0)
  if (player.stocks.length > 0) {
    const shareCount = player.stocks.reduce((sum, holding) => sum + holding.shares, 0)
    lines.push({
      label: `Shares — ${shareCount} held, at the middle of what each pays out`,
      value: money(stockValue),
    })
  }

  const lifeTileValue = player.lifeTiles.reduce((sum, tile) => sum + tile.value, 0)
  if (player.lifeTiles.length > 0) {
    lines.push({ label: `Life tiles — ${player.lifeTiles.length} earned`, value: money(lifeTileValue) })
  }

  if (player.children > 0) {
    const perChild = expectedChildValue(player, economy)
    lines.push({
      label: `Children — ${player.children}, on average at the final spin`,
      value: money(perChild * player.children),
    })
  }

  if (player.loans > 0) {
    const payoff = player.loans * loanRepaymentFor(difficulty, edition)
    lines.push({
      label: `Loans — ${player.loans} outstanding, settled at retirement`,
      value: `−${money(payoff)}`,
    })
  }

  return lines
}

function PlayerLedger({
  player,
  isActive,
  difficulty,
  editionId,
}: {
  readonly player: Player
  readonly isActive: boolean
  readonly difficulty: Difficulty
  readonly editionId: EditionId | undefined
}): ReactElement {
  const edition = editionFor(editionId)
  const { currency } = edition
  const money = (amount: number): string => formatMoney(amount, currency)
  const netWorth = estimateNetWorth(player, difficulty, edition)
  const lines = ledgerFor(player, difficulty, editionId)

  const colorVars = {
    '--player-base': `var(--player-${player.color})`,
    '--player-dark': `var(--player-${player.color}-dark)`,
  } as CSSProperties

  return (
    <section className={styles.player} style={colorVars} aria-label={`${player.name}'s assets`}>
      <header className={styles.playerHeader}>
        <span className={styles.dot} aria-hidden="true" />
        <h3 className={styles.playerName}>{player.name}</h3>
        {isActive && <span className={styles.nowPlaying}>Now playing</span>}
        {player.isRetired && <span className={styles.retiredBadge}>Retired</span>}
      </header>

      <p className={styles.career}>
        {player.career ? (
          <>
            <GameIcon name={player.career.icon} size={16} />
            {player.career.title}
            {' — '}
            {player.career.payPerPip === undefined
              ? formatSalary(player.career.salary, currency)
              : `${formatSalary(player.career.salary, currency)} on average`}
          </>
        ) : (
          'Unemployed — casual shifts'
        )}
      </p>

      <ul className={styles.ledger}>
        {lines.map((line) => (
          <li key={line.label} className={styles.ledgerLine}>
            <span className={styles.ledgerLabel}>{line.label}</span>
            <span className={styles.ledgerValue}>{line.value}</span>
          </li>
        ))}
      </ul>

      <div className={styles.total}>
        <span>Net worth</span>
        <span className={styles.totalValue}>{money(netWorth)}</span>
      </div>
      <p className={styles.totalNote}>What this player scores if the game ended this instant.</p>

      {player.insurance.length > 0 && (
        <p className={styles.insurance}>
          Insured: {player.insurance.join(', ')}
          {player.isMarried ? ' · Married' : ''}
        </p>
      )}
    </section>
  )
}

/**
 * Every player's full financial picture, open on demand rather than only
 * ever glanced at through the sidebar's compact cards — the same numbers
 * `PlayerPanel` already computes, laid out at a size a hover tooltip never
 * gets to be.
 */
export function AssetsModal({
  players,
  activePlayerId,
  difficulty = 'normal',
  editionId,
  onClose,
}: AssetsModalProps): ReactElement {
  const containerRef = useModalFocusTrap<HTMLDivElement>(onClose)

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={containerRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Assets"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 className={styles.heading}>Assets</h2>
          <ChunkyButton variant="secondary" size="sm" icon="exit" onClick={onClose}>
            Close
          </ChunkyButton>
        </header>
        <div className={styles.grid}>
          {players.map((player) => (
            <PlayerLedger
              key={player.id}
              player={player}
              isActive={player.id === activePlayerId}
              difficulty={difficulty}
              editionId={editionId}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
