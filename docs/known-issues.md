# Known issues

Not bugs in the shipped game — things found while investigating something
else, deliberately not chased further, recorded here so nobody rediscovers
them the hard way.

---

## Mouse-wheel scrolling "not working in places" (issue #36)

Not reproduced on the title screen; explained on the board screen.

**Reported** in the playtest report "任天堂UI改善リスト", under the title-screen
section, on v1.15.0-26 in Chrome desktop at 1316×921:

> マウスホイールでのスクロールが効かない場面があった（bodyの `overflow` 設定）

The parenthesis is the reporter's own guess at a cause, not an observation,
and two agents have now failed to reproduce a title-screen wheel failure from
the CSS. Recording what was actually checked so a third does not start over:

- `body { overflow-x: hidden }` (`src/index.css`) does **not** trap the wheel.
  With `html`'s overflow left `visible`, the body's overflow propagates to the
  viewport, and a viewport with one axis `hidden` computes the other to `auto`
  — which is exactly the ordinary, scrollable "no horizontal scrollbar"
  pattern. The body box itself computes back to `visible` and is not a scroll
  container at all.
- `.screen { overflow-x: clip }` (`TitleScreen.module.css`) does not either,
  and was chosen for precisely that reason — `clip` is the one overflow value
  that is compatible with `visible` on the other axis, so unlike `hidden` it
  never forces `overflow-y: auto` and never turns the element into a scroll
  container. The comment in that rule says so.
- Nothing on the title screen's route — the title itself, the handbook, the
  hall, the release notes — registers a `wheel` listener, sets `touch-action`,
  or positions anything `fixed`. The only `wheel` handler in the codebase is
  the board's zoom (`Board.tsx`), which is on the SVG, is not on this route,
  and explicitly stands down where the page can still scroll.

**What genuinely does refuse a wheel**, and is the best candidate for the
"場面があった" ("there were places") wording: `App.module.css`'s `.shell` is
`height: 100dvh; overflow: hidden` at `≥1000px × ≥600px` *and* at `≤999px` —
i.e. the in-game screen, at the reporter's own 1316×921. That is deliberate
(the comment in the file argues it: a phone game screen should scroll, never
the page around it), it has been there since the initial commit, and it means
that on the board screen the page does not scroll and the wheel does nothing
above the board. It is a design decision, not the `body` rule the report
guessed at.

**Not chased further** because the title screen it was filed against no longer
scrolls in the first place: #36 replaced the one long setup form with a flow
of single-decision screens, each of which fits a normal window. That makes the
title-screen half of the report moot rather than fixed, which is a different
claim and is why it is written down here instead of in a commit message.

Anyone picking this up needs a real browser — `jsdom` runs no layout and no
scrolling, so nothing in the test suite can either confirm or deny it. See
`AGENTS.md` §6 for the CDP recipe used on this box.

---

The other entry this file used to carry — tightening the board's row spacing
(`ROW_STEP < 3`) colliding two tiles onto one coordinate — was fixed rather
than merely investigated; see the fix in `src/domain/board/createBoard.ts`
(`LayoutState`, `freeRowY`, `freeBranchY`) and its regression coverage in
`createBoard.test.ts`, closed via GitHub issue #5.
