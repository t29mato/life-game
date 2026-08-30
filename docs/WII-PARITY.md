# LIFE JOURNEY — Wii-parity work order

The goal of this round: make the game feel like a console party board game —
computer opponents, investing, insurance, career churn, upsets that keep last
place alive, a board with depth, and a host that reacts to what happens.

**Mini-games are explicitly out of scope for this round. Do not build any.**

Seven agents work in parallel. This document is the contract between them.

---

## Non-negotiables (unchanged from `SPEC.md` / `DESIGN.md`)

- **English only.** No Japanese strings anywhere in shipped UI, code, comments,
  or test names. The players are English speakers.
- **No new dependencies.** React 19 + `framer-motion`, nothing else.
- **No external assets.** CSS, inline SVG and procedural Web Audio only.
- **Clean architecture holds.** `src/test/architecture.test.ts` enforces it:
  domain imports nothing outward, application never touches the DOM,
  presentation never imports `src/infrastructure`.
- **TDD.** Failing test first, then the implementation. Domain and application
  aim for near-total branch coverage. Every test deterministic — seeded ports,
  never `Math.random`/`Date.now` in domain or application.
- **No placeholder copy.** No lorem ipsum, no `TODO` in shipped UI.

---

## File ownership — do not edit outside your slice

| Owner | Owns |
|---|---|
| **Integrator (already done)** | `src/domain/model/*`, `src/application/GameStore.ts`, `src/application/ports/*`, `src/presentation/App.tsx`, `src/presentation/App.module.css`, `src/main.tsx`, `src/test/*`, `docs/*` |
| AGENT-DOMAIN | `src/domain/board/**`, `src/domain/rules/**`, `src/domain/catalog/**`, `src/domain/index.ts` |
| AGENT-APP | `src/application/usecases/**`, `src/application/cpu/**`, `src/application/createGameStore.ts`, `src/application/testing/**`, `src/application/*.test.ts` |
| AGENT-INFRA | `src/infrastructure/**` |
| AGENT-BOARD | `src/presentation/components/Board/**`, `src/presentation/components/Pawn/**`, `src/index.css` |
| AGENT-UI | `src/presentation/components/{PlayerPanel,DecisionModal,EventCard,GameLog,TurnHandoff,RankHud}/**` |
| AGENT-SCREENS | `src/presentation/components/{TitleScreen,ResultsScreen,RecordsScreen}/**` |
| AGENT-ART | `src/presentation/icons/**` |

If you need something changed outside your slice, **stop and report it** — do not
edit it. The repository is not under version control, so a stray edit to another
agent's file cannot be recovered.

The tree will not typecheck end-to-end until every agent has landed. Run and
green **your own slice only** (`npx vitest run src/<your area>`) and ignore
errors whose root cause is in someone else's files.

---

## Contracts already in place (read, do not edit)

`src/domain/model/types.ts` now carries:

- `BoardLength = 'short' | 'standard' | 'long'`, `InsuranceKind = 'home' | 'auto' | 'life'`,
  `Hazard = 'fire' | 'accident'`
- `Stock { id, name, ticker, price, payoutRange: [min,max], icon, description }`,
  `StockHolding { stockId, shares }`
- `Player` gained `stocks`, `insurance`, `isCpu`
- `PlayerResult` gained `stockValue`, `insurancePayout`
- `GameState` gained `boardLength`; `NewGameConfig` gained `boardLength`;
  `NewGamePlayer` gained `isCpu`
- `LandingEvent` gained optional `emphasis?: 'normal' | 'big' | 'milestone'` and
  `narration?: string`
- `DecisionKind` gained `'stock' | 'insurance' | 'bank'`
- `payMoney` gained optional `hazard?: Hazard`
- New `SpaceEffect` variants: `careerChange`, `loseCareer`, `buyStock`,
  `stockDividend`, `buyInsurance`, `bank`, `payPerChild`, `collectPerChild`,
  `swapMoneyWithLeader`, `stealLifeTile`, `upgradeHouse`

`src/domain/model/constants.ts` gained `INSURANCE_PREMIUM`,
`LIFE_INSURANCE_PAYOUT`, `EARLY_LOAN_REPAYMENT`, `SHARES_PER_PURCHASE`,
`BOARD_LENGTH_SCALE` (since removed — see "Board lengths" below).

`src/domain/model/icons.ts` gained the `finance:*` and `stock:*` families and
eleven new `space:*` subjects. AGENT-ART draws all of them.

`src/application/ports/GameRepositoryPort.ts` is now slot-based
(`save(slot, state)`, `load(slot)`, `has(slot)`, `clear(slot)`, `list()`,
`SAVE_SLOT_COUNT = 4`, `AUTOSAVE_SLOT = 0`, `SaveSlotInfo`).

`src/application/ports/StatsRepositoryPort.ts` is new: `list()`, `append()`,
`clear()`, with `GameRecord`/`GameRecordEntry`.

`src/application/ports/AudioPort.ts` gained SFX `cutIn`, `stockTick`, `stamp`,
`upset`, `handoff`.

`src/application/GameStore.ts`: `save`/`load` commands now carry `slot`;
`canLoad(slot)`, `slots()` and `records()` are on the interface.

---

## Cross-agent API contract — code against these signatures

Everyone may rely on these existing before integration; implement your side
without waiting for the other agent.

### AGENT-DOMAIN provides

```ts
// src/domain/board/createBoard.ts
export function createBoard(length?: BoardLength): Board   // default 'standard'

// src/domain/catalog/stocks.ts
export const STOCKS: readonly Stock[]
export function findStock(id: StockId): Stock | undefined

// src/domain/rules/player.ts  (additions; existing helpers keep their signatures)
export function loseCareer(player: Player): Player
export function buyShares(player: Player, stock: Stock, shares: number): Player
export function totalShares(player: Player): number
export function addInsurance(player: Player, kind: InsuranceKind): Player  // debits the premium
export function hasInsurance(player: Player, kind: InsuranceKind): boolean
export function isCoveredAgainst(player: Player, hazard: Hazard): boolean  // fire→home, accident→auto
export function takeLoan(player: Player): Player       // +LOAN_PRINCIPAL, loans + 1
export function repayLoan(player: Player): Player      // debits EARLY_LOAN_REPAYMENT, loans - 1
export function removeLifeTile(player: Player, tileId: LifeTileId): Player
export function setMoney(player: Player, amount: Money): Player
export function tradeUpHouse(player: Player, house: House): Player  // credits old house price, debits new
// NOTE: `createPlayer` gained a required fifth argument:
export function createPlayer(id, name, color, startSpaceId, isCpu: boolean): Player

// src/domain/rules/scoring.ts — NOT player.ts
export function estimateNetWorth(player: Player): Money  // live ranking, no randomness

// src/domain/rules/scoring.ts  (NOTE the new third argument)
export function computeResults(
  players: readonly Player[],
  rollResale: (house: House) => Money,
  rollStock: (stock: Stock) => Money,
): GameResults
```

### AGENT-APP provides

```ts
// src/application/cpu/decideCpuCommand.ts
/** The command a computer seat issues for the current phase, or null when the
 *  current player is human or nothing is owed. Pure; deterministic. */
export function decideCpuCommand(state: GameState): GameCommand | null

/** How long the UI should pretend to think before dispatching, per phase. */
export const CPU_THINK_MS: Readonly<Record<'awaitingSpin' | 'awaitingDecision' | 'resolved', number>>
```

### Presentation component signatures the integrator wires

```tsx
// AGENT-UI
TurnHandoff({ player, turn, rank, totalPlayers, onReady }: {
  player: Player; turn: number; rank: number; totalPlayers: number; onReady: () => void
})
RankHud({ players, currentPlayerId }: { players: readonly Player[]; currentPlayerId: PlayerId })
DecisionModal({ decision, board, onChoose }: {
  decision: Decision; board: Board; onChoose: (optionId: string) => void
})
EventCard({ event, onDismiss }: { event: LandingEvent; onDismiss: () => void })

// AGENT-SCREENS
TitleScreen({ slots, records, onStart, onContinue }: {
  slots: readonly SaveSlotInfo[]; records: readonly GameRecord[]
  onStart: (config: NewGameConfig) => void; onContinue: (slot: number) => void
})
ResultsScreen({ results, records, onPlayAgain }: {
  results: GameResults; records: readonly GameRecord[]; onPlayAgain: () => void
})
RecordsScreen({ records, onClose }: { records: readonly GameRecord[]; onClose: () => void })

// AGENT-BOARD — existing props preserved, plus:
Board({ board, players, currentPlayerIndex, phase, movementPath, onMovementComplete, introFlythrough })
// introFlythrough?: boolean — when true, run the opening camera sweep once.
```

---

## Rules for the new mechanics (single source of truth)

- **Insurance.** Bought once per kind at a `buyInsurance` space, costs
  `INSURANCE_PREMIUM[kind]`. Holding `home` waives every `payMoney` tagged
  `hazard: 'fire'`; `auto` waives `'accident'`. `life` pays
  `LIFE_INSURANCE_PAYOUT` at the final scoring. Already-held kinds are never
  re-offered.
- **Stocks.** A `buyStock` space offers three random stocks plus a decline
  option; buying debits `price × SHARES_PER_PURCHASE`. `stockDividend` pays
  `perShare × totalShares(player)` — nothing to a player holding none. At
  retirement each share cashes out at a value rolled inside its `payoutRange`.
- **Bank.** A `bank` space offers: take one loan (`+LOAN_PRINCIPAL`, `loans+1`),
  repay one loan (`-EARLY_LOAN_REPAYMENT`, `loans-1`, only offered when
  `loans > 0` and affordable without new borrowing), or walk on.
- **Career churn.** `careerChange` offers two fresh careers from the pool the
  player qualifies for and they *must* take one. `loseCareer` sets
  `career = null` — paydays then pay nothing until they are hired again.
- **Upsets.** `swapMoneyWithLeader` swaps cash with the non-retired player
  holding the most (no-op if the mover already leads or is alone).
  `stealLifeTile` takes one random tile from the non-retired player with the
  highest tile value (no-op if nobody else holds one). Both are the mechanics
  that keep a trailing player interested — they must feel loud.
- **Children cost something.** `payPerChild` / `collectPerChild` multiply by
  `player.children`, so a big family is a real trade-off rather than pure upside.
- **House upgrade.** `upgradeHouse` offers homes more expensive than the one
  held; the old house is credited back at its `price`. A player with no house
  gets the ordinary `buyHouse` offer instead.

## Board lengths — shipped, then removed

This round shipped three lengths: `'standard'` kept roughly the route of the
day, `'short'` was about 60 % of the trunk (a ~15 minute game) and `'long'`
about 150 %, with `BOARD_LENGTH_SCALE` carrying the ratios.

**None of that exists any more.** A later round cut the game down to the one
fifteen-minute session — what `'short'` used to build — on the grounds that a
game running past a quarter of an hour is a game the table abandons. The tier
machinery that made one route definition produce three boards went with it, as
did every space only the longer boards carried. `createBoard` now takes a
difficulty and an edition, and nothing else. What survived unchanged is the
board `'short'` used to build, tile for tile and coordinate for coordinate.
