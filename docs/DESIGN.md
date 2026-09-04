# LIFE JOURNEY — visual design contract

Four designers work on this interface in parallel. This document is what keeps
their work looking like one product. Read it before touching any CSS.

The user's verdict on the previous iteration was that it was **too plain** —
flat pastel rectangles, no material, no depth. It read as a competent wireframe
rather than a manufactured object. The bar is Nintendo first-party polish.

---

## 1. The core idea

**A real board game, photographed from above, on a table in a warm room.**

Every surface should answer "what is this made of?" — pressed card, moulded
plastic, printed paper. Nothing is a rectangle with a fill.

Quiet, though. An earlier pass read as tacky because everything competed:
glowing borders on every panel, loud colour spread evenly, and type at one
weight throughout. The map and the pawns are the loudest things on screen;
the surround is matte paper on linen and stays out of the way. Colour is
rationed to meaning — whose turn it is, which way money moved, what is a
milestone — and taken from the map's own pigments: leaf green for actions,
road amber for highlights, roof red for costs, sea blue for focus.

Three material families, used consistently:

| Family | Where | Reads as |
| --- | --- | --- |
| **Board stock** | the play surface, tiles | thick printed card with an embossed lip |
| **Moulded plastic** | pawns, the wheel, buttons | glossy, domed, with a specular highlight and a darker lip beneath |
| **Paper** | panels, log, modals | matte card stock, softly shadowed, slightly warm |

## 2. Depth is mandatory

Every raised element gets **three** layers, not one shadow:

1. a **contact shadow** — tight, dark, directly beneath (grounds the object)
2. an **ambient shadow** — wide, soft, low opacity (places it in the room)
3. an **inner top highlight** — `inset 0 1px 0` in a lighter tone (gives it a lit top face)

Interactive controls additionally carry a **lip**: a solid darker band below the
face via `box-shadow`, which collapses on `:active` so the control physically
steps down. This already exists on `ChunkyButton` — it is the reference.

Surfaces are **never** a flat colour. Use a gradient from a lighter top to a
slightly deeper bottom, even when the difference is only a few percent.

## 3. Tokens

`src/index.css` owns all tokens. Designers of components **consume** them and
must not redefine palette values locally. The existing token names stay valid —
`--canvas`, `--surface`, `--ink`, `--candy-*`, `--player-*`, `--tone-*`,
`--radius-*`, `--shadow-*`, `--duration-*`, `--ease-*`, `--z-*`.

The foundation designer will enrich their values and add these, which everyone
else may rely on:

```
--elev-1 / --elev-2 / --elev-3      composite three-layer shadows
--lip-sm / --lip-md                 solid lip offsets for pressable controls
--sheen                             legacy: kept defined but near-invisible
--surface-grad                      the standard top-lit surface gradient
--texture-paper                     a repeating background for paper surfaces
--texture-felt                      a repeating background for the play surface
--font-display                      the wordmark / headline stack
--tabular                           font-variant-numeric for money
```

**There is one scheme: daylight.** The dark theme has been removed, and
`color-scheme: light` is authoritative — a player browsing in OS dark mode sees
the same sunny table as everyone else. Do not reintroduce a
`prefers-color-scheme: dark` block without redesigning the map to match it.

The reason is worth keeping: the board is a sunny daylight map, and the dark
theme wrapped it in indigo panels with neon outlines, so a cheerful daytime map
floated inside a glowing dashboard. The two never belonged to the same world,
and polishing the surround could not fix it. Everything on screen must look
like it sits on the same table, in the same light, as that map.

## 4. Typography

The previous version put everything at the same visual weight. Fix that.

- **Display** (wordmark, results headline): heavy, tight tracking, large.
- **Money**: the loudest thing in any panel. Big, `--tabular`, high contrast.
- **Labels** (PLAYERS, TURN, LOG): small, uppercase, wide letter-spacing, faint.
- **Body**: comfortable, never below 14px.

No external font CDN — the app is offline-first. Use the system rounded stack
already in `--font-rounded`.

## 5. Motion

- Springs with overshoot, not linear fades. `--spring-bouncy` exists.
- Stage entrances: children appear in sequence, not all at once.
- Big moments land with weight — scale punch, a flash, a settle.
- Everything must be neutralised under `prefers-reduced-motion: reduce`, which
  `usePrefersReducedMotion()` already reports.

## 6. Non-negotiables

- **English only.** No Japanese strings anywhere in the UI.
- **No new dependencies.** React 19 and `framer-motion` only.
- **No external assets.** No CDN fonts, no image files — everything is CSS,
  SVG, or emoji.
- The presentation layer never imports from `src/infrastructure` and never
  constructs a store or an audio adapter. `src/test/architecture.test.ts`
  enforces this.
- TypeScript is strict, including `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes`.
- Keyboard operable with a visible focus ring; `aria-live` regions preserved.
- **Every screen names one primary action** and puts focus on it, and Space
  *and* Enter both press it from anywhere on the page — the wheel, Continue,
  the choice under the cursor. `usePrimaryAction` is the whole of that
  contract; nothing should grow a second keyboard path to the same button.
  The focus ring is 4px of sea blue with a 3px stand-off (`:focus-visible`
  in `index.css`) because that ring is now the game's cursor, not a courtesy.
- Works from 360 px phones to wide desktops.

## 7. Board coordinates

`createBoard()` lays the route out as a clean serpentine in **abstract units**
(the board is ~23 × 9 units). `createProjection()` in
`src/presentation/components/Board/boardLayout.ts` is the only place that turns
those into viewBox pixels. Trunk rows snake left/right; each fork runs as two
parallel lanes one unit above and below its trunk row, rejoining one column
past the longer lane. The longest connector on the board is a row drop of 3
units. Do not re-derive coordinates in the view.
