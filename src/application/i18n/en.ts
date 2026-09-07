/**
 * LIFE JOURNEY — the sentences the *engine* writes, in the language they were
 * written in.
 *
 * Three catalogues now, and the split between them is the layer each one
 * belongs to. `domain/edition/i18n` holds the board's own words: what a tile
 * says, what a career is called, what a house is. `presentation/i18n` holds
 * the chrome: buttons, headings, the handbook. Between them sat everything the
 * engine *composed* rather than copied off a tile — the narration on an event
 * card, the chips under it, every line in the log, the roll tables, the label
 * on a decision — and it had no home at all, because the application layer had
 * no way to be told what language anybody was reading in.
 *
 * This is that home. The rules are the three `presentation/i18n/en.ts` already
 * states, and they are the same rules for the same reasons:
 *
 * 1. **English is the source, not a translation of anything.** This file is the
 *    type. A locale is `Partial` of it, so a key nobody has translated yet
 *    reads in English rather than as a hole.
 * 2. **A missing key has to fail loudly.** `Partial` cannot catch that, so
 *    `narration.test.ts` walks every group of every locale that claims to be
 *    finished. And `coverage.test.ts` walks the other direction — the *source*
 *    of the use cases — so a new sentence cannot be typed straight into
 *    `applyEffect.ts` and ship untranslated.
 * 3. **A sentence with something in it is a function, never a concatenation.**
 *    `${name} spins a ${face}` is English word order baked into a template
 *    literal, and Japanese does not put the verb where English puts it. Every
 *    varying string takes its parts and decides its own shape.
 *
 * What is deliberately *not* here: money, and everything that formats it.
 * `formatMoney` reads the edition's own `CurrencySpec` and goes on doing so in
 * every language — a Japanese player on the India board still counts in ₹.
 * Every function below takes money as a string that has already been formatted
 * by the edition. The same goes for names, tile titles, career titles and house
 * names: those are the board's words, translated by the *edition* overlay, and
 * they arrive here already in the reader's language.
 *
 * ## Card, log, chip — three jobs, three voices
 *
 * A narration is read; a log line is skimmed; a note is a chip glanced at. The
 * English keeps them apart and so must every translation: narration is the
 * host talking, the log is a ledger in the third person, a note is a fact with
 * no sentence around it. Keys are named for which of the three they are —
 * `…Narration`, `…Log`, `…Note` — so a translator can hear the register from
 * the key before reading the string.
 */

import type { InsuranceKind, Hazard } from '@domain/model/types'

export const EN = {
  /** Words the engine prints on more than one kind of card. */
  common: {
    /** The button on every wheel-decided decision. */
    spin: 'Spin',
    /** Stands in for a player the state no longer knows about. */
    someone: 'A player',
  },

  /**
   * The words wrapped around a figure the edition has already formatted.
   *
   * `unit` is the one entry here that takes edition data and hands back a
   * word: an edition names its salary period in English (`'month'`), the same
   * way the chrome catalogue's own `format.unit` does, and this turns that
   * name into a word the reader has.
   */
  format: {
    /** `'month'` → `'month'`. The edition's own period noun, in the reader's language. */
    unit: (raw: string): string => raw,
    /** `$65,000` + `payday` → `$65,000 a payday`. */
    perPeriod: (money: string, unit: string): string => `${money} a ${unit}`,
    /** The same pay, said as a standing fact on a chip. */
    everyPeriod: (money: string, unit: string): string => `${money} every ${unit}.`,
    /** `¥333,333 × 12 months = ¥4,000,000` — a log line, which has no plate beside it. */
    paydayReceipt: (rate: string, periods: number, unit: string, total: string): string =>
      `${rate} × ${periods} ${unit}s = ${total}`,
    /** The same receipt with the answer torn off, for a card that already prints the total. */
    paydayWorking: (rate: string, periods: number, unit: string): string =>
      `${rate} × ${periods} ${unit}s`,
    /** A raise on a board that reads salary as one lump. */
    raiseFlat: (newSalary: string): string => `Salary raised to ${newSalary}`,
    /**
     * A raise on a board that reads salary by its own period. `adjective` is
     * the edition's own English opener (`'Monthly'`); a language that does not
     * build the sentence that way is free to ignore it and use `unit`.
     */
    raiseByPeriod: (adjective: string, delta: string, rate: string, unit: string): string =>
      `${adjective} pay up ${delta} — now ${rate} a ${unit}`,
  },

  /**
   * What a roll table's cells say when they are words rather than money.
   *
   * Every one of these sits in a narrow column beside a die face, so they are
   * fragments by design — the shortest true thing, with no sentence around it.
   */
  roll: {
    /** A swing face that lands exactly nowhere. `¥0` reads as a bug; this does not. */
    breaksEven: 'Breaks even',
    /** A tuition band that costs nothing. */
    fullRide: 'Full ride',
    /** A face that clears no bar — the first row of a gated career table. */
    missed: 'Not this time',
    /** How tall the ladder under an offer is: `2 of 4`. */
    rungOf: (rung: number, height: number): string => `${rung} of ${height}`,
    /** The arrival die's empty face. Stated, never softened. */
    noChild: 'No child this year',
    oneChild: (gift: string): string => `One child, +${gift} in gifts`,
    twins: (gift: string): string => `Twins, +${gift} in gifts`,
    manyChildren: (children: number, gift: string): string => `${children} children, +${gift} in gifts`,
  },

  /** A tile that does nothing, and the log line every landing gets. */
  landing: {
    quietNarration: (name: string): string =>
      `A quiet stretch of road for ${name} — nothing to do but enjoy the view.`,
    landsOnLog: (name: string, title: string): string => `${name} lands on ${title}.`,
  },

  /** Cash on or off a tile, with nothing to decide. */
  money: {
    gainBigNarration: (amount: string, name: string): string =>
      `${amount} into ${name}'s pocket — that is a serious jump up the board!`,
    gainNarration: (name: string): string => `Straight into ${name}'s pocket.`,
    lossBigNarration: (amount: string, name: string): string =>
      `Ouch! ${amount} straight out of ${name}'s wallet.`,
    lossNarration: (name: string): string => `${name} settles it and walks on.`,
    /** The ledger's own shape, and the same for money in and money out. */
    log: (name: string, reason: string, amount: string): string => `${name}: ${reason} (${amount})`,
  },

  /** The wage packet — flat, or decided by the wheel. */
  payday: {
    salaryNarration: (name: string): string => `Payday — ${name} clocks out with the packet in hand.`,
    salaryLog: (name: string, receipt: string): string => `${name} collects payday: ${receipt}.`,
    /** The stakes line over an unsteady week's wheel. */
    casualStakes: 'Between jobs, so you pick up shifts.',
    unsteadyStakes: (trade: string): string => `${trade} — no two weeks pay the same.`,
    /** Where a player has no trade to name. */
    yourTrade: 'Your trade',
    /** The card's own title where the tile is gone — a hand-built decision. */
    cardTitle: 'Payday',
    waitingNarration: (name: string): string => `${name} lines up to spin for the week's pay.`,
    waitingLog: (name: string): string => `${name} is up for a payday spin.`,
    /** The rate, as the one fact the card cannot otherwise show. */
    casualRateNote: (perPip: string): string =>
      `Between jobs — shifts pay ${perPip} for every pip you spin.`,
    tradeRateNote: (trade: string, perPip: string): string =>
      `${trade} — ${perPip} for every pip you spin.`,
    casualNarration: (name: string): string => `No wasted week either — ${name} picks up every shift going.`,
    unsteadyNarration: (name: string): string =>
      `That is what the week was worth to ${name}. The next one will be worth something else.`,
    casualLog: (name: string, spin: number, amount: string): string =>
      `${name} picks up casual shifts, spinning ${spin}: ${amount}.`,
    unsteadyLog: (name: string, spin: number, amount: string): string =>
      `${name} collects payday, spinning ${spin}: ${amount}.`,
    /**
     * Paydays swept past mid-move. `times` is how many were crossed in one
     * move — one is the ordinary case and says nothing about the count.
     */
    passedSalaryLog: (name: string, times: number, receipt: string, balance: string): string =>
      `${name} passes payday${times > 1 ? ` ${times}x` : ''}: ${receipt} — now ${balance}.`,
    passedCasualLog: (name: string, times: number, spins: string, amount: string, balance: string): string =>
      `${name} picks up shifts passing payday${times > 1 ? ` ${times}x` : ''}, spinning ${spins}: ${amount} — now ${balance}.`,
    passedUnsteadyLog: (name: string, times: number, spins: string, amount: string, balance: string): string =>
      `${name} passes payday${times > 1 ? ` ${times}x` : ''}, spinning ${spins}: ${amount} — now ${balance}.`,
    /** `'a 7'`, `'3 and 8'`, `'3, 8 and 2'` — the faces a sweep actually turned. */
    spinList: (spins: readonly number[]): string => {
      if (spins.length === 1) return `a ${spins[0]}`
      return `${spins.slice(0, -1).join(', ')} and ${spins[spins.length - 1]}`
    },
  },

  /** A raise with no review attached. */
  raise: {
    noJobNarration: (name: string): string =>
      `Hard to get a raise with no job. Better luck at the next career fair, ${name}!`,
    noJobLog: (name: string): string => `${name} has no job yet, so there's no raise.`,
    narration: (name: string): string => `A raise for ${name}! Every payday from here on is worth more.`,
    logWithNote: (name: string, note: string): string => `${name}: ${note}.`,
    logFlat: (name: string, salary: string): string => `${name}'s salary is raised to ${salary}.`,
  },

  /** The tuition bill, before and after the wheel. */
  tuition: {
    narration: (name: string): string => `${name} opens the tuition bill.`,
    log: (name: string): string => `${name} is up for the spin: what does tuition come to?`,
    /** The card's own title where the tile is gone — a hand-built decision. */
    cardTitle: 'Tuition Bill',
    fullRideNote: 'No tuition due — a full ride.',
    billLog: (name: string, spin: number, bill: string): string =>
      `${name} spins a ${spin} for tuition: ${bill}.`,
    /** What the log calls each of the three ways the die can land. */
    billCharged: (amount: string): string => amount,
    billPaid: (amount: string): string => `${amount} paid to them`,
    billFullRide: 'a full ride',
  },

  /** The promotion review. */
  promotion: {
    noJobNarration: (name: string): string => `Hard to be promoted with no job. Get hired first, ${name}!`,
    noJobLog: (name: string): string => `${name} has no job, so there is nothing to review.`,
    callingNote: (title: string): string => `There is no rung above ${title}, and there was never going to be.`,
    callingNarration: (name: string): string =>
      `No promotion for ${name} — this is the work, and it is the whole point. A LIFE tile and a raise instead!`,
    callingLog: (name: string, title: string, pay: string): string =>
      `${name} deepens their calling as a ${title}: a LIFE tile, and pay of ${pay}.`,
    topNarration: (name: string): string =>
      `${name} already runs the place — so they simply write themselves a better number.`,
    topLog: (name: string, title: string, pay: string): string =>
      `${name} is already at the top as a ${title}, and takes a rise to ${pay}.`,
    stakes: (reason: string, needed: number, faces: number, nextTitle: string): string =>
      `${reason} You need a ${needed} or higher (out of ${faces}) to move up to ${nextTitle}. Miss it and you still take a raise.`,
    narration: (name: string): string => `${name} is up for review.`,
    log: (name: string, nextTitle: string): string => `${name} is up for review: ${nextTitle} on the line.`,
    cardTitle: 'Review',
    /** Passed over, but paid — the one line, and it is the good news. */
    raiseAnywayNote: (salary: string): string => `A raise anyway: ${salary}`,
    missedNarration: (name: string): string =>
      `Not this time, ${name} — but they find you a raise on the way out of the room.`,
    missedLog: (name: string, spin: number, nextTitle: string, pay: string): string =>
      `${name} spins a ${spin} and is passed over for ${nextTitle}, taking a rise to ${pay}.`,
    doubleNarration: (name: string, title: string): string =>
      `The top of the wheel! They skip a whole rung: ${name} is a ${title}, and the room is not sure what just happened.`,
    promotedNarration: (name: string, title: string): string => `Promoted! ${name} is a ${title} now.`,
    promotedLog: (name: string, spin: number, title: string, pay: string): string =>
      `${name} spins a ${spin} and is promoted to ${title}: ${pay}.`,
  },

  /** LIFE tiles dealt by a tile that simply hands them over. */
  lifeTile: {
    narration: (name: string): string => `${name} picks up a LIFE tile — those all count at the very end!`,
    log: (name: string, titles: string): string => `${name} gains a life tile: ${titles}.`,
  },

  /** School, and the two things it hands over. */
  school: {
    degreeNote: 'Earned a degree!',
    degreeNarration: (name: string): string =>
      `Cap in the air! ${name} is a graduate, and the big careers just opened up.`,
    degreeLog: (name: string): string => `${name} graduates and earns a degree!`,
    doctorateNote: 'Earned a doctorate!',
    doctorateNarration: (name: string): string =>
      `Doctor ${name}. Years of it, and the work nobody else is qualified for is open now.`,
    doctorateLog: (name: string): string => `${name} is awarded a doctorate!`,
  },

  /** Every tile that deals a job, and the one that takes it away. */
  career: {
    /** The income a player is being asked to give up. */
    betweenJobsIncome: (wage: string): string =>
      `You are between jobs, picking up shifts at ${wage} a pip.`,
    /** Slash-joined, unlike every other wage on the board: this one is an aside inside a prompt. */
    currentIncome: (money: string, unit: string, title: string): string =>
      `You currently earn ${money}/${unit} as a ${title}.`,
    fairPrompt: 'Choose your career path',
    fairPromptWithIncome: (income: string): string => `Choose your career path. ${income}`,
    fairNarration: (name: string): string =>
      `Two offers on the table — spin to see which one is yours, ${name}!`,
    fairLog: (name: string): string => `${name} spins for a career.`,
    /** A competition four faces in six lose. The half a table cannot say. */
    gateStakes: 'Most people do not get one.',
    stayLabel: (title: string): string => `Stay as a ${title}`,
    stayCallingDescription: 'This is the work you were made for. Let the recruiters talk to somebody else.',
    stayDescription: 'Keep the job, the ladder, and every rung still above you.',
    crossingLine: 'Two doors in, and neither counts a year of what you did before.',
    sameLevelLine: 'Two other trades would take you at the level you are on.',
    gatePrompt: (gate: number, income: string): string =>
      `Two posts are open across the whole country, and the panel appoints on a ${gate} or better. ${income}`,
    offerPrompt: (opening: string, income: string): string => `${opening} ${income}`,
    forcedPrompt: (income: string): string => `Your job is changing — pick your next one. ${income}`,
    gateMissNote: 'Miss it and nothing changes: the job, the rung and the money are all still yours.',
    crossingNote: 'They are hiring at the bottom rung, and only at the bottom rung.',
    sameRungNote: 'Same rung, same money today — but a different ladder above it.',
    gateNarration: (name: string): string =>
      `Two posts, one panel, and the whole country applying — ${name} sits it.`,
    offerNarration: (name: string): string =>
      `Two offers on the table for ${name} — and nobody is making them take either.`,
    forcedNarration: (name: string): string =>
      `New offers on the table — ${name} is changing careers whether they like it or not!`,
    gateLog: (reason: string, name: string): string => `${reason} ${name} sits the competition.`,
    offerLog: (reason: string, name: string): string => `${reason} ${name} weighs up two offers.`,
    forcedLog: (reason: string, name: string): string => `${reason} ${name} must pick a new career.`,
    /** Staying put: nothing changes, and nothing is supposed to. */
    stayCardTitle: 'Staying Put',
    stayNote: (title: string, pay: string): string => `Still a ${title}, on ${pay}.`,
    stayNarration: (name: string): string =>
      `${name} turns them both down. They like it here, and there is further to go yet.`,
    stayLog: (name: string, title: string): string => `${name} stays a ${title}.`,
    /** A gate that did not open. The job, the rung and the money are where they were. */
    gateMissCardTitle: 'The Result',
    gateMissEmployedNote: (title: string, pay: string): string => `Still a ${title}, on ${pay}.`,
    gateMissJoblessNote: 'Still between jobs, and still eligible to sit it again.',
    gateMissNarration: (name: string): string =>
      `Not this time. The list is posted, ${name} is not on it, and nothing else about the year has changed.`,
    gateMissLog: (name: string, spin: number): string => `${name} spins a ${spin} and is not appointed.`,
    /** The job actually taken. */
    hiredCardTitle: 'New Career',
    switchedNarration: (name: string, previous: string, title: string): string =>
      `Out with the old — ${name} leaves the ${previous} life behind to become a ${title}.`,
    hiredNarration: (name: string, title: string): string =>
      `${name} is hired as a ${title} — the paydays start counting now!`,
    hiredLog: (name: string, spin: number, title: string): string =>
      `${name} spins a ${spin} and becomes a ${title}.`,
  },

  /** Being laid off, and the two kinds of work it cannot reach. */
  layoff: {
    noJobNarration: (name: string): string => `You cannot lose a job you never had. ${name} shrugs and walks on.`,
    noJobLog: (name: string): string => `${name} is already out of work.`,
    callingNote: (title: string): string => `Still a ${title}, and nobody can take that away.`,
    callingNarration: (name: string): string =>
      `They cannot lay ${name} off — this is a calling, and it does not come with a badge to hand back.`,
    callingLog: (name: string, title: string): string => `${name} cannot lose their calling as a ${title}.`,
    permanentNote: (title: string): string => `Still a ${title}. The post is permanent, and permanent means this.`,
    permanentNarration: (name: string): string =>
      `The notice goes round the building and stops at ${name}'s door — this post is not the employer's to end.`,
    permanentLog: (name: string, title: string): string => `${name} keeps their permanent post as a ${title}.`,
    note: (lost: string, perPip: string): string => `No longer a ${lost}. Shifts pay ${perPip} a pip.`,
    narration: (name: string): string =>
      `Laid off! ${name} is out of work — from here every payday is shift work, and the wheel decides how good the week was.`,
    log: (name: string, lost: string): string => `${name} loses their job as a ${lost}.`,
  },

  /** The wedding, and the year spent single instead. */
  marriage: {
    alreadyNarration: (name: string): string =>
      `${name} is already spoken for. They wave at the happy couple and walk on.`,
    alreadyLog: (name: string): string => `${name} is already married.`,
    stakes: (needed: number, faces: number): string =>
      `A ${needed} or higher (out of ${faces}) and it's a yes outright. Lower gets a kinder second ask before it's a no.`,
    narration: (name: string): string => `${name} takes a knee.`,
    log: (name: string): string => `${name} is up for the spin: will they marry?`,
    cardTitle: 'Wedding Day',
    refusedNote: (spin: number): string => `Asked again, spun a ${spin} — not this year, and not next year either.`,
    refusedSecondNote:
      'Single, and the road ahead is entirely yours: children, Family Lane and every bonus on it are still open.',
    refusedNarration: (name: string): string =>
      `No wedding for ${name} — so they spend the year on themselves instead, and it makes a far better story.`,
    refusedLog: (name: string, asked: number, askedAgain: number): string =>
      `${name} spins a ${asked} and a ${askedAgain}: no wedding, but a LIFE tile out of the year.`,
    rescuedNote: (spin: number): string => `Asked again, spun a ${spin} — and this time, yes.`,
    giftNote: (payer: string, gift: string): string => `${payer} pays a ${gift} wedding gift.`,
    windfallNote: (amount: string): string => `Two incomes: ${amount}`,
    costNote: (amount: string): string => `The bill for it all: ${amount}`,
    costlyNarration: (amount: string, name: string): string =>
      `Married! And already ${amount} down, ${name} — nobody tells you about that part.`,
    quietNarration: (name: string): string =>
      `Wedding bells for ${name} — a quiet ceremony, but a very happy one.`,
    lavishNarration: (name: string): string =>
      `The wedding of the year! Everybody at this table is paying for it, ${name}.`,
    marriedNarration: (name: string): string =>
      `Wedding bells for ${name}! Everybody else, hand over those gift envelopes.`,
    costlyLog: (name: string, amount: string): string => `${name} gets married, and is ${amount} worse off for it.`,
    marriedLog: (name: string): string => `${name} gets married!`,
  },

  /** The joint account — the half of marriage that keeps happening after the wedding. */
  household: {
    singleNarration: (name: string): string => `${name} answers to nobody about money this month.`,
    singleLog: (name: string): string => `${name} has only themselves to answer to.`,
    stakes: (reason: string): string => `${reason} — the spending against the two incomes.`,
    narration: (name: string): string => `${name} opens the joint statement.`,
    log: (name: string): string => `${name} is up for the spin: how did the joint account do?`,
    cardTitle: 'The Joint Account',
    downNarration: (name: string): string => `Your partner has been shopping, ${name}. That is the month gone.`,
    evenNarration: 'The joint account lands exactly where it started. Nobody wins that argument.',
    upNarration: (name: string): string => `Two incomes and a good month for ${name}!`,
    downLog: (name: string, spin: number, amount: string): string =>
      `${name}'s joint account takes a hit, spinning a ${spin}: ${amount}.`,
    upLog: (name: string, spin: number, amount: string): string =>
      `${name}'s household comes out ahead, spinning a ${spin}: ${amount}.`,
  },

  /** A year in the trade — the tile that changes the money and not the job. */
  tradeYear: {
    noJobNarration: (name: string): string =>
      `${name} has no trade to have a year in. The year happens to somebody else.`,
    noJobLog: (name: string): string => `${name} is between jobs, so the year passes them by.`,
    stakes: (reason: string, title: string): string =>
      `${reason} Nobody is offering you a different job — only this one, for another year as a ${title}.`,
    narration: (name: string): string => `${name} looks back on the year in the trade.`,
    log: (name: string): string => `${name} is up for the spin: what kind of year was it?`,
    cardTitle: 'The Year in the Trade',
    noTradeNarration: (name: string): string => `${name} has no trade to have a year in.`,
    sameRungNote: (title: string): string => `Still a ${title}, on the same rung.`,
    goodLog: (name: string, title: string, spin: number, amount: string): string =>
      `${name} has a good year as a ${title}, spinning a ${spin}: ${amount}.`,
    badLog: (name: string, title: string, spin: number, amount: string): string =>
      `${name} has a bad year as a ${title}, spinning a ${spin}: ${amount}.`,
  },

  /**
   * A new arrival.
   *
   * The house rule for the empty face, which every translation inherits: state
   * it, do not soften it. No consolation, no "better luck next time". Two faces
   * in six are a year in which no child arrived, which is not a losing roll.
   */
  baby: {
    stakes: 'Whether the house grows this year.',
    narration: (name: string): string => `${name} is up for the spin: who is in the house next year?`,
    log: (name: string): string => `${name} spins for a new arrival.`,
    cardTitle: 'New Baby',
    noneNarration: 'No child this year. The house stays the size it is.',
    /** With a face behind it, and without — a certain tile never asked for one. */
    noneLog: (name: string): string => `${name} has no child this year.`,
    noneSpunLog: (name: string, face: number): string => `${name} spins a ${face} and has no child this year.`,
    oneNarration: (name: string): string => `Congratulations ${name} — the family just got bigger!`,
    twinsNarration: (name: string): string => `Two at once! ${name}'s family just got a good deal bigger.`,
    arrivalNote: (children: number): string => `+${children} ${children === 1 ? 'child' : 'children'}`,
    giftNote: (gift: string): string => `${gift} in gifts`,
    arrivedLog: (name: string, children: number, gift: string): string =>
      `${name} welcomes ${children} ${children === 1 ? 'child' : 'children'}, and ${gift} in gifts.`,
    arrivedSpunLog: (name: string, face: number, children: number, gift: string): string =>
      `${name} spins a ${face} and welcomes ${children} ${children === 1 ? 'child' : 'children'}, and ${gift} in gifts.`,
  },

  /** Buying a home, and trading one up. */
  house: {
    buyPrompt: 'Buy a home now, sell it again at retirement',
    keepRentingLabel: 'Keep renting for now',
    keepRentingDescription: 'Keep the cash, and own nothing to sell at retirement.',
    /** The one number a house keeps hidden: what it sells for at the end. */
    optionDescription: (description: string, resale: string): string =>
      `${description} Sells for ${resale} at retirement.`,
    huntNarration: (name: string): string => `Time to go house hunting, ${name}. Pick a front door!`,
    huntLog: (name: string): string => `${name} is house hunting.`,
    noneToUpgradePrompt: 'Nothing to trade up — buy your first, and sell it at retirement?',
    noneToUpgradeNarration: (name: string): string =>
      `No home to upgrade yet, so let's go shopping instead, ${name}!`,
    noneToUpgradeLog: (name: string): string => `${name} has no home to trade up, so goes house hunting.`,
    bestNarration: (name: string): string =>
      `There is nothing left to trade up to — ${name} already owns the best address in town!`,
    bestLog: (name: string): string => `${name} already owns the best home available.`,
    upgradePrompt: (current: string): string => `Trade up from the ${current}? A dearer house sells for more`,
    stayLabel: (current: string): string => `Stay in the ${current}`,
    stayDescription: 'Keep the home you have, and whatever it already sells for at retirement.',
    tradeInNote: (current: string, price: string): string => `Your ${current} is worth ${price} towards the move.`,
    upgradeNarration: (name: string): string => `Time to trade up, ${name}. What is it going to be?`,
    upgradeLog: (name: string): string => `${name} is offered a bigger home.`,
    cardTitle: 'House Hunting',
    boughtCardTitle: 'New Home',
    stayNarration: (name: string, house: string): string =>
      `${name} likes the ${house} just fine, thank you very much.`,
    keepRentingNarration: (name: string): string =>
      `${name} keeps renting — that cash might be worth more elsewhere!`,
    stayLog: (name: string, house: string): string => `${name} stays in the ${house}.`,
    keepRentingLog: (name: string): string => `${name} keeps renting for now.`,
    tradeInCreditNote: (price: string): string => `Old home credited back at ${price}.`,
    tradedUpNarration: (name: string, previous: string, house: string): string =>
      `Moving up in the world! ${name} trades the ${previous} for the ${house}.`,
    boughtNarration: (name: string, house: string): string =>
      `${name} gets the keys to the ${house} — a home of their own at last!`,
    tradedUpLog: (name: string, house: string): string => `${name} trades up to the ${house}.`,
    boughtLog: (name: string, house: string): string => `${name} buys the ${house}.`,
  },

  /** The trading floor, and the dividend it pays later. */
  stock: {
    optionLabel: (name: string, ticker: string): string => `${name} (${ticker})`,
    optionDescription: (description: string, low: string, high: string): string =>
      `${description} Pays out ${low}–${high} a share at retirement.`,
    /** The unit a share price is quoted by, beside the figure on an option. */
    shareUnit: 'share',
    declineLabel: 'Keep your cash',
    declineDescription: 'Nothing spent, and nothing paying out at retirement either.',
    prompt: 'Buy in now for a payout at retirement?',
    narration: (name: string): string => `The trading floor is open, ${name}. Fancy a punt?`,
    log: (name: string): string => `${name} is offered shares to buy.`,
    cardTitle: 'Trading Floor',
    declinedNarration: (name: string): string =>
      `${name} keeps their money in their pocket — nobody ever lost it that way.`,
    declinedLog: (name: string): string => `${name} passes on the shares.`,
    boughtNote: (shares: number): string => `${shares} ${shares === 1 ? 'share' : 'shares'} bought.`,
    payoutNote: (low: string, high: string): string =>
      `Each share cashes out between ${low} and ${high} at retirement.`,
    boughtNarration: (name: string, ticker: string): string =>
      `${name} buys into ${ticker}! We find out at retirement whether that was genius or nerve.`,
    boughtLog: (name: string, shares: number, ticker: string, cost: string): string =>
      `${name} buys ${shares} ${shares === 1 ? 'share' : 'shares'} of ${ticker} for ${cost}.`,
    dividendNoneNarration: (name: string): string =>
      `Dividend day, but ${name} does not own a single share. Nothing to collect!`,
    dividendNoneLog: (name: string): string => `${name} holds no shares, so the dividend pays nothing.`,
    dividendNote: (shares: number, perShare: string): string =>
      `${shares} ${shares === 1 ? 'share' : 'shares'} × ${perShare}`,
    dividendNarration: (name: string, payout: string): string =>
      `Dividend day! ${name}'s portfolio pays out ${payout}.`,
    dividendLog: (name: string, shares: number, payout: string): string =>
      `${name} collects a dividend on ${shares} ${shares === 1 ? 'share' : 'shares'}: ${payout}.`,
  },

  /**
   * The insurance office.
   *
   * Every policy is priced as a bet rather than a freebie, which is why the
   * cover lines name both the bill they waive and how often the trouble lands.
   */
  insurance: {
    policyLabel: (kind: InsuranceKind): string =>
      kind === 'home' ? 'Home Policy' : kind === 'auto' ? 'Auto Policy' : 'Life Policy',
    /** The same policy named mid-sentence, where English wants it lowercase. */
    policyInline: (kind: InsuranceKind): string =>
      kind === 'home' ? 'home policy' : kind === 'auto' ? 'auto policy' : 'life policy',
    hazard: (hazard: Hazard): string => (hazard === 'fire' ? 'fire' : 'accident'),
    /** The trouble a cover policy is against, as it appears mid-sentence. */
    troubleFire: 'a house fire',
    troubleCrash: 'a crash',
    /** How many lives actually meet it. Qualitative, because the odds move with difficulty. */
    oddsFire: 'Few lives ever have one',
    oddsCrash: 'Plenty of lives have one',
    coverNone: (trouble: string): string =>
      `Nothing ahead of you can bill you for ${trouble}. This would cover a road you have already driven.`,
    coverAhead: (count: number, worst: string, trouble: string, odds: string): string =>
      `${count === 1 ? 'One stretch of road ahead bills' : `${count} stretches of road ahead bill`} up to ${worst} for ${trouble}. ${odds}, and you pay the premium either way.`,
    lifeFund: (floor: string, ceiling: string): string =>
      `Not cover — a fund. It matures on the wheel at the end, anywhere from ${floor} to ${ceiling}.`,
    declineLabel: 'Take the risk',
    declineDescription: 'Keep the premium. Most lives are fine without it, and the ones that are not pay in full.',
    prompt: 'A premium now, or the whole bill if it happens?',
    narration: (name: string): string =>
      `The insurance office is open, ${name}. A premium now can save a fortune later.`,
    log: (name: string): string => `${name} is offered insurance.`,
    alreadyNarration: (name: string): string => `${name} is already covered on everything on offer. Walk on!`,
    alreadyLog: (name: string): string => `${name} is already covered here.`,
    cardTitle: 'Insurance Office',
    declinedNarration: (name: string): string => `${name} takes the risk and walks out uninsured. Fingers crossed!`,
    declinedLog: (name: string): string => `${name} declines a policy.`,
    lifeNote: 'It matures at retirement and pays straight into the final total.',
    coverNote: (kind: InsuranceKind): string =>
      `A ${kind === 'home' ? 'house fire' : 'road accident'} now costs you nothing.`,
    boughtNarration: (name: string): string =>
      `${name} is covered, and that premium could look very clever before the game is out.`,
    boughtLog: (name: string, policy: string, premium: string): string =>
      `${name} takes out ${policy} for ${premium}.`,
    /** A premium that has just earned itself back. */
    coversItNote: (policy: string): string => `Your ${policy} covers it.`,
    coveredNarration: (hazard: string, name: string): string =>
      `Insured! That ${hazard} just cost ${name} nothing at all.`,
    coveredLog: (name: string, policy: string, amount: string): string =>
      `${name} is covered: the ${policy} waives ${amount}.`,
  },

  /** The bank. */
  bank: {
    loanLabel: 'Take out a loan',
    loanDescription: (principal: string, settlement: string): string =>
      `Borrow ${principal} now and pay back ${settlement} at retirement — cash in hand for a house, shares, or a bill you cannot cover.`,
    repayLabel: 'Repay a loan early',
    repayDescription: (early: string, settlement: string, saved: string): string =>
      `Clear one loan now for ${early} instead of ${settlement} at retirement — ${saved} that stays in your final total.`,
    declineLabel: 'Walk on by',
    declineDescription: 'No cash today, and nothing new owed at retirement.',
    prompt: 'Cash now, or a smaller bill at retirement?',
    narration: (name: string): string => `The bank is open, ${name}. Borrow, repay, or stroll right past.`,
    log: (name: string): string => `${name} stops at the bank.`,
    cardTitle: 'The Bank',
    declinedNarration: (name: string): string => `${name} walks straight past the bank. No debts, no drama.`,
    declinedLog: (name: string): string => `${name} leaves the bank empty-handed.`,
    carryingNote: (loans: number): string => `Now carrying ${loans} loan${loans > 1 ? 's' : ''}.`,
    borrowedNarration: (principal: string, name: string): string =>
      `${principal} of the bank's money for ${name} — spend it well, it wants more back!`,
    borrowedLog: (name: string, principal: string): string => `${name} takes out a loan: ${principal}.`,
    outstandingNote: (loans: number): string => `${loans} loan${loans > 1 ? 's' : ''} still outstanding.`,
    debtFreeNarration: (name: string): string =>
      `Debt free! ${name} clears the last loan and walks out of that bank standing tall.`,
    repaidNarration: (name: string): string =>
      `${name} chips a loan off the pile — cheaper now than it would be at retirement.`,
    repaidLog: (name: string, amount: string): string => `${name} repays a loan early for ${amount}.`,
  },

  /** Bills and benefits that count heads. */
  children: {
    timesNote: (children: number, amount: string): string => `${children} × ${amount}`,
    noneToPayNarration: (name: string): string => `No children, no bill. ${name} strolls straight past this one.`,
    noneToPayLog: (name: string): string => `${name} has no children, so there is nothing to pay.`,
    payNarration: (amount: string): string => `${amount} out the door. Family life is not cheap!`,
    payLog: (name: string, amount: string, children: number): string =>
      `${name} pays ${amount} for ${children} children.`,
    noneToClaimNarration: (name: string): string => `No children to claim for, so nothing for ${name} this time.`,
    noneToClaimLog: (name: string): string => `${name} has no children, so there is nothing to claim.`,
    collectNarration: (amount: string): string => `That is ${amount} in — the family pays off this time!`,
    collectLog: (name: string, amount: string, children: number): string =>
      `${name} collects ${amount} for ${children} children.`,
  },

  /** The end of a marriage. */
  divorce: {
    singleNarration: (name: string): string => `${name} has nobody to separate from. They walk on.`,
    singleLog: (name: string): string => `${name} is not married, so there is nothing to end.`,
    settlementNote: (amount: string): string => `Settlement: ${amount}`,
    childrenNote: (children: number): string =>
      `${children} ${children === 1 ? 'child' : 'children'} leave with them.`,
    narration: (name: string): string =>
      `${name}'s marriage ends, and the house is a good deal quieter than it was.`,
    log: (name: string, amount: string): string => `${name} divorces and pays a ${amount} settlement.`,
  },

  /** Money that moves between players, and tiles that take from one. */
  upset: {
    payerDownToNote: (payer: string, balance: string): string => `${payer} is down to ${balance}.`,
    collectNarration: (name: string): string => `Everybody pays up — ${name} is collecting!`,
    collectLog: (name: string, amount: string): string => `${name} collects ${amount} from each other player.`,
    recipientUpToNote: (recipient: string, balance: string): string => `${recipient} is up to ${balance}.`,
    payEachNarration: (name: string): string => `The round is on ${name} — everybody else gets paid!`,
    payEachLog: (name: string, amount: string): string => `${name} pays ${amount} to each other player.`,
    swapAheadNarration: (name: string): string => `${name} is already out in front, so there is nothing to swap!`,
    swapNobodyNarration: (name: string): string =>
      `There is nobody left to swap wallets with. ${name} keeps every penny.`,
    swapNobodyLog: (name: string): string => `${name} has nobody to swap money with.`,
    swapNote: (mine: string, theirs: string): string => `Wallets swapped: ${mine} ↔ ${theirs}`,
    swapNarration: (name: string, leader: string): string =>
      `Swap! ${name} takes ${leader}'s wallet, and the whole board just changed shape!`,
    swapLog: (name: string, leader: string, amount: string): string =>
      `${name} swaps money with ${leader} — ${amount} changes hands!`,
    stealNoneNarration: (name: string): string =>
      `Nobody else is holding a LIFE tile, so ${name} leaves empty-handed.`,
    stealNoneLog: (name: string): string => `${name} finds no LIFE tile to take.`,
    stealNote: (value: string): string => `Worth ${value} at the final count.`,
    stealNarration: (name: string, tile: string, victim: string): string =>
      `${name} swipes “${tile}” right out of ${victim}'s hands!`,
    stealLog: (name: string, tile: string, victim: string): string =>
      `${name} takes the “${tile}” LIFE tile from ${victim}!`,
  },

  /** A die that simply pays out. */
  spinForMoney: {
    narration: (name: string): string => `${name} lines up for the spin.`,
    log: (name: string, reason: string): string => `${name} is up for a spin: ${reason}`,
    cardTitle: 'Spin',
    resultNarration: (name: string): string => `The wheel has spoken, and ${name} banks it.`,
    resultLog: (reason: string, name: string, spin: number, amount: string): string =>
      `${reason} ${name} spins a ${spin}: ${amount}.`,
  },

  /** Reaching the end of the road. */
  retire: {
    rankNote: (rank: number): string => `Retirement rank #${rank}`,
    narration: (name: string): string => `${name} is home free! Feet up, the hard part is over.`,
    log: (name: string): string => `${name} retires!`,
  },

  /** Stopping early, on a number. */
  fire: {
    takeLabel: 'Call it a life',
    takeDescription:
      'Stop working today and take the next retirement place — forfeiting every payday still on the road.',
    declineLabelAffordable: 'Not yet — keep working',
    declineLabel: 'Keep working',
    declineDescriptionAffordable:
      'Walk on, collect the rest of the paydays, and take whatever else the last stretch of road has in it.',
    declineDescription: 'Walk on and keep earning.',
    promptAffordable: (balance: string): string => `You have ${balance}. Is that enough?`,
    promptShort: (target: string, balance: string): string => `The number is ${target}. You have ${balance}.`,
    noteAffordable: 'The fund buys the rest of your life back, or it does not. One spin.',
    noteShort: (target: string): string => `You need ${target} in hand to buy your way out here.`,
    narrationAffordable: (name: string): string =>
      `${name} does the sums at the kitchen table. Enough to stop — or is one more year better?`,
    narrationShort: (name: string): string =>
      `${name} does the sums at the kitchen table, and the sums say keep going.`,
    logAffordable: (name: string): string => `${name} works out whether to stop working for good.`,
    logShort: (name: string): string => `${name} is short of the number and walks on.`,
    cardTitle: 'The Number',
    declinedNarration: (name: string): string =>
      `${name} decides the number can wait. There is road left, and road pays.`,
    declinedLog: (name: string): string => `${name} keeps working.`,
    bonusNote: (payout: string): string => `Bonus: ${payout}`,
    stakeNote: (target: string): string => `${target} went into the fund to get there.`,
    rankNote: (rank: number): string =>
      `Retirement rank #${rank}, and every payday still on the road belongs to somebody else now.`,
    goodNarration: (name: string): string =>
      `The fund comes back well ahead and ${name} never works another day. That is how it is done.`,
    badNarration: (name: string): string =>
      `The fund comes back at less than went into it. ${name} stopped a year too soon, and there is no going back.`,
    evenNarration: (name: string): string =>
      `${name} stops working for good. No more paydays — and no more bills either.`,
    retiredLog: (name: string, target: string, spin: number, payout: string): string =>
      `${name} retires early: ${target} into the fund, a spin of ${spin}, ${payout} back.`,
  },

  /** The pawn itself: forks, roads, distance. */
  move: {
    /** A branch with no lane name and no tile to borrow one from. */
    unnamedRoad: 'a new road',
    forkPrompt: 'Which way do you go?',
    forkPromptWithSteps: (steps: number): string =>
      `Which way do you go? You'll travel ${steps} space${steps === 1 ? '' : 's'} down it.`,
    takesRoadLog: (name: string, road: string): string => `${name} takes ${road}.`,
    /** The road ahead, where the board could not name one. */
    roadAhead: 'the road ahead',
    headsTowardLog: (name: string, destination: string): string => `${name} heads toward ${destination}.`,
    forkLog: (name: string, spin: number, road: string): string =>
      `${name} spins a ${spin} — the fork sends them onto ${road}.`,
    forkWithStepsLog: (name: string, spin: number, road: string, steps: number): string =>
      `${name} spins a ${spin} — the fork sends them onto ${road}, ${steps} space${steps === 1 ? '' : 's'} down it.`,
    spinLog: (name: string, spin: number): string => `${name} spins a ${spin}.`,
    pullsUpAtForkLog: (name: string, title: string): string =>
      `${name} pulls up at ${title}, where the road splits.`,
  },

  /** Opening and closing a turn, and the game around them. */
  turn: {
    welcomeLog: (names: readonly string[]): string => `Welcome to LIFE JOURNEY! Players: ${names.join(', ')}.`,
    nextLog: (name: string): string => `${name}'s turn.`,
    nextPlayer: 'Next player',
    everybodyRetiredLog: 'Everybody has retired. Time to find out what it was all worth.',
  },

  /** The closing settlement: one die per holding, then the standings. */
  settlement: {
    housePrompt: (name: string): string => `${name}'s house`,
    houseStakes: (house: string): string => `${house} goes on the market.`,
    theHouse: 'The house',
    policyPrompt: (name: string): string => `${name}'s life policy`,
    policyStakes: 'The policy matures. What it paid for over a lifetime is what the fund made.',
    sharesPrompt: (name: string): string => `${name}'s shares`,
    sharesStakes: (shares: number, companies: number): string =>
      `${shares} ${shares === 1 ? 'share' : 'shares'} in ${companies} ${companies === 1 ? 'company' : 'companies'} cash out at whatever the market closes on.`,
    houseLog: (face: number, name: string, amount: string): string =>
      `Spun a ${face} — ${name}'s house sold for ${amount}.`,
    marketLog: (face: number, name: string, amount: string): string =>
      `Spun a ${face} — ${name}'s shares cashed out at ${amount}.`,
    policyLog: (face: number, name: string, amount: string): string =>
      `Spun a ${face} — ${name}'s life policy matured at ${amount}.`,
    oneStarLog: (name: string, bonus: string): string =>
      `One of ${name}'s children turned out to be a star — ${bonus} into the final total!`,
    starsLog: (stars: number, name: string, bonus: string): string =>
      `${stars} of ${name}'s children turned out to be stars — ${bonus} into the final total!`,
    gameOverLog: (winner: string, total: string): string => `The game is over! ${winner} wins with ${total}.`,
  },
}

/** The shape every locale is measured against. The English catalogue *is* the type. */
export type NarrationText = typeof EN

/**
 * One language's rewrite of it: any subset of the catalogue, group by group.
 *
 * Deliberately not a required total — see rule 1 in the file header. What
 * stops a language shipping half-finished *by accident* is `narration.test.ts`,
 * which is a test rather than a type precisely so a language can be shipped
 * half-finished on purpose while it is being written.
 */
export type NarrationOverlay = { readonly [G in keyof NarrationText]?: Partial<NarrationText[G]> }
