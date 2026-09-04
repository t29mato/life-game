# LIFE JOURNEY — Researcher Edition: a design concept

*Status: concept only. Nothing here is built. This document exists so the user can decide
whether — and how much of it — to greenlight.*

---

## 0. The recommendation, up front

Build the Researcher Edition **on the existing measured skeleton** — the same five forks,
the same tile counts, the same stops and payday placements that Japan and Bolivia already
prove can carry an entirely different life — but let it do the one thing no country
edition was allowed to do: **change what the forks mean and which road is the gamble.**

The single design move everything else hangs off:

> **In the base game, skipping the degree is the volatile road and the degree is the safe
> one. In a researcher's life it is exactly backwards.** Industry pays now, pays well, and
> caps out. Academia is the long ladder with the grim bottom rung, the two-in-six top
> step, and a top that beats everything — a lab of your own. The engine already knows how
> to say this: it is the basic-pool/graduate-pool shape from `usa/careers.ts`, with the
> moral weight flipped.

This also answers the user's original discomfort — "college feels effectively mandatory" —
more decisively than any tuning could: in this edition the road *without* the doctorate is
the respectable, dependable one, and five more years of education is the lottery ticket.
Nobody will ever feel the game is lecturing them to stay in school.

And it should be **the first of a new axis, not a 6th country**. See §7.

> **Revised 2026-09-02.** The user pushed back on the central claim: *"you're saying the
> road without a PhD is the safe one — isn't that a Japan-specific thing? Surely the
> US/Europe differ. A country × researcher game sounds interesting."* They are right, and
> the objection is structural, not cosmetic. The design below still stands — but read it
> for what it turns out to be: **the American researcher's board**, not a universal one.
> The revised recommendation (researcher crosses with country; launch with Japan and
> France) is argued in §10, which supersedes the single-edition framing of §7 without
> deleting it.

---

## 1. Whose life this is

The player is a researcher — not "a smart person at a university," but somebody who has
lived inside grant cycles, advisor lotteries, Reviewer 2, the postdoc treadmill, the
two-body problem, soft money, and the one afternoon a committee decides a decade of work.
The test for every tile: **would a real researcher wince with recognition?** The tone
stays the game's own — short sentences, plain words, the cost or the joke landing in the
same breath — but the specificity has to come from this world:

- The grant scored one point below the payline.
- The adjunct paid by the course, per term, like a courier is paid by the drop.
- The result that fails to replicate, and the retraction that follows you to conferences.
- Being denied tenure — and hired by industry the next month, at a raise.
- The camera trap you forgot about that catches the thing nobody has photographed.

---

## 2. The arc: five forks, re-cast

The skeleton stays (that is where two years of measured balance lives, and it keeps the
15-minute promise). Every fork gets a researcher meaning that is honestly the same
*decision shape* it already carries:

| Existing fork | Researcher Edition | Same mechanism because… |
|---|---|---|
| College Lane vs Straight to Work | **The Program vs The Offer** — five years in a PhD program vs taking the industry job with a bachelor's | Tuition stop = five years on a stipend; the early-earning lane = the signing bonus before your friends pass quals |
| Company Road vs Job-Hopper Alley | **Stay at the Bench vs Leave for Industry** — the mid-career exit every academic has priced at least once | The compulsory `careerChange` redraw *is* leaving academia: you stop, you interview, you find out what you were worth outside |
| Grad School vs Keep Working (gated) | **The Tenure Track vs The Staff Job** — gated on the doctorate | The existing lane shape — a bill, unpaid years, no paydays, a compulsory appointment at the end — is *precisely* the tenure clock |
| Family Lane vs Fast Track | **Two Bodies vs The Lab at Midnight** | Marriage engine untouched; the flavour carries the two-body problem |
| Risky Road vs Safe Street | **The Spinout vs The Instrument Room** — found a startup on your own research vs the staff-scientist life | `spinForMoney` = the seed round; `swapMoneyWithLeader` = the acquisition; Safe Street's quiet gains = service contracts renewing |

### The opening fork: The Program vs The Offer

**The Program** (College Lane's slot): move-in is the first lab meeting; the tuition stop
becomes **The Stipend Years** — the same wheel-decided bill, re-told as five years of
opportunity cost ("funded, but you do the math on what your classmates are earning"). The
lane's events: quals week, the advisor draw, a first-author paper (the Scholarship Win
slot), and **The Defence** at the end. Its job fair deals from the **academia pool** —
which in this edition is the *long, volatile* pool.

Fork summaries in the board's own argumentative voice:

> **The Program.** *Five years on a stipend chasing one question nobody has answered. The
> pay is grim, the hours are worse, and at the end you are one of a handful of people
> alive qualified to run a lab — if you can win one.*
>
> **The Offer.** *A signing bonus before your friends have passed quals. Real equipment,
> real money, and somebody else deciding what the question is — forever.*

**The Offer** (Straight to Work's slot): hired on tile one into the **industry pool** —
the short, safe, well-floored shape. Moving Out, the badge photo, the first on-call
week; paid three times before The Program's players have defended.

⚠️ **This inverts one measured guarantee.** The base board asserts the *early-earning*
lane is the volatile one (`work spread > college spread`). Here the volatility deliberately
moves to the tuition-paying lane, because that is the true shape of this life. The
edition's own balance test asserts the inversion instead; the fork still has to measure
even on EV, and that tuning pass is real work (see §8).

### The Tenure Track (the gated fork)

The existing Grad School lane is the best-shaped thing in the codebase for this edition —
six tiles, a bill, no paydays, a compulsory appointment — and it becomes **The Tenure
Clock** almost line for line:

1. **The Startup Package** — the bill (wheel-decided, like `doctorateTuition`): the lab you
   have to build before the first grant lands. Bad spin: *"The renovation runs over and
   the dean's matching funds turn out to match rather less than promised."*
2. **The First Rejection** — flavour, hard-mode cost: resubmission season.
3. **Bridge Funding** — the Teaching Stipend slot: a small cheque, deliberately not a payday.
4. **The External Letters** — the Grant Award slot: a small fixed gain, word travels.
5. **The Dossier** — everything you have done, in one binder, weighed by strangers.
6. **The Tenure Vote** — see §5. This is the one genuinely new mechanic.

The road opposite — **The Staff Job** — keeps its three-tile shape: a payday, a steady
year, and a short course. Its summary: *"Keep the job that pays every month. The title
never changes, the work is real, and nobody can vote you out of it."* That road is not a
consolation prize; national-lab staff scientists and research engineers are the middle
way half this edition's audience actually took.

**Plumbing note:** `LaneIdentity.requires` currently knows only `'degree'`. Gating this
lane on the doctorate needs `'doctorate'` added to that vocabulary — small, contained
(`branch.ts` reads it in one place).

---

## 3. The career shelves and ladders

The three shelves keep their engine names and swap their meanings:

- **`basic` = the industry shelf.** Dealt at The Offer, day one. Short, safe ladders —
  the graduate-pool *shape* from the base game.
- **`graduate` = the academia shelf.** Dealt after The Defence. Long, volatile ladders —
  the basic-pool shape: grim bottom, two-in-six top step, tallest tops on the board.
- **`doctorate` = the tenured shelf.** Reached only through the Tenure Vote. Highest
  floor, not the highest ceiling — the base game's doctorate-shelf argument, verbatim,
  and it still holds: the industry player who redrew well should still be able to win.

No 9th family. The eight existing families map cleanly onto research *disciplines*, which
keeps plaques, gear, and trade-year stories working unmodified:

| Family | In this edition |
|---|---|
| science | computation, physics, engineering research |
| field | ecology, geology, oceanography — the mud-and-permits sciences |
| care | medical and clinical research |
| studio | science communication, journals, museums |
| office | program officers, tech transfer, research admin |
| works | the machine shop, instrument-making, core facilities |
| kitchen / pitch | thin here; a food-science ladder and a callings slot cover them |

### Sample ladders

**Academia shelf (long, volatile, 3 rungs):**

- **The Lab** (science): *Postdoc → Assistant Professor → Institute Director.* The postdoc
  rung carries `payPerPip` — soft money, paid by the wheel, because whether your salary
  exists next year depends on a study section you will never meet.
- **The Field Station** (field): *Field Assistant → Station Scientist → Station Director.*
  `payPerPip` at the bottom: seasons are good or the boat breaks.
- **The Clinic** (care): *Clinical Fellow → Attending Researcher → Trial Director.*
  Salaried throughout — medicine pays even in academia, which is its own bitter joke.
- **The Adjunct Road** (studio/science): *Adjunct Lecturer → Lecturer → Teaching
  Professor.* The adjunct rung is the board's grimmest: low `payPerPip`, paid by the
  course. This rung existing at all is one of the two winces this edition owes its
  audience.

**Industry shelf (short, safe, 2 rungs):**

- *Research Engineer → Senior Research Engineer* (works)
- *Data Scientist → Research Manager* (science)
- *Staff Scientist → Group Leader* (science; the national-lab ladder)
- *Medical Science Liaison → Clinical Lead* (care)

**Tenured shelf (2 rungs, highest floor):**

- *Associate Professor → Professor* — and the Sunset Strip's Final Promotion tile becomes
  **The Named Chair**, the last spin of an academic life.

**Callings** (work paid in something other than money):

- **Curator of Beetles** — *"There are four hundred thousand species and somebody has to
  love every one of them. There is no promotion from this and there was never going to be."*
- **Program Officer** — *"Reads two hundred proposals a year and funds twelve dreams.
  Turned down a lab of their own to do it, and has never once been sorry."*
- **High-School Physics Teacher** — the person half the table's professors say mattered most.

---

## 4. Trade years: the grant cycle as a wheel

`tradeYear` is the mechanic this edition was born for — a zero-mean, salary-proportional
good-or-bad year at the job you already hold. One catch: `TRADE_YEAR_STORIES` is
engine-global, keyed by family and shared by all editions. The generic science-family set
is decent but this edition's soul lives in these six lines, so the table should become
**edition-overridable** (an optional `Record<CareerFamily, TradeYearStories>` on the
edition, falling back to the global set). Medium plumbing, highest flavour return of
anything in this document.

**The lab** (science), worst first — the calibration set:

1. *Your biggest result fails to replicate in two other labs. The correction is three
   sentences long and follows you to every conference for a decade.*
2. *The renewal scores one point below the payline. The lab runs the year on leftover
   reagents and the goodwill of the department administrator.*
3. *A rival group publishes your idea first, done slightly worse. Reviewer 2 asks why you
   did not cite them.*
4. *The side project a student ran on weekends turns out to be the real discovery. The
   next grant writes itself.*
5. *Your method spreads. Half the field cites you in their second paragraph, and the
   invitations start paying their own way.*
6. *The phone rings at five in the morning, from Stockholm. Everyone who rejected the
   original paper writes to congratulate you.*

**The field station** (field):

1. *The research vessel spends the entire sampling season in dry dock. Twelve years of
   continuous data now has a hole in it with your name on it.*
2. *The site permits are revoked in March and re-granted in November. The field season
   happens in neither.*
3. *Rain, mud, and a generator that dies twice. The data is fine, the paper is fine, and
   nobody will ever ask about either.*
4. *A camera trap you forgot to collect catches something nobody has ever photographed.
   The clip funds three seasons.*
5. *Yours turns out to be the only station that recorded the event. Suddenly everyone
   needs your data, on your terms.*
6. *The species that carries your name turns out to matter enormously. Documentary crews
   now file permits to visit your mud.*

**The comms desk** (studio), abbreviated:

1. *You explain a preprint on live television. The preprint is retracted the following
   week. The clip is not.*
6. *Your explainer outlives the news cycle and becomes the thing teachers show first.
   The licensing cheque arrives quarterly, forever.*

---

## 5. What is genuinely new — and what is honestly reuse

### New, and worth it: the Tenure Vote

One new `SpaceEffect` variant — `tenureReview` — a promotion spin where **failure is
`loseCareer`**, not "try again next time." That asymmetry is the entire truth of tenure:
every other review in the game fails soft; this one ends the job. Threshold at the
first-step rate (4-in-6) — most people on the track make it, which is real, and which
makes the two faces that don't land like a punch.

And here is the part that costs nothing: **the board already catches you.** The lane
rejoins the trunk just before Layoff Notice and the Career Fair — a `stop`, dealing from
whatever shelf you hold. Tenure denial walks you, one or two tiles later, into a hall of
booths where industry hires you at your rung. *Denied tenure in April, hired at a raise
in May, still bitter in October* — the truest sentence in this document, produced by
board geometry that already exists.

### Reuse, argued honestly

- **Publications are life tiles.** The deck is already edition-owned (`lifeTiles.ts`) and
  already the right mechanic: one-off keepsakes, worth money at final scoring, stealable
  by the leader (*Sticky Fingers* becomes the co-author who presents your figure). The
  researcher deck: *First first-author paper. The talk where the live demo worked. Your
  student's first paper — somehow better than your own. The dataset everyone uses.*
  Zero plumbing.
- **Grants are NOT a second currency.** A distinct grant resource means new `Player`
  fields, new scoring, new UI, new CPU logic — and a 15-minute game does not have room
  for a second economy. The grant cycle is already told three ways: the trade-year wheel,
  `payPerPip` soft-money rungs, and the Tenure Clock's bill. Adding a resource would
  flatten the thing it claims to honour.
- **No h-index counter.** Life tiles are the publication record; a number would make it
  a spreadsheet.
- **Stocks become spinout equity** (`stocks.ts` is edition-owned): *a colleague's sensor
  company, a friend's drug that is nine years from approval.* Pure reskin.
- **Marriage/household untouched.** The two-body problem is flavour on existing bands:
  *"They said yes — and their postdoc is in another country, so the first two years of
  the marriage happen on a night bus and a video call."* The rescued-proposal band was
  born for this.
- **Imposter syndrome** is one flavour tile, effect `none`, somewhere on the trunk:
  *"Everyone at this conference is smarter than you. Half of them are thinking the same
  thing."* Cheap, and the second wince this edition owes its audience.

---

## 6. Act naming and dressing

Main Street → **The Corridor** (the department's, with the noticeboard). Midtown →
**Grant Season**. Sunset Strip → **Emeritus Row**, where The Number becomes *The Buyout*
(early retirement package), Final Promotion becomes *The Named Chair*, and The Last Year
is the last lab meeting before the keys go back. The skyline: an observatory dome, a
lecture hall, a field station, a particle-accelerator ring on the horizon.

---

## 7. Sixth edition, or a replacement for countries?

Both readings, then the opinion.

**As a 6th edition:** cheapest to ship — the edition system was built for exactly this.
But it would sit oddly on the country picker: "USA, Bolivia, France, India, Japan…
Researcher" mixes two axes (where you live / what life you live), and it buries the most
interesting board behind a flag menu.

**As a replacement:** honest about where the design energy is going, but it deletes five
finished, tested, tuned editions the user spent real sessions polishing — heavy, and
irreversible in spirit even if git remembers.

**My recommendation: neither — start a second axis.** Countries are *translations* of one
life; the Researcher Edition is a *different life*. Reframe the picker around lives
("Classic" / "Researcher", with Classic carrying its five countries inside it), freeze
further country investment, and let future editions be lives too — the engine's fork
grammar would tell a farmer's, a musician's, or a founder's life just as well. Nothing is
deleted, the user's instinct ("countries don't differ much") is honoured by *stopping*,
not by destroying, and the Researcher Edition gets top billing, which it will deserve.

*(Revision note: the two-axis framing survives the user's objection — but the researcher
axis turns out to have a country dimension of its own, and an honest one. §10.)*

---

## 8. On the premise: do the country editions really not differ?

The user is right, and it is by design rather than by failure. Japan's and Bolivia's
route files open with the same sentence: *"Structurally this board is the USA board, tile
for tile… what a country gets to change is everything the player actually reads."* Same
forks, same stops, same payday placements, same hazards, sums scaled by a currency
factor; careers keep the same measured shapes. The differentiation is entirely prose —
and it is *good* prose (gratitude money, blockade week, the thesis defence with the
family dressed for a wedding) — but in a 15-minute game where most tiles are swept past
unread, prose-deep differences are nearly invisible in play. Mechanically, five editions
are one game in five voices. That was the correct engineering call (balance is measured
once), and it is also exactly why a sixth country would add the least value of anything
buildable, and why the next edition should differ in *meaning* — which is this proposal.

---

## 9. Scope, honestly

| Tier | Work | Cost |
|---|---|---|
| **Fast** — pure edition content, the Japan/Bolivia playbook | route re-flavour (all ~90 tiles), two new career pools + tenured shelf, life-tile deck, stocks, houses, economy constants, edition tests | ≈ one country edition; the known path |
| **Medium** — small contained plumbing | `requires: 'doctorate'` lane gate; per-edition trade-year story overrides | a day or two each, low risk |
| **Slow — its own decision point #1** | `tenureReview` SpaceEffect (new variant, CPU scoring, UI card, log copy) | new domain plumbing; modest but real |
| **Slow — its own decision point #2** | **Re-measuring the inverted opening fork.** Every number in this codebase is measured, not guessed; flipping which lane is volatile means re-running the whole balance pass (fork win rates per difficulty, spread ratios, mean final score band) with new pool shapes | the expensive invisible half; budget more time for this than for all the writing |

Recommended build order if greenlit: Fast tier with the *existing* effect vocabulary
first (tenure as a plain compulsory `careerChange`, no denial), playtest, then decide
whether the Tenure Vote's catastrophic "no" earns its plumbing. It almost certainly will —
but it should be decided at a table, not in this document.

---

## 10. Revision: the country objection, taken seriously

The user's objection, restated: this document claims *"skipping the doctorate is the safe
road; academia is the gamble"* as if it were a fact about research. It is actually a fact
about **certain countries' academic labor markets** — and those markets differ in shape,
not just in flavour. Tenure systems, how permanent a post is once you clear the entry
bar, how many permanent slots exist per PhD produced, whether academia↔industry movement
is normal or stigmatized: these are structural variables, and they vary enough that
"which road is the gamble" genuinely flips depending on the flag.

The test this section has to pass is the one §8 already imposed on the country editions:
if per-country researcher boards would differ only in prose, the cross is not worth
building — it would be the same thin differentiation §8 criticizes, rebuilt at higher
cost. So the question is: **are the differences mechanical?** Below, country by country,
with confidence flagged.

### 10.1 Five countries, five actual risk shapes

**USA — the shape this document already drew.** *(Confidence: high.)* Up-or-out tenure
track: one mid-career committee vote where failure ends the job. A large postdoc surplus
below it, soft-money salaries, the adjunct floor — and, uniquely, **fluid movement**
between academia, industry, and startups, which is why "denied tenure in April, hired at
a raise in May" is a true sentence there and almost nowhere else. Refinement worth
making: in the US the gamble is not the degree itself — in biotech and pharma the PhD is
an *industry* entry ticket too. The gamble is **staying**. Everything in §§1–6 is the
American board, and it is a good one; it just isn't universal.

**Japan — "don't get the PhD" at its most extreme.** *(Confidence: high — and this is the
country whose players will wince-test hardest.)* The safe road is famously the
**master's exit**: 修士卒 into a major manufacturer's corporate lab is *the* respectable
default, because the 新卒一括採用 system historically *penalized* doctorate holders —
too old, too specialized, off the hiring calendar. The doctorate itself is the gamble
(the 「博士に行くと人生が詰む」 discourse is two decades old and still current). And the
failure mechanic is different in kind from America's: there is no tenure vote. The risk
lives in the **fixed-term treadmill** — the post-1990s postdoc surplus (ポスドク一万人
計画) chained to 任期付き posts, with the ten-year conversion rule producing its own
cliff: mass non-renewal *just before* the permanent-conversion right vests (the RIKEN
terminations of 2022–23, hundreds of researchers, were national news). But — and this is
the inversion inside the inversion — once a researcher lands a 無期 (permanent) post,
it is among the **safest jobs in the country**. No committee can vote them out. Japan's
volatility is all in *getting in*; America's is in *staying in*. Different tile, different
mechanic, same grim honesty.

**France — the structural counterexample.** *(Confidence: medium-high.)* France breaks
this document's central claim twice. First: the elite safe road **skips the university
system entirely** — classe préparatoire → grande école → industry *cadre*. French
industry prizes the engineering diploma over the doctorate, so "don't get a PhD" isn't
the safe *choice* there, it's the prestigious default that never saw the fork. Second:
the PhD road leads, if it leads anywhere, to a **permanent civil-service research post**
— CNRS/INSERM chargé de recherche, or a university maître de conférences — won by
national concours typically in one's early thirties, after which there is *no tenure
clock at all*. A fonctionnaire researcher cannot be voted out or laid off; the price is
a famously modest salary and a low ceiling. So the French risk shape is **front-loaded
into a single entry gate**: brutal odds at the concours (no formal attempt limit, but a
de facto thesis-age window — you can realistically try only a few times before ageing
out), and then near-absolute safety at a low number, forever. After the gate, *academia
is the safe road and industry the volatile one* — the exact opposite of the American
mid-game. Bonus, distinctly French, cheap to express: **CIFRE** — the doctorate done
*inside a company*, salaried, on an employment contract. A stipend-years tile where one
wheel face *pays you* is an honest French mechanic with no equivalent on the US board.

**India — a pay choice, not a risk choice.** *(Confidence: medium — broad strokes solid,
fine texture less so.)* Faculty posts at IITs/IISc and scientist posts at CSIR labs,
ISRO, DRDO are effectively **secure once won** — government pay scales, promotion by
assessment rather than up-or-out (some IITs have experimented with tenure-style review,
but American-style denial is not the norm). The industry side — the Bangalore/Hyderabad
global capability centers, pharma R&D — pays a **multiple** of the academic scale. So
"don't get a PhD" in India is not the *safe* choice; it is the *lucrative* one, and the
academic post is the secure-but-modest one. The genuinely Indian gamble is elsewhere:
the **abroad detour** — PhD/postdoc in the US or Europe, then the return bet (an IIT
post via the diaspora channel) or the stay bet. An honest Indian researcher board
probably needs an abroad chapter, which is a *new fork meaning* the other boards don't
have. Distinct shape, but less contrastive with US/Japan than France is.

**Bolivia — the honest answer is that the form doesn't transfer.** *(Confidence: low on
institutional texture, and that is precisely the point.)* Bolivia's R&D spending is
among the lowest in Latin America; there is no large national research council with
permanent researcher posts in the CNRS/CSIR mould, and little domestic industry R&D.
Research happens mostly inside the universities (UMSA, UMSS), done by *docentes* whose
post is a **teaching chair** — secure once won by concurso de méritos, but a teaching
career, with research on top, funded largely by international cooperation projects.
There are real and even storied institutions — the Chacaltaya cosmic-ray observatory
above La Paz is a genuine chapter of 20th-century physics — but the realistic path for
a Bolivian who wants a research *career* runs through emigration, and the fork that
matters is **leave-or-return**. Forcing Bolivia into the shared five-fork researcher
skeleton would manufacture a false equivalence with careers that don't exist there in
that form. If a Bolivian researcher board is ever told, it is an emigration story — a
different design, worth doing honestly or not at all. **Recommendation: decline it for
this axis, and say why in the picker if needed.**

### 10.2 The verdict: yes — cross it with country

The differences above are not prose-deep. They move **which lane is gated, where the
volatility tile sits, and what failure even means**:

| | Where the risk lives | Failure mechanic | Is "no PhD" the safe road? |
|---|---|---|---|
| USA | mid-career (year ~6 on the track) | committee vote; job ends; industry catches you | mostly — the gamble is *staying*, not the degree |
| Japan | early career (the fixed-term years) | contract simply not renewed at the cliff | **yes, emphatically** — master's exit is the national default |
| France | one entry gate (the concours) | ageing out of eligibility | no — the safe elite road never enters the university at all |
| India | the abroad detour | the return bet not landing | no — it's the *lucrative* choice; academia is secure-but-modest |
| Bolivia | the border | — | the question barely parses in-country |

So the original "one universal Researcher Edition" was, without knowing it, the USA row
of this table. The user caught that.

**Recommendation — a real one, not a menu: build researcher × country, launching with
two boards, Japan and France.**

- **Japan first** because it is the user's home market, because the "PhD as gamble"
  claim is *truest* there, and because its failure mechanic (the term-limit cliff) is
  the most under-told story in this genre.
- **France second** because it is the structural counterexample — the board that
  *proves* the country axis earns its place mechanically. If Japan and France play
  recognizably differently (and per the sketches below, they must), the axis is real.
- **USA third, essentially pre-designed** — §§1–6 of this document *are* that board;
  it waits on a shelf at near-zero additional design cost.
- **India: defer.** Differentiable (the abroad chapter) but less contrastive than
  France; a good fourth, not a launch title.
- **Bolivia: honestly declined** for this axis, per 10.1.

### 10.3 Two boards sketched — the differences are mechanical

Held to §8's own standard: each line below changes what a player *does or risks*, not
what they read.

**Researcher: Japan**

- **Opening fork: 修士で出る vs 博士課程.** The safe lane is not "no degree" — it is
  the master's exit into corporate R&D, the national default. The doctorate lane is the
  gamble, exactly as §2 drew it — this is the one country where the original design's
  opening fork survives intact, even amplified.
- **The gated lane is 任期の階段 (the Fixed-Term Ladder), and its end tile is the
  Ten-Year Cliff, not a Tenure Vote.** Same board slot as §2's Tenure Clock, different
  truth: no dossier, no committee — a spin where failure means the contract is simply
  not renewed one year before permanence would vest. Success = a 無期 post: **the
  safest shelf in the entire game**, safer than the US tenured shelf — the Layoff
  Notice tile explicitly cannot touch it.
- **Leaving late is worse than never going.** The mid-career industry redraw from the
  academia shelf deals at **rung 1 regardless of current rung** — the hiring-calendar
  penalty made mechanical: your academic years do not transfer. (On the US board the
  same redraw deals *at* your rung — that one line is the fluidity difference between
  the two labor markets, expressed in the career-fair rule.)
- **Promotion is 公募, a lottery, fail-soft.** Dozens of applicants per open post: a
  low-probability, repeatable spin. Japan's catastrophic spin is the cliff; its
  promotion spin is merely long odds. The US board has it the other way around.

**Researcher: France**

- **Opening fork: La Grande École vs L'Université.** The prestigious safe road bypasses
  university science entirely — prépa, engineering school, industry cadre, salaried from
  the start. The university/doctorate lane is the underdog road. ("Don't get a PhD" is
  not a choice here; it is the default the elite never questioned.)
- **The doctorate can pay.** One face of the stipend-years wheel is **CIFRE** — the PhD
  done inside a company, on salary. The only board where the tuition-stop tile can put
  money *in* your pocket.
- **The gated lane is Le Concours: one entry gate, attempt-limited.** One or two
  postdoc tiles, then the spin. Failure is fail-soft *but the lane only allows two or
  three attempts* — miss them all and you age out, forcibly exiting to the industry
  redraw. All the volatility of an academic life, compressed into one gate in your
  early thirties.
- **After the gate, the inversion inverts.** The fonctionnaire shelf: **highest floor
  on any board, lowest ceiling on any board.** No layoff, no vote, no cliff — and a
  salary that industry's rung 2 already beats. Late-game France plays as *academia
  safe / industry volatile*: the mirror image of late-game USA and Japan. A player who
  has played both boards will feel this without reading a single tile.

### 10.4 One mechanic, three national meanings

§5 proposed `tenureReview` as a one-off SpaceEffect. The cross reframes it better: one
new variant — call it a **gate review**: a spin at a lane's end whose failure consequence
is configurable — serves all three launch-adjacent boards:

- USA: mid-lane gate, failure = `loseCareer`, board geometry catches you (the §5 design).
- Japan: end-of-treadmill gate, failure = non-renewal, success = the untouchable shelf.
- France: entry gate, failure = decrement an attempt counter; at zero, forced exit.

One piece of domain plumbing, three national truths. This is the engineering argument
*for* the cross: the countries don't multiply the mechanics, they parameterize one.

### 10.5 Scope, revised honestly

The original §9 estimated: one country edition's worth of content + small plumbing + one
new effect + a full rebalance pass. Per additional researcher board, the content cost
repeats (~90 tiles, career pools, life-tile deck, stories) and — the expensive part —
**each board's fork shape needs its own measured balance pass**, because Japan's cliff
odds, France's concours odds and low-ceiling economy, and the US vote are three
different distributions. What amortizes: the gate-review effect (built once), the
`requires: 'doctorate'` gate, the trade-year override plumbing, and the whole §1–§6
design vocabulary.

Rough shape of the trade-off for the user:

| Option | Cost | What you get |
|---|---|---|
| Original: one "universal" edition | ≈ 1 country edition + rebalance | a good board that is secretly the US board |
| **Recommended: launch pair (Japan + France)** | ≈ 2.5× the original (plumbing amortized) | the axis *demonstrated* — two boards that play differently for real reasons |
| Full four (adding USA, India) | ≈ 4×+ | USA is nearly free by then (pre-designed); India needs its abroad-chapter design first |

If the pair is greenlit, the §9 build-order advice still holds per board: ship each with
the existing effect vocabulary first, playtest, then decide whether the gate-review
variant earns its plumbing — with the note that it now amortizes across three boards,
which strengthens its case considerably.
