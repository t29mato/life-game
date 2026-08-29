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
 * The Japan route: the same measured skeleton, and an entirely Japanese life.
 *
 * Structurally this board is the USA board, tile for tile: same tiers, same
 * stops, same hardship placements, same hazard tags, same payday count per
 * lane, every sum ×100. That is deliberate and load-bearing — the skeleton is
 * where two years of measured balance lives (the even opening fork, the
 * volatile work lane, the twice-a-game insurance payoff), and the CPU
 * scale-invariance suite proves a ×100 board plays identically. What a country
 * gets to change is everything the player actually reads: which life happens
 * on each tile, and in which words.
 *
 * The voice rule, applied on every tile below: **short sentences, plain
 * words, a Japanese word only where the sentence teaches it in passing** (the
 * tatami, the izakaya, the shaken), and never in a title. The joke is the
 * situation, not the vocabulary — a reader who is not a native English
 * speaker should get the punchline as fast as a reader who is.
 */

const START: SpaceContent = {
  ...flavour(EVERY_BOARD, 'jp-start', 'Start of Life', 'Your journey begins one April morning, wallet light, shoes new, and the whole timetable of a life posted on the wall ahead.', 'slate', 'space:start-of-life'),
  kind: 'start',
}

/**
 * University Lane: one February morning decides four years, and the bill is
 * due before the first lecture. The tuition stop and the loan tile carry the
 * same measured weight as every edition's — what is Japanese is the exam hall,
 * the six-tatami room, and a "scholarship" with excellent branding.
 */
const UNIVERSITY_LANE: readonly SpaceContent[] = [
  // EVERY_BOARD, not STANDARD_UP — see usa/route.ts college-1.
  flavour(EVERY_BOARD, 'jp-uni-move-in', 'Six-Tatami Room', 'Your first solo apartment is measured in straw mats. It holds a futon, a rice cooker, and every ambition you have.', 'blue', 'space:move-in-day', {
    from: 'hard',
    description: 'Your first solo apartment is measured in straw mats — and the landlord wants a deposit, plus a non-refundable payment called "gratitude money" for the privilege of renting to you.',
    effect: { type: 'payMoney', amount: 140_000, reason: 'Deposit and gratitude money' },
  }),
  {
    id: 'jp-uni-tuition', kind: 'event', title: 'Entrance Fees',
    description: 'One February morning decides four years: an examination hall silent except for six hundred pencils and one person coughing. You pass — and the fees are due before anyone shows you the library.',
    effect: { type: 'tuition', reason: 'University entrance and tuition' },
    tone: 'blue', icon: 'space:tuition-bill', tier: EVERY_BOARD,
  },
  flavour(LONG_ONLY, 'jp-uni-cramming', 'Late-Night Cramming', 'Vending-machine coffee, three highlighters, and a textbook you swear you will finish before the exam does.', 'blue', 'space:late-night-study', {
    from: 'hard',
    description: 'Vending-machine coffee, three highlighters, and a print shop by the gate that charges by the page for all of it.',
    effect: { type: 'payMoney', amount: 50_000, reason: 'Coffee and copying' },
  }),
  setback('veryHard', STANDARD_UP, 'jp-uni-laptop', 'Laptop Dies',
    'Your laptop gives up two days before the thesis deadline, and the replacement is not the cheap one.',
    { type: 'payMoney', amount: 300_000, reason: 'Emergency laptop' },
    'blue', 'space:late-night-study'),
  {
    id: 'jp-uni-konbini-shifts', kind: 'normal', title: 'Convenience Shifts',
    description: 'Night shifts at the convenience store: you can now scan, bag, brew, fry, and bow simultaneously, and the pay adds up.',
    effect: { type: 'gainMoney', amount: 900_000, reason: 'Convenience store shifts' },
    tone: 'blue', icon: 'space:campus-job', tier: EVERY_BOARD,
  },
  setback('hard', EVERY_BOARD, 'jp-uni-phone-trap', 'The Phone Contract',
    'The phone plan you signed at nineteen had a cancellation fee buried in the fine print, and this is the month it catches up with you.',
    { type: 'payMoney', amount: 30_000, reason: 'Contract cancellation fees' },
    'blue', 'finance:bank-visit'),
  flavour(LONG_ONLY, 'jp-uni-circle', 'The Circle', 'You join a university club that is nominally about tennis and actually about drinking parties with a tennis theme.', 'blue', 'space:group-project', {
    from: 'hard',
    description: 'You join a university club that is nominally about tennis, and the spring training-camp fee arrives before the first rally does.',
    effect: { type: 'payMoney', amount: 40_000, reason: 'Club trip fees' },
  }),
  {
    id: 'jp-uni-grant', kind: 'normal', title: 'The Real Scholarship',
    description: 'A foundation grant nobody expected — you read the terms twice to confirm it is actually a gift — and it covers a serious chunk of the fees.',
    effect: { type: 'gainMoney', amount: 2_400_000, reason: 'Foundation grant' },
    tone: 'blue', icon: 'space:scholarship-win', tier: EVERY_BOARD,
  },
  {
    id: 'jp-uni-cup-noodles', kind: 'normal', title: 'Cup Noodle Weeks',
    description: 'Dinner is cup ramen under excellent fluorescent light for a fortnight, and the grocery bill still stings.',
    effect: { type: 'payMoney', amount: 60_000, reason: 'Groceries on a student budget' },
    tone: 'blue', icon: 'space:grocery-run', tier: LONG_ONLY,
  },
  flavour(EVERY_BOARD, 'jp-uni-suit-season', 'Suit Season', 'Job hunting begins: one black suit, one white shirt, one approved hairstyle, and forty thousand identical portfolios. Yours has a nice font.', 'blue', 'space:finals-week', {
    from: 'hard',
    description: 'Job hunting begins: the black suit, the plain shoes, the portrait photos with the regulation half-smile — all, it turns out, sold separately.',
    effect: { type: 'payMoney', amount: 160_000, reason: 'The interview uniform' },
  }),
  {
    id: 'jp-uni-internship', kind: 'normal', title: 'Summer Internship',
    description: 'A summer of fetching tea and photocopies ends with a transport stipend that pays better than the work did.',
    effect: { type: 'gainMoney', amount: 500_000, reason: 'Internship stipend' },
    tone: 'blue', icon: 'space:new-skills', tier: LONG_ONLY,
  },
  {
    id: 'jp-uni-pitch', kind: 'normal', title: 'Pitch Night',
    description: 'You pitch your seminar-room idea to visiting investors in Shibuya — spin to see who bites.',
    effect: { type: 'spinForMoney', perPip: 40_000, reason: 'Pitch night winnings' },
    tone: 'blue', icon: 'space:startup-bet', tier: LONG_ONLY,
  },
  {
    id: 'jp-uni-abroad', kind: 'normal', title: 'Study Abroad',
    description: 'A semester overseas costs a fortune and changes how you see everything — including how quiet the trains back home suddenly seem.',
    effect: { type: 'payMoney', amount: 400_000, reason: 'Semester abroad' },
    tone: 'blue', icon: 'space:weekend-trip', tier: STANDARD_UP,
  },
  {
    id: 'jp-uni-loan', kind: 'normal', title: 'The "Scholarship"',
    description: 'The scholarship that got you here turns out to have been a loan with excellent branding, and repayments start the month the gown goes back.',
    effect: { type: 'payMoney', amount: 500_000, reason: 'Scholarship-loan repayments' },
    tone: 'blue', icon: 'finance:bank-visit', tier: STANDARD_UP,
  },
  {
    id: 'jp-uni-graduation', kind: 'event', title: 'Graduation Day',
    description: 'Four years, one thesis, and a diploma tube you will never open again. Officially a graduate.',
    effect: { type: 'graduate' },
    tone: 'blue', icon: 'space:cap-and-gown', tier: EVERY_BOARD,
  },
  {
    id: 'jp-uni-farewell', kind: 'normal', title: 'Clearing the Dorm',
    description: 'You pack four years into two boxes and hand the room key back to the caretaker.',
    effect: { type: 'none' },
    tone: 'blue', icon: 'space:cap-and-gown', tier: EVERY_BOARD,
  },
]

const GRAD_FAIR: SpaceContent = {
  id: 'jp-job-hunt', kind: 'event', title: 'The Job Hunt',
  description: 'Forty thousand of you buy the same black suit in the same week and take the same aptitude test. Two doors open; pick one.',
  effect: { type: 'chooseCareer', pool: 'graduate' },
  tone: 'gold', icon: 'space:grad-job-fair', tier: EVERY_BOARD,
}

/**
 * Straight to Work: the school-mediated placement system makes this lane's
 * structural promise — hired on tile one, paid before the students have
 * unpacked — *more* true in Japan than anywhere. The rest of the lane is the
 * gamble the player asked for: a yatai bet, a prize-exchange window, and rent
 * that is due whatever the week did.
 */
const WORK_LANE: readonly SpaceContent[] = [
  {
    id: 'jp-placement-day', kind: 'event', title: 'Placement Day',
    description: 'Your school has an arrangement with a local firm, and by Friday you have a badge, a uniform, and a wage — two years before the students earn a thing.',
    effect: { type: 'chooseCareer', pool: 'basic' },
    tone: 'gold', icon: 'space:first-job-fair', tier: EVERY_BOARD,
  },
  {
    id: 'jp-work-first-envelope', kind: 'normal', title: 'First Pay Envelope',
    description: 'Your very first pay lands and feels enormous. Following custom, you take your parents to dinner with it, and they let you pay with visible pride.',
    effect: { type: 'gainMoney', amount: 200_000, reason: 'First pay envelope' },
    tone: 'orange', icon: 'space:first-paycheck', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'jp-work-payday-1', 'A full month on the books, and the deposit lands while your classmates are still queueing for lecture seats.', missedPayday(
    'veryHard',
    'Paid in Arrears',
    'Nobody mentioned that the first month is paid a month behind, and the rice cooker does not care.',
    90_000,
    'A month of living on nothing',
  )),
  {
    id: 'jp-work-moving-out', kind: 'event', title: 'Moving Out',
    description: 'You are earning, so you are expected to be housed: a deposit, a month of gratitude money that thanks the landlord for existing, and a bed you assemble yourself.',
    effect: { type: 'payMoney', amount: 180_000, reason: 'Deposit, key money and first month' },
    tone: 'orange', icon: 'space:rent-due', tier: EVERY_BOARD, unscaled: true,
  },
  {
    id: 'jp-work-first-night', kind: 'normal', title: 'First Night In',
    description: 'You unpack by the light of one bare bulb, because the ceiling light still needs buying.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:rent-due', tier: EVERY_BOARD,
  },
  {
    id: 'jp-work-uniform', kind: 'event', title: 'Uniform Deposit',
    description: 'Two uniforms, a name badge, safety boots, and a deposit you have a feeling you will never see again.',
    effect: { type: 'payMoney', amount: 150_000, reason: 'Uniform deposit' },
    tone: 'orange', icon: 'space:rent-due', tier: EVERY_BOARD, appearsFrom: 'hard',
  },
  {
    id: 'jp-work-overtime', kind: 'normal', title: 'Paid Overtime',
    description: 'You pick up an extra shift, and the overtime actually appears on the slip — a novelty you decide not to mention too loudly.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:overtime-shift', tier: STANDARD_UP,
  },
  {
    id: 'jp-work-yatai', kind: 'normal', title: 'The Yatai Bet',
    description: 'Every yen you have goes into a second-hand stall cart and a very good broth — spin to see what the station crowd does at dusk.',
    effect: { type: 'spinForMoney', perPip: 200_000, reason: 'What the stall took' },
    tone: 'orange', icon: 'career:food-truck-owner', tier: STANDARD_UP,
  },
  setback('veryHard', STANDARD_UP, 'jp-work-late-rent', 'Late Rent',
    'The rent goes in four days late, and the guarantor company\'s letter is on the doormat before your apology is.',
    { type: 'payMoney', amount: 20_000, reason: 'Late rent penalty' },
    'orange', 'space:rent-due'),
  payday(EVERY_BOARD, 'jp-work-payday-2', 'Another month, another envelope, and still nobody has ever asked to see a diploma.', missedPayday(
    'hard',
    'Hours Cut',
    'The rota goes up on Sunday with your name on half as many lines as last week.',
    120_000,
    'Half a month of shifts',
  )),
  flavour(LONG_ONLY, 'jp-work-forklift', 'Forklift Licence', 'A weekend course, one written test, and a licence your boss treats like a huge achievement.', 'orange', 'space:new-skills', {
    from: 'hard',
    description: 'A weekend course, one written test, and a licence your boss treats like a huge achievement — with the course fee yours to find.',
    effect: { type: 'payMoney', amount: 80_000, reason: 'Course fee' },
  }),
  flavour(STANDARD_UP, 'jp-work-reliable', 'Never Once Late', 'You have not missed a shift or a train in two years. The station master nods to you now, which is the local equivalent of a medal.', 'orange', 'space:steady-hustle'),
  payday(EVERY_BOARD, 'jp-work-payday-3', 'Three paydays in, and the bank book has started to look like a habit.'),
  {
    id: 'jp-work-matsuri-gig', kind: 'normal', title: 'Festival Weekend',
    description: 'Two days hauling crates and stringing lanterns for the shrine festival pays better than it has any right to.',
    effect: { type: 'gainMoney', amount: 90_000, reason: 'Festival weekend work' },
    tone: 'orange', icon: 'space:side-hustle', tier: LONG_ONLY,
  },
  {
    id: 'jp-work-prize-exchange', kind: 'normal', title: 'Prize Exchange',
    description: 'You win at the parlour, which legally sells you a trinket, which a mysteriously adjacent window buys for cash — spin for the haul.',
    effect: { type: 'spinForMoney', perPip: 120_000, reason: 'The adjacent window pays out' },
    tone: 'orange', icon: 'space:lottery-ticket', tier: LONG_ONLY,
  },
  {
    id: 'jp-work-commuter-pass', kind: 'normal', title: 'Commuter Pass',
    description: 'The company covers the train — but the bus that gets you to the station, it turns out, is not covered. That one is on you.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:car-trouble', tier: LONG_ONLY,
  },
  {
    id: 'jp-work-shift-lead', kind: 'normal', title: 'Shift Lead',
    description: 'Somebody has to hold the keys, open at six, and write the rota. Spin: it might as well be you.',
    effect: { type: 'promotion', reason: 'Somebody has to hold the keys' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: LONG_ONLY,
  },
]

/**
 * Salaryman Street, first half: the years between the first wage and the
 * first serious question about where the wage comes from. The densest stretch
 * of recognition-comedy on the board, exactly as the proposal ordered.
 */
const SALARYMAN_STREET_EARLY: readonly SpaceContent[] = [
  flavour(STANDARD_UP, 'jp-main-apartment', 'Apartment Hunt', 'You sign a lease on a place described as "cosy", with a kitchen in the hallway and a washing machine on the balcony.', 'slate', 'space:apartment-hunt', {
    from: 'hard',
    description: 'You sign a lease on a place described as "cosy" — and the agent\'s fee, the deposit, the key money and the guarantor fee are all listed out for you, one by one.',
    effect: { type: 'payMoney', amount: 220_000, reason: 'Deposit, key money and agency fee' },
  }),
  {
    id: 'jp-main-probation', kind: 'normal', title: 'Probation Review',
    description: 'Six months in, somebody sits down opposite you with a form to fill out in three copies and asks how you think it is going. Spin.',
    effect: { type: 'promotion', reason: 'The end of probation' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'jp-main-depachika', kind: 'normal', title: 'The Food Hall',
    description: 'You go down to the department store basement for one thing, hungry, and surface forty minutes later with a beautifully wrapped box of food you never planned to buy.',
    effect: { type: 'payMoney', amount: 80_000, reason: 'The food hall got you' },
    tone: 'slate', icon: 'space:grocery-run', tier: LONG_ONLY,
  },
  {
    id: 'jp-main-bank', kind: 'normal', title: 'Bank Visit',
    description: 'The teller bows at exactly the angle the manual specifies and asks, warmly, how the money is treating you.',
    effect: { type: 'bank' },
    tone: 'slate', icon: 'finance:bank-visit', tier: EVERY_BOARD,
  },
  {
    id: 'jp-main-hometown-tax', kind: 'normal', title: 'Hometown Tax',
    description: 'You redirect your taxes to a village you have never visited, and it thanks you with a box of astonishing beef.',
    effect: { type: 'gainMoney', amount: 150_000, reason: 'Hometown tax return gift' },
    tone: 'slate', icon: 'space:side-hustle', tier: LONG_ONLY,
  },
  {
    id: 'jp-main-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'The broker\'s laminated flood-fire-and-earthquake map of your neighbourhood is thorough, recent, and quietly terrifying.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office', tier: EVERY_BOARD,
  },
  {
    id: 'jp-main-burnout', kind: 'normal', title: 'Burnout',
    description: 'A year of last trains and "voluntary" overtime, and one Monday morning you simply cannot go in. The job does not wait.',
    effect: { type: 'loseCareer', reason: 'Signed off, and the job did not wait' },
    tone: 'orange', icon: 'space:steady-hustle', tier: STANDARD_UP,
  },
  {
    id: 'jp-main-gym', kind: 'normal', title: 'Gym Membership',
    description: 'You commit to the gym by the station. You have visited twice; the membership fee visits monthly.',
    effect: { type: 'none' },
    tone: 'slate', icon: 'space:gym-membership', tier: LONG_ONLY,
  },
  // The only payday in this stretch — see usa/route.ts main-6. Harshening it
  // zeroed every player's income for this whole run on Hard and Very Hard, so
  // it stays unconditional rather than joining every other lane's pattern of
  // harshening one of several paydays and leaving another alone.
  payday(EVERY_BOARD, 'jp-main-payday-1', 'The deposit lands at 9:00 on the dot, because of course it does. The best notification of the week.'),
  {
    id: 'jp-main-stock-tip', kind: 'normal', title: 'Stock Tip',
    description: 'A colleague opens the trading app under the desk and swears by a ticker. The market is open until three.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'space:stock-tip', tier: EVERY_BOARD,
  },
  {
    id: 'jp-main-shaken', kind: 'normal', title: 'Inspection Time',
    description: 'The car\'s mandatory biennial inspection arrives — the shaken — and the garage finds, as it is legally required to, several things.',
    effect: { type: 'payMoney', amount: 120_000, reason: 'Vehicle inspection' },
    tone: 'slate', icon: 'space:car-trouble', tier: LONG_ONLY,
  },
  {
    id: 'jp-main-onsen', kind: 'normal', title: 'Hot Spring Weekend',
    description: 'A spontaneous onsen trip empties your wallet, boils you pink, and fixes everything else.',
    effect: { type: 'payMoney', amount: 60_000, reason: 'Hot spring weekend' },
    tone: 'slate', icon: 'space:weekend-trip', tier: LONG_ONLY,
  },
  {
    id: 'jp-main-fender-bender', kind: 'normal', title: 'Minor Car Crash',
    description: 'A gentle tap in the supermarket car park. The other driver bows at precisely forty-five degrees; the quote arrives by email that afternoon.',
    effect: { type: 'payMoney', amount: 240_000, reason: 'Bodyshop bill', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: EVERY_BOARD,
  },
  setback('veryHard', EVERY_BOARD, 'jp-main-pileup', 'Expressway Pileup',
    'Fog on the expressway, brake lights, and four cars crushed together on the ramp. Everyone walks away; the invoices do not.',
    { type: 'payMoney', amount: 1_400_000, reason: 'Pileup repairs', hazard: 'accident' },
    'slate', 'space:fender-bender'),
  setback('hard', EVERY_BOARD, 'jp-main-dentist', 'Dentist Bill',
    'One filling, one silver crown, one lecture about flossing, and an invoice that stings rather more than the drill did.',
    { type: 'payMoney', amount: 500_000, reason: 'Dental work' },
    'slate', 'space:gym-membership'),
  {
    id: 'jp-main-tower-parking', kind: 'normal', title: 'The Parking Tower',
    description: 'The rotating car elevator considers your wing mirror an acceptable loss, and the attendant\'s apology is magnificent.',
    effect: { type: 'payMoney', amount: 260_000, reason: 'Wing mirror and pride', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'jp-main-tempura-fire', kind: 'normal', title: 'Tempura Night',
    description: 'A pan of oil, one distracted minute answering the intercom, and a kitchen ceiling the exact colour of strong tea.',
    effect: { type: 'payMoney', amount: 600_000, reason: 'Kitchen fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'jp-main-morning-praise', kind: 'normal', title: 'Morning Assembly',
    description: 'Your name is read out at the morning assembly for last month\'s numbers, and everyone claps in exact unison.',
    effect: { type: 'gainMoney', amount: 100_000, reason: 'Performance bonus' },
    tone: 'slate', icon: 'space:good-review', tier: LONG_ONLY,
  },
  {
    id: 'jp-main-blossom-duty', kind: 'normal', title: 'Blossom Duty',
    description: 'The cherry trees bloom for one perfect week, and you are this year\'s designated tarp-holder at six a.m., guarding an empty rectangle from other companies\' tarp-holders. Worth it.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'slate', icon: 'space:lucky-find', tier: EVERY_BOARD,
  },
]

/**
 * The mid-career crossroads: stay or go, and Japan is the country where that
 * question has a name on each side. The junction halts movement, as every
 * fork must.
 */
const MID_CAREER_FORK: SpaceContent = {
  id: 'jp-crossroads', kind: 'normal', title: 'Five Years In',
  description: 'Five years at the same desk, a seniority raise on schedule, and a recruiter\'s message you have somehow still not deleted. The road forks here.',
  effect: { type: 'none' },
  tone: 'orange', icon: 'space:networking-night', tier: EVERY_BOARD,
}

/**
 * Company Loyalty Road: the raise arrives because you were still there to
 * receive it. Everything on this side compounds, and everything it costs is a
 * thing the company decided on your behalf.
 */
const COMPANY_LOYALTY_ROAD: readonly SpaceContent[] = [
  {
    id: 'jp-loyal-seniority', kind: 'normal', title: 'The Seniority Ladder',
    description: 'Nobody has left this department in a decade, so the job above yours only comes free when somebody finally retires. Spin to see whether this was the year.',
    effect: { type: 'promotion', reason: 'The job above yours came free' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'jp-loyal-summer-bonus', kind: 'payday', title: 'Summer Bonus',
    description: 'Twice a year the company simply hands you extra months of salary. Nobody abroad believes you.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: STANDARD_UP,
  },
  {
    id: 'jp-loyal-transfer', kind: 'normal', title: 'The Transfer Order',
    description: 'Osaka. April first. The company decided in February; you found out on Friday. Your apartment, gym and favourite ramen counter are now souvenirs, and the moving van is yours to pay for.',
    effect: { type: 'payMoney', amount: 300_000, reason: 'Relocating for the company' },
    tone: 'orange', icon: 'space:apartment-hunt', tier: STANDARD_UP,
  },
  {
    id: 'jp-loyal-black-ice', kind: 'normal', title: 'Black Ice',
    description: 'Forty minutes each way for nine years, and one January morning the same gentle corner finds you before you find it.',
    effect: { type: 'payMoney', amount: 400_000, reason: 'Commuter write-off', hazard: 'accident' },
    tone: 'orange', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'jp-loyal-plaque', kind: 'normal', title: 'Twenty Years, One Plaque',
    description: 'Two decades, a framed certificate, and a story about the old office that everybody at the table lets you finish.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'orange', icon: 'space:lucky-find', tier: LONG_ONLY,
  },
  {
    id: 'jp-loyal-envelope', kind: 'normal', title: 'The Envelope Round',
    description: 'You start the collection envelope for a colleague\'s wedding, which makes the shortfall at the end of it — there is always a shortfall — yours.',
    effect: { type: 'payEach', amount: 60_000, reason: 'Making up the collection' },
    tone: 'orange', icon: 'space:surprise-bonus', tier: LONG_ONLY,
  },
]

/**
 * Job-Hopper Alley: the raise arrives because you left. Mid-career hiring
 * stopped being a scandal a generation ago, and this road is the proof — a
 * compulsory re-draw at the head, and a gap where the health insurance bill
 * finds you between badges.
 */
const JOB_HOPPER_ALLEY: readonly SpaceContent[] = [
  {
    id: 'jp-hopper-lookout', kind: 'normal', title: 'Quiet Job Search',
    description: 'You update your résumé in a manga café after hours and start taking calls nobody at the office can hear.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:headhunted', tier: EVERY_BOARD,
  },
  {
    id: 'jp-hopper-move', kind: 'event', title: 'Name Your Price',
    description: 'You hand in your notice with the next offer already signed. HR looks stunned, as if you had quit on the spot; the new title arrives with a new number attached.',
    effect: { type: 'careerChange', reason: 'You named your price elsewhere', compulsory: true },
    tone: 'orange', icon: 'space:headhunted', tier: EVERY_BOARD,
  },
  {
    id: 'jp-hopper-bonus', kind: 'payday', title: 'Signing Bonus',
    description: 'The new firm buys out your notice period, and the transfer lands like a bonus season you did not have to wait for.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: EVERY_BOARD,
  },
  {
    id: 'jp-hopper-gap', kind: 'normal', title: 'The Gap',
    description: 'Three weeks between handing back one badge and being issued the next — during which the national health and pension bills arrive, addressed to you personally, with impressive speed.',
    effect: { type: 'payMoney', amount: 300_000, reason: 'Three weeks between badges' },
    tone: 'orange', icon: 'space:rent-due', tier: STANDARD_UP,
  },
  {
    id: 'jp-hopper-van', kind: 'normal', title: 'Moving Van',
    description: 'You drive the two-tonne rental to the new city yourself, and learn its exact height from the car park barrier.',
    effect: { type: 'payMoney', amount: 400_000, reason: 'Van and barrier repairs', hazard: 'accident' },
    tone: 'orange', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'jp-hopper-freelance', kind: 'normal', title: 'Contract Rates',
    description: 'You go freelance for a season, invoice by the day, and learn what the old company was quietly worth — spin for how many of the days were good ones.',
    effect: { type: 'spinForMoney', perPip: 120_000, reason: 'A season of day rates' },
    tone: 'orange', icon: 'space:startup-bet', tier: LONG_ONLY,
  },
  {
    id: 'jp-hopper-leaving-do', kind: 'normal', title: 'Leaving Do',
    description: 'Your third farewell party of the decade. The card is enormous, the collection is generous, and nobody quite remembers your job title.',
    effect: { type: 'collectFromEach', amount: 70_000, reason: 'The leaving collection' },
    tone: 'orange', icon: 'space:poker-night', tier: LONG_ONLY,
  },
]

/** Salaryman Street, second half: the review, the restructuring, and the ring. */
const SALARYMAN_STREET_LATE: readonly SpaceContent[] = [
  {
    id: 'jp-main-review', kind: 'event', title: 'The Review',
    description: 'A small meeting room, two managers with your file open between them, and one question: are you ready for the desk above yours? Spin, and hear what they say.',
    effect: { type: 'promotion', reason: 'Your review came round' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'jp-main-new-year-cards', kind: 'normal', title: 'New Year Cards',
    description: 'You address seventy postcards to people you will also see in person, so that a lottery number printed on each may change nothing.',
    effect: { type: 'none' },
    tone: 'slate', icon: 'space:streaming-bill', tier: LONG_ONLY,
  },
  {
    id: 'jp-main-seniority-raise', kind: 'normal', title: 'Seniority Raise',
    description: 'Your pay rises because you have become one year older. Performance was not discussed, and it would have been rude to ask.',
    effect: { type: 'payRaise' },
    tone: 'slate', icon: 'space:pay-raise-talk', tier: STANDARD_UP,
  },
  setback('veryHard', EVERY_BOARD, 'jp-main-tax-audit', 'Tax Audit',
    'A very polite letter, a long afternoon with a shoebox of receipts, and a figure at the bottom that has clearly already been decided.',
    { type: 'payMoney', amount: 1_500_000, reason: 'Tax audit settlement' },
    'slate', 'space:refund-check'),
  {
    id: 'jp-main-contract-ends', kind: 'normal', title: 'Contract Ends',
    description: 'The contract everyone swore blind would renew in April is, very quietly, not renewed. The farewell bouquet is lovely.',
    effect: { type: 'loseCareer', reason: 'Contract not renewed' },
    tone: 'orange', icon: 'space:layoff-notice', tier: EVERY_BOARD, appearsFrom: 'hard',
  },
  {
    id: 'jp-main-restructuring', kind: 'normal', title: 'Restructuring',
    description: 'The firm announces a "voluntary" early retirement scheme, and your name is on the list of volunteers.',
    effect: { type: 'loseCareer', reason: 'Volunteered, apparently' },
    tone: 'orange', icon: 'space:layoff-notice', tier: EVERY_BOARD,
  },
  {
    id: 'jp-main-midcareer-fair', kind: 'stop', title: 'Mid-Career Fair',
    description: 'A hall of booths for people who did everything right at a company that did not. Two firms like your CV; pick one.',
    effect: { type: 'careerChange', reason: 'A fresh start at the mid-career fair' },
    tone: 'orange', icon: 'space:career-fair-return', tier: EVERY_BOARD,
  },
  {
    id: 'jp-main-point-cards', kind: 'normal', title: 'Point Cards',
    description: 'Thirteen loyalty cards in one straining wallet, and this is the week the points finally converge on a free rice cooker.',
    effect: { type: 'gainMoney', amount: 40_000, reason: 'The points converge' },
    tone: 'slate', icon: 'space:coupon-clipping', tier: LONG_ONLY,
  },
  setback('hard', LONG_ONLY, 'jp-main-parking-ticket', 'Parking Ticket',
    'Eleven minutes over, one green-uniformed pair with a camera and excellent timing, and a sticker on the windscreen.',
    { type: 'payMoney', amount: 15_000, reason: 'Parking fine' },
    'slate', 'space:car-trouble'),
  {
    id: 'jp-main-year-end-party', kind: 'normal', title: 'Year-End Party',
    description: 'The year is officially forgotten at an all-you-can-drink banquet. Someone from Accounting sings, magnificently. You are somehow the treasurer.',
    effect: { type: 'payEach', amount: 60_000, reason: 'You are somehow the treasurer' },
    tone: 'slate', icon: 'space:neighborhood-bbq', tier: LONG_ONLY,
    harsher: {
      from: 'hard',
      description: 'The year is officially forgotten at an all-you-can-drink banquet — then the second party, then the third, then a taxi across half the city, and every receipt finds its way to the treasurer. You are somehow the treasurer.',
      effect: { type: 'payEach', amount: 120_000, reason: 'The second party, the third, and the taxi' },
    },
  },
  {
    id: 'jp-main-march-overtime', kind: 'normal', title: 'Fiscal Year-End',
    description: 'Six weeks of late nights before the books close in March end with a pay slip you read twice.',
    effect: { type: 'gainMoney', amount: 200_000, reason: 'Year-end overtime, actually paid' },
    tone: 'slate', icon: 'space:overtime-shift', tier: LONG_ONLY,
  },
  {
    id: 'jp-main-seasonal-gifts', kind: 'normal', title: 'Seasonal Gifts',
    description: 'Summer gifts and winter gifts for everyone at the table, chosen with great care from a catalogue that is mostly ham.',
    effect: { type: 'payEach', amount: 80_000, reason: 'A beautifully wrapped ham each' },
    tone: 'slate', icon: 'space:surprise-bonus', tier: EVERY_BOARD,
  },
  {
    id: 'jp-main-adjustment', kind: 'normal', title: 'Year-End Adjustment',
    description: 'The December payslip carries a mysterious extra line where the tax office quietly gives some of the year back.',
    effect: { type: 'gainMoney', amount: 70_000, reason: 'Year-end tax adjustment' },
    tone: 'slate', icon: 'space:refund-check', tier: LONG_ONLY,
  },
  {
    id: 'jp-main-winter-bonus', kind: 'payday', title: 'Winter Bonus',
    description: 'The second envelope of the year arrives, sized in months of salary, and the whole country goes shopping the same weekend.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:surprise-bonus', tier: LONG_ONLY,
    harsher: missedPayday(
      'veryHard',
      'Bonus Season, Cancelled',
      'This year\'s envelope contains a letter from the president about headwinds.',
      90_000,
      'A letter about headwinds',
    ),
  },
  {
    id: 'jp-main-mahjong', kind: 'normal', title: 'Mahjong Night',
    description: 'Green felt, three colleagues, friendly stakes, and the exact right tile at the exact right moment.',
    effect: { type: 'collectFromEach', amount: 50_000, reason: 'Mahjong night winnings' },
    tone: 'slate', icon: 'space:poker-night', tier: STANDARD_UP,
  },
  flavour(LONG_ONLY, 'jp-main-ring', 'Ring Shopping', 'You linger a little too long at the jewellery counter, under a poster from 1977 insisting on three months\' salary.', 'slate', 'space:ring-shopping'),
]

const MARRIAGE: SpaceContent = {
  id: 'jp-wedding', kind: 'event', title: 'Wedding Day',
  description: 'A hotel banquet, two outfit changes, and every guest hands over a thick envelope of crisp notes — attendance is priced, and beautifully calligraphed.',
  effect: { type: 'getMarried' },
  tone: 'pink', icon: 'space:wedding-day', tier: EVERY_BOARD,
}

/** Family Lane: the beats every Japanese parent knows, in order of arrival. */
const FAMILY_LANE: readonly SpaceContent[] = [
  {
    id: 'jp-family-nursery-setup', kind: 'normal', title: 'Nursery Setup',
    description: 'You paint the nursery a cheerful yellow, assemble a crib at midnight, and collect the ward office\'s handbook for new parents, which is heavier than the crib.',
    effect: { type: 'payMoney', amount: 200_000, reason: 'Nursery setup' },
    tone: 'purple', icon: 'space:nursery-setup', tier: EVERY_BOARD,
  },
  {
    id: 'jp-family-new-baby', kind: 'event', title: 'New Baby',
    description: 'A tiny new roommate arrives. The ward office sends a nurse, a handbook, and a lump sum that almost covers the hospital.',
    effect: { type: 'haveChildren', count: 1, celebrationPerPip: 40_000 },
    tone: 'purple', icon: 'space:new-baby', tier: EVERY_BOARD,
  },
  {
    id: 'jp-family-golden-week', kind: 'normal', title: 'Golden Week',
    description: 'The whole country goes on holiday during the same five days, at triple price, to the same six places. You have a wonderful time in a queue.',
    effect: { type: 'payMoney', amount: 180_000, reason: 'Golden Week at triple price' },
    tone: 'purple', icon: 'space:family-vacation', tier: LONG_ONLY,
  },
  setback('hard', EVERY_BOARD, 'jp-family-waitlist', 'The Nursery Waitlist',
    'You applied for public nursery before the baby could sit up. You are 47th in line, so a private one bridges the gap at private prices.',
    { type: 'payPerChild', amount: 500_000, reason: 'Private nursery per child' },
    'purple', 'space:nursery-setup'),
  setback('veryHard', STANDARD_UP, 'jp-family-cram-school', 'Cram School',
    'Every child now attends a second school that begins when the first one ends. Dinner is a rice ball eaten on a bicycle.',
    { type: 'payPerChild', amount: 500_000, reason: 'Cram school per child' },
    'purple', 'space:school-fees'),
  {
    id: 'jp-family-school-bag', kind: 'normal', title: 'The School Bag',
    description: 'Each child needs the traditional leather backpack, the uniform, the gym clothes, and forty-one items labelled by hand before Tuesday. The backpack costs more than your first laptop and will outlast your car.',
    effect: { type: 'payPerChild', amount: 300_000, reason: 'School bag and uniforms per child' },
    tone: 'purple', icon: 'space:school-fees', tier: EVERY_BOARD,
  },
  {
    id: 'jp-family-sports-day', kind: 'normal', title: 'Sports Day',
    description: 'Your child\'s class wins the giant-ball-rolling event. You filmed the wrong child for most of it, but the cheering was real.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'purple', icon: 'space:school-play', tier: EVERY_BOARD,
  },
  {
    id: 'jp-family-kei-van', kind: 'normal', title: 'The Kei Van',
    description: 'Reversing the kei van off the drive with three children arguing in the back seat, into the one gatepost that has never once moved.',
    effect: { type: 'payMoney', amount: 320_000, reason: 'Van bodywork', hazard: 'accident' },
    tone: 'purple', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'jp-family-piano', kind: 'normal', title: 'Piano Lessons',
    description: 'The music school by the station takes another small student. The scales are rough, but there is real promise in there somewhere.',
    effect: { type: 'payMoney', amount: 90_000, reason: 'Piano lessons' },
    tone: 'purple', icon: 'space:piano-lessons', tier: LONG_ONLY,
  },
  {
    id: 'jp-family-twins', kind: 'normal', title: 'Twins',
    description: 'The technician goes quiet at the scan, turns the screen around, and holds up two fingers.',
    effect: { type: 'haveChildren', count: 2, celebrationPerPip: 70_000 },
    tone: 'purple', icon: 'space:second-baby', tier: EVERY_BOARD,
  },
  {
    id: 'jp-family-seven-five-three', kind: 'normal', title: 'Seven-Five-Three',
    description: 'Children aged seven, five and three are dressed in tiny formal kimono and photographed at the shrine until at least one of them cries. The photographs are perfect.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'purple', icon: 'space:soccer-season', tier: STANDARD_UP,
  },
  {
    id: 'jp-family-allowance', kind: 'normal', title: 'Child Allowance',
    description: 'A quiet deposit arrives from the ward office for every small person in the house.',
    effect: { type: 'collectPerChild', amount: 150_000, reason: 'Child allowance per child' },
    tone: 'purple', icon: 'space:child-benefit', tier: STANDARD_UP,
  },
  flavour(STANDARD_UP, 'jp-family-portrait', 'Studio Portrait', 'Everyone actually smiles at the same time — the studio frames it before you can change your mind.', 'purple', 'space:family-portrait', {
    from: 'veryHard',
    description: 'Everyone smiles at the same time exactly once, and the studio charges for the whole afternoon, the album, and the commemorative key rings.',
    effect: { type: 'payMoney', amount: 110_000, reason: 'The full photo package' },
  }),
  payday(STANDARD_UP, 'jp-family-payday', 'Payday lands somewhere between the school run and bath time, and is spent in roughly the same window.'),
  {
    id: 'jp-family-back-to-work', kind: 'normal', title: 'Back to Work',
    description: 'You return from parental leave with new scheduling superpowers, and negotiate hard on the way back in.',
    effect: { type: 'payRaise' },
    tone: 'purple', icon: 'space:pay-raise-talk', tier: LONG_ONLY,
  },
  {
    id: 'jp-family-third', kind: 'normal', title: 'Another Arrival',
    description: 'The kei van is officially too small, and nobody minds in the slightest.',
    effect: { type: 'haveChildren', count: 1, celebrationPerPip: 40_000 },
    tone: 'purple', icon: 'space:new-baby', tier: LONG_ONLY,
  },
]

/** Career Track: the overtime is real and so are the raises. */
const CAREER_TRACK: readonly SpaceContent[] = [
  {
    id: 'jp-fast-shortlist', kind: 'normal', title: 'The Shortlist',
    description: 'Your name is on the shortlist for section chief, and so are two others. Spin.',
    effect: { type: 'promotion', reason: 'On the shortlist for section chief' },
    tone: 'orange', icon: 'space:big-promotion', tier: STANDARD_UP,
  },
  {
    id: 'jp-fast-networking', kind: 'normal', title: 'The Second Party',
    description: 'The conference itself was fine; the izakaya afterwards produces a referral worth real money.',
    effect: { type: 'gainMoney', amount: 120_000, reason: 'Referral bonus' },
    tone: 'orange', icon: 'space:networking-night', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'jp-fast-payday-1', 'Overtime finally shows up on the pay slip.'),
  {
    id: 'jp-fast-headhunted', kind: 'normal', title: 'Headhunted',
    description: 'A recruiter calls your personal phone during the Monday meeting, with two offers and no patience.',
    effect: { type: 'careerChange', reason: 'Headhunted for something new' },
    tone: 'orange', icon: 'space:headhunted', tier: EVERY_BOARD,
  },
  {
    id: 'jp-fast-rental-car', kind: 'normal', title: 'The Client\'s City',
    description: 'An unfamiliar town, a rented kei car, and a mechanical parking tower with opinions about your rear bumper.',
    effect: { type: 'payMoney', amount: 320_000, reason: 'Rental excess', hazard: 'accident' },
    tone: 'orange', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'jp-fast-client-win', kind: 'normal', title: 'Client Win',
    description: 'You land the account everyone said was impossible, and bow at a depth reserved for exactly this occasion.',
    effect: { type: 'gainMoney', amount: 300_000, reason: 'Client win bonus' },
    tone: 'orange', icon: 'space:client-win', tier: STANDARD_UP,
  },
  {
    id: 'jp-fast-conference', kind: 'normal', title: 'Conference Talk',
    description: 'Your talk makes the rounds of the whole industry in a week, and the organisers of the next three conferences would like your calendar.',
    effect: { type: 'gainMoney', amount: 440_000, reason: 'Speaking fees' },
    tone: 'orange', icon: 'space:conference-talk', tier: STANDARD_UP,
  },
  setback('hard', EVERY_BOARD, 'jp-fast-burnout', 'Burnout Leave',
    'Six weeks signed off with a doctor\'s note, and the pay packet is a great deal lighter by the time you bow your way back in.',
    { type: 'payMoney', amount: 1_200_000, reason: 'Unpaid leave' },
    'orange', 'space:steady-hustle'),
  {
    id: 'jp-fast-payday-severance', kind: 'payday', title: 'Year-End Payroll',
    description: 'The fiscal year closes out, and whatever this job pays lands in your account one more time before the org chart is redrawn.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: EVERY_BOARD, appearsFrom: 'veryHard',
  },
  {
    id: 'jp-fast-reorg', kind: 'normal', title: 'The Reorganisation',
    description: 'The org chart is redrawn overnight and your name turns up in a different box entirely. Nobody asked, which is what a reorganisation is.',
    effect: { type: 'careerChange', reason: 'Reorganised into a new role', compulsory: true },
    tone: 'orange', icon: 'space:career-fair-return', tier: EVERY_BOARD, appearsFrom: 'veryHard',
  },
  {
    id: 'jp-fast-trading', kind: 'normal', title: 'Trading App',
    description: 'The bonus is burning a hole in your pocket, and the app has been sending notifications with exclamation marks.',
    effect: { type: 'buyStock' },
    tone: 'orange', icon: 'finance:trading-floor', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'jp-fast-payday-2', 'Another month down, another deposit in.', missedPayday(
    'hard',
    'Bonus Clawback',
    'Last year\'s bonus is reassessed by somebody in another building, and reassessed downwards.',
    600_000,
    'Bonus clawed back',
  )),
  {
    id: 'jp-fast-bonus-season', kind: 'normal', title: 'Bonus Season',
    description: 'The year-end envelope is thicker than expected. You check the name on it twice, quietly, in the corridor.',
    effect: { type: 'gainMoney', amount: 500_000, reason: 'Year-end bonus' },
    tone: 'orange', icon: 'space:bonus-season', tier: STANDARD_UP,
  },
  flavour(LONG_ONLY, 'jp-fast-window-seat', 'A Desk With a View', 'You are moved to a desk by the window — which here can mean a promotion, or a quiet way of being pushed aside. You check the org chart twice before celebrating.', 'orange', 'space:corner-office', {
    from: 'hard',
    description: 'You are moved to a desk by the window — the good kind, this time — and the room that comes with it is yours to furnish.',
    effect: { type: 'payMoney', amount: 180_000, reason: 'Furnishing the office' },
  }),
  {
    id: 'jp-fast-board-seat', kind: 'normal', title: 'Board Seat',
    description: 'A chair has come free at the long table on the top floor. Spin to find out whose name ends up on the door card.',
    effect: { type: 'promotion', reason: 'A chair at the long table' },
    tone: 'orange', icon: 'space:corner-office', tier: STANDARD_UP,
  },
  {
    id: 'jp-fast-retention', kind: 'normal', title: 'Retention Offer',
    description: 'You mention, lightly, over tea, that somebody else has been in touch. The counter-offer arrives before the tea does.',
    effect: { type: 'payRaise' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'jp-fast-equity', kind: 'normal', title: 'Options Vest',
    description: 'Four years of paperwork from the startup years turn into an actual number in an actual account.',
    effect: { type: 'gainMoney', amount: 700_000, reason: 'Options vesting' },
    tone: 'orange', icon: 'space:bonus-season', tier: LONG_ONLY,
  },
]

/**
 * Midtown: the money act. The insurance office sells what Japan actually
 * fears, the household tiles learn about the allowance system, and the trunk
 * carries the hazards so that everybody — not half the table — walks them.
 */
const MIDTOWN: readonly SpaceContent[] = [
  {
    id: 'jp-midtown-trading', kind: 'normal', title: 'The Brokerage',
    description: 'Screens everywhere, a queue of retirees at the counter, and a broker who insists this one is different.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'finance:trading-floor', tier: EVERY_BOARD,
  },
  {
    id: 'jp-midtown-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'Every share you hold posts a cheque — and one company adds a shareholder gift box of its own instant noodles, which is the part you tell people about.',
    effect: { type: 'stockDividend', perShare: 300_000, reason: 'Quarterly dividend' },
    tone: 'slate', icon: 'space:dividend-day', tier: STANDARD_UP,
  },
  {
    id: 'jp-midtown-divorce', kind: 'normal', title: 'Divorce Papers',
    description: 'A protocol divorce, signed at the ward office counter in the time it takes to renew a driver\'s licence. The apartment is quieter than it was.',
    effect: { type: 'divorce', reason: 'Divorce settlement' },
    tone: 'slate', icon: 'space:layoff-notice', tier: STANDARD_UP,
  },
  {
    id: 'jp-midtown-kotatsu', kind: 'normal', title: 'The Old Kotatsu',
    description: 'The heated table\'s cord has been fraying gently since the nineties, and tonight it retires — taking the rug, the tatami and one corner of the room with it.',
    effect: { type: 'payMoney', amount: 560_000, reason: 'Kotatsu fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'jp-midtown-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'Before anyone hands you a set of house keys, someone would like a word about cover — and unrolls a hazard map of your neighbourhood that is thorough, recent, and quietly terrifying.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office', tier: EVERY_BOARD,
  },
  // The only payday in this stretch too — see jp-main-payday-1. Harshening it
  // zeroed Very Hard's income for the whole run between the marriage fork and
  // the home-buying fork, so it stays unconditional.
  payday(EVERY_BOARD, 'jp-midtown-payday', 'A deposit lands the week the deposit on an apartment is due.'),
  {
    id: 'jp-midtown-wiring', kind: 'normal', title: 'Wiring Fault',
    description: 'The building survey mentions the fuse box in passing. The fuse box mentions it again at two in the morning, rather louder.',
    effect: { type: 'payMoney', amount: 560_000, reason: 'Electrical fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'jp-midtown-boar', kind: 'normal', title: 'The Boar',
    description: 'It trots out of the hillside bamboo at dusk, considers you carefully, and walks away. The bonnet does not walk away.',
    effect: { type: 'payMoney', amount: 360_000, reason: 'Front end rebuilt', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'jp-midtown-presentation', kind: 'normal', title: 'The Big Presentation',
    description: 'You present to the executive floor and the room nods in perfect unison. Spin to find out whether unison means the job that runs it.',
    effect: { type: 'promotion', reason: 'You won the room' },
    tone: 'orange', icon: 'space:client-win', tier: STANDARD_UP,
  },
  {
    id: 'jp-midtown-allowance', kind: 'normal', title: 'The Allowance',
    description: 'The accounts are merged. Your whole salary now goes into a shared account, and a fixed sum comes back to you each month — labelled "allowance" in the family ledger.',
    effect: { type: 'household', reason: 'The household ledger, settled up' },
    tone: 'purple', icon: 'finance:bank-visit', tier: EVERY_BOARD,
  },
  {
    id: 'jp-midtown-bonus', kind: 'payday', title: 'Year-End Bonus',
    description: 'The winter envelope lands, sized in months of what you earn rather than what anybody promised, and every one of you gets a different number.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: EVERY_BOARD,
  },
  {
    id: 'jp-midtown-raise', kind: 'normal', title: 'Mid-Career Raise',
    description: 'A quiet word by the elevator, a new number, and a bow of exactly matched depth on the way out.',
    effect: { type: 'payRaise' },
    tone: 'slate', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  setback('veryHard', EVERY_BOARD, 'jp-midtown-rate-rise', 'Rate Rise',
    'The era of the flat variable rate ends on a Thursday morning, and every monthly figure in the household moves with it.',
    { type: 'payMoney', amount: 1_400_000, reason: 'Rates go the wrong way' },
    'slate', 'space:market-crash'),
  setback('hard', LONG_ONLY, 'jp-midtown-survey', 'The 1981 Question',
    'The surveyor asks, gently, whether the building predates the 1981 earthquake standard. The report that answers costs money, and so does the answer.',
    { type: 'payMoney', amount: 800_000, reason: 'Seismic survey and repairs' },
    'slate', 'space:house-hunting'),
  {
    id: 'jp-midtown-glamping', kind: 'normal', title: 'Glamping Trip',
    description: 'One tent someone else pitched, four sleeping bags, and rain from Friday to Sunday, all at triple the price of ordinary rain.',
    effect: { type: 'none' },
    tone: 'slate', icon: 'space:weekend-trip', tier: LONG_ONLY,
  },
  {
    id: 'jp-midtown-shinkansen', kind: 'normal', title: 'The Shinkansen Month',
    description: 'Four cities in five days at three hundred kilometres an hour, and every one of the receipts is yours until the expense forms clear.',
    effect: { type: 'payMoney', amount: 150_000, reason: 'Travel expenses' },
    tone: 'slate', icon: 'space:weekend-trip', tier: LONG_ONLY,
  },
  {
    id: 'jp-midtown-bank', kind: 'normal', title: 'Bank Visit',
    description: 'The branch manager now greets you by name and title, which is either flattering or ominous.',
    effect: { type: 'bank' },
    tone: 'slate', icon: 'finance:bank-visit', tier: LONG_ONLY,
  },
  flavour(LONG_ONLY, 'jp-midtown-showrooms', 'Six Showrooms', 'Six model rooms in one Saturday, each with rented furniture and softer lighting than the last, and you liked the second one best all along.', 'slate', 'space:house-hunting', {
    from: 'hard',
    description: 'Six model rooms in one Saturday, and a tank of fuel, three coffees and a car park fee to show for the day.',
    effect: { type: 'payMoney', amount: 60_000, reason: 'A Saturday of viewings' },
  }),
]

const HOME_BUYING: SpaceContent = {
  id: 'jp-model-room', kind: 'stop', title: 'The Model Room',
  description: 'A showroom apartment with rented furniture, soft lighting, and a salesman whose repayment plan is exactly as long as the rest of your working life.',
  effect: { type: 'buyHouse' },
  tone: 'gold', icon: 'space:house-hunting', tier: EVERY_BOARD,
}

/** Speculation Street: crypto, margin, and a man in a very good suit. */
const SPECULATION_STREET: readonly SpaceContent[] = [
  {
    id: 'jp-risky-startup', kind: 'normal', title: 'Startup Bet',
    description: 'You pour savings into a friend\'s Shibuya startup and spin to see what comes back.',
    effect: { type: 'spinForMoney', perPip: 200_000, reason: 'Startup investment payout' },
    tone: 'pink', icon: 'space:startup-bet', tier: EVERY_BOARD,
  },
  {
    id: 'jp-risky-bad-tip', kind: 'normal', title: 'Bad Stock Tip',
    description: 'Your "sure thing" tanks in a week, and you buy the table dinner to make up for having recommended it at volume.',
    effect: { type: 'payEach', amount: 200_000, reason: 'Bad stock tip' },
    tone: 'pink', icon: 'space:stock-tip', tier: EVERY_BOARD,
  },
  {
    id: 'jp-risky-golf', kind: 'normal', title: 'Client Golf',
    description: 'Eighteen holes, a friendly wager a hole, and the handicap you have quietly kept worse than it really is, all season.',
    effect: { type: 'collectFromEach', amount: 250_000, reason: 'Eighteen friendly wagers' },
    tone: 'pink', icon: 'space:poker-night', tier: EVERY_BOARD,
  },
  {
    id: 'jp-risky-crash', kind: 'normal', title: 'Market Crash',
    description: 'The market dips hard and your portfolio winces. Your father mentions, again, the year the palace grounds were worth more than California.',
    effect: { type: 'payMoney', amount: 900_000, reason: 'Market crash' },
    tone: 'pink', icon: 'space:market-crash', tier: EVERY_BOARD,
  },
  setback('hard', EVERY_BOARD, 'jp-risky-aftershock', 'Aftershock',
    'The index finds a lower floor than anyone believed it had, and finds it inside a single afternoon session.',
    { type: 'payMoney', amount: 1_600_000, reason: 'The market falls again' },
    'pink', 'space:market-crash'),
  setback('veryHard', LONG_ONLY, 'jp-risky-wipeout', 'Margin Wipeout',
    'The leveraged position is closed for you at the worst hour of the night session, and nobody asks first.',
    { type: 'payMoney', amount: 2_000_000, reason: 'Position closed out' },
    'pink', 'space:market-crash'),
  {
    id: 'jp-risky-gtr', kind: 'normal', title: 'One Careful Week',
    description: 'You buy the coupe you promised yourself at seventeen, and introduce it to a kerb before the plates arrive.',
    effect: { type: 'payMoney', amount: 500_000, reason: 'Alloys, arch and pride', hazard: 'accident' },
    tone: 'pink', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'jp-risky-jumbo', kind: 'normal', title: 'The Jumbo',
    description: 'You queue forty minutes at the famously lucky lottery booth, because the famously lucky booth is famously lucky. Spin for what the queue was worth.',
    effect: { type: 'spinForMoney', perPip: 350_000, reason: 'Year-end Jumbo' },
    tone: 'pink', icon: 'space:lottery-ticket', tier: EVERY_BOARD,
  },
  {
    id: 'jp-risky-windfall', kind: 'normal', title: 'The Old Position',
    description: 'An investment you had honestly forgotten finally pays off, and everyone at the table chips in envy.',
    effect: { type: 'collectFromEach', amount: 200_000, reason: 'Surprise windfall' },
    tone: 'pink', icon: 'space:surprise-bonus', tier: STANDARD_UP,
  },
  {
    id: 'jp-risky-gacha', kind: 'normal', title: 'One More Ten-Pull',
    description: 'The limited banner ends at midnight, the rate-up is a lie you believe, and the character you want is now a line item.',
    effect: { type: 'payMoney', amount: 600_000, reason: 'The limited banner' },
    tone: 'pink', icon: 'space:bidding-war', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'jp-risky-payday', 'A pay packet lands while your investments are busy misbehaving.'),
  {
    id: 'jp-risky-margin-call', kind: 'normal', title: 'Margin Call',
    description: 'The broker rings at seven in the morning, and you already know from their calm tone that it is bad news.',
    effect: { type: 'payMoney', amount: 400_000, reason: 'Margin call' },
    tone: 'pink', icon: 'space:market-crash', tier: LONG_ONLY,
  },
  {
    id: 'jp-risky-swap', kind: 'normal', title: 'Rival Swap',
    description: 'One handshake, one seal pressed onto one document, and you and the front-runner trade bank balances.',
    effect: { type: 'swapMoneyWithLeader', reason: 'A deal with the front-runner' },
    tone: 'pink', icon: 'space:rival-swap', tier: EVERY_BOARD,
  },
  {
    id: 'jp-risky-beer-garden', kind: 'normal', title: 'The Rooftop Beer Garden',
    description: 'You book the entire rooftop for the party of the summer and insist on picking up every single tab.',
    effect: { type: 'payEach', amount: 150_000, reason: 'The whole rooftop, on you' },
    tone: 'pink', icon: 'space:neighborhood-bbq', tier: LONG_ONLY,
  },
  {
    id: 'jp-risky-angel', kind: 'normal', title: 'Angel Investing',
    description: 'Three cheques into three garage startups — spin to find out which one grew up.',
    effect: { type: 'spinForMoney', perPip: 150_000, reason: 'Angel investment return' },
    tone: 'pink', icon: 'space:startup-bet', tier: LONG_ONLY,
  },
  {
    id: 'jp-risky-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'The speculative end of your portfolio has a very good quarter for once, and you say nothing modest about it.',
    effect: { type: 'stockDividend', perShare: 400_000, reason: 'Bumper dividend' },
    tone: 'pink', icon: 'space:dividend-day', tier: STANDARD_UP,
  },
  {
    id: 'jp-risky-good-suit', kind: 'normal', title: 'A Very Good Suit',
    description: 'The broker leans in and lowers his voice. He is wearing a very good suit, which is not the same thing as a very good tip.',
    effect: { type: 'buyStock' },
    tone: 'pink', icon: 'space:stock-tip', tier: LONG_ONLY,
  },
]

/** Steady Street: the point card, the coupon, the biscuit tin of 500-yen coins. */
const STEADY_STREET: readonly SpaceContent[] = [
  {
    id: 'jp-safe-points', kind: 'normal', title: 'Point Card Payout',
    description: 'Thirteen loyalty cards, one straining wallet, and a checkout moment where the points cover the whole basket.',
    effect: { type: 'gainMoney', amount: 80_000, reason: 'The points pay out' },
    tone: 'green', icon: 'space:coupon-clipping', tier: EVERY_BOARD,
  },
  {
    id: 'jp-safe-shiso', kind: 'normal', title: 'Balcony Harvest',
    description: 'The balcony shiso and the goya curtain finally ripen, saving a grocery trip and shading the window.',
    effect: { type: 'none' },
    tone: 'green', icon: 'space:garden-harvest', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'jp-safe-payday', 'The deposit arrives on the twenty-fifth, as it has every month since you can remember.', missedPayday(
    'veryHard',
    'Wages Withheld',
    'A cell in a spreadsheet somewhere means this month\'s wages will arrive next month instead.',
    100_000,
    'Wages held over a month',
  )),
  setback('hard', EVERY_BOARD, 'jp-safe-excess', 'Policy Excess',
    'Even the careful road has a claim form on it, and the excess is yours to cover, in exact change.',
    { type: 'payMoney', amount: 100_000, reason: 'Policy excess' },
    'green', 'finance:insurance-office'),
  setback('veryHard', STANDARD_UP, 'jp-safe-typhoon-roof', 'Typhoon Roof',
    'Typhoon nineteen takes three tiles in the night, and the man with the ladder is booked until Thursday.',
    { type: 'payMoney', amount: 900_000, reason: 'Roof repairs' },
    'green', 'space:house-hunting'),
  setback('hard', LONG_ONLY, 'jp-safe-fridge', 'Fridge Gives Up',
    'It hums, it rattles, it stops. Everything in the freezer, including the emergency rice, goes in the bin by lunchtime.',
    { type: 'payMoney', amount: 300_000, reason: 'A new fridge' },
    'green', 'space:grocery-run'),
  {
    id: 'jp-safe-trolley', kind: 'normal', title: 'Trolley Dent',
    description: 'A runaway trolley crosses the entire supermarket car park to find your door, and nobody at all saw a thing.',
    effect: { type: 'payMoney', amount: 300_000, reason: 'Panel and paint', hazard: 'accident' },
    tone: 'green', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'jp-safe-ledger', kind: 'normal', title: 'The Household Ledger',
    description: 'You keep the household accounts book faithfully for a whole year, column by column, and the book quietly wins.',
    effect: { type: 'gainMoney', amount: 100_000, reason: 'The ledger balances ahead' },
    tone: 'green', icon: 'space:budget-win', tier: EVERY_BOARD,
  },
  {
    id: 'jp-safe-time-deposit', kind: 'normal', title: 'Time Deposit Matures',
    description: 'The ten-year time deposit matures. The interest, at rates the bank describes as competitive, buys one genuinely excellent dinner.',
    effect: { type: 'gainMoney', amount: 120_000, reason: 'A decade of interest' },
    tone: 'green', icon: 'space:interest-payout', tier: STANDARD_UP,
  },
  {
    id: 'jp-safe-sticky', kind: 'normal', title: 'Sticky Fingers',
    description: 'A rival leaves their proudest keepsake unattended by the tea urn, and your hand hovers over it.',
    effect: { type: 'stealLifeTile', reason: 'A keepsake changes hands' },
    tone: 'green', icon: 'space:sticky-fingers', tier: STANDARD_UP,
  },
  {
    id: 'jp-safe-cashless', kind: 'normal', title: 'Cashless Campaign',
    description: 'The payment app\'s twenty-percent-back campaign, discovered on its final day, applied to everything you were going to buy anyway.',
    effect: { type: 'gainMoney', amount: 90_000, reason: 'Campaign cashback' },
    tone: 'green', icon: 'space:cashback-bonus', tier: LONG_ONLY,
  },
  {
    id: 'jp-safe-old-passbook', kind: 'normal', title: 'The Old Passbook',
    description: 'A childhood postal savings book surfaces in a drawer at your parents\' house, and the balance inside has been waiting patiently since primary school.',
    effect: { type: 'gainMoney', amount: 140_000, reason: 'The forgotten account' },
    tone: 'green', icon: 'space:refund-check', tier: EVERY_BOARD,
  },
  {
    id: 'jp-safe-coin-tin', kind: 'normal', title: 'The Coin Tin',
    description: 'Every 500-yen coin for three years has gone into a biscuit tin. Today the tin is full, and it is heavier than it has any right to be.',
    effect: { type: 'gainMoney', amount: 100_000, reason: 'Three years of coins' },
    tone: 'green', icon: 'space:quiet-savings', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'jp-safe-payday-2', 'Another twenty-fifth, another quiet deposit. This is the whole idea.'),
  {
    id: 'jp-safe-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'The steady half of your portfolio posts its steady little cheque, plus a shareholder gift box of very good rice.',
    effect: { type: 'stockDividend', perShare: 250_000, reason: 'Quarterly dividend' },
    tone: 'green', icon: 'space:dividend-day', tier: EVERY_BOARD,
  },
  {
    id: 'jp-safe-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'Late is better than never, and the broker is delighted to unroll the hazard map for you again.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'green', icon: 'finance:insurance-office', tier: LONG_ONLY,
  },
  flavour(LONG_ONLY, 'jp-safe-bon-dance', 'The Bon Dance', 'The neighbourhood association\'s summer festival: paper lanterns, a drum, and the same dance the street has danced for four hundred years, learned in four minutes.', 'green', 'space:neighborhood-bbq', {
    from: 'hard',
    description: 'The neighbourhood association\'s summer festival — and you, it turns out, are this year\'s committee, which means the yakitori stall deposit is yours.',
    effect: { type: 'payMoney', amount: 70_000, reason: 'The festival committee finds you' },
  }),
]

/** Sunset Years: the sharpest material on the board, played warm. */
const SUNSET_YEARS: readonly SpaceContent[] = [
  {
    id: 'jp-sunset-number', kind: 'stop', title: 'The Twenty-Million Problem',
    description: 'A government report calculates what a comfortable retirement requires, then apologises for saying so. Your own envelope arithmetic runs a little higher — and the number does not go away on its own.',
    effect: { type: 'retireEarly' },
    tone: 'gold', icon: 'space:retirement-fund', tier: EVERY_BOARD,
  },
  {
    id: 'jp-sunset-upgrade', kind: 'normal', title: 'Home Upgrade',
    description: 'The agent calls about something brighter, higher, and just about within reach — the tower has a floor free, and the floor has a view.',
    effect: { type: 'upgradeHouse' },
    tone: 'slate', icon: 'space:home-upgrade', tier: EVERY_BOARD,
  },
  {
    id: 'jp-sunset-earthquake', kind: 'normal', title: 'The Earthquake',
    description: 'The big one finally introduces itself at four in the morning, drops every plate you own, and cracks the kitchen they landed in.',
    effect: { type: 'payMoney', amount: 1_200_000, reason: 'Earthquake damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: EVERY_BOARD,
  },
  setback('veryHard', STANDARD_UP, 'jp-sunset-aftershock', 'The Aftershock',
    'The second quake finds everything the first one loosened, starting with the chimney of the old bath heater.',
    { type: 'payMoney', amount: 1_600_000, reason: 'Aftershock damage', hazard: 'fire' },
    'slate', 'space:house-fire'),
  setback('hard', EVERY_BOARD, 'jp-sunset-parents', 'Caring for Your Parents',
    'Somebody who once carried you now needs carrying, and the care home\'s waitlist is longer than its brochure. You would never count the cost. The invoice counts it anyway.',
    { type: 'payMoney', amount: 2_000_000, reason: 'Caring for family' },
    'slate', 'space:family-portrait'),
  {
    id: 'jp-sunset-workshop', kind: 'normal', title: 'Workshop Fire',
    description: 'The shed full of stock for the little online shop goes up in eleven minutes flat, along with the little online shop.',
    effect: { type: 'payMoney', amount: 700_000, reason: 'Workshop fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'jp-sunset-bollard', kind: 'normal', title: 'The New Bollard',
    description: 'The supermarket installs a bollard where no bollard has ever stood, and you formally introduce the rear bumper to it twice in one month.',
    effect: { type: 'payMoney', amount: 380_000, reason: 'Rear bumper, again', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  payday(EVERY_BOARD, 'jp-sunset-payday-1', 'One of your very last pay packets lands.'),
  {
    id: 'jp-sunset-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'Decades of never once selling pay out, share by share, all at once.',
    effect: { type: 'stockDividend', perShare: 400_000, reason: 'Annual dividend' },
    tone: 'slate', icon: 'space:dividend-day', tier: STANDARD_UP,
  },
  {
    id: 'jp-sunset-swap', kind: 'normal', title: 'Rival Swap',
    description: 'One final audacious deal over green tea, and the leader watches their fortune bow politely and leave with you.',
    effect: { type: 'swapMoneyWithLeader', reason: 'The eleventh-hour swap' },
    tone: 'slate', icon: 'space:rival-swap', tier: EVERY_BOARD,
  },
  {
    id: 'jp-sunset-children-visit', kind: 'normal', title: 'The Children Visit',
    description: 'Every grown-up child arrives with fruit in a box too beautiful to open, and quietly leaves an envelope under it.',
    effect: { type: 'collectPerChild', amount: 400_000, reason: 'An envelope from each child' },
    tone: 'slate', icon: 'space:child-benefit', tier: EVERY_BOARD,
  },
  {
    id: 'jp-sunset-fund', kind: 'normal', title: 'Fund Blows Up',
    description: 'You retired early on one clever fund, and this is the quarter the clever fund issues a letter that begins with an apology.',
    effect: { type: 'payMoney', amount: 1_600_000, reason: 'The fund you retired on' },
    tone: 'slate', icon: 'space:market-crash', tier: STANDARD_UP,
  },
  {
    id: 'jp-sunset-sticky', kind: 'normal', title: 'Sticky Fingers',
    description: 'Over the good tea, you begin talking the front-runner out of their finest story.',
    effect: { type: 'stealLifeTile', reason: 'A story changes hands' },
    tone: 'slate', icon: 'space:sticky-fingers', tier: EVERY_BOARD,
  },
  {
    id: 'jp-sunset-last-title', kind: 'normal', title: 'One Last Title',
    description: 'One more title before the door, if they can be persuaded. Spin, and let the last review of your life decide it.',
    effect: { type: 'promotion', reason: 'The last review of your life' },
    tone: 'slate', icon: 'space:big-promotion', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'jp-sunset-payday-2', 'You stopped counting the paydays years ago; the twenty-fifth has not.'),
  {
    id: 'jp-sunset-farewell', kind: 'normal', title: 'Farewell Tour',
    description: 'Every department insists on throwing you a farewell party, and every department insists on paying.',
    effect: { type: 'collectFromEach', amount: 300_000, reason: 'Leaving gifts' },
    tone: 'slate', icon: 'space:surprise-bonus', tier: STANDARD_UP,
  },
  {
    id: 'jp-sunset-pension-papers', kind: 'normal', title: 'Pension Papers',
    description: 'The projection arrives in a blue envelope. The monthly figure assumes you also did everything else right.',
    effect: { type: 'gainMoney', amount: 110_000, reason: 'Pension instalment' },
    tone: 'green', icon: 'space:garage-sale', tier: LONG_ONLY,
  },
  {
    id: 'jp-sunset-declutter', kind: 'normal', title: 'The Great Decluttering',
    description: 'You photograph forty years of possessions for the flea-market app, and strangers pay real money for the ones you nearly threw away.',
    effect: { type: 'gainMoney', amount: 70_000, reason: 'The app sells the past' },
    tone: 'green', icon: 'space:yard-sale', tier: LONG_ONLY,
  },
  {
    id: 'jp-sunset-storehouse', kind: 'normal', title: 'The Storehouse',
    description: 'The old family storehouse is finally opened, and the antiques dealer goes very quiet at one of the boxes — spin for the appraisal.',
    effect: { type: 'spinForMoney', perPip: 90_000, reason: 'The appraisal' },
    tone: 'slate', icon: 'space:garage-sale', tier: LONG_ONLY,
  },
  {
    id: 'jp-sunset-sit-down', kind: 'normal', title: 'The Sit-Down',
    description: 'You both go through a year of the household ledger at the kitchen table, and the allowance system is finally audited in both directions. There is an expensive coat one of you bought without asking, and it still needs explaining.',
    effect: { type: 'household', reason: 'The ledger, audited both ways' },
    tone: 'purple', icon: 'space:quiet-savings', tier: LONG_ONLY,
  },
  {
    id: 'jp-sunset-last-jumbo', kind: 'normal', title: 'One Last Jumbo',
    description: 'One final ticket from the famously lucky booth on the way out the door — spin for the payout.',
    effect: { type: 'spinForMoney', perPip: 350_000, reason: 'One last ticket' },
    tone: 'slate', icon: 'space:lottery-ticket', tier: STANDARD_UP,
  },
  setback('veryHard', EVERY_BOARD, 'jp-sunset-final-tax', 'Final Tax Bill',
    'One last envelope from the tax office arrives before the office door closes behind you for good.',
    { type: 'payMoney', amount: 2_200_000, reason: 'Final tax bill' },
    'slate', 'space:refund-check'),
  flavour(EVERY_BOARD, 'jp-sunset-ahead', 'Sunset Ahead', 'From the train window, the mountain turns pink at dusk, the way it has every evening you were too busy to look.', 'slate', 'space:sunset-ahead'),
]

const RETIREMENT: SpaceContent = {
  id: 'jp-retirement', kind: 'retirement', title: 'Retirement Day',
  description: 'A bouquet at your desk, one deep bow to the office, and the first Monday in forty years with nowhere to be.',
  effect: { type: 'retire' },
  tone: 'gold', icon: 'space:retirement', tier: EVERY_BOARD,
}

// ---------------------------------------------------------------------------
// The route: start, four forks, four trunk runs, and retirement — the same
// grammar as every edition, with the summaries written as two uncles giving
// contradictory advice, because the argument at the table is the content.
// ---------------------------------------------------------------------------

const UNIVERSITY_BRANCH: RouteBranch = {
  identity: {
    name: 'University Lane',
    summary: 'Four years, one exam that decides them, and the bill up front, in full, before you have earned a yen. What the degree buys is a corporate ladder that mostly goes up — dependable, and never enormous.',
  },
  spaces: [...UNIVERSITY_LANE, GRAD_FAIR],
}

const WORK_BRANCH: RouteBranch = {
  identity: {
    name: 'Straight to Work',
    summary: 'Your school hands you to an employer before the graduates have bought their suits. Paid from day one, no safety net, and a trade ladder whose bottom rung is grim and whose top rung out-earns every graduate at this table.',
  },
  spaces: WORK_LANE,
}

const LOYALTY_BRANCH: RouteBranch = {
  identity: {
    name: 'Company Loyalty Road',
    summary: 'Stay put. The raises come by seniority, slowly and without fail, the bonus comes twice a year, and the company remembers loyalty — usually. It also decides where you live.',
  },
  spaces: COMPANY_LOYALTY_ROAD,
}

const HOPPER_BRANCH: RouteBranch = {
  identity: {
    name: 'Job-Hopper Alley',
    summary: 'Leave, and name your price. Recruiters love you and HR departments keep a file — glorious if you drew badly the first time, and a real risk if you did not.',
  },
  spaces: JOB_HOPPER_ALLEY,
}

const FAMILY_BRANCH: RouteBranch = {
  identity: {
    name: 'Family Lane',
    summary: 'School bags, cram school, and a house full of noise, with an envelope from every grown-up child at the end. Far fewer paydays, and every bill arrives multiplied.',
  },
  spaces: FAMILY_LANE,
}

const CAREER_BRANCH: RouteBranch = {
  identity: {
    name: 'Career Track',
    summary: 'The overtime is real and so are the raises, the bonuses and the long table at the end of the room. What you gave up for it is a separate list, and it is long.',
  },
  spaces: CAREER_TRACK,
}

const SPECULATION_BRANCH: RouteBranch = {
  identity: {
    name: 'Speculation Street',
    summary: 'Crypto, margin, and a tip from a man in a very good suit. Whoever is behind at the model room should be here; whoever is ahead should think hard about it.',
  },
  spaces: SPECULATION_STREET,
}

const STEADY_BRANCH: RouteBranch = {
  identity: {
    name: 'Steady Street',
    summary: 'The savings account, the point card, the coupon, the biscuit tin of 500-yen coins. Nobody ever got rich down here, or ruined — which is worth a great deal if you are already winning.',
  },
  spaces: STEADY_STREET,
}

export const ROUTE_JAPAN: RouteDefinition = {
  segments: [
    fork(START, UNIVERSITY_BRANCH, WORK_BRANCH),
    run('salaryman street', SALARYMAN_STREET_EARLY),
    fork(MID_CAREER_FORK, LOYALTY_BRANCH, HOPPER_BRANCH),
    run('salaryman street, after the crossroads', SALARYMAN_STREET_LATE),
    fork(MARRIAGE, FAMILY_BRANCH, CAREER_BRANCH),
    run('midtown', MIDTOWN),
    fork(HOME_BUYING, SPECULATION_BRANCH, STEADY_BRANCH),
    run('sunset years', SUNSET_YEARS),
  ],
  terminal: RETIREMENT,
}
