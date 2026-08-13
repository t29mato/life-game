# Remote play — design options

**Status:** design only. Nothing in this document has been built. No source file
was changed to write it.

**The ask.** Play LIFE JOURNEY from separate locations, on phones, by creating a
room and sharing a code — inside what Vercel's free (Hobby) plan can do.

This document sets out one design in enough detail to build, the alternatives
that were rejected and why, and the places where the current code will fight
back. It is ordered by value: the architecture first, then the format, then the
hazards, then the platform, then the UI, then the roads not taken.

---

## 0. Verdict, and where I disagree

The lead's read of the codebase is broadly right, and I verified each claim
against the source rather than taking it on trust. Five corrections and
additions matter enough to state before anything else.

**Confirmed.**

- The use cases are pure `(state, deps) → GameState`. `spin`, `settle`,
  `choose`, `endTurn` and `startGame` never mutate their input and never touch
  a clock, a global, or `Math.random` directly. Verified across
  `src/application/usecases/`.
- All non-determinism funnels through `RandomPort`
  (`src/application/ports/RandomPort.ts`), and `createSeededRandom`
  (`src/infrastructure/random/SeededRandomAdapter.ts:22`) already reproduces a
  stream from a seed.
- The board is derivable. `createBoard(length, difficulty, edition)`
  (`src/domain/board/createBoard.ts:346-350`) takes **no** `RandomPort` — it is a
  pure function of three values. I measured the consequence: in
  `public/dev/early.json`, the serialized `GameState` is **19,848 bytes, of which
  the board is 19,105 — 96%**. Players are 439 bytes. So "the board dominates the
  payload" is not a hunch; it is 96 cents on the dollar.
- Turn-based, so polling is fine and no socket is needed.
- Storage request quotas, not compute, are the ceiling. Confirmed with numbers
  in §4.

**Corrections.**

1. **There is no seed anywhere today.** `NewGameConfig`
   (`src/domain/model/types.ts:429-436`) has no seed field, and `startGame`
   ignores its deps entirely — the signature is `startGame(config, _deps)`
   (`src/application/usecases/startGame.ts:30`). The seed lives only in the
   adapter handed to `createGameStore` at the composition root, and today that
   adapter is `createMathRandom()` (`src/main.tsx:18-22`). "Share a seed" is new
   work, not a wiring change.

2. **The RNG is a stateful stream, not a function of (seed, command index).**
   One `createGameStore` call creates one mulberry32 stream, and every draw
   advances it. If two clients ever differ by a single draw — one extra
   `shuffle`, one skipped `spin` — *every subsequent random result on both
   clients differs forever*. This is the most fragile part of lockstep here, and
   §3 proposes reseeding per command to contain it.

3. **`GameStore` is the right seam for three of its seven members, not all
   seven.** `getState`/`subscribe`/`dispatch` map onto a networked store
   cleanly. `canLoad`/`slots`/`records` are local-storage concepts, and
   `save`/`load` are commands that must never reach the network log. The seam
   holds; it just has a local half and a networked half. See §5.

4. **A whole-state hash will produce false desyncs.** `formatMoney` calls
   `Number.prototype.toLocaleString` (`src/application/usecases/format.ts:15,20`),
   and its output is baked into `GameState.log[].message`,
   `LandingEvent.notes` and `LandingEvent.narration`. Locale formatting is
   engine- and ICU-data-dependent. Two phones can agree perfectly on the game
   and disagree on a string. Hash a mechanical projection, not the state. §3.

5. **`settle` belongs in the log — it is not presentation.** The lead asked this
   directly, so it gets a direct answer: `settle` draws randomness in eight
   places via `applyEffect`, so it cannot be folded into the move without moving
   those draws. What is wrong is not that it is a command; it is that an
   *animation finishing on one particular device* is what emits it. §3.4.

**And one hazard neither of us listed, which I think is likelier to bite than
anything about RNG:** two phones loading two different JS bundles. The board is
generated from `src/domain/edition/usa/route.ts`, which is under active edit. A
player on a stale cached bundle builds a different board and diverges on move
one. §3.7.

---

## 1. Architecture

### 1.1 The shape

Deterministic lockstep. The server stores an **append-only log of commands** and
nothing else. Every client holds the full `GameState` in memory, computed by
folding the log through the existing use cases. Nobody is authoritative over
state; the log is authoritative over *inputs*, and the reducer does the rest.

```
  phone A ──┐                                   ┌── phone A
            │  POST /api/rooms/:code/log        │   fold(log) → GameState
  phone B ──┼──► [ Vercel function ] ──► Redis ─┼── phone B
            │  GET  /api/rooms/:code/log?since= │   fold(log) → GameState
  phone C ──┘        (stateless)          LIST  └── phone C
```

The server never imports the domain. It appends opaque JSON blobs to a list and
hands back slices of that list. That is deliberate: it means the game rules can
change without redeploying an API, and it means the API is small enough to be
obviously correct.

### 1.2 What is stored, and what is recomputed

**Stored** (two Redis keys per room, both with a 24-hour TTL):

`room:{code}:meta` — a hash, written once at creation and once more at start:

| field | example | why |
|---|---|---|
| `seed` | `1739284471` | the shared RNG seed; a 32-bit integer, because that is what `mulberry32` takes |
| `buildId` | `a3f91c2` | git SHA or Vite build hash — see §3.7 |
| `config` | `{players:[…], boardLength, difficulty, editionId}` | the `NewGameConfig` the game will start from |
| `hostClientId` | `uuid` | who owns CPU seats and `settle` fallbacks |
| `seats` | `{"player-1":"uuid-a", …}` | seat → device claims |
| `status` | `lobby` \| `playing` \| `over` | gates joining |

`room:{code}:log` — a Redis LIST. Each element is one command envelope (§2).
Sequence number *is* the list index, which makes `LLEN` the current head and
removes the need for a separate counter.

**Recomputed on every client, from `meta` + `log`:**

- the entire `Board` (19 KB of the 20 KB state — never transmitted)
- every `Player`, their money, career, house, stocks, insurance
- `phase`, `pendingDecision`, `lastEvent`, `movementPath`, `log`, `results`

Nothing derivable is ever stored. A finished 4-player game's log is roughly
210 commands × ~70 bytes ≈ **15 KB**, against ~40 KB for one snapshot of a
late-game `GameState`. The log is smaller than a single copy of the thing it
generates.

### 1.3 Room lifecycle

**Create.** The host opens the title screen, fills in the roster and settings as
today, and taps *Play online* instead of *Start*. The client generates a room
code and a `clientId`, and `POST /api/rooms` writes `meta` with
`status: lobby`, a server-generated `seed`, and the build id baked into the
bundle at compile time. The host claims seat `player-1`.

Room codes: 5 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (no O/0/I/1/L),
≈ 28 million combinations. Collisions are handled by `SET NX` on the meta key
and retrying — at the volumes in §4 this will effectively never fire.

**Share.** The code is shown large, alongside a link `https://…/?room=ABCDE`.
Use `navigator.share()` where available so it goes into a group chat in one tap;
fall back to copy-to-clipboard. A QR code is tempting and is not worth it — the
people playing are not in the room, so nobody can scan anybody's screen.

**Join.** `GET /api/rooms/ABCDE` returns `meta`. The client checks `buildId`
against its own and refuses with a clear message on mismatch (§3.7). It then
`POST`s to claim a free seat, storing its `clientId` in `localStorage`. The
lobby shows which seats are taken and by whom, polling `meta` every 3 s.

**Start.** The host taps *Start*. This appends command 0 —
`{type:'startGame', config}` — and flips `status` to `playing`. Every client
sees a log of length 1, constructs a **fresh** store with
`createSeededRandom(seed)`, folds command 0, and lands in `awaitingDecision` at
the opening fork exactly as the local game does today
(`src/application/usecases/startGame.ts:78-79`).

**Play.** The client whose seat is `currentPlayerIndex` has live controls;
everyone else's are disabled and their screen reads *Waiting for Rin…*. When the
active player acts, their client:

1. applies the command locally at once (optimistic — the UI must not wait a
   round trip to show a spin),
2. `POST`s the envelope with `expectedSeq = current log length`,
3. on `409 Conflict`, rolls back by rebuilding from the log (§2.3).

Everyone else polls, folds the new commands, and re-renders. Because `dispatch`
already replaces the whole `GameState` object and `useGameState`
(`src/presentation/hooks/useGameState.ts`) is a `useSyncExternalStore`
subscription, a remote command arriving is indistinguishable to React from a
local one.

**Someone refreshes.** Nothing to recover. `clientId` is in `localStorage`, the
room code is in the URL. The client re-fetches `meta` and the whole log, folds
from zero, and is back — with the *same* state as everyone else by construction,
because it is a pure function of what it just downloaded. Total cost: two Redis
reads and ~15 KB. This is the single best property of the design and it is worth
protecting: it means "refresh the page" is a legitimate fix for every visual
glitch you will ever ship.

**Someone drops and returns.** Identical to a refresh. Play does not block on
absence unless it is the absent player's turn, in which case it blocks by
definition. Show *Waiting for Rin — last seen 2 min ago* rather than a spinner,
so the table can decide to nudge them in the group chat. A `heartbeat` field on
`meta`, written on each poll, would give you "last seen"; it costs one extra
write per poll per player, which roughly doubles the request budget, so I would
**not** build it in v1. Derive presence instead from the timestamp on the last
command anyone appended.

**The game ends.** `endTurn` produces `phase: 'gameOver'` with `results`. Every
client computes the same standings and files its own row in its own local hall
of records (`createGameStore.ts:82-86`), which is what you want — each player
keeps the game in their own history. `status` flips to `over`; the keys expire
24 hours later.

### 1.4 The API

Five endpoints, all stateless, none of them importing the domain.

| method | path | Redis commands | notes |
|---|---|---|---|
| `POST` | `/api/rooms` | 1 (`HSET` w/ NX) | create; server picks the seed |
| `GET` | `/api/rooms/:code` | 1 (`HGETALL`) | meta; used by the lobby |
| `POST` | `/api/rooms/:code/seat` | 1 (`EVAL`) | claim a seat, CAS on the seat being free |
| `GET` | `/api/rooms/:code/log?since=N` | 1 (`LRANGE N -1`) | the hot path |
| `POST` | `/api/rooms/:code/log` | 1 (`EVAL`) | append with optimistic concurrency |

One Redis command per HTTP request, everywhere. That is the property that makes
§4's arithmetic work.

---

## 2. The command log

### 2.1 Envelope format

```ts
interface LoggedCommand {
  /** Index in the list. Assigned by the server; the client's guess is validated. */
  readonly seq: number
  /** Which seat issued it. `'player-1'`… — matches `Player.id`. */
  readonly by: PlayerId
  /** The device that issued it, for seat-ownership checks. */
  readonly clientId: string
  /** Exactly the existing `GameCommand`, minus `save`/`load`/`reset`. */
  readonly command: NetworkCommand
  /** FNV-1a of the mechanical projection of the state *after* applying it. */
  readonly hash: number
  /** Server clock, for "last seen" and for after-the-fact debugging only. */
  readonly at: number
}

type NetworkCommand = Extract<
  GameCommand,
  { type: 'startGame' | 'spin' | 'settle' | 'choose' | 'endTurn' }
>
```

`save`, `load` and `reset` are deliberately excluded. `load`
(`createGameStore.ts:135-143`) replaces state wholesale from local storage and
would desync the room instantly; `reset` returns to `setup`. All three stay
local-only, and §5 says what they become in a room.

A typical envelope: `{"seq":47,"by":"player-2","clientId":"3f…","command":
{"type":"choose","optionId":"house-cottage"},"hash":2847193,"at":1786…}` —
about 130 bytes as written, ~70 after you drop `clientId` and `at` from the
stored form and keep them server-side. Either way the whole game is well under
30 KB.

### 2.2 Optimistic concurrency on append

`seq` is the list index, so the append is a compare-and-append against `LLEN`.
One Lua script, one round trip:

```lua
-- KEYS[1] = room:{code}:log,  ARGV[1] = expectedSeq,  ARGV[2] = envelope JSON
if redis.call('LLEN', KEYS[1]) ~= tonumber(ARGV[1]) then
  return -1
end
redis.call('RPUSH', KEYS[1], ARGV[2])
return tonumber(ARGV[1])
```

Return `-1` → the function replies `409` with the current length, and the client
reconciles. Return `n` → `200`, and the client's optimistic state was correct.

Contention is nearly nil — the game is turn-based and only one seat is ever
entitled to act — so this exists for three narrower reasons, all of which will
actually happen:

- **React StrictMode double-invokes effects in development** (`src/main.tsx:32`).
  Any dispatch fired from an effect will fire twice. The CAS makes the second one
  a no-op rather than a duplicate turn.
- **The `settle` race.** Multiple clients can currently emit `settle` (§3.4).
  Until seat ownership is enforced, the CAS is what stops both landing.
- **Retries.** A phone on flaky mobile data will retry a `POST` whose response
  it never saw. Without the CAS that is a duplicated command.

### 2.3 How a client reconciles

The client keeps three things: `log` (everything it has seen), `applied`
(how many it has folded), and `pending` (at most one optimistically applied
command not yet acknowledged).

**On a poll returning commands `[N…M]`:**

- If `N === applied` and there is no `pending`: fold each in order. Done.
- If `pending` exists and the first returned command is that command: clear
  `pending`, it landed. Fold the rest.
- If `pending` exists and the first returned command is *someone else's*: our
  optimistic apply is wrong. **Rebuild from zero.** Construct a fresh store with
  `createSeededRandom(seed)`, fold the whole log, re-issue our command only if
  it is still legal in the rebuilt state, otherwise drop it and let the UI
  re-render (the button the player pressed will simply no longer be there).

Rebuilding from zero rather than trying to unwind is not laziness; it is the
only correct move, because the RNG stream cannot be rewound (§3.2). Folding 210
commands over an 86-space board is a couple of milliseconds. Always rebuild.

**Never** reconcile by applying a command out of order, and **never** let the
existing `reject()` path (`createGameStore.ts:88-92`) swallow a failure during a
replay. In local play, swallowing an invalid command and logging *"Ignored: …"*
is exactly right. During a replay it is catastrophic — see §3.3.

### 2.4 The state hash

Each envelope carries a hash of the state *after* its command, computed by the
emitting client. Every other client compares after folding. A mismatch is
reported immediately, naming the seq and the command, so you learn about a
divergence at move 12 rather than at the results screen.

Hash a **mechanical projection**, never the whole state:

```ts
function projectForHash(s: GameState) {
  return {
    t: s.turn, i: s.currentPlayerIndex, p: s.phase,
    sp: s.lastSpin, sr: s.stepsRemaining, ce: s.chosenExit,
    mp: s.movementPath,
    // A count, not the text. Catches a missing or extra entry without
    // hashing a single locale-formatted string. See §3.1.
    ln: s.log.length,
    d: s.pendingDecision?.options.map((o) => o.id) ?? null,
    pl: s.players.map((q) => [
      q.id, q.spaceId, q.money, q.loans, q.career?.id ?? null,
      q.hasDegree, q.isMarried, q.children, q.house?.id ?? null,
      q.lifeTiles.map((t) => t.id),
      q.stocks.map((h) => [h.stockId, h.shares]),
      q.insurance, q.isRetired, q.retirementRank,
    ]),
  }
}
```

Serialize with a key-sorted stringify and run FNV-1a 32-bit over it. Not
`crypto.subtle` — that is async, needs a secure context, and buys nothing here.
Collisions at 32 bits are irrelevant: you are detecting accident, not defending
against an adversary.

Note `ln: s.log.length` in particular. Log entry ids are derived from the log's
own length — `` `log-${state.turn}-${state.log.length + offset}` ``
(`src/application/usecases/logging.ts:17`) — so **one extra or missing entry
permanently shifts every id that follows it**. Including the count catches that
on the very next command, which is exactly the class of bug that is otherwise
invisible until something keys a React list on `entry.id`.

---

## 3. Determinism hazards

This is the section to read twice. Everything here is a specific, verified
mechanism by which two clients running identical code can end up with different
states.

### 3.1 `toLocaleString` in log text — *real, will cause false desyncs*

`src/application/usecases/format.ts:15,20`:

```ts
return `${sign}${currency.symbol}${Math.abs(amount).toLocaleString(currency.locale)}`
```

`toLocaleString` output depends on the engine's ICU data. iOS Safari, Android
Chrome and a desktop build do not carry identical ICU versions, and the risk is
worst for the non-`en-US` editions — the Japan edition is exactly the case where
grouping and symbol placement have historically differed between engines.

Its output is not cosmetic in the sense that matters here: it is embedded in
`GameState.log[].message`, `LandingEvent.notes` and `LandingEvent.narration`, all
of which are *inside* `GameState`.

This never changes a single number the game computes. It only breaks a naive
whole-state hash. Two fixes, in order of preference:

1. **Hash the projection, not the state** (§2.4). Costs nothing, and is the right
   thing anyway.
2. Additionally, consider replacing `toLocaleString` with a hand-rolled grouping
   function driven by `CurrencySpec`. Six lines, removes an engine dependency
   from the domain's output, and makes the log text byte-identical everywhere —
   which you will want the first time two players screenshot the same moment and
   the text differs. This is a nice-to-have, not a blocker.

### 3.2 The RNG is positional, and cannot be rewound — *real, structural*

`createGameStore` (`createGameStore.ts:66-67`) holds one `RandomPort` for the
store's entire lifetime. `createSeededRandom` closes over a single mutable
`state` (`SeededRandomAdapter.ts:11-12`). Every draw advances it.

Three consequences, all of which need a rule:

**(a) Replay must always start from a fresh store.** A client that plays a local
game and then joins a room must not reuse its store — the stream has already
been advanced. Rule: constructing a networked store constructs a new
`createSeededRandom(seed)`, always, and folds from index 0.

**(b) Draw counts must match exactly, not just draw *values*.** Because the
stream is positional, one client making one extra draw shifts everything after
it. Today the draw count is a deterministic function of the state and the
command, so this holds — but it holds by accident of the code, not by
construction.

**(c) A throw after a draw poisons the stream.** `spin`
(`src/application/usecases/spin.ts:18`) calls `deps.random.spin()` and *then*
calls `planMovement`, which can throw on a malformed board. `dispatch` catches
and swallows (`createGameStore.ts:149-151`), leaving the stream advanced by one
and the state otherwise unchanged. A client that threw and a client that did not
are now permanently out of step on every future draw.

**Recommendation: reseed per command.** Instead of one stream for the game, give
each command its own:

```ts
// conceptually, inside the networked store's fold loop
const random = createSeededRandom(mix(seed, seq))
const next = spin(state, { ...deps, random })
```

`mix` can be as simple as `Math.imul(seed ^ seq, 0x9e3779b1) >>> 0`. This makes
each command's randomness a pure function of `(seed, seq)` rather than of the
entire preceding history. It converts (b) and (c) from *permanent, silent,
whole-game* divergence into *one command's worth* of divergence, which the hash
then catches immediately. It costs one object allocation per command and changes
no rule of the game — the draws within a command are still a well-distributed
stream. I would build this. It is the single highest-leverage change in this
document.

The eight draw sites, for reference: `applyEffect.ts:288` (`collectPaydays`),
`:345` (life tiles), `:365` (career pool), `:428` (houses), `:496`
(`spinForMoney`), `:534` (career change), `:583` (stocks), `:853` (steal a
tile), `:879` (upgrade house); plus `spin.ts:18`, `choose.ts:114`
(`collectPaydays` on a mid-move fork) and `endTurn.ts:35` (resale and stock
payout rolls at retirement).

### 3.3 `reject()` mutates state — *real, and it is the sneaky one*

`createGameStore.ts:88-92`:

```ts
function reject(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  setState({ ...state, log: appendLog(state, null, `Ignored: ${message}`, 'info') })
}
```

An invalid command does not leave state alone — it **appends a log entry**.
Combined with §2.4's note about log ids being derived from `log.length`, one
client rejecting a command that another client accepted means their log ids
diverge from that point on, forever.

Rule: the networked store must have a **strict mode**. During a fold of the
authoritative log, a use case that throws is a *fatal desync*, not a swallowed
line. Surface it, stop folding, and show a "this game has desynced" state with a
Rebuild button. Do not paper over it. The local same-screen store keeps its
forgiving behaviour unchanged.

### 3.4 `settle` — the lead's question, answered

**Is `settle` a command that belongs in the log, or should the model treat it as
part of the move?**

It belongs in the log, and it cannot be folded into the move as the code stands.
`settle` (`src/application/usecases/settle.ts:7`) calls `applyEffect`, which
draws randomness in eight of its branches. Making it part of `spin` would mean
moving all eight draws into `spin` — which is a real refactor, and one that
would also collapse `phase: 'moving'`, the state the board animation is built on
(`App.tsx:370-378`).

So the command is fine. What is wrong is **who emits it and when**:

```ts
// src/presentation/App.tsx:112-114
const handleMovementComplete = useCallback(() => {
  store.dispatch({ type: 'settle' })
}, [store])
```

The pawn animation finishing *on one particular device* is what advances the
shared model. Animation duration is not identical across devices: it depends on
frame rate, on `prefers-reduced-motion` (the repo has
`usePrefersReducedMotion.ts`), and on whether the tab was backgrounded — a
backgrounded tab throttles `requestAnimationFrame` and may never fire
`onMovementComplete` at all. Left alone, four phones race to emit `settle`, and
a backgrounded phone can stall the game.

There is a second, quieter emitter of the same command
(`App.tsx:124-132`): the empty-`movementPath` safety net. On a spectator's
client this fires too.

**Rule for v1: only the turn owner's device emits `settle`.** Concretely, both
`handleMovementComplete` and the safety-net effect become no-ops unless
`mySeatId === state.players[state.currentPlayerIndex].id`. Spectators receive
the `settle` entry from the log; if their pawn is still hopping when it arrives,
they fast-forward the animation and land on the same tile. This is a small,
local change and it is what I would build first.

**The better end state, later.** The turn owner emits `settle` *immediately*
after `spin`, without waiting for the animation, and every client — including the
one that emitted it — renders a presentation cursor that lags the model. The
model becomes strictly ahead of the pixels, which is how you want a networked
game to work: state is the truth, animation is a replay of it. That is a real
change to `App.tsx`, `Board`, `EventCard` and the CPU loop, so it is not v1. But
the moment you find yourself adding a second "wait for the animation" coupling,
build it.

### 3.5 CPU seats are driven by a UI timer — *real, low severity*

`App.tsx:209-224` runs a `setTimeout` per client and dispatches the CPU's
command. In a room, all four clients run it.

The saving grace: `decideCpuCommand` is genuinely pure and deterministic
(`decideCpuCommand.ts:610`), and its tie-break is explicit — `pickOption` uses a
strict `>` so ties fall to the first option offered
(`decideCpuCommand.ts:593-604`). So every client computes the *same* command,
and the §2.2 CAS turns the three losers into no-ops.

Still: four devices racing to write the same thing, four times per CPU turn, is
a waste of the request budget from §4 and produces confusing logs. **Rule: the
host's device owns every CPU seat.** One line in the effect's guard.

A related note on floating point: `scoreBranch` accumulates `laneValue` by
iterating a `Set` (`decideCpuCommand.ts:531`), and floating-point addition is
order-dependent. The order here is deterministic — `Set` iterates in insertion
order, and insertion order comes from `reachableWithin`'s walk over
`board.spaces`, whose keys are non-integer-like strings and so iterate in
insertion order too. So this is safe *today*. It is safe by a chain of four
facts, none of which is written down anywhere, which is why the host owning CPU
seats is worth doing regardless — it removes the dependency entirely.

Also `2 ** retired` at `decideCpuCommand.ts:366`: `**` is
implementation-approximated per spec. With small integer exponents every real
engine returns the exact value, so this is theoretical. Noting it only so it is
not rediscovered as a mystery.

### 3.6 `save` / `load` / `reset` must not reach the network — *design rule*

Covered in §2.1. `load` replaces the entire state from local storage;
`reset` returns to `setup`. Both would desync a room. §5 says what they become.

Also note `endTurn`'s side effects in the store (`createGameStore.ts:120-127`):
it autosaves to `AUTOSAVE_SLOT` and files finished games via
`deps.stats.append`, which stamps `new Date().toISOString()`
(`LocalStorageStatsRepository.ts:104`). These sit *outside* the pure fold and
are per-device, so they are harmless — and in fact desirable, since each player
ends up with the game in their own records at their own local time. Just make
sure they are not invoked during a bulk replay of 200 commands, or a rejoining
player will write 200 autosaves. Gate them on "this fold caught up to the head".

### 3.7 Build skew — *the one most likely to actually happen*

The board is generated from `src/domain/edition/usa/route.ts`, which is under
active development by other agents right now. Two phones on two different
cached bundles produce two different boards from the same
`{editionId, boardLength, difficulty}`, and diverge on the first command.

This is not a subtle bug — it is catastrophic and immediate — but it is easy to
misdiagnose as an RNG problem, and it *will* happen, because a phone that
opened the site last week and has a service worker or a stale HTTP cache is the
normal case, not the edge case.

**Rule: `meta.buildId` is written at room creation and checked at join.** Inject
it at build time (`import.meta.env.VITE_BUILD_ID`, set from `VERCEL_GIT_COMMIT_SHA`).
On mismatch, refuse to join with a message that says what to do: *"This room is
running a newer version. Pull down to refresh and try again."* Also re-check on
every poll response, so a room that starts fine cannot drift when someone
refreshes mid-game onto a new deploy.

Ship `Cache-Control: no-cache` on `index.html` so a refresh actually gets the
new bundle. Vercel does this by default for HTML, but confirm it rather than
assume it.

### 3.8 Non-hazards, checked and cleared

Worth recording so nobody re-audits them:

- **Log entry ids.** `makeLogEntry` derives them from turn and log length and
  explicitly never touches `Math.random` (`logging.ts:1-22`). Deterministic.
- **`createBoard`.** No `RandomPort` parameter. Pure in `(length, difficulty,
  edition)`. Verified at `createBoard.ts:346-350`.
- **`startGame`.** Takes deps and ignores them (`startGame.ts:30`). Draws
  nothing. Player ids are `player-${index + 1}`, positional and stable.
- **`Array.prototype.sort`** in `expectedBestOfTwoSalary`
  (`decideCpuCommand.ts:141`) — stable since ES2019, and the comparator is a
  total order on numbers anyway.
- **Object key iteration order** for `board.spaces` — space ids like `main-14`
  are not integer-like, so insertion order, which is deterministic.
- **`Math.random` in `WebAudioAdapter.ts:141`** — noise buffer generation.
  Presentation only, never touches state.

---

## 4. Vercel free-plan realities

Figures below are from Vercel's own limits page and from Upstash's pricing, both
checked on 2026-08-13. Where I am unsure I say so rather than guess. **Verify
before building against any single number** — these move.

### 4.1 Vercel Hobby, the parts that matter

From [vercel.com/docs/limits](https://vercel.com/docs/limits) (last updated
2026-08-03):

| | Hobby |
|---|---|
| Function invocations | 1,000,000 / month |
| Active CPU | 4 CPU-hours / month |
| Provisioned Memory | 360 GB-hours / month |
| Fast Data Transfer | 100 GB / month |
| Function duration | default 10 s, max 60 s |
| Deployments | 100 / day |
| Collaborators | single developer, no shared dashboard |

Two non-technical constraints that matter more than any quota:

- **Hobby is explicitly non-commercial.** Vercel scopes it to personal projects.
  A game you and your friends play is squarely inside that. Anything with a
  payment, an ad, or a business behind it is not, and needs Pro at $20/month.
- **Hobby cannot connect to a Git-organization repository.** If this repo ever
  moves under an org, deployment breaks. Worth knowing now.

When a Hobby limit is hit, the project **pauses** rather than billing you. That
is the failure mode to design against: not a surprise invoice, but the game
going dark mid-evening.

The 10 s default / 60 s maximum duration figure is stated for projects deployed
before 2025-04-23 and *not* using Fluid compute. **I am uncertain what the
current maximum is for a new Hobby project on Fluid compute** — I have seen
larger numbers quoted and could not confirm them against the docs. This matters
only if you pursue long-polling (§4.4), so check it at that point and not
before.

### 4.2 Storage options actually available on Hobby today

| option | verdict | why |
|---|---|---|
| **Upstash Redis** (via Vercel Marketplace) | **Build on this** | Free tier: 256 MB, **500,000 commands/month**. Supports `EVAL`, so the §2.2 CAS is one round trip. |
| **Vercel Blob** | Workable fallback | 1 GB on Hobby. Rate limit is generous (1,200 simple ops/min per team). But it is object storage: no atomic compare-and-append, so §2.2 becomes read-modify-write with a real race. |
| **Edge Config / Global Config** | **Ruled out** | The limits page lists *"Global Config writes per month (Free): **250**"*. A single 4-player game needs ~240 writes. One game per month. It is a read-optimized config store and this is not what it is for. |
| **Neon Postgres** (Marketplace) | Overkill | A relational database for an append-only list of 210 rows. It works, and the free tier autosuspends compute, which adds cold-start latency to a poll. No reason to prefer it. |
| **Vercel Postgres / Vercel KV** (first-party) | Gone | Both were folded into the Marketplace (Neon, Upstash). Do not follow older tutorials that reference them. |

Upstash it is. 500,000 commands/month is the number the whole design lives or
dies by.

### 4.3 Honest per-game request estimate

Assume the lead's scenario: 4 players, 30-minute game, and — because §1.4 gives
one Redis command per HTTP request — Redis commands and function invocations are
the same count.

**Naive: every client polls every 2 s for the whole game.**

- Polls: 4 players × (30 × 60 / 2) = 4 × 900 = **3,600**
- Appends: ~60 player-turns × ~4 commands (`choose` road, `spin`, `settle`,
  `endTurn`) ≈ **240**
- Join/meta/lobby: ~50
- **Total ≈ 3,900 Redis commands per game.**

Against 500,000/month: **≈ 128 games per month.** Against 1M invocations:
≈ 256 games. Redis binds first. The lead's instinct is exactly right.

**With adaptive polling** — and this is cheap, purely client-side, and should be
in v1:

| situation | interval | rationale |
|---|---|---|
| it is **my** turn | 15 s | I am the one generating the events; nothing will change without me |
| it is someone else's turn | 2 s | this is the only case that needs to feel live |
| tab hidden (`document.visibilityState`) | 20 s, or stop | nobody is looking |
| lobby | 3 s | short-lived |
| after `gameOver` | stop | nothing more will happen |

In a 4-player game each player is idle 3/4 of the time and active 1/4. Per
player per 30 minutes: 1,350 s idle at 2 s (675 polls) + 450 s active at 15 s
(30 polls) ≈ 705. Times four ≈ 2,800. Add backgrounding — phones lock, people
put the game down between turns — and realistically **1,000–1,500 commands per
game**, i.e. **roughly 300–500 games per month**.

**The honest summary, plainly: this supports a handful of concurrent games and a
few hundred games a month. It is right for you and your friends. It is not a
public launch.** If the thing gets shared beyond the group, the failure is not
graceful degradation — it is the project pausing.

Two guardrails worth building because they are nearly free:

- A `MAX_ROOMS` check on create (`SCARD` of an active-rooms set), refusing new
  rooms past a ceiling you pick. Better a clear "too busy, try later" than a
  paused project.
- 24-hour TTLs on every key, so abandoned lobbies never accumulate. 256 MB is
  ~8,000 finished games' worth of logs, so storage is not the constraint — but
  hygiene is free here.

### 4.4 Things that look like optimizations and mostly are not

- **Long-polling** (hold the request open ~25 s, return early on a change) would
  cut poll count roughly 10×. But: the duration ceiling is uncertain (§4.1), and
  a held request burns **Provisioned Memory GB-hours**, of which Hobby has 360.
  A 25 s hold at ~1 GB provisioned is ~0.007 GB-hr, giving ~50,000 holds a month
  — which may be *worse* than the invocation budget it saves. Fluid compute
  multiplexes concurrent invocations onto shared instances, which changes this
  arithmetic substantially and in a direction I cannot pin down without
  measuring. **Do not build this on theory. Measure it if adaptive polling
  proves insufficient, which I do not expect.**
- **ETags / conditional GET** save bandwidth, not Redis commands — you still
  have to read to know whether anything changed. Bandwidth is not the binding
  constraint (100 GB against a 15 KB log). Skip.
- **Batching the response** (`LRANGE since -1` returns everything new at once) is
  already in the design and is the reason a poll is one command rather than N.

---

## 5. What changes in the UI

### 5.1 What stays, unchanged

**Same-screen play stays exactly as it is, and this is not negotiable.** It is
the mode the game was built around, it is the better experience when people are
in the same room, and it is the mode with no dependencies. Concretely: the
existing `createGameStore` + `createMathRandom` composition in `src/main.tsx`
stays; online play is a *second* composition, chosen at the title screen.

Also unchanged: the board, the spinner, the player panels, the decision modal,
the event card, the results screen, the log drawer, the audio, all of
`src/domain`, and all of `src/application/usecases`.

### 5.2 The store seam

The lead's claim is that a networked store implementing `GameStore` leaves the
UI almost untouched. Mostly true, with the caveat from §0.3. Concretely:

```ts
export function createNetworkGameStore(deps: {
  room: RoomPort          // the five endpoints from §1.4
  seed: number
  mySeatId: PlayerId
  local: GameRepositoryPort   // still local: autosave, records
  stats: StatsRepositoryPort
}): GameStore & { readonly mySeatId: PlayerId; readonly desync: DesyncInfo | null }
```

- `getState` / `subscribe` — identical semantics. `useGameState` needs no change.
- `dispatch` — applies optimistically, then posts. Stays `void`-returning and
  synchronous from the UI's point of view, which is what makes this work.
- `canLoad` / `slots` / `save` / `load` — in a room these become "leave" and
  nothing else. Save/load a shared game is a feature nobody asked for; the
  refresh story (§1.3) already covers what save/load was protecting against.
  Return an empty slot list and make `canLoad` false, and the Save button in
  `App.tsx:319-356` hides itself.
- `records` — unchanged, still local.

### 5.3 The turn handoff becomes "waiting for X"

`TurnHandoff` (`App.tsx:457-465`) exists because everyone shares one screen and
you might not notice it became your turn. Its condition is
`humanSeats >= 2 && startingTurn && !activePlayer.isCpu`
(`App.tsx:185-190`).

In a room the premise is gone — you are holding your own phone. Replace the
condition with `activePlayer.id === mySeatId`, and the component's job flips
from *"pass the device to Rin"* to a brief *"Your turn"* flourish on your own
device. Same component, inverted trigger. Good — it already has the right
visual weight for the moment.

What is genuinely new is the **waiting** state, which same-screen play has no
concept of. When `activePlayer.id !== mySeatId`:

- A persistent, non-modal banner: *"Rin is choosing a career…"* — derived from
  `state.phase`, so it is specific rather than a generic spinner. `awaitingSpin`
  → "Rin is about to spin". `moving` → nothing, the pawn is visibly moving.
  `awaitingDecision` → "Rin is choosing…". `resolved` → "Rin is reading the
  card".
- Every control disabled: the spinner (`disabled` prop already exists,
  `App.tsx:388`), the decision modal (render it read-only rather than not at
  all — seeing what Rin is choosing between is half the fun), and the event
  card's Continue button.
- Connection state in the header: a small dot, green when the last poll
  succeeded, amber after two failures, with a *Reconnecting…* label. Do not use
  a modal; a poll failing on mobile data is routine and must not steal focus.

### 5.4 Each phone shows one player's view

There is a nuance here worth stating plainly: **this game has no hidden
information.** Every player's money, career, house, stocks and insurance are on
screen for everybody today, in `PlayerPanel` (`App.tsx:399-411`). So "each phone
shows one player's hand of information" is not about *secrecy* — there is no
hand to hide. It is about *emphasis on a small screen*.

What that means concretely:

- Your own panel is pinned, expanded, and visually distinct. Everyone else's
  collapse to one line: name, colour, cash, rank.
- The board viewport follows *your* pawn by default, with a control to follow
  the active player instead. On a phone the 86-space board does not fit legibly
  otherwise.
- The event card is full-screen when it is your event and a smaller toast when
  it is someone else's — you should see what happened to Rin without it seizing
  your screen.
- The log drawer gains value, not less: it is how you catch up on the two turns
  that happened while you were in a tunnel.

### 5.5 The lobby

Genuinely new UI, and the only substantial new screen: room code display, share
button, seat list with claim/release, host-only Start, and the settings
(`boardLength`, `difficulty`, `editionId`) shown read-only to non-hosts. Budget
this properly — it is the first thing every player sees and a confusing lobby
will sink the feature regardless of how good the sync is.

---

## 6. Alternatives considered and rejected

### 6.1 Host-authoritative state broadcast — rejected

One client (or the server) holds the `GameState` and pushes the whole thing
after every change. Simplest possible model; no determinism requirements at all,
so §3 mostly evaporates.

Rejected on measurement. A serialized `GameState` is **19,848 bytes early in a
game, of which 19,105 is the board** — and the log grows from there, plausibly to
40 KB by retirement. At ~240 state changes per game that is 5–10 MB of writes
per game against a 15 KB command log: **300–600× the payload**, for a store
whose free tier is measured in commands. And a host-authoritative variant means
the game dies when the host's phone locks.

Worth noting the compromise it suggests, though: you *could* transmit
`GameState` with the board omitted and rebuild it on arrival, since it is
derivable. That gets you to ~750 bytes early and a few KB late — 10–50× the
command log rather than 500×. If lockstep's determinism requirements ever prove
too fragile in practice, **this is the fallback**, and it is a good one: it
trades payload for the complete elimination of §3. Keep it in your pocket.

### 6.2 WebRTC peer-to-peer, server only signalling — rejected for v1

Very appealing on paper: the server carries a handful of signalling messages per
game and then gets out of the way entirely, which makes §4's quota arithmetic
irrelevant.

Rejected because signalling still needs a rendezvous channel with the same
polling shape you were trying to avoid, four phones on four different mobile
networks is exactly the NAT topology that needs a TURN relay, and there is no
free TURN service you would want to depend on. You would be trading a well-
understood 500K-command budget for an intermittent, unreproducible "it works on
wifi but not on 5G" failure. Not for a game that needs to work when four people
have already sat down to play.

### 6.3 SSE / streaming from an Edge function — rejected

An `EventSource` per client, with an Edge function streaming updates. Feels like
the right answer for "push instead of poll".

Rejected because a Vercel function is stateless and has no way to be *notified*
that a room changed — it would have to poll the store itself in a loop, moving
the polling from the client to the server without reducing it, while holding a
connection open per client. That is worse on every axis that matters here: same
store reads, plus held connections against a 360 GB-hour provisioned-memory
budget. Push needs a broker (Redis pub/sub with a persistent subscriber), and a
persistent subscriber is exactly what a serverless platform will not host.

If Upstash's Redis pub/sub over their REST API turns out to support a long-lived
SSE subscription cheaply, this becomes worth re-examining. I have not verified
that and am not confident either way.

### 6.4 A third-party realtime service on its own free tier — rejected, with reservations

Ably, Pusher, Liveblocks, Supabase Realtime, PartyKit — any of them would give
you true push with a proper WebSocket, and several have free tiers sized for a
group of friends. This is the *technically best* answer to "make it feel live".

Rejected for v1 on three grounds: it adds a second vendor, a second account, a
second set of quotas and a second failure mode to the project; the game is
turn-based, so 2-second polling is genuinely indistinguishable from push for the
player; and it does not remove the need for durable storage, because a
reconnecting player still needs the log from somewhere.

The reservation: if the polling ever *does* feel bad — most likely because
someone plays with a 4-second poll to save quota and it feels sluggish —
swapping the transport is a contained change. The design keeps the log as the
source of truth and treats delivery as a detail, so a realtime service would
slot in as "notify me that the log grew" while `GET /log?since=N` stays exactly
as it is. Design for that, do not build it.

### 6.5 What I would build, and what I would build first

**Build: deterministic lockstep on Upstash Redis, with adaptive polling.** §1–§3.

**Build first, before any networking at all: a replay harness.** A test that
takes a seed and a command log, folds it twice through two independently
constructed stores, and asserts the projection hashes match at every step.
Extend it into a fuzzer: generate random legal command sequences, replay each
one twice, assert equality.

This is the highest-value first move and it is worth being explicit about why.
It de-risks §3 in its entirety — the RNG-stream question, the `reject`
divergence, the `settle` ownership question and the `toLocaleString` problem all
become failing tests you can fix on a laptop in minutes, rather than mysterious
desyncs you diagnose over a group chat with four people waiting. It needs zero
infrastructure, zero Vercel quota and zero UI. And if lockstep turns out not to
hold, you find out for the price of one test file, and you fall back to §6.1's
board-stripped state broadcast having lost almost nothing.

Then, in order:

1. **Replay harness + per-command reseeding** (§3.2). No network.
2. **`RoomPort` with an in-memory fake**, and `createNetworkGameStore` against
   it. Two `GameStore`s in one test, sharing a fake log, playing a full game.
   Still no network.
3. **The five endpoints + Upstash.** Swap the fake for the real port.
4. **Lobby UI, waiting states, seat ownership for `settle` and CPU seats.**
5. **Adaptive polling and the room ceiling.** Only once you have watched a real
   game and know what the intervals should be.

Steps 1 and 2 are where the risk lives and neither needs a deployment. That is
the point.

---

## 7. What I would not build

**Server-side rule validation.** The server appends opaque blobs. Making it
validate commands means importing the domain into a serverless function,
building the board on every append, and doubling the compute budget — to catch a
class of problem that only a friend deliberately tampering with the client could
cause. The state hash (§2.4) already detects it, after the fact, for free.

**Accounts, auth, sessions.** A room code and a `localStorage` UUID. Anyone with
the code can join; that is what "share the code" means.

**Spectators, chat, reconnect grace timers, an AFK kick, replays as a feature,
rooms that outlive a session.** All of these are real features and none of them
is this feature. The group chat you shared the room code in is already the chat.

**Presence heartbeats in v1.** §1.3 — it roughly doubles the request budget to
answer a question ("is Rin still there?") that the group chat answers better.

**Long-polling, until measured.** §4.4.

### The cheating question

The honest answer is close to "do nothing", and there is a specific reason
rather than just a shrug.

**There is no hidden information in this game.** Money, career, house, stocks,
insurance, position — every one of them is rendered in `PlayerPanel` for every
seat, for everybody, right now. The entire category of "cheating by seeing what
you should not see" does not exist here. That is unusual and it makes this a
much easier problem than it would be in a card game.

What remains is a short list:

1. **Acting out of turn, or forging another seat's command.** The only cheat
   with any teeth, and it costs one line on the server: reject an append whose
   `clientId` does not hold the seat named by `by`, and whose `by` is not the
   seat whose turn it is. Build this — not because you expect friends to try it,
   but because it also catches a genuine class of client bug (two tabs open on
   the same phone) that would otherwise present as an unexplainable desync.

2. **Reading the seed to predict spins.** Every client needs the seed to compute
   state, so it cannot be hidden. A determined friend can open devtools, read
   the seed, and precompute their next few spins. The fix, if it ever mattered,
   is to have the *server* roll and store the value in the command envelope
   (`{type:'spin', value:7}`), which removes the need for a shared seed for that
   draw. It is not free — it means threading a value into `spin` rather than
   pulling from `RandomPort`, i.e. a domain change — and it only closes one of
   the twelve draw sites unless you do all of them.

   **I would not build it.** Anyone who reverse-engineers the seed to nudge a
   spin in a game of LIFE JOURNEY against their friends has already got what
   they wanted out of the evening, and it was not winning.

3. **Tampering with the client to produce an illegal state.** Detected by the
   hash, at which point everyone sees a desync banner and the game stops. That
   is a sufficient response. Do not build recovery-from-tampering; build
   recovery-from-desync, which is the same button, and which you need anyway for
   honest bugs.

So: **one seat-ownership check on the server, the state hash you were building
regardless, and nothing else.** These are friends playing a board game. Spending
a week on anti-cheat would be spending it on the wrong thing, and worse, it
would be spending it on making the game feel like it does not trust the people
playing it.

---

## Sources

- [Vercel — Limits](https://vercel.com/docs/limits) (Hobby quotas, function
  duration, Global Config write limits, Blob rate limits), checked 2026-08-13
- [Vercel — Hobby Plan](https://vercel.com/docs/plans/hobby) (non-commercial
  scope, single developer)
- [Upstash — Redis pricing and limits](https://upstash.com/docs/redis/overall/pricing)
  (256 MB, 500,000 commands/month free tier)
- Payload sizes measured directly from `public/dev/early.json`,
  `public/dev/late.json` and `public/dev/spread.json` in this repository
