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
import { rankPlayers } from '@domain/rules/standing'
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

/** One object on the shelf: what it is, drawn as the board draws it. */
interface ShelfItem {
  readonly key: string
  readonly icon: IconName
  readonly label: string
  /** The figure it is worth, where it has one. A fact like "Graduate" has none. */
  readonly value?: string
  /** Prints in the board's roof red — the one shelf item that subtracts. */
  readonly debt?: boolean
}

/**
 * Everything this player is carrying, as tiles rather than as a table.
 *
 * The order is the order a life accumulates them — work, home, the people in
 * the car, the money put away, the things done — with the debt last, in red,
 * because the one holding a two-column ledger genuinely buries is the only
 * one that counts *against* the big number above it.
 */
function shelfFor(
  player: Player,
  difficulty: Difficulty,
  editionId: EditionId | undefined,
): readonly ShelfItem[] {
  const edition = editionFor(editionId)
  const { currency, economy } = edition
  const money = (amount: number): string => formatMoney(amount, currency)
  const items: ShelfItem[] = []

  items.push(
    player.career
      ? {
          key: 'career',
          icon: player.career.icon,
          label: player.career.title,
          value:
            player.career.payPerPip === undefined
              ? formatSalary(player.career.salary, currency)
              : `${formatSalary(player.career.salary, currency)} on average`,
        }
      : { key: 'career', icon: 'space:first-job-fair', label: 'Unemployed', value: 'Casual shifts' },
  )

  if (player.house) {
    items.push({
      key: 'house',
      icon: player.house.icon,
      label: player.house.name,
      value: money(player.house.price),
    })
  }

  // The passengers, exactly as the pawn on the board carries them.
  items.push({
    key: 'marriage',
    icon: 'space:wedding-day',
    label: player.isMarried ? 'Married' : 'Single',
  })
  if (player.children > 0) {
    items.push({
      key: 'children',
      icon: 'space:new-baby',
      label: `${player.children} child${player.children === 1 ? '' : 'ren'}`,
      value: money(expectedChildValue(player, economy) * player.children),
    })
  }
  if (player.hasDegree) {
    items.push({ key: 'degree', icon: 'space:cap-and-gown', label: 'Graduate' })
  }

  if (player.stocks.length > 0) {
    const shares = player.stocks.reduce((sum, holding) => sum + holding.shares, 0)
    const worth = player.stocks.reduce((sum, holding) => {
      const stock = findStock(holding.stockId, edition)
      if (!stock) return sum
      const [low, high] = stock.payoutRange
      return sum + ((low + high) / 2) * holding.shares
    }, 0)
    items.push({
      key: 'shares',
      icon: 'space:stock-tip',
      label: `${shares} share${shares === 1 ? '' : 's'}`,
      value: money(worth),
    })
  }

  if (player.lifeTiles.length > 0) {
    const worth = player.lifeTiles.reduce((sum, tile) => sum + tile.value, 0)
    items.push({
      key: 'tiles',
      // Every `tile:*` id draws the same LIFE-tile card — the art is the
      // token, not the story on it — so any of them names the shelf's own
      // stack of them correctly.
      icon: 'tile:marathon',
      label: `${player.lifeTiles.length} LIFE tile${player.lifeTiles.length === 1 ? '' : 's'}`,
      value: money(worth),
    })
  }

  if (player.loans > 0) {
    items.push({
      key: 'loans',
      icon: 'finance:bank-visit',
      label: `${player.loans} loan${player.loans === 1 ? '' : 's'}`,
      value: `−${money(player.loans * loanRepaymentFor(difficulty, edition))}`,
      debt: true,
    })
  }

  return items
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

  const shelf = shelfFor(player, difficulty, editionId)

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

      {/* One number, big. Everything else on this card is what it is made
          of. The old card led with a two-column ledger at 0.78rem and put
          the total at the bottom, which is the shape of a spreadsheet: it
          answers "what are the line items" before "am I winning". */}
      <div className={styles.total}>
        <span className={styles.totalLabel}>Net worth</span>
        <span className={styles.totalValue}>{money(netWorth)}</span>
        <span className={styles.totalNote}>If the game ended now</span>
      </div>

      {/* The shelf: the same objects the board itself draws, at the size the
          board draws them, in the order a player collects them. A house is a
          house here, not a row reading "House — Tiny Cabin ... $60,000". */}
      <ul className={styles.shelf}>
        {shelf.map((item) => (
          <li
            key={item.key}
            className={item.debt ? `${styles.shelfTile} ${styles.debtTile}` : styles.shelfTile}
          >
            <span className={styles.shelfIcon} aria-hidden="true">
              <GameIcon name={item.icon} size={26} />
            </span>
            <span className={styles.shelfLabel}>{item.label}</span>
            {item.value && <span className={styles.shelfValue}>{item.value}</span>}
          </li>
        ))}
      </ul>

      {/* The spreadsheet is not deleted — a player who wants to argue with
          the total still needs every line that made it, and there is no
          other place in the game that shows them. It is folded, so it is
          something asked for rather than something read past.

          And it is a real table now, matching `RollTable`: a visually-hidden
          caption, `<th scope="col">` over the columns, `<th scope="row">` on
          each holding. This is the one thing in the game that genuinely *is*
          a spreadsheet — a player opens it precisely to check somebody's
          arithmetic — and a `<ul>` of flex rows gave it none of what makes a
          column of money checkable: a screen reader read "Cash $84,000 House
          — Tiny Cabin $60,000" as one run of prose with no header to hang the
          figures on, and no browser would let a player select the column. */}
      <details className={styles.breakdown}>
        <summary className={styles.breakdownSummary}>Full breakdown</summary>
        <table className={styles.ledger}>
          <caption className="visually-hidden">
            What {player.name}&apos;s net worth is made of
          </caption>
          <thead>
            <tr>
              <th scope="col">Holding</th>
              <th scope="col" className={styles.ledgerValue}>
                Worth
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr
                key={`${line.label}-${index}`}
                className={line.item ? `${styles.ledgerLine} ${styles.item}` : styles.ledgerLine}
              >
                <th scope="row" className={styles.ledgerLabel}>
                  {line.icon && (
                    <span className={styles.ledgerIcon} aria-hidden="true">
                      <GameIcon name={line.icon} size={15} />
                    </span>
                  )}
                  {line.label}
                </th>
                <td className={styles.ledgerValue}>{line.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

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
