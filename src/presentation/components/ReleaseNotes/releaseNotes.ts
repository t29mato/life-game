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
    date: 'August 29, 2026',
    whatsNew: [],
    changes: [
      "A payday or event tile you sweep past mid-move now gets its own card, named for that tile, shown right there before your turn's final card — no more guessing which stop a line in the notes actually came from.",
      "Payday itself always shows a card now, even on a flat salary with no wheel to spin — the money still changed, so it still gets a moment on screen.",
    ],
    fixes: [],
  },
  {
    version: 'v1.14.0',
    date: 'August 29, 2026',
    whatsNew: [],
    changes: [
      "India's landmark is India Gate now, not the Taj Mahal — both were built and put side by side, and the arch read clearer at board size.",
    ],
    fixes: [],
  },
  {
    version: 'v1.13.0',
    date: 'August 29, 2026',
    whatsNew: [
      "Every edition finally looks like the country it's named for: the Statue of Liberty stands somewhere on the American board, Fuji and a torii gate on the Japanese one, the Eiffel Tower in France, the Gate of the Sun in Bolivia, and the Taj Mahal in India — one skyline per board, standing behind the tiles rather than on them.",
    ],
    changes: [],
    fixes: [],
  },
  {
    version: 'v1.12.0',
    date: 'August 29, 2026',
    whatsNew: [
      "Money now moves the way it looks like it moves: coins and notes fly wherever cash changes hands — your own gains and bills, a payday you swept past mid-move, a round of gifts or a collection between players — with a sound to match. The final standings get the same coins for the winner's own moment.",
    ],
    changes: [
      "The fork spin's own stakes — which road this press decides, not just how far — now sit right on top of the wheel, large enough to actually read before you press it.",
      "Descriptions read a little bigger throughout — event cards, the wheel's own stakes, and every choice card's fine print.",
    ],
    fixes: [],
  },
  {
    version: 'v1.11.0',
    date: 'August 29, 2026',
    whatsNew: [],
    changes: [
      "Most stops aren't stops any more. Tuition, a promotion review, a new career, a wedding, a new baby — the news still happens exactly the same, but a big roll no longer gets cut short landing on the tile that delivers it. Only a handful of tiles that ask a real question — buying a house, retiring early — still halt your turn.",
      "Early retirement spells out the bonus itself, not just what it nets against the stake, so a modest roll doesn't read as a loss when the fund you just locked in is a real one.",
      "The final standings no longer give the winner away by where their name sits on the screen or what rank is printed next to it — every row and every number waits its turn in the same reveal the podium already runs.",
      "Money that changes hands between players — a collection, a round of gifts — now says whose balance ended up where, not just who paid what.",
      "A payday or any other event you sweep past mid-move now says what it left your balance at, not only what it was worth.",
    ],
    fixes: [
      "The very first spin of a game — the fork that sends you to college or straight to work — could resolve with nothing on screen to say a road was even being decided. It now names both roads before you press the wheel, same as every other spin that asks something of you.",
    ],
  },
  {
    version: 'v1.10.0',
    date: 'August 28, 2026',
    whatsNew: [],
    changes: [
      "Forks no longer ask you to choose a road before you spin — landing on one, the same spin that decides how far you travel also decides which road you take. Nobody who has played the game before gets a head start on the players who haven't.",
      "The Five Years In fork on the road to the top no longer stops your turn on its own — it used to sit right in front of another forced stop, so choosing the job-hopper road could cost you most of two turns in a row.",
    ],
    fixes: [],
  },
  {
    version: 'v1.9.0',
    date: 'August 28, 2026',
    whatsNew: [
      'An Assets button in the header opens every player\'s full financial picture at once — cash, house, shares, loans, life tiles and family, each spelled out as its own line rather than squeezed into the sidebar or hidden behind a hover.',
    ],
    changes: [
      "No more spoilers: the board itself used to jump to your landing tile the instant you pressed Spin, well before the wheel had visibly finished turning. Now it waits for the wheel, same as the result card already did.",
      "A payday you sweep straight past on the way to somewhere else now shows up on the card you actually see, instead of only ever being visible by opening the log.",
      "A tile with truly nothing on it — no money, no news — no longer stops your turn for a card with nothing to read. It just ends the turn and moves on.",
      "House hunting and the trading floor now say what buying actually gets you — what a house sells for at retirement, what a share pays out — instead of only naming the price.",
      "Text throughout the game reads a little larger.",
    ],
    fixes: [],
  },
  {
    version: 'v1.8.0',
    date: 'August 28, 2026',
    whatsNew: [
      "A marriage can end now, not just begin. It's rare, and it costs a settlement — and every child leaves with the departing partner, so the family scoring at the end of the game stops counting them from there on.",
      "College runs a little longer before the cap and gown — a couple of already-written years (a scholarship win, finals week) used to be cut from shorter games, and now they always happen.",
    ],
    changes: [
      "A handful of board bills that had drifted a long way from what the thing they describe actually costs — a bank overdraft fee, a parking ticket, a late-rent penalty, an insurance deductible — now land much closer to real life, in every country's own currency.",
    ],
    fixes: [],
  },
  {
    version: 'v1.7.0',
    date: 'August 27, 2026',
    whatsNew: [
      'A new home-screen icon — the road, the sun, and the flag at the end of it, the same picture across every country and every device.',
    ],
    changes: [
      "Fewer back-to-back forced stops. A few spots on the board used to chain two mandatory stops right next to each other — right after graduation, and right after taking the Job-Hopper route — so the roll straight after barely mattered. Both now have a beat in between, so every roll still counts for something.",
      "Changing careers always pays out first. On the Job-Hopper route and a couple of other stretches, it used to be possible to change jobs twice without ever actually collecting a paycheck from either one in between. There's always a payday in there now.",
      "A couple of plainer word choices — a fender bender is now a minor car crash, a golden handshake is now a final promotion — so nothing on the board depends on knowing an English expression rather than the words themselves. This is the first pass of a wider plain-English review still in progress.",
    ],
    fixes: [],
  },
  {
    version: 'v1.6.0',
    date: 'August 27, 2026',
    whatsNew: [
      "You can add this game to your phone's home screen now, like any other app — open it from the browser menu ('Add to Home Screen' on an iPhone, 'Install' on most others) and it launches full-screen from its own icon from then on, no address bar in the way.",
      "Once you've opened it at least once, it keeps working with no signal at all — on a plane, underground, wherever. Nothing about play changes; it just doesn't need the internet to start.",
    ],
    changes: [
      "When a new release is out and you already have a tab or the home-screen app open, a small banner now offers to update rather than switching you over on its own — tap it whenever you're ready and it picks up the new version right away.",
    ],
    fixes: [],
  },
  {
    version: 'v1.5.4',
    date: 'August 26, 2026',
    whatsNew: [],
    changes: [
      "The board reads bigger on a wide desktop screen — the camera now zooms in to match how much wider your window is than tall, instead of leaving a plain stretch of background beside the actual route. The wheel-side rail and a phone screen were already sized right and are unchanged.",
    ],
    fixes: [],
  },
  {
    version: 'v1.5.3',
    date: 'August 25, 2026',
    whatsNew: [],
    changes: [],
    fixes: [
      "Fixed a tap near the left edge of a phone screen opening a space's card half off the side of the screen instead of shifting clear of the edge.",
    ],
  },
  {
    version: 'v1.5.2',
    date: 'August 25, 2026',
    whatsNew: [
      "Drag the board — swipe, on a phone — to look around it freely, any time it isn't your turn to actually move. Nothing to hold or release, it just goes where you take it.",
      "Tap any space for its own card: what kind of space it is and what actually happens there, pulled straight from the same rules the game itself plays by.",
    ],
    changes: [],
    fixes: [
      "Fixed the tighter camera crop from the last release occasionally leaving a player's own car outside the wide shot between turns.",
    ],
  },
  {
    version: 'v1.5.1',
    date: 'August 25, 2026',
    whatsNew: [],
    changes: [
      "The board fills the screen corner to corner now — the camera crops in tight instead of leaving spare room around the map, so it reads bigger even though the outermost row can run a sliver past the edge on some screens.",
      "Release notes open as their own screen now instead of a pop-up. The back button closes it and returns you to the title screen you opened it from, rather than risking a step back out of the game itself.",
    ],
    fixes: [],
  },
  {
    version: 'v1.5.0',
    date: 'August 21, 2026',
    whatsNew: [],
    changes: [
      "The wheel spins from its own middle now — tap or click the center of the wheel itself to spin it, the same way a real board game's roulette works. The separate Spin button beside it is gone, so the wheel gets to be bigger for it. Space still spins it exactly as before.",
      "A spin that has nothing to do with where anyone's token sits — tuition, a career choice, a promotion review, a marriage proposal — now turns front and centre in its own window over the middle of the screen, instead of down in the sidebar. An ordinary move roll still spins right beside the board, since that one decides where you actually go.",
      "The camera fits the board's own route a little more snugly on a wide screen, trimming some of the empty space around the edges.",
    ],
    fixes: [],
  },
  {
    version: 'v1.4.5',
    date: 'August 19, 2026',
    whatsNew: [],
    changes: [
      "The board is much bigger on a phone — roughly double, tile for tile. The wheel used to be free to grow as large as it liked above it with nothing guaranteeing the board any room in return; the board now always keeps at least half the screen, and the wheel gave up some of the space it didn't need to make that true.",
    ],
    fixes: [
      "Fixed the title screen's floating dice, cap, and other decorations landing on top of the game's own name on a narrow phone screen.",
    ],
  },
  {
    version: 'v1.4.4',
    date: 'August 19, 2026',
    whatsNew: [],
    changes: [
      "A tab left open now picks up a new release on its own. It checks quietly every so often and, the moment one is out, applies it the next time nothing would be lost — the title screen or the results screen — never mid-game.",
    ],
    fixes: [],
  },
  {
    version: 'v1.4.3',
    date: 'August 19, 2026',
    whatsNew: [],
    changes: [],
    fixes: [
      "Fixed the Space bar shortcut freezing the game: pressing it disabled the wheel instead of spinning it, and there was no way back short of reloading. Space now presses the wheel for real.",
      "Fixed a spoiler: a spin-decided tile (tuition, career choice, a promotion review, and the rest) could update a player's cash or job title in the sidebar while the wheel was still turning, before it had actually landed. The sidebar now waits for the wheel to settle, same as the result card already did.",
    ],
  },
  {
    version: 'v1.4.2',
    date: 'August 20, 2026',
    whatsNew: [
      "Press the Space bar to spin. On a wide desktop screen the wheel sits in its own tray off to the side — Space presses it from wherever your cursor already is, no trip across the screen required. It steps aside the moment anything else on the page has focus, so it never fights with a button you actually meant to press.",
    ],
    changes: [],
    fixes: [],
  },
  {
    version: 'v1.4.1',
    date: 'August 20, 2026',
    whatsNew: [],
    changes: [],
    fixes: [
      "Fixed every spin-the-wheel tile — tuition, career choice, a promotion review, a marriage proposal, and the rest — so pressing Spin actually spins the wheel you can see, instead of the result just appearing in the result card with the wheel sitting there disabled. The card now shows what's on the line, then hands the real wheel to you (or, on a computer's turn, spins it the same way a person would) rather than deciding everything the instant the card opened.",
    ],
  },
  {
    version: 'v1.4.0',
    date: 'August 19, 2026',
    whatsNew: [
      "Career choice is on the wheel now. Job fairs, headhunters, Job-Hopper Alley, and every other career tile put two named jobs on the table and spin for which one you get, instead of you just picking whichever pays more. The card names both jobs and the split — 1-5 for one, 6-10 for the other — before you press Spin. Where the tile allows it, you can still turn both down and keep the job you already have.",
      "College tuition is a spin too. Instead of one flat bill, the wheel decides what you owe — a bad spin costs more than the old flat rate, a great one can mean a full ride, and the card spells out every band before you spin.",
    ],
    changes: [
      "The desktop spin wheel is bigger again, and turns more slowly, so the numbers are easier to follow as they go by.",
    ],
    fixes: [],
  },
  {
    version: 'v1.3.3',
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
