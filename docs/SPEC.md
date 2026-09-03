# LIFE JOURNEY — Build Spec

A web remake **in the spirit of** the classic life-path board game (spinner, careers,
paydays, marriage, houses, retirement). All content — board, careers, events, art,
music — is **original**. No Takara Tomy trademarks, board layout, or assets are
reproduced. The product name is **LIFE JOURNEY**.

**The entire UI is in English.** No Japanese strings anywhere in shipped code.

---

## 1. Architecture

Strict clean architecture. Dependencies point **inward only**:

```
presentation ──▶ application ──▶ domain
infrastructure ─▶ application (implements its ports) ──▶ domain
```

| Layer | Path | May import from | Must never import |
|---|---|---|---|
| Domain | `src/domain` | itself only | react, browser APIs, application, infrastructure |
| Application | `src/application` | domain | react, browser APIs, infrastructure, presentation |
| Infrastructure | `src/infrastructure` | domain, application ports | react, presentation |
| Presentation | `src/presentation` | domain types, application | infrastructure (except via injection) |

The domain and application layers must run in plain Node with no DOM. No
`window`, `document`, `localStorage`, `Math.random`, or `Date.now` in them —
non-determinism goes through `RandomPort`.

### Frozen contracts — read, never edit

- `src/domain/model/types.ts`
- `src/domain/model/constants.ts`
- `src/domain/board/movementTypes.ts`
- `src/application/ports/RandomPort.ts`
- `src/application/ports/GameRepositoryPort.ts`
- `src/application/ports/StatsRepositoryPort.ts`
- `src/application/ports/AudioPort.ts`
- `src/application/GameStore.ts`

If a contract genuinely blocks you, **stop and report it** rather than editing it —
three other agents are compiling against the same file.

### Path aliases

`@domain/*`, `@application/*`, `@infrastructure/*`, `@presentation/*`.
Within a layer, prefer relative imports.

---

## 2. TDD is mandatory

For every unit: **write the failing test first**, then the implementation, then
refactor. Tests live beside their subject as `<name>.test.ts`.

- Domain and application: aim for near-total branch coverage. These are pure — there
  is no excuse for a gap.
- Every test must be deterministic. Use fake/seeded ports, never real randomness.
- Run your own slice continuously: `npx vitest run src/<your-layer>`.
- Do not finish with failing tests or type errors in your slice.

Test style: `describe` per unit, `it('does X when Y')`, arrange/act/assert.
Prefer many small behavioural tests over a few sprawling ones.

---

## 3. Game rules

### Setup
2–4 players, each seat either a person or the computer. Everyone starts on
`start` with `STARTING_MONEY`, no career, no degree, no shares and no policies.
`NewGameConfig.boardLength` picks a `short` / `standard` / `long` board.

### Computer seats
A seat with `isCpu` plays itself. `decideCpuCommand(state)` returns the command
that seat would issue for the current phase — it is pure, deterministic, and
scores the options it is offered rather than picking at random. The UI paces it
with `CPU_THINK_MS` and routes its roll through the die, so a computer turn
looks exactly like a person's. It must never return an option id outside
`pendingDecision.options`: an invalid id would freeze the game.

### Turn cycle
`awaitingSpin` → roll (1–6) → `moving` (pawn animates along `movementPath`) →
`settle` → either `awaitingDecision` (branch/career/house) or `resolved`
(`lastEvent` populated) → `endTurn` → next non-retired player.

### Movement
- Step space by space along `Space.next`.
- `next.length > 1` is a fork: halt **before** stepping off it and raise a branch
  decision. Resume with the remaining steps once chosen.
- Entering a `stop` space halts movement; leftover steps are forfeited.
- Passing over a `payday` space pays salary immediately (counted by
  `MovementPlan.paydaysPassed`). Landing on one pays via its own effect — never both.
- Reaching `retirement` retires the player: `isRetired = true`, `retirementRank`
  assigned in retirement order (1, 2, 3 …).

### Money
- Cash may go negative. A player who would be pushed below zero by a payment
  automatically takes as many `LOAN_PRINCIPAL` loans as needed to cover it.
- Each loan is repaid at `LOAN_REPAYMENT` during final scoring.

### Effects
Implement every variant of `SpaceEffect`:

| Effect | Behaviour |
|---|---|
| `none` | Flavour only |
| `gainMoney` / `payMoney` | Adjust cash by `amount` |
| `payday` | Pay `career.salary`; nothing if unemployed |
| `payRaise` | `salary += raiseStep`; nothing if unemployed |
| `gainLifeTiles` | Draw `count` tiles from the shuffled deck |
| `chooseCareer` | Offer 2 random careers from the given pool → decision |
| `graduate` | `hasDegree = true` |
| `getMarried` | `isMarried = true`; every other player pays `WEDDING_GIFT` |
| `haveChildren` | Roll; `arrivals` says how many arrive on that face (New Baby: 1-2 none, 3-5 one, 6 twins), and `celebrationPerChild × arrivals` is paid in gifts. A tile whose every face agrees (Twins) settles on landing with no die |
| `buyHouse` | Offer 3 affordable-ish houses + a "not yet" option → decision |
| `collectFromEach` | Every other player pays `amount` to the mover |
| `payEach` | The mover pays `amount` to every other player |
| `spinForMoney` | Spin; gain `perPip × result` |
| `retire` | Retire the player |
| `careerChange` | Offer 2 fresh careers from the qualifying pool; declinable unless `compulsory`. `pool` caps which shelf they come off (like `chooseCareer`); `startsOver` deals the bottom rung to anyone crossing in from another shelf; `passSpin` turns the offer into a **gate** — that face or better and one of the two posts is yours, under it nothing happens at all (the Researcher: France concours) |
| `loseCareer` | `career = null`; paydays pay nothing until re-hired. No effect on a calling, or on a career marked `cannotBeLaidOff` |
| `buyStock` | Offer 3 random stocks plus a decline option → decision |
| `stockDividend` | Pay `perShare × totalShares`; nothing to a player holding none |
| `buyInsurance` | Offer the listed policies not already held → decision |
| `bank` | Take a loan, repay one at `EARLY_LOAN_REPAYMENT`, or walk on → decision |
| `payPerChild` / `collectPerChild` | Multiply `amount` by `children` |
| `swapMoneyWithLeader` | Swap cash with the richest non-retired player |
| `stealLifeTile` | Take one random tile from the biggest tile holder |
| `upgradeHouse` | Trade up to a dearer home, old one credited at `price` → decision |

A `payMoney` effect may carry `hazard`. A player holding the matching policy
(`fire` → `home`, `accident` → `auto`) pays nothing.

### Final scoring (`GameResults`)
Once every player is retired:

```
total = cash
      + Σ lifeTile.value
      + house resale (random in resaleRange, 0 if no house)
      + Σ shares × (random in the stock's payoutRange)
      + LIFE_INSURANCE_PAYOUT if the life policy is held
      + children × CHILD_BONUS
      + retirement bonus (FIRST_RETIREMENT_BONUS halved per rank: 80k / 40k / 20k / 10k)
      - loans × LOAN_REPAYMENT
```

`estimateNetWorth(player)` is the same idea without randomness — stocks at the
midpoint of their range, house at its price — and drives the live rank HUD.

Standings sort by `total` descending; `rank` is 1-based; ties share the lower rank
number and `winnerId` is the first of them.

---

### Saving and records
Four save slots. Slot `AUTOSAVE_SLOT` (0) is a rolling autosave written after
every `endTurn`; 1–3 are manual. Every finished game appends a `GameRecord` to
the stats repository exactly once, so a group can keep score across an evening.

---

## 4. Board layout

One route definition, one board: 75 spaces at `normal`, rising to 90 at
`veryHard` as the difficulty seeds its extra setbacks in. A session runs about
fifteen minutes, which is the whole reason there is one length and not three —
a game nobody finishes is a game nobody plays twice. The board keeps every
milestone stop and carries every `SpaceEffect` variant at every difficulty.

The only thing that thins or thickens the route is difficulty: `appearsFrom` on
a space is the gate, and `createBoard.test.ts` pins what each step up is allowed
to change.

The upset spaces and the biggest money swings belong in the last third of the
route, where they can still change the standings — a board decided by turn ten
is the failure mode to design against. Coordinates are abstract units inside `Board.width` ×
`Board.height`; the UI renders them into an SVG `viewBox`. Lay them out as a
readable serpentine so the path never crosses itself.

```
START ─┬─ College Lane (~8) ─────▶ GRADUATION (stop)   ─┐
       └─ Straight to Work (~5) ─▶ FIRST JOB (stop)     ─┴─▶ MAIN STREET
MAIN STREET ─▶ … paydays every ~6 ─▶ MARRIAGE (stop)
MARRIAGE ─┬─ Family Lane ─┐
          └─ Fast Track ──┴─▶ HOME BUYING (stop)
HOME BUYING ─┬─ Risky Road ─┐
             └─ Safe Street ┴─▶ … ─▶ RETIREMENT (terminal)
```

- College Lane: tuition (`COLLEGE_TUITION`), study events, richer later payoff.
- Family Lane: more children and life tiles, fewer paydays.
- Fast Track: more paydays and raises, fewer life tiles.
- Risky Road: big swings both ways (`spinForMoney`, `payEach`, `collectFromEach`).
- Safe Street: small steady gains.

Copy must be warm, playful, and concrete — "Your podcast goes viral", not "Gain
money". Every space gets an emoji.

---

## 5. Design language (presentation)

Target: **Nintendo first-party polish**. Joyful, chunky, tactile, immaculate.

- **Type**: rounded system stack — `ui-rounded, 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', system-ui, sans-serif`. Heavy weights for numbers and headings. No external font CDNs.
- **Colour**: warm cream canvas, saturated candy accents, deep navy text. Every colour a CSS custom property in `:root`. Support `prefers-color-scheme: dark`.
- **Buttons**: chunky, fully rounded, with a darker bottom lip (`box-shadow: 0 6px 0 <dark>`). On press the lip collapses and the button translates down — it must feel like a physical key. Never a flat rectangle.
- **Motion**: springs, not linear fades. Overshoot on entry, squash-and-stretch on the pawn's hop, a satisfying settle on every card. Use `framer-motion`.
- **Feedback**: every action gets a sound *and* a visual. Money changes roll up digit by digit and flash green/red. Milestones burst confetti.
- **Dice**: a moulded six-face die, docked over the foot of the board. Multi-turn tumble, decelerating ease-out, the face flickering every quarter turn, a bounce as it settles on the number it rolled.
- **Board**: SVG. Rounded-square tiles along a drawn path, tone-coloured, with the emoji centred. The current player's tile pulses. Camera pans smoothly to follow the active pawn.
- **Accessibility**: full keyboard operation, visible focus rings, `aria-live` for turn and money announcements, and honour `prefers-reduced-motion` by cutting movement to instant transitions (never remove information).
- **Responsive**: works from 360 px phones to wide desktops. Board scales; panels reflow to a bottom sheet on narrow screens.

Absolutely no placeholder text, lorem ipsum, or "TODO" in shipped UI.

---

## 6. Audio

Fully **procedural Web Audio** — no binary assets, no network fetches.

- Three looping BGM tracks (`title`, `board`, `results`), each a short original
  chiptune-ish loop scheduled ahead on the audio clock so it never drifts or clicks:
  a bass line, a chord pad, and a melody, with a light drum pulse.
- SFX for every `SfxName`, built from oscillators and noise bursts with envelopes.
- Nothing may start before a user gesture; `unlock()` is called from a click.
- Music and SFX toggle independently and persist to `localStorage`.
- Ramp gain rather than switching it — no clicks or pops, ever.
