# LIFE JOURNEY — The Japan Edition, and How Editions Should Work

**Status: proposal only.** Nothing in this document has been implemented. It is written
for whoever builds it next, against the code as it stands today (`createBoard.ts`,
`types.ts`, the four catalogues, `difficulty.ts`, `decideCpuCommand.ts`,
`format.ts`). Where an idea needs a change to a frozen contract, that is said
plainly, because those files are frozen for a reason and touching them is a
decision the integrator makes, not this document.

The player's brief, in short: make the game more interesting, fill it with the
situations any Japanese adult recognises with a wince or a laugh, and make the
thing already built become the **Japan edition** of a family of country editions
— France and Bolivia to follow. The UI stays entirely in English throughout: this
is Japanese *life* told in English, for a table of friends abroad, not Japanese
text on screen.

The document is in three parts, in the order the work should be believed in:

1. **What would make the game more fun in any country** — because a mechanic that
   only works with Japanese paint on it is not a mechanic.
2. **The Japan edition's content** — the heart of it: careers, spaces, lanes,
   milestones, houses, stocks, tiles, all recast, with copy you could ship.
3. **How editions should work structurally** — the seam between engine and
   country, what is hard-coded today, and what gets expensive at five editions.

---

## Part 0 — What the engine can already say

Every proposal below is graded against this list, because a proposal the engine
can already express costs a content edit, and one it cannot costs a change to a
frozen contract plus `applyEffect`, the CPU, and possibly the UI. The full
`SpaceEffect` union today (`src/domain/model/types.ts:139`):

- Money: `gainMoney`, `payMoney` (optionally hazard-tagged), `spinForMoney`,
  `payEach`, `collectFromEach`, `payPerChild`, `collectPerChild`
- Work: `payday` (also pays when *passed*), `payRaise`, `chooseCareer`,
  `careerChange` (forced re-draw), `loseCareer`
- Life: `gainLifeTiles`, `graduate`, `getMarried`, `haveChildren`, `buyHouse`,
  `upgradeHouse`, `retire`
- Finance: `buyStock`, `stockDividend`, `buyInsurance`, `bank`
- Upsets: `swapMoneyWithLeader`, `stealLifeTile`
- `none` (flavour)

On top of the effects, the board machinery already provides, per space: a tier
(`short`/`standard`/`long` selection), an `appearsFrom` difficulty gate (harder
boards genuinely have more tiles), a `harsher` rewrite (the same tile has a
worse day on Hard), `stop` spaces that halt movement, forks with named
`LaneIdentity`, and hazard tags that make insurance real. **This machinery is
the single most reusable asset the project has** — none of it is US-specific,
and all of Part 2 rides on it unchanged.

---

## Part 1 — Making the game more fun, in any country

Ordered by value per unit of engine cost. 1.1–1.5 are content-only: no type
changes, no new effects, nothing frozen touched. 1.6 is the one new mechanic I
would actually buy. 1.7 is what I considered and would drop.

### 1.1 The mid-game corridor needs a fork (content only — build first)

**The flat spot.** The board has exactly three decisions of consequence: the
opening fork, marriage, and home-buying. Between them, Main Street and Midtown
are long linear corridors where the only verb is "spin". On the standard board a
player can go eight or nine turns — a third of the session — without making a
single choice. That is where attention drifts and phones come out.

**The fix.** Forks are free: `next.length > 1` anywhere raises a branch
decision, and `laneFor`/`layoutFork` already handle named parallel lanes. Add
**one mini-fork in the middle of Main Street** — three to five tiles per side,
rejoining before the marriage stop. Give the two sides opposed personalities so
the choice is arguable at the table (in the Japan edition this becomes *Company
Loyalty Road* vs *Job-Hopper Alley*, §2.4). The layout engine places fork
figures generically; the only code that knows there are exactly three forks is
the hand-written sequence in `computeLayout`/`createBoard` wiring — a content
edit, though it foreshadows the route-as-data work in Part 3.

**Why first:** it attacks the game's largest dead zone at near-zero cost, and
every future edition inherits a fourth personality-defining choice for free.

### 1.2 Insurance almost never pays off — raise the hazard density (content only)

**The flat spot.** A `home` policy costs $25,000 and waives `fire` hazards; but
the standard board carries roughly two fire-tagged tiles, each landed on maybe
once in five games. Players who buy insurance almost never get the *vindication
moment* — the whole table watching a $12,000 bill bounce off a policy — which is
the only reason insurance is fun rather than accounting.

**The fix.** Tag more of the existing bills. Car-adjacent costs get
`hazard: 'accident'`; house-adjacent get `hazard: 'fire'`. Target: a policy
holder should visibly dodge a bill about twice per game, so the premium
roughly breaks even and the *feeling* of it is pure profit. This is editing
`SpaceEffect` literals in board content, nothing more. (Note for Part 3: the
`Hazard` union is frozen and closed — `'fire' | 'accident'` — so the Japan
edition's earthquake is *copy* on a `fire`-tagged tile, not a new hazard kind.
That is fine for three editions; see §3.4.)

### 1.3 "Bonus" paydays: salary-scaled windfalls are already free (content only)

**The observation.** Everyone reaches for `gainMoney` when writing a windfall,
but a fixed sum is worth the same to the pet groomer and the surgeon. The engine
has a salary-scaled payout already: a space with `kind: 'payday'` pays
`career.salary` when landed on *or passed*. Nothing says a payday tile must be
titled "Payday".

**The fix.** Write one or two payday-kind tiles per act as *bonus* events — a
year-end bonus, a profit share, a 13th-month cheque. Same effect, new copy, and
suddenly the board rewards the career you actually picked. This is load-bearing
for the Japan edition (the twice-yearly ボーナス is a national institution, §2.5),
resonates in France (13th month) and Bolivia (the legally mandated aguinaldo) —
one mechanic, three national jokes, zero code.

**One honest caution:** payday tiles pay when *passed*, so each added one is a
whole extra salary packet per walker per game — real balance weight, and
`gameBalance.test.ts` will notice. Add them by converting existing `gainMoney`
tiles' slots, not by pure addition, and let the difficulty machinery's
`missedPayday` hardship apply to them like any other payroll.

### 1.4 More social obligations, fewer solitary bills (content only)

**The flat spot.** `payEach` and `collectFromEach` are the two effects that
make players talk to *each other* — money physically crosses the table — and
the board uses them perhaps five times, mostly on Risky Road. Most costs are
solitary: you pay the board, everyone else checks their phone.

**The fix.** Recast a handful of solitary bills as social ones. A party you
host is `payEach` (you fund everyone's evening); a round of seasonal gifts is
`payEach`; a leaving-do in your honour is `collectFromEach`. The sums stay
small — $500–$2,000 — because the point is the ritual of handing money over,
not the swing. The wedding already does this perfectly (`getMarried` collects
`WEDDING_GIFT` from every player, and lands beautifully as Japan's ご祝儀
envelopes); the board should hit that chord more than once per game.

### 1.5 Sharpen the lane identities into arguments (content only)

`LaneIdentity.summary` is already shown at every fork. Today the summaries are
accurate but polite. Make them *opinionated* enough that the table takes sides:
a fork whose two labels read like two uncles giving contradictory advice gets
argued about, and the argument is the content. This costs nothing and is where
each country edition's voice lives (see the Japan fork copy in §2.4).

### 1.6 The one new mechanic worth buying: dilemma tiles

**The gap no content edit fixes.** Every landing today is either passive (the
board does something to you) or a purchase (career/house/stock/insurance/bank).
There is no space where the player chooses between two *outcomes* — and "pick
your poison" is the single strongest table-talk generator a board game has,
because everyone else at the table has an opinion and says it out loud.

**The proposal.** One new effect:

```ts
| { readonly type: 'dilemma'
    readonly prompt: string
    readonly options: readonly {
      readonly label: string
      readonly description: string
      readonly icon: IconName
      readonly effect: SpaceEffect   // restricted: money/tile/raise effects only
    }[] }
```

Landing raises an `awaitingDecision` exactly like a career or house offer —
`DecisionModal` renders it with **zero UI work** because `Decision` and
`DecisionOption` already carry label/description/icon/detail. Example (Japan
edition, §2.5): *The Invitation* — the department is going drinking. **Go**
(`payMoney` $800, `gainLifeTiles` 1 — wait, one effect only: `payMoney` 800
and the description carries the social note) or **Go home** (`none`, "your
evening is yours; your absence is noted"). Both options priced, neither wrong,
the table divided.

**The honest cost.** This touches the frozen `types.ts` (new effect variant,
new `DecisionKind`), `applyEffect` (one case that re-applies a sub-effect —
keep the allowed sub-effects to the simple money/tile/raise set so it cannot
recurse into decisions), `decideCpuCommand` (score each option's effect with
the valuation table that already exists at `decideCpuCommand.ts:254`), and the
board content that uses it. No new UI, no new audio, no save-format change
(decisions are transient). I estimate it at a day of careful TDD, and it is the
only type-level change in this document I would spend integrator sign-off on.

### 1.7 Considered, and dropped

- **Mini-games.** Explicitly out of scope per `WII-PARITY.md`, and rightly: they
  are a presentation-layer mountain and they break the 30-minute session.
- **Spin duels** (challenge a player, both spin, loser pays). Great moment, but
  it needs target selection — a new decision *about other players* — which the
  CPU currently has no vocabulary for. The dilemma tile buys 80 % of the drama
  for a third of the cost. Revisit after editions ship.
- **Targeted steals / trading.** Same target-selection problem, plus kingmaking
  in a 4-player game. The existing automatic upsets (`swapMoneyWithLeader`,
  `stealLifeTile`) already aim at the leader, which is the fair target.
- **Mid-game stock price movement.** Stocks resolving only at retirement is a
  feature — it keeps the mid-game fast — and `stockDividend` already gives
  holders their moments. Not worth an economy simulation.
- **Events that reference the season/turn number.** The engine has no calendar
  and does not need one; payday-as-bonus (§1.3) fakes an annual rhythm well
  enough.

---

## Part 2 — The Japan edition

### 2.1 Voice: Japanese life, English wit

The rule that makes or breaks this edition: **wit travels; vocabulary does
not.** Every space must land for someone who has never lived in Japan, using
only its own copy. The technique, demonstrated once and then applied
throughout:

> Weak (tourist): "Land on the Shinkansen space!"
> Weak (untranslated): "Nomikai — pay ¥8,000."
> Right: **"The Last Train"** — *"The izakaya ran long, the 12:04 left without
> you, and the taxi home costs more than the dinner did."* `payMoney ¥180,000`

The joke is the *situation*, described concretely enough to explain itself. A
single Japanese word may appear when the sentence teaches it in passing
("a small carved seal — your hanko — without which you do not officially
exist"), and never in a title or a button. No Japanese script anywhere, per the
SPEC's English-only rule.

The second rule: **prefer the wince of recognition to the postcard.** Cherry
blossoms are on the board, but the tile is about being sent at dawn to guard
the tarp. The content below is chosen by one test: *does this make a good board
space* — a moment, a number, and a feeling — not merely a reference.

### 2.2 Money: yen at ×100, and what that breaks

All amounts convert at a flat **×100** ($42,000 → ¥4,200,000). This is not an
exchange rate; it is a balance-preservation rule. Every number in the current
game is tuned against every other — salaries against tuition against loan
interest against the retirement bonus — and the cheapest correct move is to
keep the ratios bit-for-bit and change only the unit. Realism is already
stylised (a $10,000 wedding gift is not realistic either); the wink lives in
the copy ("envelopes of astonishing thickness"), not in the arithmetic.

What ×100 actually breaks, so nobody is surprised (details in Part 3):

- `formatMoney` hard-codes `$` and en-US grouping (`format.ts:8`). Needs a
  per-edition formatter. Yen conveniently has no decimals.
- Nine-digit numbers (`¥100,000,000` net worth) will not fit where `$1,000,000`
  fits. The HUD and digit roll-up need a compact form (`¥42.0M`) for tight
  spots; the edition owns that policy.
- Difficulty rounding: `toHundreds` in `difficulty.ts` rounds scaled bills to
  $100 so tiles print cleanly; the yen equivalent is ¥10,000. Rounding unit
  becomes edition data.
- The CPU's absolute thresholds (`CASH_RESERVE: 60_000`,
  `RISK_CASH_FLOOR: 25_000`, and the effect-valuation table around
  `decideCpuCommand.ts:254`) silently become 100× too timid or bold. They must
  be sourced from edition constants or restated as ratios of salary.

### 2.3 The route: same skeleton, Japanese skin

The board's skeleton — opening fork, trunk, marriage fork, trunk, housing fork,
sunset run — maps onto a Japanese life with almost eerie precision, which is
part of why this edition is the right first one. Tiers, difficulty gates,
hardships, and the three lengths all carry over unchanged.

```
START ─┬─ University Lane ───▶ GRADUATION ─▶ THE JOB HUNT (stop) ─┐
       └─ Straight to Work ──▶ PLACEMENT DAY (stop) ──────────────┴─▶ SALARYMAN STREET
SALARYMAN STREET ─┬─ Company Loyalty Rd ─┐        ← new mini-fork (§1.1)
                  └─ Job-Hopper Alley ───┴─▶ … ─▶ WEDDING DAY (stop)
WEDDING DAY ─┬─ Family Lane ─┐
             └─ Career Track ┴─▶ MIDTOWN ─▶ THE MODEL ROOM (stop)
THE MODEL ROOM ─┬─ Speculation St ─┐
                └─ Steady Street ──┴─▶ SUNSET YEARS ─▶ RETIREMENT
```

Milestone stops, recast:

| Stop | Title | Copy | Effect |
|---|---|---|---|
| Graduation | **Graduation Day** | "Four years, one thesis, and a diploma tube you will never open again." | `graduate` |
| Grad job fair | **The Job Hunt** | "Forty thousand of you buy the same black suit in the same week and take the same aptitude test. Two doors open; pick one." | `chooseCareer` graduate pool |
| First job (work lane head) | **Placement Day** | "Your school has an arrangement with a local firm, and by Friday you have a badge, a uniform, and a wage — two years before the students earn a thing." | `chooseCareer` basic pool |
| Marriage | **Wedding Day** | "A hotel banquet, two outfit changes, and every guest hands over a thick envelope of crisp notes — attendance is priced, and beautifully calligraphed." | `getMarried` (the engine's gift-from-each-player *is* the ご祝儀 custom, verbatim) |
| Home buying | **The Model Room** | "A showroom apartment with rented furniture, soft lighting, and a salesman whose repayment plan is exactly as long as the rest of your working life." | `buyHouse` |
| Retirement | **Retirement Day** | "A bouquet at your desk, one deep bow to the office, and the first Monday in forty years with nowhere to be." | `retire` |

### 2.4 The forks, written to be argued about

The fork copy is where the edition's soul is cheapest to install
(`LaneIdentity`, §1.5):

- **University Lane** — *"Four years, an exam that decides them, and a bill up
  front. What the degree buys is a corporate ladder that mostly goes up."*
- **Straight to Work** — *"Your school hands you to an employer before the
  graduates have bought their suits. Paid from day one, on a ladder with rungs
  at both ends."*
- **Company Loyalty Road** (new mini-fork, §1.1) — *"Stay put. The raises come
  by seniority, slowly and without fail, and the company remembers loyalty —
  usually."* (Steady `payRaise` and payday tiles; the *Transfer Order* hardship
  lives here — loyalty means going where you are sent.)
- **Job-Hopper Alley** — *"Change firms and name your price. Recruiters love
  you; HR departments keep a file."* (`careerChange`, bigger swings, a
  `loseCareer` risk tile — the road for players behind on salary.)
- **Family Lane** — *"School bags, cram school, and a house full of noise.
  Fewer paydays; better stories."*
- **Career Track** — *"The overtime is real and so are the raises. The life
  you might have had is itemised separately."*
- **Speculation Street** — *"Crypto, margin, and a tip from a man in a very
  good suit. The swings here decide whole games."*
- **Steady Street** — *"The savings account, the point card, the coupon. Nobody
  ever got rich here, or ruined."*

### 2.5 Salaryman Street — the trunk, and the heart of the あるある

This is the longest stretch and the densest with recognition-comedy. A
representative set, each row implementable as-is (tier suggestions in
parentheses; amounts pre-×100-scaled yen; hardships shown where they earn it):

| Title | Copy | Effect |
|---|---|---|
| **First Business Cards** (t0) | "A box of five hundred cards with your name on them. You receive one with two hands, study it gravely, and place it in a special wallet. There are rules." | `none`; harsher (hard): "…and the special wallet, the seal, and the correct pen are all sold separately." `payMoney ¥60,000` |
| **The Personal Seal** (t1) | "You cannot open a bank account, rent a flat, or officially exist without a small carved stamp of your own name. The nice one is surprisingly expensive." | `payMoney ¥60,000` |
| **The Morning Crush** (t0) | "You are folded into the 7:42 by a gloved professional whose entire job is pushing. You have learned to read a phone held six centimetres from your face." | `none`; harsher (hard): "…your umbrella and one shirt button do not survive the experience." `payMoney ¥30,000` |
| **Welcome Party** (t0) | "The department drinks to your arrival. You discover that your glass is refilled by rank, and that yours is the arm that pours for everyone senior — which is everyone." | `payEach ¥50,000` (you fund the table — §1.4) |
| **The Last Train** (t0) | "The izakaya ran long, the 12:04 left without you, and the taxi home costs more than the dinner did." | `payMoney ¥180,000` |
| **Summer Bonus** (t0) | "Twice a year the company simply hands you extra months of salary. Nobody abroad believes you." | `kind: 'payday'` (§1.3 — pays your actual salary); harsher (veryHard): *"Bonus Season, Cancelled"* — "This year's envelope contains a letter from the president about headwinds." `payMoney ¥120,000`, kind `normal` |
| **Nine Red Stamps** (t1) | "Your proposal circulates for approval and returns three weeks later wearing nine red stamps, slightly changed by each of them." | `none`; harsher (veryHard): "…the tenth stamp requests a ten percent budget cut, and the budget is yours." `payMoney ¥200,000` |
| **Seniority Raise** (t0) | "Your pay rises because you have become one year older. Performance was not discussed, and it would have been rude to ask." | `payRaise` |
| **The Invitation** (t1) | *Dilemma (§1.6):* "It is 9 p.m. and the section chief is putting on his coat meaningfully. 'Just one drink.'" → **Go** (`payMoney ¥80,000` — "it was not one drink") / **Go home** (`none` — "your evening is yours; your absence is noted") | `dilemma` — cut this tile if §1.6 is not built; do not fake it |
| **Hometown Tax** (t1) | "You redirect your taxes to a village you have never visited, and it thanks you with a box of astonishing beef." | `gainMoney ¥100,000` |
| **The Number Card** (t2) | "You queue for two hours to collect the identity card that was introduced to end queueing." | `payMoney ¥20,000` |
| **Blossom Duty** (t1) | "The cherry trees bloom for one perfect week. You find out you are this year's designated tarp-holder at six a.m., guarding an empty rectangle from other companies' tarp-holders." | `gainLifeTiles 1`; harsher (hard): "…and, as junior-most, you also buy the drinks for the entire department." `payMoney ¥120,000` |
| **Golden Week** (t1) | "The whole country goes on holiday during the same five days, at triple price, to the same six places. You have a wonderful time in a queue." | `payMoney ¥150,000` |
| **Year-End Party** (t0) | "The year is officially forgotten at an all-you-can-drink banquet. Someone from Accounting sings, magnificently. You are somehow the treasurer." | `payEach ¥40,000`; harsher (hard): the venue's cancellation fee finds you. `payMoney ¥180,000` |
| **New Year Cards** (t2) | "You address seventy postcards to people you will also see in person, so that a lottery number printed on each may change nothing." | `payMoney ¥30,000` |
| **Convenience Dinner** (t2) | "Fried chicken and a rice ball at 11 p.m. under excellent lighting. Cheap, delicious, quietly becoming your entire personality." | `payMoney ¥20,000` |
| **The Transfer Order** (t0, `appearsFrom: 'hard'`) | "Osaka. April first. The company decided in February; you found out on Friday. Your apartment, gym, and favourite ramen counter are now souvenirs." | `careerChange` — the forced re-draw *is* the transfer |
| **Restructuring** (t0) | "The firm announces a 'voluntary' early retirement scheme, and your name is on the list of volunteers." | `loseCareer` (sits one tile before the Career Fair stop, exactly like today's layoff) |
| **Mid-Career Fair** (t0, stop) | "A hall of booths for people who did everything right at a company that did not. Two firms like your CV; pick one." | `careerChange` |

The `missedPayday` hardship gets its perfect Japanese name here: **"Service
Overtime"** — *"The overtime is real; the pay for it is described as
voluntary."* — the standard payroll-cancellation device (`kind: 'normal'`,
small `payMoney`) wearing the exact phrase (サービス残業, translated) every
Japanese employee knows.

### 2.6 University Lane and Straight to Work

University Lane (tuition stays the unscaled stop, ¥4,000,000):

| Title | Copy | Effect |
|---|---|---|
| **Exam War** (t0, stop → tuition) | "One February morning decides four years. The examination hall is silent except for six hundred pencils and one person coughing." | tuition stop as today |
| **The Cram Year** (t1, `appearsFrom: 'hard'`) | "You missed the cut by two points, so you enrol at a cram school to spend one entire year doing nothing else. There is a word for people living this year, and it is the old word for a masterless samurai." | `payMoney ¥800,000` |
| **Six-Tatami Room** (t1) | "Your first solo apartment is measured in straw mats. It holds a futon, a rice cooker, and every ambition you have." | `payMoney ¥140,000` |
| **Convenience Shifts** (t0) | "Night shifts at the convenience store: you can now scan, bag, brew, fry, and bow simultaneously." | `gainMoney ¥300,000` |
| **The Circle** (t2) | "You join a university club that is nominally about tennis and actually about drinking parties with a tennis theme." | `none`; harsher: club trip fees, `payMoney ¥50,000` |
| **Seminar Professor** (t1) | "Your fourth-year research seminar adopts you. Your professor's recommendation letter is worth more than your thesis, and both of you know it." | `gainLifeTiles 1` |
| **Suit Season** (t0) | "Job hunting begins: one black suit, one white shirt, one approved hairstyle, one canvas of forty thousand identical portfolios. Yours has a nice font." | `payMoney ¥60,000` |
| **Interview Marathon** (t1) | "Round three of eight. Today's question: 'Describe a time you overcame adversity as part of a team.' You have described it eleven times this month." | `none`; harsher: travel to interviews in three cities, `payMoney ¥90,000` |
| **The Offer Ceremony** (t1) | "The company that chose you gathers all its chosen in one hall in October to formally promise each other next April. It is a betrothal, with lanyards." | `gainLifeTiles 1` |

Straight to Work keeps its structural promise (hired on tile one, §board): the
school-mediated placement system makes this *more* true in Japan than in the
original — the copy above ("Placement Day", §2.3) says so. The lane's tiles:
first pay envelope, dormitory rent, the factory floor's morning calisthenics
(*"Radio Calisthenics — the whole yard stretches in unison to a piano recording
older than everyone present"* — flavour, life tile on long), forklift licence
(`payRaise`), the scratch-card and pachinko-adjacent `spinForMoney` beats
(*"Prize Exchange — you win at the parlour, which legally sells you a trinket,
which a mysteriously adjacent window buys for cash — spin for the haul"*).

### 2.7 Family Lane — the beats every Japanese parent knows

| Title | Copy | Effect |
|---|---|---|
| **New Baby** (t0, stop) | "A tiny new roommate arrives. The ward office gives you a handbook, a nurse visit, and a lump-sum that almost covers the hospital." | `haveChildren 1` |
| **The Nursery Waitlist** (t0) | "You applied for public nursery before the baby could sit up. You are 47th in line, so a private one bridges the gap at private prices." | `payPerChild ¥500,000`; the childcare hardship slot, verbatim need |
| **The School Bag** (t1) | "Grandparents insist on buying each child the traditional leather backpack. It costs more than your first laptop and will outlast your car." | `collectPerChild ¥60,000` (the grandparents pay *you* — the rare warm per-child tile) |
| **Seven-Five-Three** (t2) | "Children aged seven, five, and three are dressed in tiny formal kimono and photographed at a shrine until at least one of them cries." | `payPerChild ¥40,000`, `gainLifeTiles` on long |
| **Cram School** (t0) | "Every child now attends a second school that begins when the first one ends. Dinner is a rice ball eaten on a bicycle." | `payPerChild ¥300,000` |
| **Exam Season** (t1) | "Application fees for five schools each — just in case — and a special lucky snack whose name puns on 'certain victory'." | `payPerChild ¥200,000` |
| **Sports Day** (t0) | "Your child's class wins the giant-ball-rolling event. You filmed the wrong child for most of it, but the cheering was real." | `gainLifeTiles 1` |
| **New Year Money** (t1) | "Every adult relative hands every child a decorated envelope of cash. You are now the adult relative. The maths only gets worse." | `payPerChild ¥100,000` |
| **Child Allowance** (t1) | "A quiet deposit arrives from the ward office for every small person in the house." | `collectPerChild ¥150,000` |
| **PTA Lottery** (t2) | "The parent-teacher association assigns its committee roles by drawing lots, and your slip is not blank. Your year just gained forty meetings." | `none`; harsher: event supplies come out of your pocket, `payMoney ¥50,000` |

### 2.8 Midtown, the housing act, and the endgame

**Midtown** keeps its financial-services spine (bank, insurance, brokerage —
all existing effects) with the insurance office rewritten to sell what Japan
actually fears: *"The broker's laminated flood-fire-and-earthquake map of your
neighbourhood is thorough, recent, and quietly terrifying."* Earthquake copy
rides the `fire` hazard tag (§1.2's closed-union note): the home policy tile
that pays off is **"The Big One Misses"** — *"The earthquake drops every plate
you own; the policy covers the kitchen it dropped them in."*

**Speculation Street / Steady Street** carry today's structure with new skins:
the margin-call, the crypto winter (*"Your coin was named after a dog. The dog
is fine."*), the gacha whale tile (*"Just one more ten-pull"* — `spinForMoney`
inverted as `payMoney` on harsher), against the point-card, coupon and postal
savings tiles on the steady side.

**Sunset Years** is where Japan's sharpest material lives, and the existing
late-game effects take all of it:

| Title | Copy | Effect |
|---|---|---|
| **Retirement Lump Sum** (t0) | "Decades of service condense into a single astonishing bank transfer, and one long afternoon deciding what it must last." | `gainMoney ¥6,000,000` |
| **Rehired at Sixty** (t0) | "Retirement age arrives, so the company retires you, then rehires you at the same desk for the same work at half the pay. Your new lanyard says 'Senior Staff'." | `careerChange` (forced re-draw — the pay usually falls, which is the point) |
| **The Twenty-Million Problem** (t1) | "A government report calculates that a comfortable retirement requires savings of twenty million yen, then apologises for saying so. The number, unfortunately, does not withdraw itself." | `none` on normal; harsher (hard): advisory fees to do something about it, `payMoney ¥400,000` |
| **Caring for Your Parents** (t0, `appearsFrom: 'hard'`) | "Somebody who once carried you now needs carrying, and the care home's waitlist is longer than its brochure. You would never count the cost. The invoice counts it anyway." | `payMoney ¥2,000,000` |
| **Pension Papers** (t0) | "The projection arrives in a blue envelope. The monthly figure assumes you also did everything else right." | `gainMoney ¥400,000` |
| **The Children Visit** (t0) | "Every grown-up child arrives with fruit in a box too beautiful to open, and quietly leaves an envelope under it." | `collectPerChild ¥400,000` |
| **Grave Matters** (t2) | "The family plot needs a decision, and the stonemason's catalogue is heavier than the stone." | `payMoney ¥800,000` |

### 2.9 Careers: reskin the tuned numbers, keep the two pools' meaning

The careers rebuild (documented at the top of `careers.ts`) is the best-tuned
system in the game: graduates get a narrow dependable band, school-leavers get
a wide ladder with `payPerPip` gambles. **Keep every number and swap every
skin** — same salary, same `raiseStep`, same `payPerPip` presence, ×100. The
mapping, chosen so the volatility stays honest (a job is `payPerPip` only if
its real weeks genuinely differ):

**Basic pool** (wide, ¥2.4M–¥8.6M):

| Slot (today) | Japan career | Why it fits the slot |
|---|---|---|
| Pastry Chef ¥4.2M | **Bakery Owner** | the neighbourhood bread shop; steady |
| Food Truck Owner ¥6.2M/pip | **Ramen Stall Owner** | queue length is the wheel; per-pip stays |
| Pet Groomer ¥2.4M | **Convenience Store Manager** | always open, never rich |
| Delivery Courier ¥3.2M/pip | **Parcel Courier** | tips and peak seasons; per-pip stays |
| Construction Foreman ¥7.4M | **Site Foreman** | prices the job properly; salaried |
| Salon Owner ¥6.8M/pip | **Hair Salon Owner** | the diary decides; per-pip stays |
| Motorcycle Mechanic ¥5.0M | **Scooter Mechanic** | as-is, smaller wheels |
| Podcast Host ¥5.6M/pip | **Streamer** | superchats are a wheel; per-pip stays |
| Portrait Photographer ¥3.4M/pip | **Wedding Photographer** | between banquets; per-pip stays |
| Youth Coach ¥2.8M | **Baseball Club Coach** | Saturdays, names, barley tea |
| Session Musician ¥2.6M/pip | **Enka Session Player** | waiting on the phone; per-pip stays |
| Market Gardener ¥3.8M/pip | **Rice Farmer** | the harvest is the wheel; per-pip stays |
| Warehouse Lead ¥4.6M | **Distribution Centre Lead** | as-is |
| Real Estate Agent ¥8.6M/pip | **Property Agent** | one good year carries three; per-pip stays |

**Graduate pool** (tight, ¥5.8M–¥8.2M) — the joke of this pool in Japan is that
half of them are the *same job* at different companies, which is true to
sōgō-shoku (rotational generalist) hiring and worth playing straight:

| Slot (today) | Japan career | Note |
|---|---|---|
| Marine Biologist ¥6.2M | **Aquarium Researcher** | keeps the dolphin |
| Game Designer ¥6.8M | **Game Designer (Kyoto studio)** | untouched; it's already Japan's export |
| Architect ¥7.2M | **Architect** | untouched |
| Software Engineer ¥7.6M | **Systems Engineer** | the ubiquitous "SE" title |
| Surgeon ¥8.0M | **Hospital Surgeon** | untouched |
| Corporate Lawyer ¥8.2M | **Corporate Lawyer** | untouched |
| Veterinarian ¥6.6M | **Veterinarian** | untouched |
| University Professor ¥6.4M | **University Professor** | "argues with colleagues on Wednesdays" survives translation intact |
| Novelist ¥6.0M/pip | **Manga Artist** | royalties are a wheel; the pool's one gamble, as today |
| Robotics Engineer ¥7.4M | **Robotics Engineer** | untouched |
| Insurance Actuary ¥7.0M | **Ministry Bureaucrat** | "the lights in the ministry district stay on past midnight, and the overtime is measured in national budgets" |
| Fund Manager ¥7.8M | **Trading House Generalist** | "posted to three continents before forty; nobody, including you, can explain your job at parties, but the bonus arrives twice a year" |

### 2.10 Houses: the ladder learns that Japanese houses depreciate

This is the edition's best *mechanical* twist, and it costs only data. In Japan
a wooden house loses most of its value within decades — the land holds, the
building does not — while a well-located tower apartment holds or gains. The
existing `resaleRange` expresses this perfectly: **the cheap-and-charming end
of the Japanese ladder gets resale ranges that sit *below* price, and the
concrete-and-location end holds.** House choice becomes a real argument
(charm vs asset) instead of a bigger-is-better staircase:

| House | Price | Resale range | The joke |
|---|---|---|---|
| **Country Farmhouse** | ¥6.0M | ¥1.0M–¥6.0M | "A vast old wooden house in a village that will pay you to love it. Resale value: sentimental." (the akiya — Japan's eight million empty houses) |
| **One-Room City Flat** | ¥11.0M | ¥8.0M–¥15.5M | "Eighteen square metres, four minutes from the station. The bathtub is also the sink." |
| **Suburban Tract House** | ¥17.5M | ¥10.0M–¥18.0M | "Identical to its neighbours down to the postbox, ninety minutes from your desk. New-build smell included; new-build value not retained." |
| **Renovated Warehouse Loft** | ¥20.5M | ¥15.0M–¥28.0M | as today |
| **Two-Family House** | ¥24.0M | ¥18.0M–¥32.0M | "Your parents live downstairs. This solves several problems and creates a similar number." |
| **Seaside Villa** | ¥31.0M | ¥20.0M–¥36.0M | "The ocean view is eternal; the typhoon insurance is annual." |
| **Custom-Built House** | ¥40.0M | ¥24.0M–¥42.0M | "An architect built your dream exactly. Dreams, the market notes, are non-transferable." |
| **Bayside Tower, 38th Floor** | ¥52.0M | ¥42.0M–¥74.0M | "Concrete, a concierge, and a nightly view of the bridge. Towers, unlike houses, are allowed to appreciate." |
| **Central Penthouse** | ¥66.0M | ¥50.0M–¥92.0M | "The whole top floor above the old imperial moat district. The elevator has a sofa." |

Balance note: today's ladder mostly appreciates, so tilting half of it downward
is a real economy change — the *totals* stay close if the tower end is allowed
slightly more upside than today's top end (done above), and `gameBalance.test.ts`
should confirm the house EV across the catalogue stays within a few percent of
the current one.

### 2.11 Stocks: five tickers off the Tokyo board

Same ladder logic as today — the wider the range, the further its middle sits
above the price:

| Name | Ticker | Price | Payout | Copy |
|---|---|---|---|---|
| **Nationwide Konbini Holdings** | KNBI | ¥1.0M | ¥0.9M–¥1.6M | "Fifty-eight thousand stores that never close, never miss, and never surprise anyone. That is the entire pitch." |
| **Sunrise Rail & Property** | RAIL | ¥1.5M | ¥1.3M–¥2.4M | "The trains run on time to the second, and the company owns every shop you pass apologising for being late anyway." |
| **Lantern Animation Studio** | ANIM | ¥1.2M | ¥0.4M–¥3.4M | "One global streaming hit from glory, one troubled production from the documentary about it." |
| **Gacha Games Guild** | GCHA | ¥2.0M | ¥0.6M–¥4.6M | "Free to play, mysteriously profitable. Revenue depends entirely on how this quarter's collectible characters are received by teenagers." |
| **Orbital Springs Robotics** | ORBS | ¥2.5M | ¥0.3M–¥7.7M | "Humanoid caregivers for an ageing nation — either the next national champion or the world's most expensive way to fold a towel." |

### 2.12 Life tiles: thirty-six small Japanese glories

Keep the deck size and value curve; replace the stories. A representative
sample across the value bands (full deck is a mechanical find-and-replace on
`lifeTiles.ts` at these values ×100):

- ¥1.0M–¥1.6M: *Grew a Prize Daikon* · *Perfected Your Gyoza Seal* · *Won the
  Neighbourhood Bon Dance* · *Adopted a Shrine Cat* · *Completed the Radio
  Calisthenics Summer Card* (every morning, every stamp) · *Made a Bento Too
  Good to Eat*
- ¥1.8M–¥3.2M: *Climbed Mt. Fuji for the Sunrise* · *Walked the 88-Temple
  Pilgrimage* · *Won the Karaoke Perfect Score* · *Reached Shogi Amateur Dan* ·
  *Filled a Book of Temple Stamps* · *Ran the Tokyo Marathon (Won the Lottery
  Twice: the Entry, Then the Race)*
- ¥3.5M–¥5.5M: *Released an Indie Visual Novel* · *Your Food Stall Made the
  Local News* · *Restored a Kominka Farmhouse* · *Snow Festival Sculpture Took
  First Prize* · *Trained a Champion Koi*
- ¥6.0M–¥9.0M: *Your Haiku Ran in the National Paper* · *Invented a Vending
  Machine Snack* (the ¥9.0M slot — Japan's answer to naming a beetle) ·
  *Designed a Village's Mascot Character* · *Your Bonsai Outlived Three Emperors'
  Eras* (¥8.0M)
- ¥15.0M (the outlier slot): *Backed a Friend's Startup in Shibuya*

### 2.13 Difficulty, à la japonaise

The machinery needs nothing; the *casting* is the work, and Japan's material is
unusually rich in institutionalised setbacks. The principled mapping:

- **`missedPayday` → "Service Overtime"** everywhere (§2.5). One name, used
  consistently, teaches the concept by the second occurrence.
- **`appearsFrom: 'hard'` tiles** are the systemic ones: *The Transfer Order*,
  *The Nursery Waitlist* escalation, *Caring for Your Parents*, the *Cram
  Year*. Hard mode reads as "the institutions stop bending your way".
- **`appearsFrom: 'veryHard'`** is the black-company tier: *"Voluntary"
  Training Retreat* (unpaid, mountains, shouting — `payMoney`), *Bonus Season,
  Cancelled*, *The Tenth Stamp*. Very Hard reads as a bad employer in a bad
  year, which is exactly the difficulty fantasy the current design doc
  describes ("visibly a harder board").
- The `harsher` rewrites above (tarp duty, the umbrella, the marquee-equivalent
  banquet deposits) carry the comedy: **on Hard, the same day happens, and you
  pay for it** — which is the most Japanese joke in the entire document.

### 2.14 What I would cut from this edition

- Anything requiring reading Japanese to be funny (puns, kanji jokes). The
  lucky-snack pun in §2.7 is described, not written, which is the line.
- Pachinko as a *career* and hostess clubs: playable material exists, but the
  tone of the game is Nintendo-warm, and these read seedy without their
  context. The prize-exchange `spinForMoney` tile keeps the pachinko joke at
  the right size.
- Natural-disaster set pieces beyond the insurance tiles. One earthquake tile
  with a policy to bounce off is a wince and a cheer; a tsunami tile is not a
  party game beat.
- 熟年離婚 (grey divorce), school refusal, hikikomori: real あるある, wrong
  temperature for a family table.

---

## Part 3 — How editions should work

### 3.1 The principle: an edition is data; the engine is the game

Everything Part 2 changes is *content*: strings, numbers, catalogue entries,
board topology. Everything it does **not** change is the game: phases, movement,
effect semantics, decisions, the CPU's decision *procedure*, scoring shape,
saves, audio, UI components, difficulty machinery. That observed boundary is
the seam, and it should become a literal one:

```ts
// src/domain/edition/types.ts (new; shape only, names negotiable)
export interface Edition {
  readonly id: string                    // 'japan', 'usa', 'france', …
  readonly name: string                  // 'LIFE JOURNEY: Japan'
  readonly currency: CurrencySpec        // see 3.2
  readonly economy: EconomyConstants     // every Money constant in constants.ts
  readonly route: RouteDefinition        // see 3.3
  readonly careers: { basic: readonly Career[]; graduate: readonly Career[] }
  readonly houses: readonly House[]
  readonly lifeTiles: readonly LifeTile[]
  readonly stocks: readonly Stock[]
  readonly difficultyProfiles?: Partial<Record<Difficulty, DifficultyProfile>>
}

export interface CurrencySpec {
  readonly symbol: string                // '$', '¥', '€', 'Bs'
  readonly format: (amount: Money) => string   // full form
  readonly formatCompact: (amount: Money) => string  // HUD form: '¥42.0M'
  readonly tileRounding: Money           // 100 for $, 10_000 for ¥ (difficulty.ts)
}
```

`createGameStore`/`startGame` take an `Edition`; `NewGameConfig` gains an
`editionId`; the USA edition is the current content, extracted verbatim, and
becomes the proof that extraction changed nothing (`gameBalance.test.ts` runs
against it unchanged).

### 3.2 Inventory: what is hard-coded to one country today

File-by-file, with the cost of moving each. This is the honest part.

| Where | Assumption | Move | Cost |
|---|---|---|---|
| `presentation/format.ts` | `'$'`, en-US grouping, "payday" wording | `CurrencySpec` above; components already call these four functions, so the seam is narrow | **Small** — but it fans out into the digit roll-up animation and every panel width (¥ is 100×: nine digits). Budget UI review, not just a symbol swap |
| `domain/model/constants.ts` (frozen) | Every `Money` value: starting cash, tuition, loans, wedding gift, child bonus, premiums, payouts, retirement bonus | Becomes `EconomyConstants` on the edition; the module survives as the USA edition's values | **Medium, and political**: the file is a frozen contract with ~20 importers (`applyEffect`, scoring, CPU, UI panels). Mechanical change, wide blast radius. Do it first, while there are two editions, not five |
| `domain/board/createBoard.ts` | Content arrays *and* route shape (9 lanes, 3 forks, 4 milestones) live in one 1,500-line file; `computeLayout` and the wiring name each lane literally | Split into: layout engine + tier/hardship machinery (shared, already generic) and `RouteDefinition` data (edition). Sketch in 3.3 | **Medium.** The functions are already cleanly separable; the work is mostly moving code and writing the route walker |
| `domain/model/icons.ts` (frozen) | `IconName` is a closed union; a test pins the registry to it | See 3.4 | **Small now, the worst offender at five editions** |
| `application/cpu/decideCpuCommand.ts` | `CASH_RESERVE: 60_000`, `RISK_CASH_FLOOR: 25_000`, and the effect-valuation table's raw dollar figures (`:254` onward) | Restate as multiples of the edition's average salary, or read from `EconomyConstants` | **Small but sneaky** — nothing fails loudly; the CPU just plays badly in yen. Needs its own test: CPU decisions identical across a ×100-scaled edition |
| `domain/rules/difficulty.ts` | `toHundreds` rounding; hard-coded loan repayment figures | `tileRounding` from `CurrencySpec`; loan figures into `EconomyConstants` per difficulty | **Small** |
| `applyEffect` / `scoring.ts` | `WEDDING_GIFT`, `CHILD_BONUS`, `LIFE_INSURANCE_PAYOUT`, `FIRST_RETIREMENT_BONUS`, `CASUAL_WAGE_PER_PIP` read from constants | Same constants move; call sites unchanged if `EconomyConstants` keeps the names | **Free once constants move** |
| Saves & records (`GameRepositoryPort`, `StatsRepositoryPort`) | `GameState` embeds board and catalogue objects, so saves are self-contained (good!) — but nothing records *which edition* | Add `editionId` to `GameState` and `GameRecord`; "play again" and the records screen need it. Old saves default to `'usa'`, exactly as the difficulty field already defaults | **Small; do it in the same change as the field additions or pay a migration later** |
| `public/dev/*.json` fixtures, `gameBalance.test.ts` | Pinned to the current board's shape and dollar band | Regenerate per edition; balance test becomes parameterised over editions | **Small each, ×N editions — accept it; balance is per-edition by nature** |
| `Hazard`/`InsuranceKind` unions (frozen) | `'fire' | 'accident'`, `'home' | 'auto' | 'life'` | Keep the unions as *mechanical* slots; editions re-skin the copy (earthquake rides `fire`, §2.8). Widen only when an edition genuinely needs a fourth slot | **Zero now, by choosing not to generalise** |
| `Player` shape: `isMarried`, `children`, `hasDegree`, `house` | The milestone set itself | See 3.5 | **Zero for Japan/France/Bolivia — deliberately deferred** |

### 3.3 The route as data

The one structural generalisation worth doing now. Today `computeLayout` and
the wiring block hard-code the sequence *fork(college|work) → main →
fork(family|fast) → midtown → fork(risky|safe) → sunset → retirement*. The
layout engine underneath (`step`, `ensureRoom`, `layoutFork`, `chain`) is
already fully generic. So the route becomes:

```ts
export type RouteSegment =
  | { readonly kind: 'run'; readonly lane: LaneContent }          // linear stretch
  | { readonly kind: 'fork'                                        // named choice
      readonly at: SpaceContent                                    // the stop tile
      readonly branches: readonly [LaneContent, LaneContent] }

export interface RouteDefinition {
  readonly start: SpaceContent
  readonly segments: readonly RouteSegment[]
  readonly terminal: SpaceContent                                  // retirement
}
// LaneContent = the existing SpaceContent[] + LaneIdentity, tiers and all
```

`createBoard(edition, length, difficulty)` walks the segments: `laneFor` thins
each lane exactly as today, `layoutFork`/`layoutLinear` place them, `chain`
wires them. The invariants the current code enforces by construction — every
lane keeps a tier-0 space, milestones exist at every length, forks always have
two live branches — move into a `validateRoute` that runs in tests for every
edition, because five content authors will break them where one integrator did
not. The tier/hardship/`appearsFrom` machinery transfers with zero changes:
**it is already the edition author's difficulty API, and it is good.**

What this buys beyond swappability: the §1.1 mini-fork becomes one more
segment; a France edition with a *grande école* triple-fork or a Bolivia
edition with a different act structure is a data file, not a layout-engine
project. What it costs: the fork count and placement per edition changes
session length, so the balance test must pin *per edition*.

### 3.4 Icons and art: the thing that looks cheap and is not

`IconName` is a closed union and every space/career/house names a subject in
it; a test guarantees the registry draws every name. That is a superb contract
for one edition and a treadmill for five: every edition adds ~40 subjects
(shrine-visit, rice-field, tower-mansion…), all hand-drawn inline SVG under the
no-external-assets rule, and the union plus registry plus test grows without
bound. At five editions that union is several hundred entries, most unused by
the running edition.

Recommendation: split the namespace. A **shared core** (`space:payday`,
`finance:*`, generic milestones — perhaps sixty subjects) stays in the frozen
union; each edition ships an **edition icon module** keyed
`'jp:last-train'`-style, registered alongside its content and checked by a
per-edition version of the same registry test. The `IconName` type widens to
`CoreIconName | (string & {})` at the edition boundary — or, more honestly,
each edition's content is typed against `CoreIconName | JapanIconName`.
Second-order saving: let edition content reuse core subjects aggressively (the
Japan board above reuses `finance:bank-visit`, `space:payday`-class subjects
constantly) so a new edition is ~25 genuinely new drawings, not 80. **Art is
the real per-edition cost of this whole programme** — more than code, more than
copy — and the sooner reuse is the default, the cheaper France gets.

### 3.5 Milestones: resist generalising them (for now)

The tempting design is to make milestones data too — `Player.isMarried`
becomes a generic flag set, `getMarried` a parameterised "milestone" effect —
because "marriage and a mortgage are not universal beats". True. But look at
the first three editions actually planned: Japan, France, Bolivia. All three
tell marriage, children, housing, and retirement natively; what differs is the
*copy* and the *money* (France: PACS-or-wedding is one stop's description;
Bolivia: the house-building beat is arguably stronger than the mortgage one —
still `buyHouse`). The `Player` fields also feed scoring, the CPU's valuations,
the HUD, and the results screen; generalising them touches everything for a
customer that does not exist yet.

So: **milestone semantics stay in the engine; milestone meaning moves to the
edition's copy.** Revisit only when a signed-up edition genuinely cannot tell
its life with `isMarried`/`children`/`house`/`hasDegree` — and when that day
comes, the route-as-data work (3.3) will already have made stops swappable,
which is half the job.

### 3.6 What stays shared, permanently

Movement and phases, all `SpaceEffect` semantics, decisions, loans, the CPU's
*procedure* (its constants become edition data), scoring's shape, difficulty
machinery (profiles tunable per edition), the four save slots and records, all
audio, all UI components, the layout engine, tiers and hardships. The English
language itself is shared: an edition is a *place*, not a translation — this is
the France edition in English for the same table of friends, which keeps the
whole localisation industry out of the repository. And the engine's voice —
warm, concrete, one wink per tile — is shared editorial law across editions;
Part 2 is written to be its style guide.

### 3.7 Order of work, and what I would drop

**Build, in order:**

1. **Extract the USA edition** — `Edition` type, `CurrencySpec`,
   `EconomyConstants`, catalogues moved behind it, `editionId` on
   state/records. Current tests pass unchanged against `EDITION_USA`. This is
   the whole seam, proven with zero content risk. (~the one frozen-contract
   negotiation, done once.)
2. **Route as data** (3.3) + `validateRoute`. `createBoard` becomes the route
   walker; the USA board is the first `RouteDefinition`.
3. **Part 1's content upgrades** (mini-fork, hazard density, bonus paydays,
   social bills) — on the USA edition first, so the Japan edition inherits a
   better skeleton rather than forking a worse one.
4. **The Japan edition content** — Part 2 wholesale: route, catalogues,
   constants at ×100, ~25 new icons, per-edition balance run, CPU
   scale-invariance test.
5. **The dilemma effect** (§1.6) — after Japan ships, added to both editions.
6. **Title-screen edition picker** — trivial once 1–4 exist; last because a
   picker with one edition is furniture.

**Drop, and say why:**

- **Per-edition rules or effects** (a Japan-only mechanic, a France-only
  phase): the moment editions can change rules, every engine test multiplies by
  the edition count. Editions are content, full stop.
- **In-game language switching / i18n framework**: explicitly out of brief (UI
  stays English), and the largest cost avoided in this whole plan.
- **Per-edition audio and UI theming**: the chiptune and the candy palette are
  the *product's* identity, not a country's. A single title-screen accent per
  edition at most.
- **Simultaneous mixed-edition play** (players on different boards): nothing in
  the state model supports two boards in one game, and no player asked.
- **Generalised milestones** (3.5) and **new hazard kinds** (3.2): deferred
  with named triggers for revisiting, which is different from never.

---

*Written 2026-08-13 against the current tree. The space copy in Part 2 is
offered as shippable first drafts: every tile names its effect and amount so a
content agent can land the Japan board without re-deriving the design, and
argue with any single row instead of the whole document.*
