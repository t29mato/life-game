import { expect, test, type Page } from '@playwright/test'

/**
 * v1.3.0 shipped a real regression that no test in the suite caught: on a
 * phone-width viewport, `.boardArea > *` (the board) rendered far taller than
 * the grid cell it was given — up to 3x the viewport height — and, because
 * `.boardArea` sets no `overflow`, the overflow was never clipped. It just
 * drew straight through the spinner and the player panels below it. Every
 * component test used jsdom, which never runs a layout engine and so never
 * had a chance to notice a box was the wrong size. Root cause: a stale
 * `@media (max-width: 720px) { .svg { min-width: 700px } }` rule in
 * `Board.module.css`, left over from an older "pan instead of shrink" design
 * that predates (and fights with) the container-query shrink-to-fit system
 * `App.module.css` uses today.
 *
 * These tests exist to make that class of bug fail CI instead of a player's
 * phone: real Chromium, real layout, asserting the board's own box stays
 * inside its cell and never overlaps its siblings, at every viewport this
 * project's own screenshots have used at some point.
 */

/**
 * The title is a flow rather than one long form since #36: the lid offers
 * Continue and New Game, and the new game asks players → country →
 * difficulty, one screen at a time. So this walks it — and walking it is
 * itself worth something here, since it means a broken step shows up as a
 * failure in the layout suite too.
 */
async function startGame(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'New Game' }).click()
  const cpuToggles = page.getByRole('button', { name: 'CPU', exact: true })
  const count = await cpuToggles.count()
  for (let i = 0; i < count; i += 1) await cpuToggles.nth(i).click()
  await page.getByRole('button', { name: /next: the country/i }).click()
  await page.getByRole('button', { name: /^Japan edition\./i }).click()
  await page.getByRole('button', { name: /next: the difficulty/i }).click()
  await page.getByRole('button', { name: /start game/i }).click()
  const ready = page.getByRole('button', { name: /i'm ready/i })
  if (await ready.isVisible().catch(() => false)) await ready.click()
  // `/^roll/` rather than an exact name: the die's accessible name carries the
  // previous result once there is one ("Roll — last roll 4"), and reads
  // "Rolling…" mid-throw. It was `/^spin$/` until the vocabulary was unified on
  // die/roll, which is what had this whole suite failing in CI — the one place
  // that runs it — while every local run skipped it for want of a browser.
  await expect(page.getByRole('button', { name: /^roll/i })).toBeVisible()
}

/** True if `a` and `b` share any pixels. Touching edges (area 0) do not count as an overlap. */
function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  const xOverlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
  const yOverlap = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  return xOverlap > 0 && yOverlap > 0
}

test.describe('board layout never overlaps the rest of the table', () => {
  test('the board does not overlap the player panels', async ({ page }) => {
    await startGame(page)

    // The rendered card (`.frame`, drawn by `Board`), not just the grid cell
    // it sits in — a `.boardArea` cell is sized correctly by CSS Grid no
    // matter what its child does, so comparing cells alone would miss a child
    // that visually overflows its own box. This is the check that actually
    // caught v1.3.0's regression; the cell-containment test below explains why.
    const board = page.getByRole('region', { name: 'Game board' })
    const frame = board.locator(':scope > div').first()
    // Was a `complementary` landmark called "Spinner and players" holding both
    // the wheel and the seats. The wheel became a die in a tray on the board's
    // own card, and what is left beside the board is the seats — now a button
    // that opens the full status. Same question as before, asked of what the
    // layout actually has: the drawing must not reach into the panel.
    const rail = page.getByRole('button', { name: 'Players — open full status' })
    await expect(frame).toBeVisible()
    await expect(rail).toBeVisible()

    const frameBox = await frame.boundingBox()
    const railBox = await rail.boundingBox()
    expect(frameBox).not.toBeNull()
    expect(railBox).not.toBeNull()
    expect(rectsOverlap(frameBox!, railBox!)).toBe(false)
  })

  test('the board stays inside its own allocated cell — it does not render taller than the room it was given', async ({
    page,
  }) => {
    await startGame(page)

    const boardArea = page.getByRole('region', { name: 'Game board' })
    const boardAreaBox = await boardArea.boundingBox()
    expect(boardAreaBox).not.toBeNull()

    // `.frame` is the board's own drawn card, inside `.boardArea`'s cell.
    const frame = boardArea.locator(':scope > div').first()
    const frameBox = await frame.boundingBox()
    expect(frameBox).not.toBeNull()

    // A few pixels of shadow/rounding slack, not a licence for the drawing to
    // spill into a neighbouring section.
    const slack = 4
    expect(frameBox!.height).toBeLessThanOrEqual(boardAreaBox!.height + slack)
    expect(frameBox!.y).toBeGreaterThanOrEqual(boardAreaBox!.y - slack)
  })

  /**
   * The same contract, with the player's own zoom wound all the way in.
   *
   * Zoom is applied as a transform on a group *inside* the `<svg>`'s fixed
   * viewBox — never by growing the drawing's own box — precisely so that the
   * class of bug this file exists for cannot come back through it: an SVG
   * clips to its viewport, so a scaled-up group has nowhere to spill to. That
   * is the claim, and jsdom cannot check it (no layout engine, every
   * `getBoundingClientRect` a zero). This is where it gets checked for real.
   *
   * Pressed to the limit rather than once: a containment bug that only
   * appears past some zoom level is exactly the kind that ships.
   */
  test('the board stays inside its cell and clear of the rail when the player zooms all the way in', async ({
    page,
  }) => {
    await startGame(page)

    const boardArea = page.getByRole('region', { name: 'Game board' })
    const frame = boardArea.locator(':scope > div').first()
    const rail = page.getByRole('button', { name: 'Players — open full status' })
    const zoomIn = page.getByRole('button', { name: 'Zoom in' })
    await expect(zoomIn).toBeVisible()

    // Pressed until the key itself says there is nothing further in — the
    // range is bounded (see `USER_ZOOM_MAX`), so this terminates.
    //
    // `force` because `startGame` sits every seat down as a computer, so the
    // table plays itself and never stops: a car is always mid-hop, the camera
    // is always easing after it, and the key rides the board's own card. An
    // ordinary click waits for the element to hold still between two frames,
    // which in a game that is always animating is a condition that can never
    // arrive — this test timed out 54 stability checks deep on every phone
    // profile until it was written this way. Visibility and enabled-ness are
    // still asserted, on the line above and the line below; what is skipped is
    // only the wait for a stillness this screen does not have.
    for (let press = 0; press < 12 && (await zoomIn.isEnabled()); press += 1) {
      await zoomIn.click({ force: true })
    }
    await expect(zoomIn).toBeDisabled()

    const boardAreaBox = await boardArea.boundingBox()
    const frameBox = await frame.boundingBox()
    const railBox = await rail.boundingBox()
    expect(boardAreaBox).not.toBeNull()
    expect(frameBox).not.toBeNull()
    expect(railBox).not.toBeNull()

    const slack = 4
    expect(frameBox!.height).toBeLessThanOrEqual(boardAreaBox!.height + slack)
    expect(frameBox!.width).toBeLessThanOrEqual(boardAreaBox!.width + slack)
    expect(frameBox!.y).toBeGreaterThanOrEqual(boardAreaBox!.y - slack)
    expect(rectsOverlap(frameBox!, railBox!)).toBe(false)

    // And the drawing inside the card, not just the card around it: the
    // group the zoom actually scales lives in here, and this is the box that
    // would have grown if the zoom had been spent on the drawing's own size.
    const drawing = frame.locator('svg').first()
    const drawingBox = await drawing.boundingBox()
    expect(drawingBox).not.toBeNull()
    expect(drawingBox!.height).toBeLessThanOrEqual(boardAreaBox!.height + slack)
    expect(drawingBox!.width).toBeLessThanOrEqual(boardAreaBox!.width + slack)

    // Back to fit, and the page is exactly the page it was — the reset key
    // is the promise that zoom is opt-in and reversible.
    await page.getByRole('button', { name: 'Reset zoom to fit' }).click({ force: true })
    const resetBox = await frame.boundingBox()
    expect(resetBox!.width).toBeCloseTo(frameBox!.width, 0)
    expect(resetBox!.height).toBeCloseTo(frameBox!.height, 0)
  })

  /**
   * The die moved out of the middle of the board and into its own tray in the
   * corner (issue #23), which makes it a new box inside the board's cell —
   * exactly the shape of thing this file exists to keep honest. It is
   * absolutely positioned inside the board's stage, so it cannot spill by
   * construction; this is where that claim gets checked against real layout
   * rather than against the CSS it was written in.
   */
  test('the die tray stays inside the board’s own cell and clear of the zoom rail', async ({ page }) => {
    await startGame(page)

    const boardArea = page.getByRole('region', { name: 'Game board' })
    const die = page.getByRole('button', { name: /^roll/i })
    const zoomIn = page.getByRole('button', { name: 'Zoom in' })
    await expect(die).toBeVisible()

    const boardAreaBox = await boardArea.boundingBox()
    const dieBox = await die.boundingBox()
    const zoomBox = await zoomIn.boundingBox()
    expect(boardAreaBox).not.toBeNull()
    expect(dieBox).not.toBeNull()
    expect(zoomBox).not.toBeNull()

    const slack = 4
    expect(dieBox!.y).toBeGreaterThanOrEqual(boardAreaBox!.y - slack)
    expect(dieBox!.y + dieBox!.height).toBeLessThanOrEqual(boardAreaBox!.y + boardAreaBox!.height + slack)
    expect(dieBox!.x).toBeGreaterThanOrEqual(boardAreaBox!.x - slack)
    expect(dieBox!.x + dieBox!.width).toBeLessThanOrEqual(boardAreaBox!.x + boardAreaBox!.width + slack)
    // Opposite corners, and that is the whole reason the tray is on the left.
    expect(rectsOverlap(dieBox!, zoomBox!)).toBe(false)
  })

  test('the whole page fits the viewport on a phone — no vertical scroll needed to see every section', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'desktop', 'the no-scroll contract is a phone-layout promise, not a desktop one')
    await startGame(page)

    const viewport = page.viewportSize()
    expect(viewport).not.toBeNull()
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
    expect(scrollHeight).toBeLessThanOrEqual(viewport!.height + 2)
  })
})
