/**
 * The player-facing changelog. Newest release first. Written for a player —
 * "the computer opponent now takes different routes", never a mechanism name
 * or file path — grouped into what's new, what changed, and what got fixed
 * so a player can scan for the bit they care about.
 *
 * The current release's version label is `__APP_VERSION__` itself (injected
 * from `package.json` by Vite, see `vite.config.ts`), so the headline entry
 * can never drift from the build actually running.
 */

export interface ReleaseNote {
  readonly version: string
  readonly date: string
  readonly whatsNew: readonly string[]
  readonly changes: readonly string[]
  readonly fixes: readonly string[]
}

export const RELEASE_NOTES: readonly ReleaseNote[] = [
  {
    version: __APP_VERSION__,
    date: 'August 12, 2026',
    whatsNew: [
      'Play against the computer — any seat can be a person or the computer, so the game works solo.',
      'Three session lengths (Short, Standard, Long) and three difficulties (Normal, Hard, Very Hard). On Very Hard, finishing in the black at all is close to a coin flip.',
      'Shares, insurance policies, and a bank: buy shares that pay out at retirement, insure against a house fire or a prang, and borrow — or clear a loan early.',
      'Careers can change mid-life. A layoff can leave you earning nothing until you are hired again, and a headhunter can drag you somewhere better.',
      'Two upsets wait late on the board: one swaps your cash with whoever is leading, the other takes a life tile off whoever has collected the most.',
      'Cars carry passengers now — marriage and children are visible on the board, not just in a stats panel.',
      'Pass-the-device turn cards, a standings strip, four save slots with autosave, and a hall of records across every game this table has played.',
    ],
    changes: [
      'Roads are now chosen before you spin, so you cannot pick the lane that happens to suit your number.',
    ],
    fixes: [
      'Graduation and the first baby can no longer be skipped past — paying tuition and never actually graduating was possible before.',
      'House resale and share payouts now land on round numbers.',
      'Money totals no longer come up a dollar short.',
      "A computer opponent's turn now waits for you to press Continue instead of racing ahead.",
    ],
  },
]
