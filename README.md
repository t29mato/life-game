# LIFE JOURNEY 🎲

A browser board game about spinning your way through a whole life — college or a
first job, careers and paydays, marriage, kids, a house, shares and insurance, a
few gambles, and a retirement you hope you can afford.

Play with 2–4 people around one screen, against the computer, or a mix of both.
Pick a short, standard or long board depending on how much of an evening you
have.

Built with React 19 + TypeScript + Vite, under a strict clean architecture, with
the domain and application layers developed test-first.

> **On the original.** This project was inspired by the life-path board game
> genre. Everything in it — the board, the careers, the events, the artwork, the
> music — is original work written for this repository. No Takara Tomy
> trademarks, board layout, or assets are reproduced.

---

## Running it

```bash
npm install
```

```bash
npm run dev
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check then production build |
| `npm run preview` | Serve the production build |
| `npm test` | Run the whole test suite once |
| `npm run test:watch` | Watch mode |
| `npm run test:ui` | Vitest's browser UI |
| `npm run coverage` | Coverage for the domain, application, and infrastructure layers |
| `npm run typecheck` | `tsc` with no emit |
| `npm run lint` | oxlint |

---

## Architecture

Dependencies point inward. Nothing in an inner ring knows an outer ring exists.

```
┌─────────────────────────────────────────────────────────┐
│  presentation/        React components, animation, CSS  │
│    ▼ dispatches commands, reads state                   │
├─────────────────────────────────────────────────────────┤
│  application/         use cases, GameStore, ports       │
│    ▼ pure state transitions                             │
├─────────────────────────────────────────────────────────┤
│  domain/              board, catalogs, rules, model     │
│                       no dependencies at all            │
└─────────────────────────────────────────────────────────┘
        ▲
        │ implements the application's ports
┌─────────────────────────────────────────────────────────┐
│  infrastructure/      Web Audio, localStorage, RNG      │
└─────────────────────────────────────────────────────────┘
```

`src/main.tsx` is the composition root: the single place where a real random
source, a real repository, and a real audio adapter are constructed and injected.
Swap any of them and the game still runs — which is exactly how the tests drive a
complete playthrough with a seeded PRNG and no browser.

### The layers

| Path | Contains | Depends on |
|---|---|---|
| `src/domain/model` | Types and balance constants. The frozen contract. | nothing |
| `src/domain/catalog` | Careers, houses, life tiles, stocks. | model |
| `src/domain/board` | Board construction and movement planning. | model |
| `src/domain/rules` | Pure player transformations and final scoring. | model |
| `src/application/ports` | `RandomPort`, `GameRepositoryPort`, `StatsRepositoryPort`, `AudioPort`. | domain |
| `src/application/usecases` | `startGame`, `spin`, `settle`, `choose`, `endTurn`, `applyEffect`. | domain, ports |
| `src/application/cpu` | `decideCpuCommand` — the computer opponent, pure and deterministic. | domain, GameStore |
| `src/application/createGameStore.ts` | Observable store the UI subscribes to. | usecases |
| `src/infrastructure` | Adapters implementing the ports. | domain, ports |
| `src/presentation` | Components, hooks, formatting, CSS. | domain types, application |

### Rules the code holds itself to

- The domain and application layers run in plain Node. No `window`, no
  `document`, no `localStorage`, no `Math.random`, no `Date.now`.
- All non-determinism goes through `RandomPort`, so any game is reproducible from
  a seed.
- Every state transition is a pure function returning new immutable objects.
- The presentation layer never constructs an adapter and never mutates state; it
  dispatches a `GameCommand` and re-renders.

---

## Test-driven development

The inner layers were written test-first, and they are where the coverage lives —
they hold every rule in the game, and they are pure, so there is no excuse for a
gap.

```bash
npm test
```

- **Domain** — catalogue integrity, board connectivity (every space reachable from
  the start, retirement reachable from every space, forks reconverge), movement
  planning against hand-built fixture boards, the auto-loan cascade, the scoring
  formula.
- **Application** — every use case's valid transitions and invalid-phase
  rejections, every `SpaceEffect` variant, store subscribe/notify semantics, the
  computer opponent's scoring across every decision kind, and a **full seeded
  playthrough** that drives a three-player game to `gameOver` and asserts the
  standings.
- **Infrastructure** — seeded PRNG reproducibility, per-slot save/load round-trips
  including corrupt, foreign and version-mismatched payloads, the capped records
  history, and the Web Audio adapter against a hand-written fake `AudioContext`.
- **Whole system** (`src/test/gameBalance.test.ts`) — hundreds of complete games
  across seeds, player counts and all three board lengths, asserting the
  properties that only emerge from everything running together: every game
  terminates, an all-computer table finishes unaided, the economy stays in a
  playable band, and the lead genuinely changes hands rather than the board being
  decided at the two-thirds mark.
- **Presentation** — behavioural tests with Testing Library: the right thing
  renders for a given state, and the right command is dispatched on interaction.

---

## The game

Spin 1–10 and move. First decision of the game: **College Lane** costs tuition and
delays you, but unlocks the graduate careers; **Straight to Work** gets you
earning immediately.

Passing a payday pays your salary. Landing on one pays it too — but never both.
Along the way: marriage (everyone else chips in for a gift), children, a house you
buy at a price and sell at retirement for whatever the market gives you, pay
raises, and a fork between a **Risky Road** of big swings and a **Safe Street** of
small steady gains.

**Shares** can be bought along the way and cash out at retirement somewhere inside
each company's range — the safe ones nearly always pay, the exciting ones might
not. **Policies** are the other half of that bet: home cover means a house fire
costs you nothing, auto cover does the same for a prang, and life cover pays out
at the end. **Careers churn** too — a layoff can leave you earning nothing until
you are hired again, and a headhunter can drag you somewhere better.

The last third of the board is where games are won: the biggest swings, the space
that swaps your cash with whoever is leading, and the one that takes a life tile
straight off the biggest collection. Being ahead at the two-thirds mark is not the
same as winning.

If a payment would put you underwater you automatically take a $20,000 loan, and
each one costs you $25,000 at the end — though the bank will let you clear one
early for less. Reach retirement and your final score is cash, plus life tiles,
plus your house's resale, plus your shares, plus life insurance, plus $10,000 a
child, plus a retirement-order bonus, minus your loans.

### Playing with the computer

Any seat can be handed to the computer, so the game works solo. A computer seat
scores the options it is offered — salary against raise step, a house against what
it can afford, a share against its range, a lane against its own position — and
takes its turn on a visible delay, spinning the same wheel you do.

### Around one screen

With two or more people on one device, a pass-the-device card appears between
turns so nobody misses that they are up. A standings strip stays on screen the
whole game, and it animates when the order changes — an overtake is the moment
worth noticing. Four save slots (one a rolling autosave) and a hall of records
that keeps score across an evening.

---

## Audio

Every note is generated at runtime through the Web Audio API — there are no audio
files in this repository. `src/infrastructure/audio/theory.ts` holds the three
original loops (`title`, `board`, `results`) as plain data, which makes the
musical content unit-testable, and `WebAudioAdapter` schedules them ahead on the
audio clock so the loop never drifts. Sound effects are built from oscillators and
noise bursts with real envelopes.

Music and effects toggle independently and the preference persists. Nothing plays
before your first click — browsers require a gesture, and the title screen's first
interaction is what unlocks the audio context.
