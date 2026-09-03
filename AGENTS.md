# AGENTS.md

Operating notes for an AI coding agent (Claude Code or otherwise) working in
this repository. This file is about *how to work here* — process, discipline,
gotchas learned the hard way. What the game actually is and how it's built is
already documented elsewhere; read that first:

| Doc | Covers |
|---|---|
| `README.md` | Architecture diagram, layer table, running/testing commands |
| `docs/SPEC.md` | Frozen contracts, every `SpaceEffect` variant, board layout, final scoring |
| `docs/DESIGN.md` | Visual design language — read before touching any CSS |
| `docs/known-issues.md` | Investigated-but-not-fixed bugs, so nobody rediscovers them |
| `docs/WII-PARITY.md` | Feature-parity tracking against the reference game |
| `docs/JAPAN-EDITION.md`, `docs/REMOTE-PLAY.md` | Edition- and feature-specific design notes |

`docs/SPEC.md`'s final-scoring section still describes a flat
`LIFE_INSURANCE_PAYOUT` — the life policy now matures on a die
(`lifeInsuranceMaturity`, `src/domain/rules/scoring.ts`). Worth a fix next time
someone is in that doc; flagged here rather than silently patched so it isn't
lost.

---

## 1. This is a solo owner's repo, but not always a single writer

More than one agent session can have write access to this working tree at
once (a background/autonomous session with its own cron, a parallel Claude
Code session on another machine, subagents you yourself dispatched). Before
starting anything that touches many files:

- `git status` and `git log --oneline -10` first — don't assume the tree is
  where you last left it.
- If you find someone else's uncommitted work, don't discard it blindly
  (`git stash`/`git checkout --` on files you didn't touch) without
  understanding what it is first. A `git stash` performed mid-task in a
  shared tree is a real risk another session has genuinely taken here before;
  it worked out, but it should never be the default move.
- Never force-push. Never `git reset --hard` on a shared branch without
  first checking `git log <branch>..<other-branch>` for what you'd be
  discarding.
- Prefer fast-forward merges into `main` (`git merge --ff-only`). If it
  refuses, that means `main` has moved — go find out what, don't force it
  through.
- Work on a branch, not directly on `main`, for anything beyond a one-line
  fix. `session-batch-checkpoint` has been used as a running integration
  branch across long sessions; reuse the pattern (a branch per session or
  per batch of related work) rather than inventing a new one each time
  unless the work is genuinely unrelated.

## 2. Before you touch anything

- Read `docs/SPEC.md`'s "Frozen contracts — read, never edit" list. If one
  of those files genuinely blocks a change, stop and say so rather than
  editing it — other work may be compiling against it unchanged.
- `src/test/architecture.test.ts` enforces the import-direction table in
  `README.md`/`SPEC.md` mechanically. If application code needs logic that
  currently lives under `presentation/components/`, the fix is to move the
  pure logic down into `domain/rules/` (this has happened repeatedly —
  `rankPlayers` → `domain/rules/standing.ts`, `CAREER_FAMILY` →
  `domain/rules/careerFamily.ts`) and re-export from the component if the
  component still needs the name, not to add an import that crosses the
  boundary.
- `tsconfig`'s `exactOptionalPropertyTypes: true` means you cannot assign a
  possibly-`undefined` value to an optional field directly. Use a
  conditional spread instead:
  ```ts
  { ...base, ...(value === undefined ? {} : { field: value }) }
  ```
  This pattern recurs constantly when adding any new optional field to a
  domain type.

## 3. The verification bar

Nothing here is "done" on the strength of the diff looking right. Before
calling any change finished:

```bash
npm run typecheck
npm test -- --run
npx oxlint
```

If the change touches economy numbers, odds, board layout, or anything else
`src/test/gameBalance.test.ts` or an edition's own `balance.test.ts` might
care about, run it explicitly too:

```bash
npx vitest run src/test/gameBalance.test.ts
```

**"It's just load" was wrong, and cost this repo a lot of time.** For a
long stretch the note here said transient `waitFor` timeouts in the
presentation suites were a machine-load fact of life, to be confirmed by
rerunning the file alone. Six parallel agent sessions each hit it, each
independently stashed and re-ran against baseline to decide "flake or
regression", and the result was that nobody could show a green full suite
at all — the exact conditions a real regression hides in. Issue #45 went
and measured it instead, and it was not load: it was two things the tests
were doing to themselves, both now fixed.

1. `waitFor` re-runs its callback on *every DOM mutation* as well as on
   its interval, an animating frame is a DOM mutation, and Testing
   Library's default `getElementError` pretty-prints the whole container
   into an error message on every failed `getBy*`. This document is a
   ~5,500-node SVG board, so one poll cost **635 ms** and the two worst
   tests spent 12.7 s of a 15.4 s run building error text nobody reads.
   `src/test/setup.ts` now suppresses the dump for polling errors only —
   real failures still print the DOM.
2. Every pacing beat ran at its authored, human length. `TEMPO`
   (`src/presentation/tempo.ts`) now divides them by four under `vitest`,
   and `paced()` does the same for `CPU_THINK_MS` at its call site. The
   beats still happen asynchronously in the same order — which is what
   the tests actually assert — they just cost a quarter of the frames.

So: **a `waitFor` timeout is a bug until proven otherwise.** Rerunning in
isolation is still the right first move, but if a presentation test is
sitting anywhere near its budget, find out where the seconds are going
before blaming the machine. `--reporter=verbose` prints a per-test
duration; a presentation test over ~3 s on an idle machine is worth
opening up. What load genuinely does is turn a thin margin red, so the
answer is margin, not a bigger timeout.

Two things to know before touching the pacing: `TEMPO` is built by
mapping over `AUTHORED`, so a beat added to that table is scaled for free
and one added anywhere else is not; and the test clock is deliberately a
quarter rather than zero, because several tests press the die and assert
in the next statement that the result is not on screen yet. Collapsing
motion entirely — `prefers-reduced-motion`, `MotionGlobalConfig`, a scale
of 0 — makes those assertions pass by no longer checking anything.

## 4. Measure, don't guess

Nearly every balance/economy decision in this repo's history was made by
running many seeded playthroughs and reading off an actual measured rate,
not by eyeballing a number and hoping. Examples worth knowing about before
touching anything economy-shaped: marriage odds were tuned by measuring the
actual refusal rate across the two-spin proposal system; insurance premiums
were retuned after measuring that the old numbers left a buyer worse off in
94.9% of games (home) — i.e. it wasn't a decision, it was a trap dressed as
one; career-change frequency, hazard-landing odds, and fork win rates have
all been measured the same way before being touched.

`gameBalance.test.ts` and each edition's `balance.test.ts` are the harness
for this — extend them rather than reasoning from constants alone when a
change could plausibly shift a rate.

**Read `src/application/testing/fakes.ts` alongside
`src/infrastructure/random/*.ts` before trusting any measurement.** There
are two independent implementations of `RandomPort` — the real adapters and
a second, separate fake RNG the balance tests actually drive the store
through. They have drifted out of sync before (one bounded rolls `1–10`
after the other had already moved to `1–6`), and the result was not a test
failure — it was a fully green suite producing balance measurements that
were completely fictional. If a measurement moves in a direction you can't
explain mechanically from the change you made, suspect the fakes before you
suspect the economy.

## 5. The die-arming contract

Any roll a human is meant to watch must show the die *before* the result is
known — `dieSettled=false` / `activeSpin='event'` armed before dispatch, so
`EventSpinModal`/`Dice` mounts and animates before the card reveals what it
rolled. This has been a real, twice-reported bug class: a decision with a
second option (not just "press to spin") can bypass this arming entirely if
its `onChoose` dispatches straight through. The current answer is
`DecisionOption.turnsTheDie?: boolean` — every option that reaches for
`random.spin()` or `random.int()` must be marked, and the calling UI must
park the choice (not dispatch it) until the die itself has been pressed.
Grep for `turnsTheDie` before adding a new decision kind that involves any
randomness, and check both halves: the option is marked, *and* whatever
resolves it stamps both `lastEvent.rolled` and `lastSpin` (a roll with the
first but not the second hangs the die with nothing to land on — the other
half of the same bug class, found in `resolveRetireEarly`).

## 6. Visual verification in a real browser

`jsdom` (what the test suite runs under) does no real layout —
`getBoundingClientRect` returns zero there, so any claim about actual pixel
positions, camera framing, or visual overlap needs a real browser. This
machine had no Google Chrome and no working `claude-in-chrome` connection,
so verification here used headless Brave driven directly over the Chrome
DevTools Protocol with Node's built-in `WebSocket`/`fetch` — no Puppeteer or
Playwright dependency needed for a quick check. **Re-verify what's actually
available on a new machine** rather than assuming this exact recipe still
applies; if `claude-in-chrome` is connected there, prefer it.

If reproducing the CDP approach: launch the browser as its own backgrounded
process first (`--headless=new --remote-debugging-port=<port>
--user-data-dir=$(mktemp -d) --hide-scrollbars`), then connect to it from a
*separate* script — launching and connecting in one script was unreliable
here. `Emulation.setDeviceMetricsOverride` for an exact viewport (window
size alone loses real pixels to browser chrome even headless).

For reproducing a specific mid-game state deterministically: the game's
autosave (`localStorage['life-journey:save:0']`) is only written on
`endTurn`/`scoreRoll`, not on a bare `spin` — inject or patch it *after*
completing at least one full turn, then reload, rather than expecting a
save to exist immediately.

Camera/board-framing work specifically needs a band of viewport widths
checked, not just phone-narrow and desktop-wide — this board's tall viewBox
has a corner-pinned-frame regime around 600–1000px-wide-by-800px-tall
windows where the usual "zoom in to fix crowding" intuition inverts (zooming
in slides the visible centre *toward* the pinned corner, not away from it).
Screenshot the actual band, not just the extremes, when touching
`src/presentation/components/Board/camera.ts`.

## 7. Commit and PR style

This repo's commit messages are long-form: a short, specific, present-tense
title, then a structured body — what was reported (quote the actual user
report if there was one), root cause, the fix and why it's shaped that way,
and a verification summary naming the actual numbers (test count, pass/fail,
what was visually confirmed and how). Skim `git log` for real examples
before writing one; terse one-liners are the outlier here, not the norm.
Every commit and PR closes with:

```
Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: <this session's URL>
```

When a batch of unrelated work has accumulated uncommitted, split it into
commits by actual concern rather than one undifferentiated dump — but check
first whether the concerns are genuinely separable in the working tree
(a later change layered on an earlier one's new types/functions in the same
file often isn't cleanly splittable without hand-patching hunks; don't force
it if it isn't).

## 8. Deploying

- `npm run deploy:preview` — Vercel preview build, safe to run anytime.
- `npm run deploy` — Vercel production. Outward-facing; confirm before
  running unless already asked to.
- GitHub Pages deploys automatically via `.github/workflows/deploy-pages.yml`
  on push to `main`.

## 9. Runtime files that must never be committed

`.claude/scheduled_tasks.lock` (and anything matching it) is a live
session's own pid/lock file, not source — it's gitignored. If a future tool
or session writes a similar runtime artifact under `.claude/`, gitignore it
rather than letting it get swept into a commit by an `add -A`.
