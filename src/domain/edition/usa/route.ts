import type { RouteBranch, RouteDefinition, SpaceContent } from '../../board/route'
import {
  EVERY_BOARD,
  LONG_ONLY,
  STANDARD_UP,
  flavour,
  fork,
  missedPayday,
  payday,
  run,
  setback,
} from '../../board/route'

/**
 * The USA route: the board this game has always had, written down.
 *
 * Not one tile, tier, hardship or sum of money has changed in the move — the
 * board built from this file is the board `createBoard` used to hold inline,
 * space for space and coordinate for coordinate. That is the entire point of
 * it: the route became data without the game noticing, so the next country
 * only has to be *written*, not reverse-engineered.
 *
 * The shape below reads as the life it describes. Lanes are written at their
 * longest and thinned per board length by their tiers; the trunk is a list of
 * segments at the bottom of the file, and a new fork in the middle of one of
 * these acts is one entry added to that list.
 *
 * The voice rule, applied on every tile below: short sentences, plain words,
 * and any joke stated plainly rather than implied. A reader who is not a
 * native English speaker should understand a tile on the first read, exactly
 * as fast as a native speaker would.
 */

const START: SpaceContent = {
  ...flavour(EVERY_BOARD, 'start', 'Start of Life', 'Your journey begins here, wallet light and the future wide open.', 'slate', 'space:start-of-life'),
  kind: 'start',
}

/**
 * College Lane: the degree is real, and so is the bill.
 *
 * Tuition used to be an ordinary tile in the middle of the lane, which meant
 * the $40,000 it charges was collected from roughly one walker in six — the
 * other five spun straight over it and graduated for nothing. A cost that is
 * usually dodged is not a cost, it is decoration, and it is most of the reason
 * the lane could be strictly better than working. It is a `stop` now: everyone
 * who enrols pays, once, in full, and the student loan that follows is on the
 * road out.
 */
const COLLEGE_LANE: readonly SpaceContent[] = [
  // EVERY_BOARD, not STANDARD_UP: this is the fork's first step. Thinned away
  // on a short board it left the tuition stop as the branch's very first tile
  // — an instant forced halt, so the roll that chose it never mattered.
  flavour(EVERY_BOARD, 'college-1', 'Move-In Day', 'You haul boxes into a tiny dorm room and call it home.', 'blue', 'space:move-in-day', {
    from: 'hard',
    description: 'You haul boxes into a tiny dorm room, and the dorm office asks for a deposit on the way in.',
    effect: { type: 'payMoney', amount: 1_400, reason: 'Dorm deposit' },
  }),
  {
    id: 'college-2', kind: 'stop', title: 'Tuition Bill',
    description: "The registrar's office sends a bill that is shockingly high, and nobody enrolls until it is paid.",
    effect: { type: 'tuition', reason: 'College tuition' },
    tone: 'blue', icon: 'space:tuition-bill', tier: EVERY_BOARD,
  },
  flavour(LONG_ONLY, 'college-3', 'Late-Night Study', "Coffee, highlighters, and a textbook you swear you'll finish.", 'blue', 'space:late-night-study', {
    from: 'hard',
    description: 'Coffee, highlighters, and a print shop that charges by the page for all of it.',
    effect: { type: 'payMoney', amount: 500, reason: 'Coffee and printing' },
  }),
  setback('veryHard', STANDARD_UP, 'college-laptop', 'Laptop Dies',
    'Your laptop breaks two days before the deadline, and the replacement is not the cheap one.',
    { type: 'payMoney', amount: 3_000, reason: 'Emergency laptop' },
    'blue', 'space:late-night-study'),
  {
    id: 'college-4', kind: 'normal', title: 'Campus Job',
    description: 'A work-study job in the library turns into real hours and a genuinely useful paycheck.',
    effect: { type: 'gainMoney', amount: 9_000, reason: 'Work-study paycheck' },
    tone: 'blue', icon: 'space:campus-job', tier: EVERY_BOARD,
  },
  setback('hard', EVERY_BOARD, 'college-overdraft', 'Overdraft Fee',
    'The account dips below zero for a single day, and the bank notices before you do.',
    { type: 'payMoney', amount: 300, reason: 'Overdraft charges' },
    'blue', 'finance:bank-visit'),
  flavour(LONG_ONLY, 'college-5', 'Group Project', 'Somehow you end up doing most of the slides. Again.', 'blue', 'space:group-project', {
    from: 'hard',
    description: 'Somehow you end up doing most of the slides, and buying the poster board for all five of you.',
    effect: { type: 'payMoney', amount: 400, reason: 'Project supplies' },
  }),
  {
    id: 'college-6', kind: 'normal', title: 'Scholarship Win',
    description: 'Your essay wins a scholarship nobody expected, and it covers a big part of the bill.',
    effect: { type: 'gainMoney', amount: 24_000, reason: 'Scholarship award' },
    tone: 'blue', icon: 'space:scholarship-win', tier: EVERY_BOARD,
  },
  {
    id: 'college-ramen', kind: 'normal', title: 'Ramen Weeks',
    description: 'Dinner is instant noodles for two weeks straight, and the grocery bill still stings.',
    effect: { type: 'payMoney', amount: 600, reason: 'Groceries on a student budget' },
    tone: 'blue', icon: 'space:grocery-run', tier: LONG_ONLY,
  },
  // EVERY_BOARD, not STANDARD_UP, and the same for Scholarship Win above:
  // college used to shrink to move-in, tuition, one paycheck and a cap and
  // gown on a short board — four years compressed into a handful of tiles.
  // These two were already written and already good; they just needed to
  // survive the thinning.
  flavour(EVERY_BOARD, 'college-7', 'Finals Week', 'Five exams in four days. You survive on instant noodles.', 'blue', 'space:finals-week', {
    from: 'hard',
    description: 'Five exams in four days, and a tutor you hire in a panic for the one you dread most.',
    effect: { type: 'payMoney', amount: 1_600, reason: 'Emergency tutoring' },
  }),
  {
    id: 'college-internship', kind: 'normal', title: 'Summer Internship',
    description: 'A summer of fetching coffee ends with a genuinely generous check.',
    effect: { type: 'gainMoney', amount: 5_000, reason: 'Summer internship' },
    tone: 'blue', icon: 'space:new-skills', tier: LONG_ONLY,
  },
  {
    id: 'college-pitch', kind: 'normal', title: 'Pitch Night',
    description: 'You pitch your dorm-room idea to visiting investors — spin to see who invests.',
    effect: { type: 'spinForMoney', perPip: 400, reason: 'Pitch night winnings' },
    tone: 'blue', icon: 'space:startup-bet', tier: LONG_ONLY,
  },
  {
    id: 'college-abroad', kind: 'normal', title: 'Study Abroad',
    description: 'A semester overseas costs a fortune and rearranges how you see everything.',
    effect: { type: 'payMoney', amount: 4_000, reason: 'Semester abroad' },
    tone: 'blue', icon: 'space:weekend-trip', tier: STANDARD_UP,
  },
  {
    id: 'college-loan', kind: 'normal', title: 'Student Loan',
    description: 'You sign for the half of it the scholarship never covered, and the repayments start the month you graduate.',
    effect: { type: 'payMoney', amount: 5_000, reason: 'Student loan repayments' },
    tone: 'blue', icon: 'finance:bank-visit', tier: STANDARD_UP,
  },
  {
    id: 'college-8', kind: 'stop', title: 'Cap and Gown',
    description: 'You slip into your cap and gown — officially a graduate.',
    effect: { type: 'graduate' },
    tone: 'blue', icon: 'space:cap-and-gown', tier: EVERY_BOARD,
  },
  // A one-tile buffer, EVERY_BOARD so it survives every length: Cap and Gown
  // and the job fair right after it were both `stop` tiles, so landing on one
  // always meant landing on the other next turn too — two turns in a row
  // where the roll barely mattered. This tile breaks that pair up without
  // touching either guaranteed event.
  {
    id: 'college-9', kind: 'normal', title: 'Packing Up',
    description: 'You clear out the dorm room and hand back the key, one box of textbooks lighter than you hoped.',
    effect: { type: 'none' },
    tone: 'blue', icon: 'space:cap-and-gown', tier: EVERY_BOARD,
  },
]

const GRAD_FAIR: SpaceContent = {
  id: 'grad-fair', kind: 'stop', title: 'Grad Job Fair',
  description: 'Recruiters line the quad, eager to hire fresh graduates like you.',
  effect: { type: 'chooseCareer', pool: 'graduate' },
  tone: 'gold', icon: 'space:grad-job-fair', tier: EVERY_BOARD,
}

/**
 * Straight to Work: hired on the first tile, paid before the graduates have
 * unpacked.
 *
 * The job fair used to sit at the *end* of this lane, which made the lane's own
 * promise — "start earning immediately" — a sentence the board never kept. A
 * school-leaver walked five tiles unemployed, reached the booths at the same
 * moment the graduate reached theirs, and from then on the two lives were
 * identical except that one of them was paid $54,000 more a payday. Putting the
 * fair first buys the lane the only thing it can genuinely offer against a
 * degree: two wage packets nobody in a lecture hall is collecting, and a couple
 * of years of earning while the other player is paying for the privilege.
 *
 * The rest of the lane is written as the gamble the player asked for. There is
 * no safety net down here, so the tiles swing: a van full of savings, a scratch
 * card, and rent that is due whatever the week did.
 */
const WORK_LANE: readonly SpaceContent[] = [
  {
    id: 'first-job-fair', kind: 'stop', title: 'First Job Fair',
    description: 'Local employers set up booths, hunting for hungry new talent — and you are hired by Friday.',
    effect: { type: 'chooseCareer', pool: 'basic' },
    tone: 'gold', icon: 'space:first-job-fair', tier: EVERY_BOARD,
  },
  {
    id: 'work-1', kind: 'normal', title: 'First Paycheck',
    description: 'Your very first paycheck lands and it feels enormous.',
    effect: { type: 'gainMoney', amount: 2_000, reason: 'First paycheck' },
    tone: 'orange', icon: 'space:first-paycheck', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'work-payday-1', 'A full month on the books, and the deposit lands while your friends are still in the dorms.', missedPayday(
    'veryHard',
    'Paid in Arrears',
    'Nobody mentioned that the first month is paid a month behind, and the fridge does not care.',
    900,
    'A month of living on nothing',
  )),
  {
    /*
     * The lane's own up-front bill, and the mirror of the tuition stop.
     *
     * Straight to Work was pure upside for its first six tiles — hired on tile
     * one, paid twice before the graduates have unpacked — because the one
     * cost it carried was a rent tile that five walkers in six spun straight
     * over. A cost that is usually dodged is decoration. This is a stop: you
     * are earning, so you are expected to be housed, and everybody who takes
     * this road pays for the deposit, the first month and the bed.
     *
     * `unscaled` for the same reason tuition is: it is a price the lane
     * chooses, not a misfortune, and multiplying it on the harder settings
     * would not make the road harder so much as delete it.
     */
    id: 'work-2', kind: 'stop', title: 'Moving Out',
    description: 'You are earning, so you are expected to be housed: a deposit, a first month up front, and a bed you put together yourself.',
    effect: { type: 'payMoney', amount: 1_800, reason: 'Deposit and first month' },
    tone: 'orange', icon: 'space:rent-due', tier: EVERY_BOARD, unscaled: true,
  },
  // A one-tile buffer before the uniform deposit below: on Hard and Very
  // Hard that tile is also a `stop`, right after this one, which meant the
  // roll after moving out barely mattered. EVERY_BOARD so it holds the two
  // apart on a short board too.
  {
    id: 'work-first-night', kind: 'normal', title: 'First Night In',
    description: 'You unpack by lamplight because the overhead bulb still needs replacing.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:rent-due', tier: EVERY_BOARD,
  },
  /*
   * A stop rather than an ordinary tile, and only on the harder settings.
   *
   * The same argument the Moving Out bill above is written on: a cost five
   * walkers in six spin straight over is decoration, not a cost. This is the
   * other half of holding the opening fork even on hard — the payroll lost
   * below is the weight, and this is the tile that makes sure everybody who
   * takes this road in a bad year actually feels it.
   */
  {
    id: 'work-uniform', kind: 'stop', title: 'Uniform Deposit',
    description: 'Two shirts, a name badge, and a deposit you have a feeling you will never see again.',
    effect: { type: 'payMoney', amount: 1_500, reason: 'Uniform deposit' },
    tone: 'orange', icon: 'space:rent-due', tier: EVERY_BOARD, appearsFrom: 'hard',
  },
  {
    id: 'work-3', kind: 'normal', title: 'Overtime Shift',
    description: 'You pick up an extra shift and your feet regret it by nine.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:overtime-shift', tier: STANDARD_UP,
  },
  {
    id: 'work-truck', kind: 'normal', title: 'Food Truck Bet',
    description: 'Every dollar you have goes into a used van and a very good chili — spin to see what the line does.',
    effect: { type: 'spinForMoney', perPip: 2_000, reason: 'What the food truck took' },
    tone: 'orange', icon: 'career:food-truck-owner', tier: STANDARD_UP,
  },
  setback('veryHard', STANDARD_UP, 'work-late-rent', 'Late Rent',
    'The rent goes in four days late, and the late fee arrives before you can even apologize.',
    { type: 'payMoney', amount: 200, reason: 'Late rent penalty' },
    'orange', 'space:rent-due'),
  /*
   * The payroll this lane loses first, and the one that keeps the opening fork
   * a fork on the harder settings.
   *
   * A degree is bought up front and repaid over a working life, so the harder
   * settings charge for it twice: the bill is the same $40,000 whatever the
   * difficulty, and the borrowing it forces is repaid at rates half again as
   * steep. Measured, College Lane won 35.8% of games on hard against an
   * even-fork floor of 40% — enrolling had stopped being a choice and become a
   * trap. Every correction on the college side moves normal and hard together,
   * because tuition and graduate pay are the same numbers on both; taking a
   * payroll off the *other* road is the only lever that lands on hard alone.
   *
   * It is also the honest way round. Being paid by the hour with no
   * qualification behind you is precisely what gets thinner when times are
   * hard, and a missed payday is the heaviest single change the board can
   * make — a payday pays for being passed, so losing one costs a whole packet
   * rather than the fraction of a tile that has to be landed on.
   */
  payday(EVERY_BOARD, 'work-payday-2', 'Another month, another deposit, and still nobody has asked to see a certificate.', missedPayday(
    'hard',
    'Hours Cut',
    'The schedule goes up on Sunday with your name on half as many shifts as last week.',
    1_200,
    'Half a month of shifts',
  )),
  flavour(LONG_ONLY, 'work-4', 'New Skills', 'A weekend workshop teaches you a trick your boss loves.', 'orange', 'space:new-skills', {
    from: 'hard',
    description: 'A weekend workshop teaches you a trick your boss loves, and the course fee is yours to find.',
    effect: { type: 'payMoney', amount: 800, reason: 'Course fee' },
  }),
  flavour(STANDARD_UP, 'work-5', 'Steady Hustle', "Word gets around that you're reliable, and reliable pays off.", 'orange', 'space:steady-hustle'),
  /*
   * The third early wage packet, and the price of the fork on Main Street.
   *
   * The graduate's edge has always been a wage multiplied by every payday left
   * on the road, and the mid-career fork pays out in exactly that currency — a
   * share of a good year is worth what you earn, so a board carrying one more
   * of them has quietly tilted toward the degree. Measured: the fork moved the
   * opening one from 52.5% College to 55.8%, and this tile is most of what
   * moved it back. The lane is paid in the only currency it is rich in — wages
   * banked while the other player is still in a lecture hall — and it was the
   * lane's own long-board packet promoted, not a new one invented.
   *
   * It carries no hardship, deliberately: it is the one wage on this lane the
   * harder settings do not cancel, which is what keeps the fork level on Hard
   * and Very Hard rather than only on the board everybody play-tests. It is on
   * every length for the same reason — the short board is the one where the
   * graduate's edge arrives soonest.
   */
  payday(EVERY_BOARD, 'work-payday-3', 'Three months in and the deposits have stopped feeling like a surprise.'),
  {
    id: 'work-gig', kind: 'normal', title: 'Weekend Gig',
    description: 'Two days of hauling gear for a wedding band pays better than it has any right to.',
    effect: { type: 'gainMoney', amount: 900, reason: 'Weekend gig' },
    tone: 'orange', icon: 'space:side-hustle', tier: LONG_ONLY,
  },
  {
    id: 'work-scratch', kind: 'normal', title: 'Scratch Card',
    description: 'Bought with the change from the sandwich, scratched in the parking lot — spin for what is under the foil.',
    effect: { type: 'spinForMoney', perPip: 1_200, reason: 'Under the foil' },
    tone: 'orange', icon: 'space:lottery-ticket', tier: LONG_ONLY,
  },
  {
    id: 'work-bus-pass', kind: 'normal', title: 'Bus Pass',
    description: 'The commute across town adds up one fare at a time.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:car-trouble', tier: LONG_ONLY,
  },
  {
    id: 'work-shift-lead', kind: 'normal', title: 'Shift Lead',
    description: 'They are short of somebody to hold the keys and write the schedule. Spin: it might as well be you.',
    effect: { type: 'promotion', reason: 'Somebody has to hold the keys' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: LONG_ONLY,
  },
]

/**
 * Main Street, first half: the years between the first wage and the first
 * serious decision about where the wage comes from.
 *
 * It used to run unbroken from the apartment hunt to the ring shopping — the
 * longest stretch on the board, and the one where the only verb was "spin". It
 * is cut in two now, and the mini-fork below is what it is cut for.
 */
const MAIN_STREET_EARLY: readonly SpaceContent[] = [
  flavour(STANDARD_UP, 'main-1', 'Apartment Hunt', "You sign a lease on a place that's almost big enough.", 'slate', 'space:apartment-hunt', {
    from: 'hard',
    description: "You sign a lease on a place that's almost big enough, and the agent's fee is almost bigger.",
    effect: { type: 'payMoney', amount: 2_200, reason: 'Deposit and agency fee' },
  }),
  /*
   * A review on the *shared* road, and the whole reason it is not on Fast Track
   * with the rest of them.
   *
   * Reviews are where Straight to Work's volatility physically comes from. The
   * basic ladders run three rungs from $24,000 to $148,500; a graduate's run two
   * inside a band a third as wide. So a review multiplies a number that varies
   * far more for a school-leaver than for a surgeon, and every one of them
   * widens the gap between a school-leaver's best life and their worst. Stacked
   * onto one optional lane, that made the property a side effect of choosing
   * that lane — measured, trimming two tiles off it dropped the work spread from
   * 219,000 to 173,783 and Straight to Work stopped being the volatile road at
   * all. On the trunk the same tile cancels out of both fork comparisons, so it
   * buys the swing without touching either choice: the property becomes
   * structural instead of incidental.
   */
  {
    id: 'main-early-review', kind: 'normal', title: 'Probation Review',
    description: 'Six months in, somebody sits down with a form and asks how you think it is going. Spin.',
    effect: { type: 'promotion', reason: 'The end of probation' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'main-2', kind: 'normal', title: 'Grocery Run',
    description: 'The cart somehow costs more than you planned. Again.',
    effect: { type: 'payMoney', amount: 800, reason: 'Groceries' },
    tone: 'slate', icon: 'space:grocery-run', tier: LONG_ONLY,
  },
  {
    id: 'main-bank', kind: 'normal', title: 'Bank Visit',
    description: 'The manager slides a coffee across the desk and asks how things are going with your money.',
    effect: { type: 'bank' },
    tone: 'slate', icon: 'finance:bank-visit', tier: EVERY_BOARD,
  },
  {
    id: 'main-4', kind: 'normal', title: 'Side Hustle',
    description: 'Selling handmade candles online brings in a nice little bonus.',
    effect: { type: 'gainMoney', amount: 1_500, reason: 'Side hustle income' },
    tone: 'slate', icon: 'space:side-hustle', tier: LONG_ONLY,
  },
  {
    id: 'main-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'A broker in a cardigan explains, warmly and at length, everything that could go wrong.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office', tier: EVERY_BOARD,
  },
  {
    /*
     * The graduate's tile, even though everyone can land on it.
     *
     * Every effect on this board that is worth a *salary* rather than a fixed
     * sum lands harder on the player who is paid more, and this one takes the
     * job away entirely: the graduate walks past the next payroll on $69,000
     * and the school-leaver on $48,000. It is the honest way to make a degree
     * something you can still lose, and it is the tile the player asked for by
     * name — you work yourself flat and the work stops.
     *
     * It sits early on Main Street rather than beside the layoff, so there is a
     * payday between here and the career fair that hires you back.
     */
    id: 'main-burnout', kind: 'normal', title: 'Burnout',
    description: 'You have been running on four hours and good intentions for a year, and one Monday you simply cannot go in.',
    effect: { type: 'loseCareer', reason: 'Signed off, and the job did not wait' },
    tone: 'orange', icon: 'space:steady-hustle', tier: STANDARD_UP,
  },
  {
    id: 'main-3', kind: 'normal', title: 'Gym Membership',
    description: 'You commit to getting fit. The treadmill remains skeptical.',
    effect: { type: 'none' },
    tone: 'slate', icon: 'space:gym-membership', tier: LONG_ONLY,
  },
  // The only payday in this stretch — every other lane on the board harshens
  // one of *several* paydays and leaves another alone, but this run only ever
  // wrote the one. Harshening it the same way zeroed out every player's
  // income for this whole stretch on Hard and Very Hard, trunk tile though it
  // is, so it stays unconditional rather than joining the pattern.
  payday(EVERY_BOARD, 'main-6', 'Direct deposit hits — the best notification of the week.'),
  {
    id: 'main-stock-tip', kind: 'normal', title: 'Stock Tip',
    description: 'A friend swears by a ticker they read about. The broker is open until six.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'space:stock-tip', tier: EVERY_BOARD,
  },
  {
    id: 'main-5', kind: 'normal', title: 'Car Trouble',
    description: 'The check-engine light wins the staring contest.',
    effect: { type: 'payMoney', amount: 1_200, reason: 'Car repair' },
    tone: 'slate', icon: 'space:car-trouble', tier: LONG_ONLY,
  },
  {
    id: 'main-7', kind: 'normal', title: 'Weekend Trip',
    description: 'A spontaneous road trip empties your wallet and fills your camera roll.',
    effect: { type: 'payMoney', amount: 600, reason: 'Weekend trip' },
    tone: 'slate', icon: 'space:weekend-trip', tier: LONG_ONLY,
  },
  {
    id: 'main-fender-bender', kind: 'normal', title: 'Minor Car Crash',
    description: 'Someone taps your bumper in the parking lot and the quote arrives by email that afternoon.',
    effect: { type: 'payMoney', amount: 2_400, reason: 'Bodyshop bill', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: EVERY_BOARD,
  },
  setback('veryHard', EVERY_BOARD, 'main-pileup', 'Highway Pileup',
    'Fog, brake lights, and four cars crushed together on the highway on-ramp. Everyone walks away; the bills do not.',
    { type: 'payMoney', amount: 14_000, reason: 'Pileup repairs', hazard: 'accident' },
    'slate', 'space:fender-bender'),
  setback('hard', EVERY_BOARD, 'main-dentist', 'Dentist Bill',
    'One filling, one lecture about flossing, and one invoice that stings rather more than the drill did.',
    { type: 'payMoney', amount: 5_000, reason: 'Dental work' },
    'slate', 'space:gym-membership'),
  {
    /*
     * The two tiles below, and their eleven cousins scattered down the rest of
     * the board, exist so that a policy is something a player *watches work*.
     * The board used to carry exactly two hazard-tagged bills — one prang and
     * one house fire — and a $25,000 premium bought the right to dodge them
     * about once every three games. Nobody buys a lottery ticket that pays out
     * after the game has finished. There are a dozen on the standard route
     * now, and an insured player watches roughly two of them bounce.
     */
    id: 'main-prang', kind: 'normal', title: 'Parking Lot Dent',
    description: 'Somebody reverses into your door in the parking garage and leaves a note that reads, in full, "sorry".',
    effect: { type: 'payMoney', amount: 2_600, reason: 'Door and wing repairs', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'main-grease-fire', kind: 'normal', title: 'Grease Fire',
    description: 'A pan of oil, one distracted minute, and a kitchen ceiling the exact color of strong tea.',
    effect: { type: 'payMoney', amount: 6_000, reason: 'Kitchen fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'main-8', kind: 'normal', title: 'Good Review',
    description: 'Your manager praises your work in front of everyone.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'Performance bonus' },
    tone: 'slate', icon: 'space:good-review', tier: LONG_ONLY,
  },
  {
    id: 'main-9', kind: 'normal', title: 'Lucky Find',
    description: 'You stumble into a little story worth remembering.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'slate', icon: 'space:lucky-find', tier: EVERY_BOARD,
  },
]

/**
 * The fourth fork, and the reason the corridor above is only half as long as
 * it was.
 *
 * The board had three decisions of consequence on it — the opening lane,
 * marriage, and the house — and between the first two a player could spin
 * eight or nine times in a row without being asked anything at all. This is
 * that stretch's missing question, and it is the one the table can actually
 * argue about, because the right answer depends on the asker: a player sitting
 * on a surgeon's salary should stay put and compound it, and a player who drew
 * the pet groomer should absolutely roll the dice on somebody else's payroll.
 *
 * The junction is a `stop`, and it has to be — this shipped as a `normal` tile
 * and that was a real unfairness, not a cosmetic one. Movement halts *before*
 * stepping off a fork, so a player who merely passed over this one arrived at
 * the choice with `stepsRemaining` already on the table and could pick whichever
 * road happened to land them well. That is precisely the cheap advantage the
 * chosen-exit rule was built to remove, reintroduced by a tile. `validateRoute`
 * now refuses any fork that does not halt, so the next country cannot repeat it.
 *
 * The head of Job-Hopper Alley is *also* a stop, and that is the asymmetry the
 * two summaries are written around: staying costs you nothing and might promote
 * you, leaving costs you the rest of the week and certainly changes things.
 */
const MID_CAREER_FORK: SpaceContent = {
  id: 'main-crossroads', kind: 'stop', title: 'Five Years In',
  description: 'Five years at the same desk, and a recruiter\'s email you have somehow still not deleted. The road forks here.',
  effect: { type: 'none' },
  tone: 'orange', icon: 'space:networking-night', tier: EVERY_BOARD,
}

/**
 * Company Road: the raise arrives because you were still there to receive it.
 *
 * Everything on this side compounds — a raise paid on every payday left in the
 * game, and a share of a good year — and everything it costs is a thing the
 * company decided on your behalf.
 */
const COMPANY_ROAD: readonly SpaceContent[] = [
  {
    id: 'ladder-raise', kind: 'normal', title: 'Long Service',
    description: 'Nobody has left this department in a decade, so the job above yours only comes free when somebody finally does. Spin to see whether this was the year.',
    effect: { type: 'promotion', reason: 'The job above yours came free' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    /*
     * A `payday` tile that is not called Payday — the cheapest good idea in
     * the whole design. A fixed windfall is worth the same to the surgeon and
     * the pet groomer; a profit share is worth what you actually earn, so the
     * board finally rewards the career the player chose. Both roads out of
     * this fork carry exactly one, so the choice is between two arguments and
     * not between one salary packet and none.
     */
    id: 'ladder-bonus', kind: 'payday', title: 'Profit Share',
    description: 'The firm has a good year and gives everyone a share of it — a whole extra paycheck, and nobody had to ask.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: STANDARD_UP,
  },
  {
    id: 'ladder-transfer', kind: 'normal', title: 'The Transfer',
    description: 'The company decided in February and told you on Friday. The new office is four hundred miles away, and the van is yours to pay for.',
    effect: { type: 'payMoney', amount: 3_000, reason: 'Relocating for the company' },
    tone: 'orange', icon: 'space:apartment-hunt', tier: STANDARD_UP,
  },
  {
    id: 'ladder-black-ice', kind: 'normal', title: 'Black Ice',
    description: 'Forty minutes each way for nine years, and one January morning the traffic circle finds you before you find it.',
    effect: { type: 'payMoney', amount: 4_000, reason: 'Commuter write-off', hazard: 'accident' },
    tone: 'orange', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'ladder-award', kind: 'normal', title: 'Service Award',
    description: 'Twenty years, a framed certificate, and a story about the old building that everybody lets you finish.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'orange', icon: 'space:lucky-find', tier: LONG_ONLY,
  },
  {
    id: 'ladder-collection', kind: 'normal', title: 'The Collection',
    description: 'You start the envelope for somebody\'s farewell gift, and when it does not collect enough, you make up the difference.',
    effect: { type: 'payEach', amount: 600, reason: 'Making up the collection' },
    tone: 'orange', icon: 'space:surprise-bonus', tier: LONG_ONLY,
  },
]

/**
 * Job-Hopper Alley: the raise arrives because you left.
 *
 * The mirror image, tile for tile — one payday, one hazard, one bill — with
 * the seniority raise swapped for a re-draw of the whole salary. That is the
 * argument: a player near the top of their pool is gambling their best asset,
 * and a player near the bottom has almost nothing to lose.
 */
const JOB_HOPPER_ALLEY: readonly SpaceContent[] = [
  // The fork tile right before this lane (`main-crossroads`) is itself a
  // forced stop, and Name Your Price below is too — so choosing this branch
  // used to land on two stops back to back, wasting most of two separate
  // rolls. EVERY_BOARD so the buffer survives thinning on a short board too.
  {
    id: 'hopper-lookout', kind: 'normal', title: 'Quiet Job Search',
    description: 'You update your resume on a lunch break and start taking calls nobody at the office can hear.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:headhunted', tier: EVERY_BOARD,
  },
  {
    /*
     * A `stop`, so that choosing this road *is* the re-draw rather than a one
     * in six chance of one. It costs the rest of the spin, which is the point:
     * the alley asks for a week of your life and a look at the whole salary
     * table, and hands back whatever it hands back. It is also why the two
     * roads swing so differently — a graduate re-drawing from the tight
     * graduate band moves a few thousand, and a school-leaver re-drawing from
     * a band that runs from $24,000 to $86,000 moves their whole game.
     */
    id: 'hopper-move', kind: 'stop', title: 'Name Your Price',
    description: 'You hand in your notice with the next offer already signed, and the new title turns up with a new number attached.',
    // Compulsory, and that is the whole reason Company Road is a real
    // alternative: this road *is* the re-draw. A player who could stand on the
    // alley and decline would be getting a free look at two salaries and a
    // signing bonus, and nobody would ever take the other road.
    effect: { type: 'careerChange', reason: 'You named your price elsewhere', compulsory: true },
    tone: 'orange', icon: 'space:headhunted', tier: EVERY_BOARD,
  },
  {
    // EVERY_BOARD, not STANDARD_UP: on a short board this used to be the
    // first tile thinned away, which meant a player who re-drew here could
    // reach the career fair's *second* redraw (after a layoff) without ever
    // banking a payday from either job in between. This is the alley's own
    // wage, so it stays on every length the redraw itself is on.
    id: 'hopper-bonus', kind: 'payday', title: 'Signing Bonus',
    description: 'The new firm buys you out of your notice period, and the check lands like a whole extra paycheck.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: EVERY_BOARD,
  },
  {
    id: 'hopper-gap', kind: 'normal', title: 'The Gap',
    description: 'Three weeks between handing back one badge and being issued the next. The rent does not care which company you work for.',
    effect: { type: 'payMoney', amount: 3_000, reason: 'Three weeks between jobs' },
    tone: 'orange', icon: 'space:rent-due', tier: STANDARD_UP,
  },
  {
    id: 'hopper-van', kind: 'normal', title: 'Moving Van',
    description: 'You drive the rental van to the new city yourself, and learn its exact height from the parking garage gate.',
    effect: { type: 'payMoney', amount: 4_000, reason: 'Van and barrier repairs', hazard: 'accident' },
    tone: 'orange', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'hopper-contract', kind: 'normal', title: 'Contract Rates',
    description: 'You go freelance for a season and bill by the day — spin to find out how many of the days were good ones.',
    effect: { type: 'spinForMoney', perPip: 1_200, reason: 'A season of day rates' },
    tone: 'orange', icon: 'space:startup-bet', tier: LONG_ONLY,
  },
  {
    id: 'hopper-leaving-do', kind: 'normal', title: 'Farewell Party',
    description: 'Your third leaving party of the decade. The card is enormous, the collection is generous, and nobody quite remembers your job title.',
    effect: { type: 'collectFromEach', amount: 700, reason: 'The leaving collection' },
    tone: 'orange', icon: 'space:poker-night', tier: LONG_ONLY,
  },
]

/** Main Street, second half: the review, the layoff, the hall of booths, and the ring. */
const MAIN_STREET_LATE: readonly SpaceContent[] = [
  {
    /*
     * The one promotion nobody spins past.
     *
     * A ladder is only a ladder if it is climbed, and a review that has to be
     * *landed on* is one a player meets about once a game — which is not a
     * career, it is a rumour. So there is exactly one guaranteed review on the
     * board, it is a `stop`, and it sits in the middle of a working life where
     * a first promotion belongs. Every other review on the route is still a
     * tile you have to land on; this is the one that makes the ladder real on
     * every board length, at every difficulty, for everybody at the table.
     *
     * It costs the session a halt and roughly a turn, which is the honest
     * price of the mechanic and was measured rather than assumed.
     */
    id: 'main-review', kind: 'stop', title: 'The Review',
    description: 'A small room, two people with your file open in front of them, and one question: are you ready for the job above yours? Spin, and hear what they say.',
    effect: { type: 'promotion', reason: 'Your review came round' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'main-10', kind: 'normal', title: 'Streaming Bill',
    description: "Somehow you're subscribed to six different services.",
    effect: { type: 'none' },
    tone: 'slate', icon: 'space:streaming-bill', tier: LONG_ONLY,
  },
  {
    id: 'main-11', kind: 'normal', title: 'Pay Raise Talk',
    description: 'You ask for a raise and, to your shock, actually get one.',
    effect: { type: 'payRaise' },
    tone: 'slate', icon: 'space:pay-raise-talk', tier: STANDARD_UP,
  },
  setback('veryHard', EVERY_BOARD, 'main-tax-audit', 'Tax Audit',
    'A polite letter, a long afternoon with a shoebox of receipts, and a number at the bottom of it.',
    { type: 'payMoney', amount: 15_000, reason: 'Tax audit settlement' },
    'slate', 'space:refund-check'),
  {
    // Sits with `main-layoff` immediately in front of the career fair below,
    // for the same reason: two ways to lose the job, one hall of booths to fix
    // it, and neither of them more than a tile away from the fix.
    id: 'main-hours-cut', kind: 'normal', title: 'Contract Ends',
    description: 'The contract everyone was sure would be renewed is, very quietly, not renewed.',
    effect: { type: 'loseCareer', reason: 'Contract not renewed' },
    tone: 'orange', icon: 'space:layoff-notice', tier: EVERY_BOARD, appearsFrom: 'hard',
  },
  {
    // Keep this immediately in front of the career fair below: the swing is
    // only fair because the way back is the very next tile.
    id: 'main-layoff', kind: 'normal', title: 'Layoff Notice',
    description: 'The whole floor is called into one meeting, and afterwards your badge stops working.',
    effect: { type: 'loseCareer', reason: 'Laid off' },
    tone: 'orange', icon: 'space:layoff-notice', tier: EVERY_BOARD,
  },
  {
    // A stop, and on every board, because it is the layoff's only way back.
    // `loseCareer` sits one tile behind it, so anyone who loses their job walks
    // straight into this hall and cannot spin past it. Left as an ordinary
    // space it could be stepped over, and an unlucky player would spend the
    // rest of the game on casual shifts, which keep you fed and nothing more.
    id: 'main-career-fair', kind: 'stop', title: 'Career Fair',
    description: 'A hall full of booths, free pens, and two offers you have to pick between.',
    effect: { type: 'careerChange', reason: 'A fresh start at the career fair' },
    tone: 'orange', icon: 'space:career-fair-return', tier: EVERY_BOARD,
  },
  {
    id: 'main-coupons', kind: 'normal', title: 'Coupon Clipping',
    description: 'An evening with the scissors knocks a satisfying chunk off the weekly shop.',
    effect: { type: 'gainMoney', amount: 400, reason: 'Coupon savings' },
    tone: 'slate', icon: 'space:coupon-clipping', tier: LONG_ONLY,
  },
  setback('hard', LONG_ONLY, 'main-parking', 'Parking Ticket',
    'Eleven minutes over, one parking officer with excellent timing, and a yellow ticket under the windshield wiper.',
    { type: 'payMoney', amount: 150, reason: 'Parking fine' },
    'slate', 'space:car-trouble'),
  {
    /*
     * Was a flavour tile that quietly charged for the meat on Hard. It is a
     * `payEach` on every board now: the money crosses the table, everybody at
     * it gets a drink out of you, and the tile is a thing you *do for people*
     * rather than a bill you settle alone with the board.
     */
    id: 'main-13', kind: 'normal', title: 'Block Party',
    description: 'The whole street turns up, you end up on the grill, and every single one of them eats for free.',
    effect: { type: 'payEach', amount: 600, reason: 'You fed the whole street' },
    tone: 'slate', icon: 'space:neighborhood-bbq', tier: LONG_ONLY,
    harsher: {
      from: 'hard',
      description: 'The whole street turns up, the gazebo is hired, and every single one of them eats for free.',
      effect: { type: 'payEach', amount: 1_200, reason: 'You fed the whole street, twice over' },
    },
  },
  {
    id: 'main-overtime', kind: 'normal', title: 'Overtime Season',
    description: 'Six weeks of late nights end with a pay stub you read twice.',
    effect: { type: 'gainMoney', amount: 2_000, reason: 'Overtime season' },
    tone: 'slate', icon: 'space:overtime-shift', tier: LONG_ONLY,
  },
  {
    id: 'main-gifts', kind: 'normal', title: 'Holiday Gifts',
    description: 'A present for everyone at the table, chosen with more thought than budget.',
    effect: { type: 'payEach', amount: 800, reason: 'A present for everyone' },
    tone: 'slate', icon: 'space:surprise-bonus', tier: EVERY_BOARD,
  },
  {
    id: 'main-refund', kind: 'normal', title: 'Refund Check',
    description: "A tax refund shows up right when you'd forgotten to expect it.",
    effect: { type: 'gainMoney', amount: 700, reason: 'Tax refund' },
    tone: 'slate', icon: 'space:refund-check', tier: LONG_ONLY,
  },
  {
    id: 'main-bonus', kind: 'payday', title: 'Spot Bonus',
    description: 'Someone upstairs notices the weekend you saved, and says thank you with a whole extra paycheck.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:surprise-bonus', tier: LONG_ONLY,
    harsher: missedPayday(
      'veryHard',
      'Thanks, Verbally',
      'Someone upstairs notices the weekend you saved and thanks you warmly — in one email, sent to everyone.',
      900,
      'Thanked in writing',
    ),
  },
  {
    id: 'main-poker', kind: 'normal', title: 'Poker Night',
    description: 'A friendly table, terrible bluffs, and everyone else pays for the pizza.',
    effect: { type: 'collectFromEach', amount: 500, reason: 'Poker night winnings' },
    tone: 'slate', icon: 'space:poker-night', tier: STANDARD_UP,
  },
  flavour(LONG_ONLY, 'main-14', 'Ring Shopping', 'You spend a little too long looking in the jewelry counter window.', 'slate', 'space:ring-shopping'),
]

const MARRIAGE: SpaceContent = {
  id: 'marriage', kind: 'stop', title: 'Wedding Day',
  description: "Vows are exchanged, tears are shed, and it's official — you're married!",
  effect: { type: 'getMarried' },
  tone: 'pink', icon: 'space:wedding-day', tier: EVERY_BOARD,
}

const FAMILY_LANE: readonly SpaceContent[] = [
  {
    id: 'family-1', kind: 'normal', title: 'Nursery Setup',
    description: 'You paint the nursery a cheerful yellow and assemble a crib at midnight.',
    effect: { type: 'payMoney', amount: 2_000, reason: 'Nursery setup' },
    tone: 'purple', icon: 'space:nursery-setup', tier: EVERY_BOARD,
  },
  {
    id: 'family-2', kind: 'stop', title: 'New Baby',
    description: 'A tiny new roommate arrives, and nothing is ever quiet again.',
    effect: { type: 'haveChildren', count: 1, celebrationPerPip: 400 },
    tone: 'purple', icon: 'space:new-baby', tier: EVERY_BOARD,
  },
  {
    id: 'family-3', kind: 'normal', title: 'Family Vacation',
    description: 'Sandy shoes and sunburns — everyone agrees it was worth it.',
    effect: { type: 'payMoney', amount: 1_800, reason: 'Family vacation' },
    tone: 'purple', icon: 'space:family-vacation', tier: LONG_ONLY,
  },
  setback('hard', EVERY_BOARD, 'family-childcare', 'Childcare Bill',
    'Full-time nursery for every small person in the house, and a monthly total you read twice.',
    { type: 'payPerChild', amount: 5_000, reason: 'Childcare per child' },
    'purple', 'space:nursery-setup'),
  setback('veryHard', STANDARD_UP, 'family-tutor', 'Exam Tutoring',
    'Every child gets an hour a week with somebody patient, and patience turns out to be billed hourly.',
    { type: 'payPerChild', amount: 5_000, reason: 'Tutoring per child' },
    'purple', 'space:school-fees'),
  {
    id: 'family-school-fees', kind: 'normal', title: 'School Fees',
    description: 'Uniforms, trips, and a recorder each. The invoices arrive together, of course.',
    effect: { type: 'payPerChild', amount: 3_000, reason: 'School fees per child' },
    tone: 'purple', icon: 'space:school-fees', tier: EVERY_BOARD,
  },
  {
    id: 'family-4', kind: 'normal', title: 'School Play',
    description: 'Your kid nails the lead role and you tear up in the third row.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'purple', icon: 'space:school-play', tier: EVERY_BOARD,
  },
  {
    id: 'family-minivan', kind: 'normal', title: 'The Minivan',
    description: 'Reversing off the driveway with three children arguing behind you, into the one gatepost that has never once moved.',
    effect: { type: 'payMoney', amount: 3_200, reason: 'Minivan bodywork', hazard: 'accident' },
    tone: 'purple', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'family-5', kind: 'normal', title: 'Piano Lessons',
    description: "The scales are rough, but there's real promise in there somewhere.",
    effect: { type: 'payMoney', amount: 900, reason: 'Piano lessons' },
    tone: 'purple', icon: 'space:piano-lessons', tier: LONG_ONLY,
  },
  {
    /*
     * Two at once, and no new tile to say so. The route's length is
     * load-bearing — where the paydays fall in the board's back half is
     * measured — so the lane grows a family rather than growing longer. Three
     * children on the standard board and four on the long one: a family, not a
     * farm, and nobody is counting to five.
     */
    id: 'family-6', kind: 'normal', title: 'Twins',
    description: 'The scan technician goes quiet, turns the screen round, and points at two of them.',
    effect: { type: 'haveChildren', count: 2, celebrationPerPip: 700 },
    tone: 'purple', icon: 'space:second-baby', tier: EVERY_BOARD,
  },
  {
    id: 'family-7', kind: 'normal', title: 'Soccer Season',
    description: 'Weekend mornings become sideline cheering and orange slices.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'purple', icon: 'space:soccer-season', tier: STANDARD_UP,
  },
  {
    id: 'family-benefit', kind: 'normal', title: 'Child Benefit',
    description: 'A quiet government check arrives for every small person in the house.',
    effect: { type: 'collectPerChild', amount: 1_500, reason: 'Child benefit per child' },
    tone: 'purple', icon: 'space:child-benefit', tier: STANDARD_UP,
  },
  flavour(STANDARD_UP, 'family-8', 'Family Portrait', 'Everyone actually smiles at the same time — frame it immediately.', 'purple', 'space:family-portrait', {
    from: 'veryHard',
    description: 'Everyone smiles at the same time exactly once, and the studio charges for the whole afternoon.',
    effect: { type: 'payMoney', amount: 1_100, reason: 'The photographer package' },
  }),
  payday(STANDARD_UP, 'family-payday', 'Payday arrives between the school run and bath time.'),
  {
    id: 'family-back-to-work', kind: 'normal', title: 'Back to Work',
    description: 'You return from parental leave and negotiate hard on the way back in.',
    effect: { type: 'payRaise' },
    tone: 'purple', icon: 'space:pay-raise-talk', tier: LONG_ONLY,
  },
  {
    id: 'family-third', kind: 'normal', title: 'Another Arrival',
    description: 'The car is officially too small, and nobody minds in the slightest.',
    effect: { type: 'haveChildren', count: 1, celebrationPerPip: 400 },
    tone: 'purple', icon: 'space:new-baby', tier: LONG_ONLY,
  },
]

const FAST_TRACK: readonly SpaceContent[] = [
  {
    id: 'fast-1', kind: 'normal', title: 'Big Promotion',
    description: 'Your name is on the shortlist for the job above yours, and so are two others. Spin.',
    effect: { type: 'promotion', reason: 'On the shortlist for the job above' },
    tone: 'orange', icon: 'space:big-promotion', tier: STANDARD_UP,
  },
  {
    id: 'fast-2', kind: 'normal', title: 'Networking Night',
    description: 'A chance conversation turns into a lucrative referral bonus.',
    effect: { type: 'gainMoney', amount: 1_200, reason: 'Referral bonus' },
    tone: 'orange', icon: 'space:networking-night', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'fast-3', 'Overtime finally shows up on the pay stub.'),
  {
    id: 'fast-headhunted', kind: 'normal', title: 'Headhunted',
    description: 'A recruiter calls your cell phone during a meeting with two offers and no patience.',
    effect: { type: 'careerChange', reason: 'Headhunted for something new' },
    tone: 'orange', icon: 'space:headhunted', tier: EVERY_BOARD,
  },
  {
    id: 'fast-hire-car', kind: 'normal', title: 'Rental Car',
    description: 'A strange city, a rental car you don\'t know well, and a concrete post that had been standing there all morning.',
    effect: { type: 'payMoney', amount: 3_200, reason: 'Rental car deductible', hazard: 'accident' },
    tone: 'orange', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'fast-4', kind: 'normal', title: 'Client Win',
    description: 'You land the account everyone said was impossible.',
    effect: { type: 'gainMoney', amount: 3_000, reason: 'Client win bonus' },
    tone: 'orange', icon: 'space:client-win', tier: STANDARD_UP,
  },
  {
    /*
     * A review fewer. Three reviews and three payrolls on one lane is not a
     * faster road, it is a different and better-paid game — and a talk that
     * lands you a fee is a truer story about a conference than one that lands
     * you the job above yours.
     */
    /*
     * A review fewer. Three reviews and three payrolls on one lane is not a
     * faster road, it is a different and better-paid game — and a talk that
     * lands you a fee is a truer story about a conference than one that lands
     * you the job above yours.
     */
    id: 'fast-5', kind: 'normal', title: 'Conference Talk',
    description: 'Your talk goes round the whole industry in a week, and the organizers of the next three would like to book you.',
    effect: { type: 'gainMoney', amount: 4_400, reason: 'Speaking fees' },
    tone: 'orange', icon: 'space:conference-talk', tier: STANDARD_UP,
  },
  setback('hard', EVERY_BOARD, 'fast-burnout', 'Burnout Leave',
    'Six weeks signed off, and the paycheck is a great deal lighter by the time you walk back in.',
    { type: 'payMoney', amount: 12_000, reason: 'Unpaid leave' },
    'orange', 'space:steady-hustle'),
  // Very Hard only, matching the restructure below: without it, a Very Hard
  // player headhunted onto this lane could be reorganized into yet another
  // role a few tiles later without ever banking a payday from the one in
  // between.
  {
    id: 'fast-payday-severance', kind: 'payday', title: 'Year-End Payroll',
    description: 'The year winds down, and whatever this job pays lands one more time before everything changes again.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: EVERY_BOARD, appearsFrom: 'veryHard',
  },
  {
    id: 'fast-restructure', kind: 'normal', title: 'Restructure',
    description: 'The company reorganizes overnight, and your name turns up in a different job entirely.',
    // Nobody asked, which is what a reorganisation is.
    effect: { type: 'careerChange', reason: 'Reorganized into a new role', compulsory: true },
    tone: 'orange', icon: 'space:career-fair-return', tier: EVERY_BOARD, appearsFrom: 'veryHard',
  },
  {
    id: 'fast-trading-floor', kind: 'normal', title: 'Trading Floor',
    description: 'You are eager to spend your bonus, and the trading floor is still shouting.',
    effect: { type: 'buyStock' },
    tone: 'orange', icon: 'finance:trading-floor', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'fast-6', 'Another two weeks down, another deposit in.', missedPayday(
    'hard',
    'Bonus Clawback',
    "Last year's bonus is reviewed by somebody in another building, and the new number is lower.",
    6_000,
    'Bonus clawed back',
  )),
  {
    id: 'fast-7', kind: 'normal', title: 'Bonus Season',
    description: 'The year-end bonus is bigger than expected, and you celebrate.',
    effect: { type: 'gainMoney', amount: 5_000, reason: 'Year-end bonus' },
    tone: 'orange', icon: 'space:bonus-season', tier: STANDARD_UP,
  },
  flavour(LONG_ONLY, 'fast-8', 'Corner Office', 'You finally get a door that closes and a window that opens.', 'orange', 'space:corner-office', {
    from: 'hard',
    description: 'You finally get a door that closes, a window that opens, and an empty room to furnish yourself.',
    effect: { type: 'payMoney', amount: 1_800, reason: 'Furnishing the office' },
  }),
  {
    id: 'fast-board-seat', kind: 'normal', title: 'Board Seat',
    description: 'There is an open chair at the long table. Spin to find out whose name ends up on it.',
    effect: { type: 'promotion', reason: 'A chair at the long table' },
    tone: 'orange', icon: 'space:corner-office', tier: STANDARD_UP,
  },
  {
    /*
     * This was a third payroll, and a payroll is the heaviest thing a lane can
     * carry: it pays for being *passed*, where every other tile has to be
     * landed on. A counter-offer is still a good day at work; it is simply not
     * another month's pay on top of it.
     */
    id: 'fast-payday-3', kind: 'normal', title: 'Retention Offer',
    description: 'You mention, lightly, that somebody else has been in touch. The counter-offer arrives before lunch.',
    effect: { type: 'payRaise' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'fast-equity', kind: 'normal', title: 'Equity Vests',
    description: 'Four years of paperwork turn into an actual number in an actual account.',
    effect: { type: 'gainMoney', amount: 7_000, reason: 'Equity vesting' },
    tone: 'orange', icon: 'space:bonus-season', tier: LONG_ONLY,
  },
]

/**
 * Midtown: the money act, and the trunk that carries the overflow.
 *
 * It is longer than it was, and deliberately. A tile on a *branch* costs the
 * layout engine a column on the trunk row the branch hangs off — put enough of
 * them on one side of a fork and the serpentine has to widen the whole board,
 * which flattens it into fewer, longer rows and eventually stops it fitting a
 * phone at all. A tile on a trunk run costs nothing but itself. So when this
 * act's new hazards and obligations needed somewhere to live, they came here
 * rather than onto Family Lane and the Fast Track, and a handful of long-board
 * tiles that were sitting on those branches came with them.
 *
 * Worth knowing before writing the next country: **branches are expensive and
 * trunks are free**, and a hazard on the trunk is walked by everybody rather
 * than by half the table, which is the cheaper way to make a policy pay.
 */
const MIDTOWN: readonly SpaceContent[] = [
  {
    id: 'midtown-trading-floor', kind: 'normal', title: 'Trading Floor',
    description: 'Screens everywhere, everyone shouting, and a broker who insists this one is different.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'finance:trading-floor', tier: EVERY_BOARD,
  },
  {
    id: 'midtown-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'Every share you hold quietly posts a check through the mailbox.',
    effect: { type: 'stockDividend', perShare: 3_000, reason: 'Quarterly dividend' },
    tone: 'slate', icon: 'space:dividend-day', tier: STANDARD_UP,
  },
  /*
   * A converted tile, not a new one, for the same reason `midtown-party`
   * (the joint account) below was: the route's length is load-bearing, so
   * saying something new about a marriage means re-theming an existing tile
   * rather than adding one. Single players walk past this exactly the way
   * they walk past the joint account.
   */
  {
    id: 'midtown-divorce', kind: 'normal', title: 'Splitting Up',
    description: 'The marriage ends here. The paperwork is faster than either of you expected, and the apartment is quieter than it was.',
    effect: { type: 'divorce', reason: 'Divorce settlement' },
    tone: 'slate', icon: 'space:layoff-notice', tier: STANDARD_UP,
  },
  {
    id: 'midtown-dryer-fire', kind: 'normal', title: 'Dryer Fire',
    description: 'Nobody has emptied the lint filter in four years, and the utility room is the first to hear about it.',
    effect: { type: 'payMoney', amount: 5_600, reason: 'Utility room fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'midtown-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'Before anyone hands you a set of house keys, someone would like a word about cover.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office', tier: EVERY_BOARD,
  },
  // The only payday in this stretch too — see main-6. Harshening it zeroed
  // Very Hard's income for the entire run between the marriage fork and the
  // home-buying fork, so it stays unconditional.
  payday(EVERY_BOARD, 'midtown-payday', 'A deposit lands the week the deposit on a house is due.'),
  {
    id: 'midtown-wiring', kind: 'normal', title: 'Wiring Fault',
    description: 'The inspection report mentions the fuse box in passing. The fuse box mentions it again at two in the morning, much louder this time.',
    effect: { type: 'payMoney', amount: 5_600, reason: 'Electrical fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'midtown-deer', kind: 'normal', title: 'Deer in the Road',
    description: 'It steps out of the hedge at dusk, considers you carefully, and walks away. The hood of your car does not walk away.',
    effect: { type: 'payMoney', amount: 3_600, reason: 'Front end rebuilt', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'midtown-pitch', kind: 'normal', title: 'Big Client Pitch',
    description: 'You win the room. Spin to find out whether winning the room is the same as being given the job that runs it.',
    effect: { type: 'promotion', reason: 'You won the room' },
    tone: 'orange', icon: 'space:client-win', tier: STANDARD_UP,
  },
  /*
   * The other half of marrying, and the reason the wedding is no longer the
   * whole story. A single player walks past this; a married one finds out what
   * kind of partner the wheel dealt them, one month at a time.
   *
   * A converted tile rather than a new one, deliberately: the route's length is
   * load-bearing — where the paydays fall in the board's back half is measured
   * in `createBoard.test.ts` — so adding tiles to say something new moves things
   * that have nothing to do with marriage.
   *
   * `EVERY_BOARD`, including the short one, and that was measured rather than
   * assumed. Without it a short game would run a *different rule set* — marriage
   * there would be pure upside again, which is the exact flaw this whole pass
   * existed to remove — and rules that differ by session length are worse than
   * a point of drift. The short board is the tightest opening fork on the board
   * at 44.2% against a floor of 40%, so the cost was checked: it holds.
   */
  {
    id: 'midtown-party', kind: 'normal', title: 'Joint Account',
    description: 'You merge the accounts, and for the first time somebody else\'s spending is also, unavoidably, your spending.',
    effect: { type: 'household', reason: 'The joint account, settled up' },
    tone: 'purple', icon: 'finance:bank-visit', tier: EVERY_BOARD,
  },

  {
    /*
     * The trunk's bonus payday, and a conversion rather than an addition: this
     * was an ordinary payroll tile, and it pays exactly what it always did.
     * Every board gets one, because a windfall scaled to your own salary is the
     * cheapest way the board has of remembering which career you picked, and a
     * short session needs that more than a long one, not less.
     */
    id: 'midtown-bonus', kind: 'payday', title: 'Year-End Bonus',
    description: 'The year-end bonus lands, sized to what you earn rather than to what anybody promised, and every one of you gets a different number.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: EVERY_BOARD,
  },
  {
    id: 'midtown-raise', kind: 'normal', title: 'Mid-Career Raise',
    description: 'A quiet word, a new number, and a handshake on the way out of the room.',
    effect: { type: 'payRaise' },
    tone: 'slate', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  setback('veryHard', EVERY_BOARD, 'midtown-rate-rise', 'Rate Rise',
    'The rate moves the wrong way on a Thursday morning, and every monthly figure moves with it.',
    { type: 'payMoney', amount: 14_000, reason: 'Rates go the wrong way' },
    'slate', 'space:market-crash'),
  setback('hard', LONG_ONLY, 'midtown-survey', 'Inspection Report',
    'The home inspector finds damp, a cracked support beam, and one paragraph you have to read three times.',
    { type: 'payMoney', amount: 8_000, reason: 'Survey and repairs' },
    'slate', 'space:house-hunting'),
  {
    id: 'midtown-camping', kind: 'normal', title: 'Camping Trip',
    description: 'One tent, four sleeping bags, and rain from Friday to Sunday.',
    effect: { type: 'none' },
    tone: 'slate', icon: 'space:weekend-trip', tier: LONG_ONLY,
  },
  {
    id: 'midtown-red-eye', kind: 'normal', title: 'Red-Eye Flights',
    description: 'Four cities in five days, and every one of the receipts is yours.',
    effect: { type: 'payMoney', amount: 1_500, reason: 'Travel expenses' },
    tone: 'slate', icon: 'space:weekend-trip', tier: LONG_ONLY,
  },
  {
    id: 'midtown-bank', kind: 'normal', title: 'Bank Visit',
    description: 'The manager remembers your name now, which is either flattering or ominous.',
    effect: { type: 'bank' },
    tone: 'slate', icon: 'finance:bank-visit', tier: LONG_ONLY,
  },
  flavour(LONG_ONLY, 'midtown-tour', 'Open House Tour', 'Six houses in one Saturday, and you liked the second one best all along.', 'slate', 'space:house-hunting', {
    from: 'hard',
    description: 'Six houses in one Saturday, and a tank of fuel and three coffees to show for the day.',
    effect: { type: 'payMoney', amount: 600, reason: 'A Saturday of viewings' },
  }),
]

const HOME_BUYING: SpaceContent = {
  id: 'home-buying', kind: 'stop', title: 'House Hunting',
  description: 'You tour open houses all weekend, mentally moving in furniture.',
  effect: { type: 'buyHouse' },
  tone: 'gold', icon: 'space:house-hunting', tier: EVERY_BOARD,
}

const RISKY_ROAD: readonly SpaceContent[] = [
  {
    id: 'risky-1', kind: 'normal', title: 'Startup Bet',
    description: "You pour savings into a friend's startup and spin to see what comes back.",
    effect: { type: 'spinForMoney', perPip: 2_000, reason: 'Startup investment payout' },
    tone: 'pink', icon: 'space:startup-bet', tier: EVERY_BOARD,
  },
  {
    id: 'risky-2', kind: 'normal', title: 'Bad Stock Tip',
    description: "Your 'sure thing' loses most of its value in a week, and you buy the table dinner to make up for it.",
    effect: { type: 'payEach', amount: 2_000, reason: 'Bad stock tip' },
    tone: 'pink', icon: 'space:stock-tip', tier: EVERY_BOARD,
  },
  {
    id: 'risky-3', kind: 'normal', title: 'Poker Night',
    description: 'Luck stays on your side at the table all night long.',
    effect: { type: 'collectFromEach', amount: 2_500, reason: 'Poker winnings' },
    tone: 'pink', icon: 'space:poker-night', tier: EVERY_BOARD,
  },
  {
    id: 'risky-5', kind: 'normal', title: 'Market Crash',
    description: 'The market dips hard and your portfolio winces.',
    effect: { type: 'payMoney', amount: 9_000, reason: 'Market crash' },
    tone: 'pink', icon: 'space:market-crash', tier: EVERY_BOARD,
  },
  setback('hard', EVERY_BOARD, 'risky-aftershock', 'Aftershock',
    'The market finds a lower floor than anyone believed it had, and finds it in a single afternoon.',
    { type: 'payMoney', amount: 16_000, reason: 'The market falls again' },
    'pink', 'space:market-crash'),
  setback('veryHard', LONG_ONLY, 'risky-wipeout', 'Margin Wipeout',
    'The position is closed for you at the worst possible hour, and nobody asks first.',
    { type: 'payMoney', amount: 20_000, reason: 'Position closed out' },
    'pink', 'space:market-crash'),
  {
    id: 'risky-kerb', kind: 'normal', title: 'One Careful Week',
    description: 'You buy the car you promised yourself at seventeen, and introduce it to a curb before the plates arrive.',
    effect: { type: 'payMoney', amount: 5_000, reason: 'Wheels, fender and pride', hazard: 'accident' },
    tone: 'pink', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'risky-6', kind: 'normal', title: 'Lottery Ticket',
    description: 'A dollar ticket, a lucky scratch, and a spin for the payout.',
    effect: { type: 'spinForMoney', perPip: 3_500, reason: 'Lottery scratch-off' },
    tone: 'pink', icon: 'space:lottery-ticket', tier: EVERY_BOARD,
  },
  {
    id: 'risky-7', kind: 'normal', title: 'Surprise Bonus',
    description: 'An old investment finally pays off, and everyone else is jealous.',
    effect: { type: 'collectFromEach', amount: 2_000, reason: 'Surprise windfall' },
    tone: 'pink', icon: 'space:surprise-bonus', tier: STANDARD_UP,
  },
  {
    id: 'risky-8', kind: 'normal', title: 'Bidding War',
    description: 'An auction gets competitive and your paddle goes up one too many times.',
    effect: { type: 'payMoney', amount: 6_000, reason: 'Auction overspend' },
    tone: 'pink', icon: 'space:bidding-war', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'risky-payday', 'A paycheck lands while your investments are busy misbehaving.'),
  {
    id: 'risky-margin-call', kind: 'normal', title: 'Margin Call',
    description: 'The broker calls at seven in the morning, and the tone of voice already tells you it is bad news.',
    effect: { type: 'payMoney', amount: 4_000, reason: 'Margin call' },
    tone: 'pink', icon: 'space:market-crash', tier: LONG_ONLY,
  },
  {
    id: 'risky-swap', kind: 'normal', title: 'Rival Swap',
    description: 'One handshake, one signature, and you and the front-runner trade bank balances.',
    effect: { type: 'swapMoneyWithLeader', reason: 'A deal with the front-runner' },
    tone: 'pink', icon: 'space:rival-swap', tier: EVERY_BOARD,
  },
  {
    id: 'risky-rooftop', kind: 'normal', title: 'Rooftop Party',
    description: 'You throw the party of the year and insist on picking up every single tab.',
    effect: { type: 'payEach', amount: 1_500, reason: 'Rooftop party tab' },
    tone: 'pink', icon: 'space:neighborhood-bbq', tier: LONG_ONLY,
  },
  {
    id: 'risky-angel', kind: 'normal', title: 'Angel Investing',
    description: 'Three checks into three garages — spin to find out which one grew up.',
    effect: { type: 'spinForMoney', perPip: 1_500, reason: 'Angel investment return' },
    tone: 'pink', icon: 'space:startup-bet', tier: LONG_ONLY,
  },
  {
    id: 'risky-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'The risky end of your portfolio has a very good quarter for once.',
    effect: { type: 'stockDividend', perShare: 4_000, reason: 'Bumper dividend' },
    tone: 'pink', icon: 'space:dividend-day', tier: STANDARD_UP,
  },
  {
    id: 'risky-hot-tip', kind: 'normal', title: 'Hot Stock Tip',
    description: 'The broker leans in and lowers his voice. You have heard this before.',
    effect: { type: 'buyStock' },
    tone: 'pink', icon: 'space:stock-tip', tier: LONG_ONLY,
  },
]

const SAFE_STREET: readonly SpaceContent[] = [
  {
    id: 'safe-1', kind: 'normal', title: 'Coupon Clipping',
    description: 'Your stack of coupons actually pays off at checkout.',
    effect: { type: 'gainMoney', amount: 800, reason: 'Coupon savings' },
    tone: 'green', icon: 'space:coupon-clipping', tier: EVERY_BOARD,
  },
  {
    id: 'safe-2', kind: 'normal', title: 'Garden Harvest',
    description: 'The backyard tomatoes finally ripen, saving a grocery trip.',
    effect: { type: 'none' },
    tone: 'green', icon: 'space:garden-harvest', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'safe-payday', 'The deposit arrives on the same day it always has.', missedPayday(
    'veryHard',
    'Wages Withheld',
    'A cell in a spreadsheet somewhere means this month\'s wages will arrive next month instead.',
    1_000,
    'Wages held over a month',
  )),
  setback('hard', EVERY_BOARD, 'safe-excess', 'Policy Deductible',
    'Even the careful road has a claim form on it, and the deductible is always yours to cover.',
    { type: 'payMoney', amount: 1_000, reason: 'Policy deductible' },
    'green', 'finance:insurance-office'),
  setback('veryHard', STANDARD_UP, 'safe-roof', 'Roof Repairs',
    'Three roof shingles come off in the night, and the man with the ladder is booked until Thursday.',
    { type: 'payMoney', amount: 9_000, reason: 'Roof repairs' },
    'green', 'space:house-hunting'),
  setback('hard', LONG_ONLY, 'safe-fridge', 'Fridge Gives Up',
    'It hums, it rattles, it stops. Everything in the freezer goes in the bin by lunchtime.',
    { type: 'payMoney', amount: 3_000, reason: 'A new fridge' },
    'green', 'space:grocery-run'),
  {
    id: 'safe-trolley', kind: 'normal', title: 'Cart Dent',
    description: 'A runaway shopping cart crosses the entire parking lot to find your door, and nobody at all saw a thing.',
    effect: { type: 'payMoney', amount: 3_000, reason: 'Panel and paint', hazard: 'accident' },
    tone: 'green', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'safe-3', kind: 'normal', title: 'Budget Win',
    description: 'You stick to the budget for once and it actually feels great.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'Budgeting win' },
    tone: 'green', icon: 'space:budget-win', tier: EVERY_BOARD,
  },
  {
    id: 'safe-4', kind: 'normal', title: 'Interest Payout',
    description: 'The savings account quietly earns its keep.',
    effect: { type: 'gainMoney', amount: 1_200, reason: 'Savings interest' },
    tone: 'green', icon: 'space:interest-payout', tier: STANDARD_UP,
  },
  {
    id: 'safe-sticky', kind: 'normal', title: 'Sticky Fingers',
    description: 'A rival leaves their proudest keepsake unattended, and your hand hovers over it.',
    effect: { type: 'stealLifeTile', reason: 'A keepsake changes hands' },
    tone: 'green', icon: 'space:sticky-fingers', tier: STANDARD_UP,
  },
  {
    id: 'safe-6', kind: 'normal', title: 'Cashback Bonus',
    description: "The credit card's cashback finally adds up to something real.",
    effect: { type: 'gainMoney', amount: 900, reason: 'Cashback bonus' },
    tone: 'green', icon: 'space:cashback-bonus', tier: LONG_ONLY,
  },
  {
    id: 'safe-7', kind: 'normal', title: 'Refund Check',
    description: "A tax refund shows up right when you'd forgotten to expect it.",
    effect: { type: 'gainMoney', amount: 1_400, reason: 'Tax refund' },
    tone: 'green', icon: 'space:refund-check', tier: EVERY_BOARD,
  },
  {
    id: 'safe-8', kind: 'normal', title: 'Quiet Savings',
    description: 'Nothing dramatic happens — your piggy bank just quietly grows.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'Quiet savings' },
    tone: 'green', icon: 'space:quiet-savings', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'safe-payday-2', 'Another deposit, another quiet week. This is the whole idea.'),
  {
    id: 'safe-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'The steady half of your portfolio posts its steady little check.',
    effect: { type: 'stockDividend', perShare: 2_500, reason: 'Quarterly dividend' },
    tone: 'green', icon: 'space:dividend-day', tier: EVERY_BOARD,
  },
  {
    id: 'safe-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'Late is better than never, and the broker is delighted to see you again.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'green', icon: 'finance:insurance-office', tier: LONG_ONLY,
  },
  flavour(LONG_ONLY, 'safe-party', 'Garden Party', 'Bunting, folding chairs, and a raffle nobody expected to enjoy this much.', 'green', 'space:neighborhood-bbq', {
    from: 'hard',
    description: 'Bunting, folding chairs, a raffle, and a tent somebody had to put a deposit down on.',
    effect: { type: 'payMoney', amount: 700, reason: 'The tent deposit' },
  }),
]

const SUNSET_STRIP: readonly SpaceContent[] = [
  {
    /*
     * Financial independence, and the one question the board asks everybody.
     *
     * A `stop` at the head of the last act, so the whole table is asked it
     * once: you are holding what you are holding, and there is one act of the
     * board left. Is that enough?
     *
     * It has to be here rather than further along. Stopping only means
     * something if what it forfeits is real, and what it forfeits is exactly
     * this run: two more paydays, a dividend, a swap, a theft, a house fire
     * and one last big spin — the loudest stretch on the whole route. A player
     * who is ahead is buying their way out of all of it, and a player who is
     * behind is walking away from the only road long enough to catch up on.
     *
     * That is why it is not a strictly better button, and the wheel is what
     * finishes the argument: the fund is realised on one spin, so nobody knows
     * what stopping was worth until they have already stopped.
     */
    id: 'sunset-number', kind: 'stop', title: 'The Number',
    description: 'Somebody works out on the back of an envelope exactly what you would need never to work again — and the number turns out to be a good deal smaller than you feared.',
    effect: { type: 'retireEarly' },
    tone: 'gold', icon: 'space:retirement-fund', tier: EVERY_BOARD,
  },
  {
    id: 'sunset-upgrade', kind: 'normal', title: 'Home Upgrade',
    description: 'The agent calls about something bigger, brighter, and just about within reach.',
    effect: { type: 'upgradeHouse' },
    tone: 'slate', icon: 'space:home-upgrade', tier: EVERY_BOARD,
  },
  {
    id: 'sunset-fire', kind: 'normal', title: 'House Fire',
    description: 'A pan, a tea towel, and a kitchen that needs rebuilding from the tiles up.',
    effect: { type: 'payMoney', amount: 12_000, reason: 'Fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: EVERY_BOARD,
  },
  setback('veryHard', STANDARD_UP, 'sunset-chimney', 'Chimney Fire',
    'A bird\'s nest, a cold night, and a chimney that has to come out and go back in again.',
    { type: 'payMoney', amount: 16_000, reason: 'Chimney fire damage', hazard: 'fire' },
    'slate', 'space:house-fire'),
  setback('hard', EVERY_BOARD, 'sunset-care', 'Care Costs',
    'Somebody you love needs care, and you would never put a price on it. The invoice does anyway.',
    { type: 'payMoney', amount: 20_000, reason: 'Caring for family' },
    'slate', 'space:family-portrait'),
  {
    id: 'sunset-workshop', kind: 'normal', title: 'Workshop Fire',
    description: 'The garage full of stock for the side business goes up in eleven minutes flat, along with the side business.',
    effect: { type: 'payMoney', amount: 7_000, reason: 'Workshop fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'sunset-bollard', kind: 'normal', title: 'The New Post',
    description: 'The supermarket puts a concrete post where no post has ever been, and you introduce yourself to it twice in one month.',
    effect: { type: 'payMoney', amount: 3_800, reason: 'Rear bumper, again', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  payday(EVERY_BOARD, 'sunset-2', 'One of your very last paychecks lands.'),
  {
    id: 'sunset-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'Years of holding on pay out, share by share, all at once.',
    effect: { type: 'stockDividend', perShare: 4_000, reason: 'Annual dividend' },
    tone: 'slate', icon: 'space:dividend-day', tier: STANDARD_UP,
  },
  {
    id: 'sunset-swap', kind: 'normal', title: 'Rival Swap',
    description: 'One last audacious trade, and the leader watches their fortune walk away with you.',
    effect: { type: 'swapMoneyWithLeader', reason: 'The eleventh-hour swap' },
    tone: 'slate', icon: 'space:rival-swap', tier: EVERY_BOARD,
  },
  {
    id: 'sunset-benefit', kind: 'normal', title: 'Child Benefit',
    description: 'Every grown-up child pitches in for the retirement fund, and it adds up.',
    effect: { type: 'collectPerChild', amount: 4_000, reason: 'A gift from each child' },
    tone: 'slate', icon: 'space:child-benefit', tier: EVERY_BOARD,
  },
  {
    /*
     * The other half of what the player asked for: a degree buys earning power,
     * not immunity. You got out early, on one clever fund, and one clever fund
     * turns out to be exactly as many as it takes.
     */
    id: 'sunset-1', kind: 'normal', title: 'Fund Blows Up',
    description: 'You retired early on one clever fund, and this is the quarter the clever fund gets something badly wrong.',
    effect: { type: 'payMoney', amount: 16_000, reason: 'The fund you retired on' },
    tone: 'slate', icon: 'space:market-crash', tier: STANDARD_UP,
  },
  {
    id: 'sunset-sticky', kind: 'normal', title: 'Sticky Fingers',
    description: 'You start talking the front-runner out of their finest story.',
    effect: { type: 'stealLifeTile', reason: 'A story changes hands' },
    tone: 'slate', icon: 'space:sticky-fingers', tier: EVERY_BOARD,
  },
  {
    id: 'sunset-handshake', kind: 'normal', title: 'Final Promotion',
    description: 'One last title before the door, if they can be persuaded. Spin, and let the last review of your life decide it.',
    effect: { type: 'promotion', reason: 'The last review of your life' },
    tone: 'slate', icon: 'space:big-promotion', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'sunset-payday-2', 'You have lost count, but the deposit has not.'),
  {
    id: 'sunset-farewell', kind: 'normal', title: 'Farewell Tour',
    description: 'Everyone insists on throwing you a farewell party, and everyone insists on paying.',
    effect: { type: 'collectFromEach', amount: 3_000, reason: 'Leaving gifts' },
    tone: 'slate', icon: 'space:surprise-bonus', tier: STANDARD_UP,
  },
  {
    id: 'sunset-fete', kind: 'normal', title: 'Town Fair',
    description: 'You run the raffle, and the money is far better than anybody predicted.',
    effect: { type: 'gainMoney', amount: 1_100, reason: 'Raffle earnings' },
    tone: 'green', icon: 'space:garage-sale', tier: LONG_ONLY,
  },
  {
    id: 'sunset-yard-sale', kind: 'normal', title: 'Yard Sale',
    description: 'Old clothes and books turn into a tidy stack of cash.',
    effect: { type: 'gainMoney', amount: 700, reason: 'Yard sale' },
    tone: 'green', icon: 'space:yard-sale', tier: LONG_ONLY,
  },
  {
    id: 'sunset-garage-sale', kind: 'normal', title: 'Garage Sale',
    description: 'Strangers pay real money for your old junk — spin to see the haul.',
    effect: { type: 'spinForMoney', perPip: 900, reason: 'Garage sale haul' },
    tone: 'slate', icon: 'space:garage-sale', tier: LONG_ONLY,
  },
  {
    id: 'sunset-nest-egg', kind: 'normal', title: 'The Sit-Down',
    description: 'You both go through a year of statements at the kitchen table, and one of you has some explaining to do about a very nice coat.',
    effect: { type: 'household', reason: 'A year of the joint account, gone through properly' },
    tone: 'purple', icon: 'space:quiet-savings', tier: LONG_ONLY,
  },
  {
    id: 'sunset-last-spin', kind: 'normal', title: 'Last Big Spin',
    description: 'One final roll of the dice on the way out the door — spin for the payout.',
    effect: { type: 'spinForMoney', perPip: 3_500, reason: 'One last bet' },
    tone: 'slate', icon: 'space:lottery-ticket', tier: STANDARD_UP,
  },
  setback('veryHard', EVERY_BOARD, 'sunset-tax', 'Final Tax Bill',
    'One last brown envelope arrives before the office door closes behind you for good.',
    { type: 'payMoney', amount: 22_000, reason: 'Final tax bill' },
    'slate', 'space:refund-check'),
  flavour(EVERY_BOARD, 'sunset-3', 'Sunset Ahead', 'The finish line is close enough to see the glow.', 'slate', 'space:sunset-ahead'),
]

const RETIREMENT: SpaceContent = {
  id: 'retirement', kind: 'retirement', title: 'Retirement',
  description: 'You close the office door for the last time and step into retirement.',
  effect: { type: 'retire' },
  tone: 'gold', icon: 'space:retirement', tier: EVERY_BOARD,
}

// ---------------------------------------------------------------------------
// The route: start, three forks, three trunk runs, and retirement.
// ---------------------------------------------------------------------------

/*
 * The graduate job fair is the last tile of College Lane rather than a stop on
 * the trunk, because that is what it is: the hall the degree buys you into,
 * standing at the end of the road that bought it. Straight to Work reaches its
 * own fair on its first tile and merges into Main Street directly.
 */
/*
 * The eight summaries below are the only writing on this board a player reads
 * *before* deciding anything, and they used to be captions: accurate, even-
 * handed, and impossible to disagree with. A fork nobody argues about is a
 * coin the game asks you to flip. Each one is now a case put by somebody who
 * believes it, with its cost admitted in the same breath — because the sentence
 * that starts the argument at the table is the one that concedes something.
 */

const COLLEGE_BRANCH: RouteBranch = {
  identity: {
    name: 'College Lane',
    summary: 'Pay for four years now and be paid properly for forty. The bill is due up front, in full, before you have earned a penny — and the wage it buys is dependable rather than enormous.',
  },
  spaces: [...COLLEGE_LANE, GRAD_FAIR],
}

const WORK_BRANCH: RouteBranch = {
  identity: {
    name: 'Straight to Work',
    summary: 'Be earning by Friday while they are still unpacking their dorms. No tuition, no safety net, and a trade ladder whose bottom rung is grim and whose top rung beats any graduate at this table.',
  },
  spaces: WORK_LANE,
}

const COMPANY_BRANCH: RouteBranch = {
  identity: {
    name: 'Company Road',
    summary: 'Stay. The raise comes because you were still here to be given it, the good years are shared out, and the company decides where you live.',
  },
  spaces: COMPANY_ROAD,
}

const HOPPER_BRANCH: RouteBranch = {
  identity: {
    name: 'Job-Hopper Alley',
    summary: 'Leave. You stop where you stand, hand in your notice, and take a fresh draw on the whole salary table — glorious if you drew badly the first time, and a real risk if you did not.',
  },
  spaces: JOB_HOPPER_ALLEY,
}

const FAMILY_BRANCH: RouteBranch = {
  identity: {
    name: 'Family Lane',
    summary: 'A house full of noise, a bonus for every child at the end, and a shelf of stories nobody can take from you. Far fewer paydays, and every bill arrives multiplied.',
  },
  spaces: FAMILY_LANE,
}

const FAST_BRANCH: RouteBranch = {
  identity: {
    name: 'Fast Track',
    summary: 'Paydays, raises and the corner office, earned at the desk on the evenings and weekends. The personal life you gave up for it is the real cost.',
  },
  spaces: FAST_TRACK,
}

const RISKY_BRANCH: RouteBranch = {
  identity: {
    name: 'Risky Road',
    summary: 'Startups, margin and one very confident broker. Whoever is behind at the house should be here; whoever is ahead should think hard about it.',
  },
  spaces: RISKY_ROAD,
}

const SAFE_BRANCH: RouteBranch = {
  identity: {
    name: 'Safe Street',
    summary: 'Coupons, interest and a full pantry. Nobody has ever got rich down here, and nobody has ever been ruined — which is worth a great deal if you are already winning.',
  },
  spaces: SAFE_STREET,
}

export const ROUTE_USA: RouteDefinition = {
  segments: [
    fork(START, COLLEGE_BRANCH, WORK_BRANCH),
    run('main street', MAIN_STREET_EARLY),
    fork(MID_CAREER_FORK, COMPANY_BRANCH, HOPPER_BRANCH),
    run('main street, after the fork', MAIN_STREET_LATE),
    fork(MARRIAGE, FAMILY_BRANCH, FAST_BRANCH),
    run('midtown', MIDTOWN),
    fork(HOME_BUYING, RISKY_BRANCH, SAFE_BRANCH),
    run('sunset strip', SUNSET_STRIP),
  ],
  terminal: RETIREMENT,
}
