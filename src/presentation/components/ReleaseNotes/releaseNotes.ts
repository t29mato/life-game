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
    date: 'August 18, 2026',
    whatsNew: [],
    changes: [
      'Added anonymous visit analytics on the main site, to help understand how the game gets played. No personal data, nothing that touches your saves or your game.',
    ],
    fixes: [],
  },
  {
    version: 'v1.3.2',
    date: 'August 18, 2026',
    whatsNew: [],
    changes: [
      "Cleared the floating STOP and PAYDAY labels off the board — every stop still gets its own red-striped band and every payday its own gold ring and sparkle, so the tile itself already says what it is. Fewer bubbles, same board, easier to read at a glance.",
    ],
    fixes: [],
  },
  {
    version: 'v1.3.1',
    date: 'August 18, 2026',
    whatsNew: [],
    changes: [],
    fixes: [
      "Fixed a bad one from the last release: on a phone, the board could render far taller than the space it was given and print straight through the spin wheel and the player cards below it, breaking the whole screen. It now always stays sized to fit above them, like it's meant to.",
    ],
  },
  {
    version: 'v1.3.0',
    date: 'August 17, 2026',
    whatsNew: [
      "Every country now looks and sounds like itself. The board's own map repaints toward that country's colours and rooftops — Japan's blossom pink and indigo tile roofs, France's lavender fields and slate mansards, India's marigold land and terracotta, Bolivia's altiplano ochre and a turquoise lake — and the music under the board changes with it too: an original tune written for each country instead of one loop everywhere.",
      'A new baby now gets its own spin. Land on New Baby, Twins, or Another Arrival and press Spin for the gift envelopes, same as any other spin-for-money tile — higher is always better.',
    ],
    changes: [
      "Wedding proposals, promotions, and the household joint-account tile now wait for you to press Spin too, the same way payday cards already did — the game no longer rolls before you've seen what's on the tile.",
      "The spin wheel is bigger on a desktop screen, and every player's token on the board is larger too, so it's easier to see who's standing where at a glance.",
      'The USA edition got the same plain-English pass the other four editions already had — American spelling and terms throughout, so nothing reads like a translation.',
      "Japan's salary numbers now read the way a real paycheque does — a monthly figure, not the whole year at once — and every payday or raise spells out the arithmetic (¥350,000 × 12 months = ¥4,200,000) so the total is never a mystery.",
      "Trimmed a handful of the board's smallest forced money events down to pure flavour text — a few more spaces where nothing happens but the scene, for a slightly lighter pace.",
    ],
    fixes: [
      "Fixed a right-side profile panel where a long salary figure could print over the top of the cash total instead of staying in its own row.",
    ],
  },
  {
    version: 'v1.2.1',
    date: 'August 14, 2026',
    whatsNew: [],
    changes: [
      'Japan, India and Bolivia get the same plain-English pass France got last release — same jokes, same local words explained the same way, far fewer sentences that needed a second read.',
    ],
    fixes: [],
  },
  {
    version: 'v1.2.0',
    date: 'August 14, 2026',
    whatsNew: [
      'A spin-for-money card now names its rate up front and waits for you to press Spin — instead of the game rolling for you before you saw the tile. Higher is always better, and now you find that out yourself.',
    ],
    changes: [
      'The France edition is rewritten in plainer English, tile by tile — same jokes, same French words explained the same way, far fewer of them wrapped in sentences that needed a second read.',
    ],
    fixes: [],
  },
  {
    version: 'v1.1.1',
    date: 'August 14, 2026',
    whatsNew: [],
    changes: [
      'Hard and Very Hard are retuned around the fix below — Very Hard should still land as a coin flip, not noticeably softer or harder than before.',
    ],
    fixes: [
      'Fixed a real gap on Hard and Very Hard: the whole stretch between your career fair and your next fork, and again between marriage and buying a house, could pay out nothing at all — every payday in that stretch was a penalty instead. Pay is guaranteed there now.',
      'On a short game, the opening roll used to do nothing if you chose the degree lane — the pawn always stopped one tile later regardless of the number. Fixed.',
    ],
  },
  {
    version: 'v1.1.0',
    date: 'August 14, 2026',
    whatsNew: [
      'Five countries to play in: the USA, Japan, France, India and Bolivia. Pick one on the title screen — same rules and the same board, but a different life, in that country’s own money.',
    ],
    changes: [
      'Loans now say how much you actually borrowed, alongside what it will cost to settle at retirement. On Very Hard those two numbers are much further apart than you might expect.',
      'Save slots say which country the game was played in, so a half-finished Japan evening is no longer indistinguishable from a French one.',
    ],
    fixes: [],
  },
  {
    version: 'v1.0.0',
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
