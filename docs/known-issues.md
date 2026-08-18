# Known issues

Not bugs in the shipped game — things found while investigating something
else, deliberately not chased further, recorded here so nobody rediscovers
them the hard way.

## Tightening the board's row spacing collides two tiles onto the same square

**Found:** 2026-08-19, while investigating owner feedback that the board map
shows too much open, tileless ground at a glance.

**Where:** `src/domain/board/createBoard.ts` — the serpentine layout engine
(`step`, `ensureRoom`, `layoutFork`, `computeLayout`) and the `ROW_STEP`
constant (currently `3`), which is the vertical distance the cursor drops
every time a row of tiles wraps.

**What happens:** Reducing `ROW_STEP` below `3` — tried as a scoped
experiment, `2`, applied only to the USA edition's standard-length board —
places two *different* spaces at the exact same `(x, y)` layout coordinate.
Reproduced identically across every difficulty and in a synthetic test-route
fixture unrelated to USA's actual content, so it is a property of the layout
algorithm itself, not of any one route's tile count or shape:

```
[standard/normal]   "ladder-raise" and "work-2" both at (5,3)
[standard/veryHard]  "ladder-transfer" and "work-payday-3" both at (12,3)
[standard/veryHard]  "ladder-black-ice" and "work-5" both at (11,3)
```

**Root cause:** `layoutFork` places a fork's two branches on `forkY - 1` and
`forkY + 1` — exactly one row above and below the fork tile — regardless of
what `rowStep` is. The ordinary switchback cursor (`step`) places its own
rows purely by counting `rowStep` down from wherever it last turned, with no
awareness of where any fork elsewhere in the route put its branches. Once
`rowStep` drops to 2 or less, an ordinary switchback row and an unrelated
fork's branch row can land on the same `y` — and, at whichever column the
fork happened to sit, the same `x` too — so the algorithm draws two Space
ids into a single map square. In-game this means overlapping tile art and an
ambiguous click target: one of the two spaces becomes effectively unreachable
by pointer.

**How it was caught:** the existing test suite, unmodified —
`createBoard.test.ts`'s "has no duplicate layout coordinates" and
`validateRoute.test.ts`'s "the usa edition has no route problems" /
"validates clean" all failed immediately against the `rowStep: 2` build. No
new test was needed to catch it; the coverage already existed and did its job.

**Current state:** reverted. `ROW_STEP` is `3` everywhere, exactly as it was
before this investigation — no code changed. The owner decided not to pursue
the underlying "the map shows too much open ground" feedback further for now
(2026-08-19).

**If this gets picked up again:** a real fix needs `layoutFork`/`ensureRoom`
to check the coordinate a branch row would land on against every row already
placed elsewhere in the route (not just the local left/right room-ahead
bookkeeping they do today), or some other way to reserve a fork's branch rows
so a tightened `rowStep` can never reuse them. Simply lowering the constant,
as tried here, is not safe at any value below `3` without that.
