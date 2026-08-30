import { type ReactElement, type CSSProperties } from 'react'
import type { IconName } from '@domain/model/icons'
import type { Difficulty, EditionId, Player, PlayerId } from '@domain/model/types'
import { editionFor } from '@domain/edition/registry'
import { findStock } from '@domain/edition/lookup'
import { loanRepaymentFor } from '@domain/rules/difficulty'
import { expectedChildValue } from '@domain/rules/children'
import { estimateNetWorth } from '@domain/rules/scoring'
import { formatMoney, formatOrdinal, formatSalary } from '../../format'
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap'
import { GameIcon } from '../../icons/GameIcon'
import { INSURANCE_ICON, INSURANCE_LABEL } from '../../icons/insurance'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import { rankPlayers } from '../PlayerPanel/rankPlayers'
import styles from './StatusModal.module.css'

export interface StatusModalProps {
  readonly players: readonly Player[]
  readonly activePlayerId: PlayerId | undefined
  readonly difficulty?: Difficulty
  readonly editionId?: EditionId
  readonly onClose: () => void
}

interface LedgerLine {
  readonly label: string
  readonly value: string
  /** Drawn beside the label — the same glyph the board itself uses for it. */
  readonly icon?: IconName
  /** An itemised entry indented beneath the group line whose total it feeds. */
  readonly item?: boolean
}

/**
 * Every number `estimateNetWorth` sums, spelled out as its own line instead
 * of folded into one total — the same figures `PlayerPanel`'s worth strip
 * already carries, but there only as a hover tooltip, which a player asking
 * "wait, why is my net worth that number" on a touch screen can never open.
 *
 * Groups that used to be one aggregate line — shares, life tiles — keep that
 * line as their header (it is what the net worth actually sums) and itemise
 * beneath it, so "what is my collection worth" and "what *is* my collection"
 * are both answered without either crowding the other out.
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
    lines.push({
      label: `House — ${player.house.name}`,
      value: money(player.house.price),
      icon: player.house.icon,
    })
  }

  if (player.stocks.length > 0) {
    // A holding whose stock the edition no longer knows contributes nothing
    // to net worth, so it is left off the ledger too rather than shown as a
    // nameless row worth a figure the total would then disagree with.
    const valued = player.stocks.flatMap((holding) => {
      const stock = findStock(holding.stockId, edition)
      if (!stock) return []
      const [low, high] = stock.payoutRange
      return [{ stock, holding, value: ((low + high) / 2) * holding.shares }]
    })
    const total = valued.reduce((sum, entry) => sum + entry.value, 0)
    lines.push({ label: 'Shares — at the middle of what each pays out', value: money(total) })
    for (const { stock, holding, value } of valued) {
      lines.push({
        label: `${stock.name} (${stock.ticker}) — ${holding.shares} share${holding.shares === 1 ? '' : 's'}`,
        value: money(value),
        icon: stock.icon,
        item: true,
      })
    }
  }

  if (player.lifeTiles.length > 0) {
    const total = player.lifeTiles.reduce((sum, tile) => sum + tile.value, 0)
    lines.push({ label: `Life tiles — ${player.lifeTiles.length} earned`, value: money(total) })
    for (const tile of player.lifeTiles) {
      lines.push({ label: tile.title, value: money(tile.value), icon: tile.icon, item: true })
    }
  }

  if (player.children > 0) {
    const perChild = expectedChildValue(player, economy)
    lines.push({
      label: `Children — ${player.children}, on average at the final roll`,
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

function PlayerStatus({
  player,
  isActive,
  rank,
  difficulty,
  editionId,
}: {
  readonly player: Player
  readonly isActive: boolean
  readonly rank: number | undefined
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
    <section className={styles.player} style={colorVars} aria-label={`${player.name}'s status`}>
      <header className={styles.playerHeader}>
        <span className={styles.dot} aria-hidden="true" />
        <h3 className={styles.playerName}>{player.name}</h3>
        {player.isCpu && <span className={styles.cpuTag}>Computer</span>}
        {rank !== undefined && (
          <span className={styles.rank}>
            {formatOrdinal(rank)}
            <span className="visually-hidden"> place</span>
          </span>
        )}
        {isActive && <span className={styles.nowPlaying}>Now playing</span>}
        {player.isRetired && (
          <span className={styles.retiredBadge}>
            {player.retirementRank ? `Retired #${player.retirementRank}` : 'Retired'}
          </span>
        )}
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

      {/* Marriage and children used to surface here only as a dollar estimate
          and a word tacked onto the insurance line. They are facts about a
          life, not just entries in a ledger, so they get their own plain
          statement — the estimate below stays, but as the price of the fact
          rather than the fact itself. */}
      <p className={styles.facts}>
        <span className={styles.fact}>
          {player.isMarried && (
            <span className={styles.factIcon} aria-hidden="true">
              <GameIcon name="space:wedding-day" size={14} />
            </span>
          )}
          {player.isMarried ? 'Married' : 'Single'}
        </span>
        {player.children > 0 && (
          <span className={styles.fact}>
            <span className={styles.factIcon} aria-hidden="true">
              <GameIcon name="space:new-baby" size={14} />
            </span>
            {player.children} child{player.children === 1 ? '' : 'ren'}
          </span>
        )}
        {player.hasDegree && (
          <span className={styles.fact}>
            <span className={styles.factIcon} aria-hidden="true">
              <GameIcon name="space:cap-and-gown" size={14} />
            </span>
            Graduate
          </span>
        )}
      </p>

      <ul className={styles.ledger}>
        {lines.map((line, index) => (
          <li
            key={`${line.label}-${index}`}
            className={line.item ? `${styles.ledgerLine} ${styles.item}` : styles.ledgerLine}
          >
            <span className={styles.ledgerLabel}>
              {line.icon && (
                <span className={styles.ledgerIcon} aria-hidden="true">
                  <GameIcon name={line.icon} size={15} />
                </span>
              )}
              {line.label}
            </span>
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
          <span className={styles.insuranceLabel}>Insured</span>
          {player.insurance.map((kind) => (
            <span key={kind} className={styles.policy}>
              <span className={styles.factIcon} aria-hidden="true">
                <GameIcon name={INSURANCE_ICON[kind]} size={14} />
              </span>
              {INSURANCE_LABEL[kind]}
            </span>
          ))}
        </p>
      )}
    </section>
  )
}

/**
 * Every player's full picture, open on demand rather than only ever glanced
 * at through the sidebar's compact cards — the same facts `PlayerPanel`
 * already carries, laid out at a size a hover tooltip never gets to be.
 * Named for what it now shows: not just the assets, but the life around
 * them — family, standing, career, and each thing actually collected.
 */
export function StatusModal({
  players,
  activePlayerId,
  difficulty = 'normal',
  editionId,
  onClose,
}: StatusModalProps): ReactElement {
  const containerRef = useModalFocusTrap<HTMLDivElement>(onClose)
  // Priced in this game's own edition, so the standing shown here can never
  // disagree with the net worth printed two lines below it.
  const standings = rankPlayers(players, difficulty, editionId)

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={containerRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Player status"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 className={styles.heading}>Player Status</h2>
          <ChunkyButton variant="secondary" size="sm" icon="exit" onClick={onClose}>
            Close
          </ChunkyButton>
        </header>
        <div className={styles.grid}>
          {players.map((player) => (
            <PlayerStatus
              key={player.id}
              player={player}
              isActive={player.id === activePlayerId}
              rank={standings.get(player.id)?.rank}
              difficulty={difficulty}
              editionId={editionId}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
