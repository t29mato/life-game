/**
 * LIFE JOURNEY — the interface, in the language it was written in.
 *
 * The board's *content* has had a translation contract since the edition
 * overlays landed (`domain/edition/i18n/types.ts`). This is the other half:
 * every word the game says that is not printed on a tile — the buttons, the
 * headings, the handbook, the ledger's own labels, the sentences a screen
 * reader hears.
 *
 * Three rules, and they are the same three the edition overlays follow:
 *
 * 1. **English is the source, not a translation of anything.** This file is
 *    the type. A locale is `Partial` of it (see `UiOverlay`), so a key nobody
 *    has translated yet reads in English rather than as a bracketed key —
 *    a half-finished language is always shippable.
 * 2. **A key that goes missing has to fail loudly.** `Partial` cannot catch
 *    that on its own, so `ui.test.ts` walks every group of every locale that
 *    claims to be finished and names what is absent. That test is to this
 *    file exactly what `overlays.test.ts` is to a country's tiles.
 * 3. **A sentence with a number in it is a function, never a concatenation.**
 *    `${count} loans` is English grammar hidden in a template literal; a
 *    language that counts differently, or puts the number somewhere else, has
 *    nowhere to say so. Every string that varies takes its parts as arguments
 *    and decides its own shape.
 *
 * What is *not* here, deliberately: money. `formatMoney` reads the edition's
 * own `CurrencySpec`, and it goes on doing so in every language — a Japanese
 * player on the India board still counts in ₹, grouped the way ₹ is grouped.
 * Changing the language you read in must never change what the board counts
 * in. The one thing this file does say about a figure is the *words* around
 * it: the ordinal, the period a wage is quoted by, the join between them.
 */

export const EN = {
  /** Words several screens print identically. Kept in one place so they cannot drift apart. */
  common: {
    close: 'Close',
    back: 'Back',
    backToTitle: 'Back to title',
    continue: 'Continue',
    gotIt: 'Got it',
    settings: 'Settings',
    cpu: 'CPU',
    human: 'Human',
    empty: 'Empty',
    turn: (turn: number): string => `Turn ${turn}`,
  },

  /**
   * The words wrapped around a figure.
   *
   * `dateLocale` is a BCP-47 tag rather than a phrase because a date is the
   * one thing here the platform can already spell correctly in any language —
   * what it needs from us is only which language to spell it in.
   */
  format: {
    /** `1` → `1st`. */
    ordinal: (n: number): string => {
      const abs = Math.abs(n)
      const lastTwo = abs % 100
      if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`
      switch (abs % 10) {
        case 1:
          return `${n}st`
        case 2:
          return `${n}nd`
        case 3:
          return `${n}rd`
        default:
          return `${n}th`
      }
    },
    /** `1` → `1st place`. The standing said out loud, not abbreviated on a badge. */
    ordinalPlace: (ordinal: string): string => `${ordinal} place`,
    /**
     * The period a wage is quoted by. The edition names it in English
     * (`CurrencySpec.salaryDisplay.unit`, plus `'share'` from the trading
     * floor); this turns that name into a word the reader has.
     */
    unit: (raw: string): string => raw,
    /** `$65,000` + `payday` → `$65,000 / payday`. */
    salary: (money: string, period: string): string => `${money} / ${period}`,
    /** Where a spread of money is quoted: `-$40,000 to -$10,000, on the die`. */
    range: (low: string, high: string): string => `${low} to ${high}`,
    onTheDie: (range: string): string => `${range}, on the die`,
    dateLocale: 'en-US',
    unknownTime: 'unknown time',
    unknownDate: 'an unknown date',
  },

  /** The game's own header, and the two menus that hang off it. */
  app: {
    log: 'Log',
    save: 'Save',
    quit: 'Quit',
    settings: 'Settings',
    gameBoard: 'Game board',
    computerTag: ' · Computer',
    playersMove: (name: string): string => `${name}’s move`,
    chooseSaveSlot: 'Choose a save slot',
    slot: (n: number): string => `Slot ${n}`,
    slotDetail: (turn: number | string, names: readonly string[]): string =>
      `Turn ${turn} · ${names.join(', ')}`,
    autosaveHint: (slot: number): string => `Your game autosaves to slot ${slot} after every turn.`,
    forkAhead: 'Fork ahead — this roll picks your road',
    onRoad: (road: string): string => `You're on ${road} — roll again for how far you go`,
    rollAgainHint: 'Roll again for how far you go',
  },

  /** The box lid. */
  title: {
    eyebrow: 'A board game of chance & ambition',
    tagline: 'Roll, hop, and build a life worth bragging about.',
    continue: 'Continue',
    newGame: 'New Game',
    handbook: 'The Handbook',
    hallOfRecords: 'Hall of Records',
    whatsNew: 'What’s New',
    continueAria: 'Continue a saved game',
    continueAriaEmpty: 'Continue: no saved games yet',
    hint: 'Three quick choices and you are on the board.',
    hintEmpty: 'No saved games yet — three quick choices and you are on the board.',
    buildTitle: 'The exact commit this build came from',
    defaultPlayerName: (n: number): string => `Player ${n}`,
  },

  /** The chrome every rung of the new-game flow wears. */
  step: {
    back: 'Back',
    of: (step: number, count: number): string => `Step ${step} of ${count}`,
  },

  /**
   * Where Back goes, said out loud — keyed by the screen it goes *to*.
   *
   * One group rather than a `backLabel` on each step, because the flow's shape
   * is computed: a country with a researcher board grows a life rung between
   * the country and the difficulty, so the screen behind any given step is not
   * something that step can know. `TitleScreen` reads the previous rung off
   * the flow and looks its name up here, which is the only way "Back to the
   * country" stays true on a screen that sometimes sits behind the life choice
   * instead.
   */
  backTo: {
    title: 'Back to title',
    saves: 'Back to the saves',
    players: 'Back to the players',
    country: 'Back to the country',
    life: 'Back to the life choice',
    difficulty: 'Back to the difficulty',
  },

  /** Step one: who is at the table. */
  players: {
    heading: "Who's playing?",
    lead: 'Two to four seats. Name them, pick a token, and hand any seat to the computer.',
    next: 'Next: the country',
    chooseToken: 'Choose your token',
    count: (n: number, max: number): string => `${n} / ${max}`,
    nameLabel: (n: number): string => `Player ${n} name`,
    colourLabel: (n: number): string => `Player ${n} colour`,
    seatTypeLabel: (n: number): string => `Player ${n} seat type`,
    recentLabel: (n: number): string => `Player ${n} recent players`,
    recent: 'Recent',
    removeLabel: (n: number): string => `Remove player ${n}`,
    addPlayer: 'Add player',
  },

  /** Step two: which country's board. */
  country: {
    heading: 'Where are you living it?',
    lead: 'Each country counts in its own money and pays its own wages. Every board is the full game.',
    next: 'Next: the difficulty',
    /** Where the forward button goes for a country that has a researcher board. */
    nextLife: 'Next: which life',
    groupLabel: 'Edition',
    cardAria: (name: string, blurb: string): string => `${name} edition. ${blurb}`,
    countsIn: (symbol: string): string => `counts in ${symbol}`,
    /** The one true sentence a country is sized up by, derived from its own data. */
    blurb: (symbol: string, start: string): string => `Counts in ${symbol} — start with ${start}.`,
    blurbWithSalaries: (symbol: string, start: string, low: string, high: string, period: string): string =>
      `Counts in ${symbol} — start with ${start}; salaries run ${low} to ${high} a ${period}.`,
    /** Tacked onto a card's spoken sentence where the next step will appear. */
    alsoResearcher: 'It also has a researcher board.',

    /* The comparison table under the cards. The cards choose; the table is the
       only place the five boards' figures stand in one column each. */
    tableCaption:
      'The country boards compared: what each starts you with, what its work pays, and whether it has a researcher board',
    columnCountry: 'Country',
    columnStart: 'Start with',
    columnSalaries: 'Salaries',
    columnResearcher: 'Researcher board',
    researcherYes: 'Yes',
    /** Honest rather than blank: the board simply has not been written yet. */
    researcherNotYet: 'Not yet',
  },

  /**
   * The rung between the country and the difficulty: which *life* is played in
   * the country just chosen.
   *
   * Only ever reached for a country that has a researcher board, so nothing
   * here ever describes an option a player cannot take.
   */
  life: {
    heading: (place: string): string => `Which life in ${place}?`,
    lead: (place: string): string =>
      `Same country, same money — a different life on it. Both boards are the full game, and ${place} plays its own way in either.`,
    next: 'Next: the difficulty',
    groupLabel: 'Life',
    classicName: 'The classic life',
    classicHint: (place: string): string => `${place}, as written`,
    classicDetail: (salaries: string): string =>
      `School or work, a career, a house, a family. ${salaries}`,
    researcherName: 'The researcher life',
    researcherHint: 'same country, different work',
    researcherDetail: (place: string, salaries: string): string =>
      `A life in research on the same ${place} board: its own careers, its own forks, and a different road to gamble on. ${salaries}`,
    cardAria: (name: string, place: string, detail: string): string => `${name} in ${place}. ${detail}`,
    /** The one figure that separates the two boards — they share a currency by construction. */
    salariesRun: (low: string, high: string, period: string): string =>
      `Salaries run ${low} to ${high} a ${period}.`,
    careersUnwritten: 'Its careers are still being written.',
  },

  /** Step three: how hard a life. */
  difficulty: {
    heading: 'How hard a life?',
    lead: 'The same board, dealt kinder or crueller. Every figure below was measured over seeded games.',
    start: 'Start Game',
    groupLabel: 'Difficulty',
    normalLabel: 'Normal',
    normalHint: 'a fair life',
    normalDetail: "The standard journey: setbacks happen, but they won't ruin you.",
    normalAria: "Normal difficulty: setbacks happen, but they won't ruin you",
    hardLabel: 'Hard',
    hardHint: 'money runs tight',
    hardDetail: 'Twice the setbacks of Normal — about one player in ten retires in the red.',
    hardAria: 'Hard difficulty: twice the setbacks, about one player in ten retires in the red',
    veryHardLabel: 'Very Hard',
    veryHardHint: 'survival is a win',
    veryHardDetail:
      'Setbacks at nearly every turn, and finishing in the black at all is close to a coin flip. Retiring with anything is bragging rights.',
    veryHardAria: 'Very hard difficulty: finishing in the black at all is close to a coin flip',
    /** "About 10–20 min for 2 human seats and 1 CPU seat." */
    playtime: (span: string, seats: string): string => `About ${span} min for ${seats}.`,
    humanSeats: (n: number): string => `${n} human seat${n === 1 ? '' : 's'}`,
    cpuSeats: (n: number): string => `${n} CPU seat${n === 1 ? '' : 's'}`,
    seatJoin: (parts: readonly string[]): string => parts.join(' and '),
  },

  /** The other branch off the title: the save shelf. */
  continueStep: {
    heading: 'Continue a game',
    lead: 'Pick up any table that was left mid-journey.',
    autosave: 'Autosave',
    slot: (n: number): string => `Slot ${n}`,
    empty: 'Empty',
    emptyAria: (title: string): string => `${title}, empty`,
    occupiedAria: (
      title: string,
      names: readonly string[],
      edition: string | null,
      turn: number | string,
      saved: string,
    ): string =>
      `Continue ${title}: ${names.join(' and ')}${
        edition === null ? '' : ` on the ${edition} board`
      }, turn ${turn}, saved ${saved}`,
    players: (names: readonly string[]): string => names.join(' & '),
    meta: (edition: string | null, turn: number | string, saved: string): string =>
      `${edition === null ? '' : `${edition} · `}Turn ${turn} · ${saved}`,
  },

  /** The map itself: its decals, its accessible description, its zoom rail. */
  board: {
    captionGraduate: 'GRADUATE',
    captionMarried: 'MARRIED',
    captionBaby: 'BABY',
    captionNewHome: 'NEW HOME',
    captionRetire: 'RETIRE',
    captionStart: 'START',
    recentreTo: (name: string): string => `Back to ${name}'s car`,
    recentreActive: 'Back to the active car',
    theBoard: 'the board',
    carOn: (car: string, space: string): string => `${car}, on ${space}`,
    zoomGroup: 'Map zoom',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    zoomReset: 'Reset zoom to fit',
  },

  /** Who is riding in a player's car, for someone who cannot see the drawing. */
  passengers: {
    partner: 'a partner alongside',
    children: (n: number): string => (n === 1 ? '1 child' : `${n} children`),
    alone: (name: string): string => `${name}, driving alone`,
    with: (name: string, seats: readonly string[]): string =>
      `${name}, driving with ${seats.join(' and ')}`,
  },

  /** The die, wherever it is thrown. */
  dice: {
    roll: 'Roll',
    rolling: 'Rolling…',
    rollWithLast: (last: number): string => `Roll — last roll ${last}`,
    clickToRoll: 'click to roll',
    tapToRoll: 'Tap to roll',
    spaceKey: 'Space',
    rolledA: (face: number): string => `Rolled a ${face}`,
  },

  /** How much further the car is going. */
  moveCounter: {
    aria: (n: number): string => `${n} space${n === 1 ? '' : 's'} to go`,
    toGo: 'to go',
  },

  /** The quiet announcement between turns, and the loud one. */
  turn: {
    playersTurn: (name: string): string => `${name}’s turn`,
    imReady: 'I’m ready',
    showEveryTurn: 'Show this every turn',
  },

  /** The key to the board, dealt once and kept in the Handbook. */
  legend: {
    kind: 'Reading the board',
    title: 'One picture, one meaning',
    lede:
      'Every mark on the board means exactly one thing. Here is all of them — you will not be shown this again, and the Handbook keeps a copy.',
    coinName: 'The coin',
    coinRule: 'Payday. Your salary, collected landing here or driving past.',
    upName: 'Arrow up',
    upRule: 'Money in.',
    downName: 'Arrow down',
    downRule: 'Money out.',
    triangleName: 'The triangle',
    triangleRule: 'A setback — a crash, a fire, a repair bill.',
    bankName: 'The bank',
    bankRule: 'Borrow, or pay a loan off. Never the market.',
    chartName: 'The chart',
    chartRule: 'The market. Shares to buy, dividends to collect.',
    shieldName: 'The shield',
    shieldRule: 'Policies, and what they cover you against.',
    starName: 'The star',
    starRule: 'A LIFE tile — a keepsake, worth real money at the end.',
    milestonesName: 'The milestones',
    milestonesRule: 'Cap, heart, pram, house, sunset: the five moments the game is about.',
    stripeName: 'Red-and-white stripe',
    stripeRule:
      'This tile always happens — landed on or driven past. Some of them stop your turn outright.',
    gainName: 'Green cut edge',
    gainRule: 'The tile pays you.',
    costName: 'Red cut edge',
    costRule: 'The tile charges you.',
    choiceName: 'Purple cut edge',
    choiceRule: 'You will be asked something. A house, a loan, a job.',
    milestoneName: 'Gold bezel',
    milestoneRule: 'A Life Milestone. Confetti included.',
  },

  /** What a tapped tile says about itself. */
  tile: {
    kindStart: 'Start',
    kindNormal: 'Space',
    kindPayday: 'Payday',
    kindEvent: 'Milestone',
    kindStop: 'Decision',
    kindRetirement: 'Retirement',
  },

  /**
   * What a tile actually does, in one line, read off its own effect.
   *
   * Never hand-written per tile — see `effectSummary.ts`. The voice is plain
   * words and a figure where a figure will do.
   */
  effect: {
    none: 'Nothing happens here.',
    payEach: (amount: string): string => `${amount} to every other player`,
    collectFromEach: (amount: string): string => `${amount} from every other player`,
    payPerChild: (amount: string): string => `${amount} for each child`,
    collectPerChild: (amount: string): string => `${amount} for each child`,
    stockDividend: (amount: string): string => `${amount} for every share you hold`,
    insurable: (amount: string): string => `${amount} — nothing, if you hold the policy`,
    payday: 'Your salary — collected landing here or driving past.',
    payRaise: 'Your salary goes up.',
    promotion: 'Roll for a promotion. Under the bar pays a raise instead.',
    tradeYear: 'A year in your trade, on the die. The best pays what the worst costs.',
    chooseCareer: 'A new job, and the die picks which.',
    careerChangeForced: 'A new trade. This one you cannot turn down.',
    careerChangeOffered: 'Two other trades, offered. Keeping your job is an answer.',
    loseCareer: 'You lose your job, and earn nothing until a fair re-hires you.',
    tuitionFree: 'nothing',
    graduate: 'You graduate. Every fair after this deals from the graduate ladders.',
    doctorate: 'The doctorate, and the shelf of jobs it opens.',
    getMarried: 'A proposal, settled on the die — and a gift from everyone if it lands.',
    household: 'The joint account, settled on the die. Married players only.',
    haveChildren: (children: string, gifts: string): string => `${children}, and ${gifts} in gifts`,
    childCount: (n: number): string => (n === 1 ? '+1 child' : `+${n} children`),
    /**
     * The New Baby tile whose die actually decides, spread and all.
     *
     * A tile whose faces all agree names its outcome through `haveChildren`;
     * one that can land on an empty face has to say so here, because "+1
     * child" about a die that arrives at none two faces in six is the summary
     * promising what the tile cannot deliver.
     */
    childrenOnTheDie: (least: number, most: number, gifts: string): string =>
      `${least} to ${most} children on the die, and up to ${gifts} in gifts`,
    divorce: (amount: string): string => `A separation: ${amount}, and the children go with them.`,
    buyHouse: 'Buy a house. Your turn stops here for it.',
    upgradeHouse: 'Trade up to a better home, if you already own one.',
    buyStock: 'Shares to buy, at the price the market is asking.',
    buyInsurance: 'Policies to buy, against the board’s worst tiles.',
    bank: (principal: string): string => `The bank: borrow ${principal}, or pay a loan off.`,
    lifeTiles: (n: number): string => (n === 1 ? 'LIFE tile +1' : `LIFE tiles +${n}`),
    stealLifeTile: 'Take one LIFE tile from whoever holds the most.',
    swapMoneyWithLeader: 'Swap wallets with whoever is ahead.',
    retire: 'The end of the road. First one in takes the biggest bonus.',
    retireEarly: 'Stop working decades early — if you are holding the number.',
  },

  /** The card a landing deals. */
  card: {
    milestone: 'Life Milestone',
    passing: 'Passing through',
    rolled: 'Rolled',
    paid: 'Paid',
    borrowed: 'Borrowed',
    loanTerms: (loans: number, amount: string): string =>
      `${loans === 1 ? '1 loan' : `${loans} loans`} — ${amount} to repay at retirement`,
    continue: 'Continue',

    /*
     * The receipt for everything the car drove over on the way here, as a
     * two-column table. It used to be a list of sentences each opening with
     * the word "Passed", which is a column heading typed out once per row;
     * the heading says it once now and the figures line up under `Amount`.
     */
    passedAria: 'Passed on the way here',
    passedColumn: 'Passed',
    amountColumn: 'Amount',
    /** One tile's name in the first column, with its count where it was crossed twice. */
    passedLabel: (title: string, times: number): string => `${title}${times > 1 ? ` ×${times}` : ''}`,
  },

  /** The question put to the player, and the die that answers some of them. */
  decision: {
    kindBranch: 'Fork in the road',
    kindHouse: 'House hunting',
    kindStock: 'Trading floor',
    kindInsurance: 'Insurance office',
    kindBank: 'The bank',
    kindRetire: 'The number',
    kindValueSpin: 'The die',
    theComputer: 'The computer',
    isChoosing: (name: string): string => `${name} is choosing…`,
    thinking: 'Thinking it over — no input needed.',
    browse: 'to browse',
    choose: 'to choose',
    or: 'or',
    enterKey: 'Enter',
    spaceKey: 'Space',
    per: (unit: string): string => `per ${unit}`,
    lanePaydayHeavy: 'Payday-heavy',
    laneEventHeavy: 'Event-heavy',
    laneMixed: 'Mixed route',
  },

  /** The card that puts a die in the middle of the screen. */
  spin: {
    passingThrough: 'Passing through',
    theDie: 'The die',
  },

  /** What each face of the die is worth, as rows. */
  rollTable: {
    caption: 'What each roll of the die is worth',
    roll: 'Roll',
    career: 'Career',
    per: (period: string): string => `Per ${period}`,
    rung: 'Rung',
    outcome: 'Outcome',
  },

  /** The scrolling feed of everything that has happened. */
  log: {
    panel: 'Game log',
    heading: 'Log',
    close: 'Close the log',
    empty: 'Nothing has happened yet.',
    upset: 'Upset',
  },

  /** The band of seats at the foot of the screen. */
  strip: {
    aria: 'Players — open full status',
    worth: 'Worth',
    retired: 'Retired',
    status: 'Status',
    rankOn: (ordinal: string, worth: string): string => `${ordinal} on net worth ${worth}`,
    cash: (amount: string): string => `cash ${amount}`,
    loansToSettle: (loans: number, amount: string): string =>
      `${loans} loan${loans === 1 ? '' : 's'} to settle ${amount}`,
    plusTheRest: 'plus house, shares, tiles and family',
    breakdownJoin: (parts: readonly string[]): string => parts.join(' — '),
    loansTitle: (loans: number, amount: string): string =>
      `${loans} loan${loans === 1 ? '' : 's'} — ${amount} to repay at retirement`,
  },

  /** One seat's card in the rail. */
  panel: {
    unemployed: 'Unemployed',
    nowPlaying: 'Now playing',
    retired: 'Retired',
    retiredRank: (rank: number): string => `Retired #${rank}`,
    cash: 'Cash',
    netWorth: 'Net worth',
    sameAsCash: 'Same as cash',
    worthTitle:
      'Cash plus house, shares, life tiles and child bonuses, minus loan payoffs — what this player scores if the game ends now',
    onAverage: (salary: string): string => `${salary} on average`,
    fixedPayNote: (title: string): string => `${title}: the same packet every payday.`,
    variablePayNote: (title: string, perPip: string): string =>
      `${title}: every payday pays ${perPip} for each pip you roll.`,
    casualNote: (perPip: string): string =>
      `Between jobs: every payday pays ${perPip} for each pip you roll.`,
    casualShifts: (perPip: string): string => `Casual shifts: ${perPip} a pip`,
    graduate: 'Graduate',
    married: 'Married',
    tiles: (n: number): string => `${n} tile${n === 1 ? '' : 's'}`,
    kids: (n: number): string => `${n} kid${n === 1 ? '' : 's'}`,
    loans: (n: number): string => `${n} loan${n === 1 ? '' : 's'}`,
    shares: (n: number): string => `${n} share${n === 1 ? '' : 's'}`,
    atRetirement: (amount: string): string => `${amount} at retirement`,
    loanTitle: (principal: string, payoff: string): string =>
      `${principal} borrowed · ${payoff} owed at retirement`,
    policy: (kind: string): string => `${kind} policy`,
  },

  /** Everything a seat is carrying, opened on demand. */
  status: {
    heading: 'Player Status',
    aria: 'Player status',
    playerAria: (name: string): string => `${name}'s status`,
    computer: 'Computer',
    nowPlaying: 'Now playing',
    retired: 'Retired',
    retiredRank: (rank: number): string => `Retired #${rank}`,
    netWorth: 'Net worth',
    ifGameEndedNow: 'If the game ended now',
    fullBreakdown: 'Full breakdown',
    /* The folded ledger is a real table — the one thing in the game that
       genuinely is a spreadsheet, opened to check somebody's arithmetic. */
    ledgerCaption: (name: string): string => `What ${name}’s net worth is made of`,
    holdingColumn: 'Holding',
    worthColumn: 'Worth',
    insured: 'Insured',
    cash: 'Cash',
    house: (name: string): string => `House — ${name}`,
    sharesLine: 'Shares — at the middle of what each pays out',
    stockLine: (name: string, ticker: string, shares: number): string =>
      `${name} (${ticker}) — ${shares} share${shares === 1 ? '' : 's'}`,
    lifeTilesLine: (n: number): string => `Life tiles — ${n} earned`,
    childrenLine: (n: number): string => `Children — ${n}, on average at the final roll`,
    loansLine: (n: number): string => `Loans — ${n} outstanding, settled at retirement`,
    unemployed: 'Unemployed',
    casualShifts: 'Casual shifts',
    single: 'Single',
    married: 'Married',
    graduate: 'Graduate',
    children: (n: number): string => `${n} child${n === 1 ? '' : 'ren'}`,
    shares: (n: number): string => `${n} share${n === 1 ? '' : 's'}`,
    lifeTiles: (n: number): string => `${n} LIFE tile${n === 1 ? '' : 's'}`,
    loans: (n: number): string => `${n} loan${n === 1 ? '' : 's'}`,
  },

  /** The podium. */
  results: {
    eyebrow: 'Final standings',
    heading: 'Game Over',
    playAgain: 'Play Again',
    tableAria: 'Final standings',
    personalBest: 'Personal best',
    firstGame: 'The first game in the hall of records.',
    newHighScore: (total: string): string => `A new high score for the table — ${total}.`,
    firstWin: (name: string): string => `${name}'s first win.`,
    personalBestFor: (name: string): string => `A personal best for ${name}.`,
    cash: 'Cash',
    lifeTiles: 'Life tiles',
    house: 'House',
    shares: 'Shares',
    insurance: 'Insurance',
    kids: 'Kids',
    retirement: 'Retirement',
    loans: 'Loans',
  },

  /** Every game this table has played. */
  records: {
    eyebrow: 'Every game this table has played',
    heading: 'Hall of Records',
    emptyTitle: 'No games finished yet',
    emptyBody:
      'Play a full game and the hall of records will remember every finish — who won, by how much, and how long it took. Come back here once the first pawn crosses the retirement space.',
    tableLeaders: 'Table leaders',
    winsAria: 'Wins by player',
    historyAria: 'Game history',
    wins: (n: number): string => `${n} ${n === 1 ? 'win' : 'wins'}`,
    turns: (n: number): string => `${n} ${n === 1 ? 'turn' : 'turns'}`,
  },

  /** The player-facing changelog. */
  notes: {
    eyebrow: 'What has changed on the way here',
    heading: 'Release Notes',
    historyAria: 'Version history',
    version: (version: string): string => `Version ${version}`,
    whatsNew: "What's new",
    changed: 'Changed',
    fixed: 'Fixed',
  },

  /** The instruction booklet. */
  manual: {
    eyebrow: 'Everything in the box, explained',
    heading: 'The Handbook',
    contentsAria: 'Contents',
    contentsTurns: 'Turns',
    contentsBoard: 'The board',
    contentsCareers: 'Careers',
    contentsGlossary: 'Glossary',
    turnHeading: 'How a turn works',
    boardHeading: 'Reading the board',
    marksHeading: 'What the marks mean',
    careersHeading: 'The careers of the world',
    careersLede:
      'Every trade on every board, ladder by ladder, one country at a time. A fair only ever hires onto the leftmost rung — the rest is climbed.',
    pickCountry: 'Pick a country',
    editionCareers: (name: string): string => `${name} careers`,
    editionMeta: (symbol: string, trades: number): string => `counts in ${symbol} · ${trades} trades`,
    wordsHeading: 'Words this game uses',

    step1Title: 'Roll the die',
    step1Body:
      'Every turn starts with one roll, 1 to 6. A fork takes two: the first picks the road for you — 1 to 3 one way, 4 to 6 the other — and the second is how far down it you drive.',
    step2Title: 'Drive the road',
    step2Body:
      'Paydays and milestones you drive past still pay out — each one deals its own card on the way, before you reach where you stop.',
    step3Title: 'Resolve the landing',
    step3Body:
      'The tile you stop on plays out: money moves, a die decides something, or a real decision is put in front of you.',
    step4Title: 'Pass the die',
    step4Body:
      'Play moves around the table until every pawn has reached retirement — then the scores settle, houses, stocks and LIFE tiles included.',

    kindPaydayName: 'Payday',
    kindPaydayRule: 'Collects your salary whether you land on it or drive straight past it.',
    kindMilestoneName: 'Milestone',
    kindMilestoneRule: 'Fires when passed or landed on, and never cuts a big roll short.',
    kindOrdinaryName: 'Ordinary tile',
    kindOrdinaryRule: 'Only does something when your pawn actually stops on it.',
    kindStopName: 'Stop',
    kindStopRule:
      'Movement always halts here, steps to spare or not — a decision worth weighing is waiting.',
    kindRetirementName: 'Retirement',
    kindRetirementRule:
      'The end of the road. Reaching it retires your pawn; first in takes the biggest bonus.',

    poolBasicLabel: 'Straight from the fair',
    poolBasicHint: 'no degree needed',
    poolGraduateLabel: 'The graduate pool',
    poolGraduateHint: 'degree required',
    poolDoctorateLabel: 'The doctoral pool',
    poolDoctorateHint: 'doctorate required',

    tagCalling: 'A calling',
    tagRung: (rung: number, height: number): string => `Rung ${rung} of ${height}`,
    tagPaidByDie: 'Paid by the die',
    climbOn: (spin: number): string => `on a ${spin}+`,

    glossaryLadderTerm: 'Ladder',
    glossaryLadderMeaning:
      'A trade written as rungs — apprentice, stylist, salon owner. A fair hires you onto the bottom rung; everything above it is climbed at reviews, and the top rungs need the bigger rolls.',
    glossaryCallingTerm: 'A calling',
    glossaryCallingMeaning:
      'Work with no ladder above it at all. It never climbs, a layoff can never take it, and every review pays a LIFE tile instead of a title.',
    glossaryTilesTerm: 'LIFE tiles',
    glossaryTilesMeaning:
      'Keepsakes picked up along the road — a marathon, a novel, a rescue dog. Every one is worth real money at the final scoring.',
    glossaryPerPipTerm: 'Paid by the die',
    glossaryPerPipMeaning:
      'Some work has good weeks and bad ones. A trade marked this way pays a rate times your roll at each payday instead of a fixed salary — the quoted wage is what it averages.',
    glossaryDegreeTerm: 'A degree',
    glossaryDegreeMeaning:
      'College Lane’s prize: tuition up front, and every job fair after graduation deals from the graduate ladders — a higher floor, in exchange for the bill.',
    glossarySeniorityTerm: 'Seniority',
    glossarySeniorityMeaning:
      'A layoff costs one rung, never the whole climb. The next fair re-hires you at the level you had earned, less one — even onto a different trade.',
    glossaryNumberTerm: 'The Number',
    glossaryNumberMeaning:
      'Hold enough cash at the right tile and you may stop working decades early — rolling for what drawing the fund that soon actually costs.',
  },

  /**
   * The short place-name a picker, a save slot or a records card calls a
   * board by.
   *
   * Keyed by `EditionId` rather than derived from `Edition.name`, because the
   * name is the box title — "LIFE JOURNEY: Japan" — and a country's name is
   * not a translation of that string, it is a different word for the same
   * place. An edition with no entry here (a test's variant, an edition that
   * ships after this file) falls back to the English name split at its colon,
   * which is what `editionDisplayName` always did.
   */
  editions: {
    usa: 'USA',
    bolivia: 'Bolivia',
    france: 'France',
    india: 'India',
    japan: 'Japan',
    'japan-researcher': 'Researcher — Japan',
    'france-researcher': 'Researcher — France',
  },

  /** The eight colours work is cast in. */
  families: {
    kitchen: 'Food & market',
    field: 'Field & harvest',
    works: 'Trades & transport',
    office: 'Desk & ledger',
    studio: 'Studio & stage',
    care: 'Care & clinic',
    science: 'Lab & launchpad',
    pitch: 'The sporting life',
  },

  /** What a policy is called wherever one is listed. */
  insurance: {
    home: 'Home',
    auto: 'Auto',
    life: 'Life',
  },

  /** Behind the gear. */
  settings: {
    heading: 'Settings',
    escHint: 'Esc closes this.',
    language: 'Language',
    languageAria: 'Language',
  },

  /** The two switches nobody touches twice. */
  audio: {
    group: 'Audio settings',
    music: 'Music',
    sfx: 'SFX',
    on: 'On',
    off: 'Off',
  },

  /** The one place a newer build gets to interrupt anything. */
  update: {
    ready: 'A new version is ready.',
    action: 'Update',
  },

  /** The lane a coin flies down, on a card that moved somebody else's money. */
  coin: {
    you: 'You',
  },
}

/** The shape every locale is measured against. The English catalogue *is* the type. */
export type UiText = typeof EN

/**
 * A locale, as far as the type system is concerned: any subset of the
 * catalogue, group by group.
 *
 * Deliberately not a required total — see rule 1 in the file header. What
 * stops a language shipping half-finished *by accident* is `ui.test.ts`,
 * which is a test rather than a type precisely so that a language can be
 * shipped half-finished on purpose while it is being written.
 */
export type UiOverlay = { readonly [G in keyof UiText]?: Partial<UiText[G]> }
