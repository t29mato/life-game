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
import { useEditionText, useUi } from '../../i18n/LocaleProvider'
import type { UiText } from '../../i18n/en'
import type { EditionText } from '@domain/edition/i18n/text'
import { GameIcon } from '../../icons/GameIcon'
import { INSURANCE_ICON, insuranceLabel } from '../../icons/insurance'
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
  t: UiText,
  text: EditionText,
): readonly LedgerLine[] {
  const edition = editionFor(editionId)
  const { currency, economy } = edition
  const money = (amount: number): string => formatMoney(amount, currency)
  const lines: LedgerLine[] = [{ label: t.status.cash, value: money(player.money) }]

  if (player.house) {
    lines.push({
      label: t.status.house(text.house(player.house.id)?.name ?? player.house.name),
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
    lines.push({ label: t.status.sharesLine, value: money(total) })
    for (const { stock, holding, value } of valued) {
      lines.push({
        label: t.status.stockLine(
          text.stock(stock.id)?.name ?? stock.name,
          stock.ticker,
          holding.shares,
        ),
        value: money(value),
        icon: stock.icon,
        item: true,
      })
    }
  }

  if (player.lifeTiles.length > 0) {
    const total = player.lifeTiles.reduce((sum, tile) => sum + tile.value, 0)
    lines.push({ label: t.status.lifeTilesLine(player.lifeTiles.length), value: money(total) })
    for (const tile of player.lifeTiles) {
      lines.push({
        label: text.lifeTile(tile.id)?.title ?? tile.title,
        value: money(tile.value),
        icon: tile.icon,
        item: true,
      })
    }
  }

  if (player.children > 0) {
    const perChild = expectedChildValue(player, economy)
    lines.push({
      label: t.status.childrenLine(player.children),
      value: money(perChild * player.children),
    })
  }

  if (player.loans > 0) {
    const payoff = player.loans * loanRepaymentFor(difficulty, edition)
    lines.push({
      label: t.status.loansLine(player.loans),
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
  t: UiText,
  text: EditionText,
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
          label: text.career(player.career.id)?.title ?? player.career.title,
          value:
            player.career.payPerPip === undefined
              ? formatSalary(player.career.salary, currency, t)
              : t.panel.onAverage(formatSalary(player.career.salary, currency, t)),
        }
      : {
          key: 'career',
          icon: 'space:first-job-fair',
          label: t.status.unemployed,
          value: t.status.casualShifts,
        },
  )

  if (player.house) {
    items.push({
      key: 'house',
      icon: player.house.icon,
      label: text.house(player.house.id)?.name ?? player.house.name,
      value: money(player.house.price),
    })
  }

  // The passengers, exactly as the pawn on the board carries them.
  items.push({
    key: 'marriage',
    icon: 'space:wedding-day',
    label: player.isMarried ? t.status.married : t.status.single,
  })
  if (player.children > 0) {
    items.push({
      key: 'children',
      icon: 'space:new-baby',
      label: t.status.children(player.children),
      value: money(expectedChildValue(player, economy) * player.children),
    })
  }
  if (player.hasDegree) {
    items.push({ key: 'degree', icon: 'space:cap-and-gown', label: t.status.graduate })
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
      label: t.status.shares(shares),
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
      label: t.status.lifeTiles(player.lifeTiles.length),
      value: money(worth),
    })
  }

  if (player.loans > 0) {
    items.push({
      key: 'loans',
      icon: 'finance:bank-visit',
      label: t.status.loans(player.loans),
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
  const t = useUi()
  const text = useEditionText(editionId)
  const money = (amount: number): string => formatMoney(amount, currency)
  const netWorth = estimateNetWorth(player, difficulty, edition)
  const lines = ledgerFor(player, difficulty, editionId, t, text)

  const colorVars = {
    '--player-base': `var(--player-${player.color})`,
    '--player-dark': `var(--player-${player.color}-dark)`,
  } as CSSProperties

  const shelf = shelfFor(player, difficulty, editionId, t, text)

  return (
    <section className={styles.player} style={colorVars} aria-label={t.status.playerAria(player.name)}>
      <header className={styles.playerHeader}>
        <span className={styles.dot} aria-hidden="true" />
        <h3 className={styles.playerName}>{player.name}</h3>
        {player.isCpu && <span className={styles.cpuTag}>{t.status.computer}</span>}
        {/* The badge prints the ordinal alone; the full phrase is spoken.
            Split rather than appended because a language whose ordinal
            already *means* "first place" (Japanese's 1位) has nothing to
            append, and would otherwise be read out twice. */}
        {rank !== undefined && (
          <span className={styles.rank}>
            <span aria-hidden="true">{formatOrdinal(rank, t)}</span>
            <span className="visually-hidden">{t.format.ordinalPlace(formatOrdinal(rank, t))}</span>
          </span>
        )}
        {isActive && <span className={styles.nowPlaying}>{t.status.nowPlaying}</span>}
        {player.isRetired && (
          <span className={styles.retiredBadge}>
            {player.retirementRank ? t.status.retiredRank(player.retirementRank) : t.status.retired}
          </span>
        )}
      </header>

      {/* One number, big. Everything else on this card is what it is made
          of. The old card led with a two-column ledger at 0.78rem and put
          the total at the bottom, which is the shape of a spreadsheet: it
          answers "what are the line items" before "am I winning". */}
      <div className={styles.total}>
        <span className={styles.totalLabel}>{t.status.netWorth}</span>
        <span className={styles.totalValue}>{money(netWorth)}</span>
        <span className={styles.totalNote}>{t.status.ifGameEndedNow}</span>
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
        <summary className={styles.breakdownSummary}>{t.status.fullBreakdown}</summary>
        <table className={styles.ledger}>
          <caption className="visually-hidden">{t.status.ledgerCaption(player.name)}</caption>
          <thead>
            <tr>
              <th scope="col">{t.status.holdingColumn}</th>
              <th scope="col" className={styles.ledgerValue}>
                {t.status.worthColumn}
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
          <span className={styles.insuranceLabel}>{t.status.insured}</span>
          {player.insurance.map((kind) => (
            <span key={kind} className={styles.policy}>
              <span className={styles.factIcon} aria-hidden="true">
                <GameIcon name={INSURANCE_ICON[kind]} size={14} />
              </span>
              {insuranceLabel(kind, t)}
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
  const t = useUi()
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
        aria-label={t.status.aria}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 className={styles.heading}>{t.status.heading}</h2>
          <ChunkyButton variant="secondary" size="sm" icon="exit" onClick={onClose}>
            {t.common.close}
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
