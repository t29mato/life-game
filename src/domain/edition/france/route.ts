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
 * The France route: the same measured skeleton, and an entirely French life.
 *
 * Structurally this board is the USA board, tile for tile: same tiers, same
 * stops, same hardship placements, same hazard tags, same payday count per
 * lane, every sum at ×1 (the euro sits close enough to the dollar that the
 * unit does not move). That is deliberate and load-bearing — the skeleton is
 * where the measured balance lives (the even opening fork, the volatile work
 * lane, the twice-a-game insurance payoff), and what a country gets to change
 * is everything the player actually reads: which life happens on each tile,
 * and in which words. `france/edition.test.ts` zips the two routes and holds
 * the mirror.
 *
 * The voice rule, applied on every tile below: **short sentences, plain
 * words, a French word only where the sentence teaches it in passing** (the
 * notaire, the concours, the apéro), and never in a title. The joke is the
 * situation, not the vocabulary — a reader who is not a native English
 * speaker should get the punchline as fast as a reader who is.
 */

const START: SpaceContent = {
  ...flavour(EVERY_BOARD, 'fr-start', 'Start of Life', 'Every September, the whole country restarts at once — new shoes, a new timetable, and your life begins on the same morning as everyone else\'s.', 'slate', 'space:start-of-life'),
  kind: 'start',
}

/**
 * The Great Schools lane: two free years of ferocious cramming, one national
 * exam, and then a school whose fees the Republic does not subsidise. The
 * tuition stop and the loan tile carry the same measured weight as every
 * edition's — what is French is the concours, the maid's room under the roof,
 * and an internship called a "stage" with a stipend called gratitude.
 */
const GRANDE_ECOLE_LANE: readonly SpaceContent[] = [
  // EVERY_BOARD, not STANDARD_UP — see usa/route.ts college-1.
  flavour(EVERY_BOARD, 'fr-uni-move-in', 'The Maid\'s Room', 'Your first home is nine square metres under the roof, six floors up, no lift. It is tiny, but it is yours.', 'blue', 'space:move-in-day', {
    from: 'hard',
    description: 'Your first home is nine square metres under the roof, six floors up, no lift — and the letting agent wants a deposit, a guarantor, and a fee just for showing you the room.',
    effect: { type: 'payMoney', amount: 1_400, reason: 'Deposit and agency fee' },
  }),
  {
    id: 'fr-uni-fees', kind: 'stop', title: 'The School Fees',
    description: 'Two free years of studying paid off: you passed the entrance exam. But the school itself is not free, and the bill is due before you even see the library.',
    effect: { type: 'payMoney', amount: 0, reason: 'Grande école fees' },
    tone: 'blue', icon: 'space:tuition-bill', tier: EVERY_BOARD, unscaled: true,
    amountFrom: 'collegeTuition',
  },
  flavour(LONG_ONLY, 'fr-uni-library', 'Library Marathon', 'The library closes at ten. Your exam is at eight tomorrow morning. Between now and then: you, three highlighters, and one vending machine.', 'blue', 'space:late-night-study', {
    from: 'hard',
    description: 'The library closes at ten and your exam is at eight tomorrow. You still need to print your notes, and the copy shop charges by the page.',
    effect: { type: 'payMoney', amount: 500, reason: 'Coffee and copying' },
  }),
  setback('veryHard', STANDARD_UP, 'fr-uni-laptop', 'Laptop Dies',
    'Your laptop dies two days before your paper is due. The replacement is not the cheap one.',
    { type: 'payMoney', amount: 3_000, reason: 'Emergency laptop' },
    'blue', 'space:late-night-study'),
  {
    id: 'fr-uni-harvest', kind: 'normal', title: 'The Grape Harvest',
    description: 'You spend three weeks in September picking grapes for a vineyard that feeds you well at lunch. The work pays in cash, sore hands, and one bottle you are saving for later.',
    effect: { type: 'gainMoney', amount: 9_000, reason: 'Harvest wages' },
    tone: 'blue', icon: 'space:campus-job', tier: EVERY_BOARD,
  },
  setback('hard', EVERY_BOARD, 'fr-uni-overdraft', 'Overdraft Charges',
    'Your account dips below zero for one single day. The bank charges you for it anyway, and includes a leaflet about budgeting.',
    { type: 'payMoney', amount: 2_500, reason: 'Overdraft charges' },
    'blue', 'finance:bank-visit'),
  flavour(LONG_ONLY, 'fr-uni-expose', 'The Group Presentation', 'Somehow you end up making most of the slides again. The other three just offer opinions.', 'blue', 'space:group-project', {
    from: 'hard',
    description: 'You end up making most of the slides again — and you print the handouts for all five of you, at your own cost.',
    effect: { type: 'payMoney', amount: 400, reason: 'Printing for five' },
  }),
  {
    id: 'fr-uni-grant', kind: 'normal', title: 'The Merit Grant',
    description: 'A scholarship exists that matches you exactly. You read the letter twice to be sure it is real, and it covers a big chunk of your fees.',
    effect: { type: 'gainMoney', amount: 24_000, reason: 'Foundation grant' },
    tone: 'blue', icon: 'space:scholarship-win', tier: STANDARD_UP,
  },
  {
    id: 'fr-uni-pasta', kind: 'normal', title: 'Pasta Weeks',
    description: 'Dinner is pasta in the shared kitchen for two weeks straight, and the grocery bill still hurts.',
    effect: { type: 'payMoney', amount: 600, reason: 'Groceries on a student budget' },
    tone: 'blue', icon: 'space:grocery-run', tier: LONG_ONLY,
  },
  flavour(STANDARD_UP, 'fr-uni-exams', 'Exam Fortnight', 'Five written exams, then one where three teachers watch you work out a problem on a blackboard. You live on coffee.', 'blue', 'space:finals-week', {
    from: 'hard',
    description: 'Five written exams, one blackboard exam in front of three teachers — and you panic-hire a tutor for the subject you dread most.',
    effect: { type: 'payMoney', amount: 1_600, reason: 'Emergency tutoring' },
  }),
  {
    id: 'fr-uni-stage', kind: 'normal', title: 'The Internship',
    description: 'Six months of real work, officially called "observation." By law the company only has to pay you just enough to call it a gift, not a wage.',
    effect: { type: 'gainMoney', amount: 5_000, reason: 'Internship stipend' },
    tone: 'blue', icon: 'space:new-skills', tier: LONG_ONLY,
  },
  {
    id: 'fr-uni-pitch', kind: 'normal', title: 'Pitch Night',
    description: 'You pitch your dorm-room idea at an open evening for young founders. Spin to see who bites.',
    effect: { type: 'spinForMoney', perPip: 400, reason: 'Pitch night winnings' },
    tone: 'blue', icon: 'space:startup-bet', tier: LONG_ONLY,
  },
  {
    id: 'fr-uni-erasmus', kind: 'normal', title: 'The Erasmus Year',
    description: 'A year abroad on a European grant. The grant covers about half the cost, and changes how you see everything.',
    effect: { type: 'payMoney', amount: 4_000, reason: 'The uncovered half of the year abroad' },
    tone: 'blue', icon: 'space:weekend-trip', tier: STANDARD_UP,
  },
  {
    id: 'fr-uni-loan', kind: 'normal', title: 'The School Loan',
    description: 'The bank lent you money against your future diploma. Now the diploma is here, and so are the repayments.',
    effect: { type: 'payMoney', amount: 5_000, reason: 'School loan repayments' },
    tone: 'blue', icon: 'finance:bank-visit', tier: STANDARD_UP,
  },
  {
    id: 'fr-uni-graduation', kind: 'stop', title: 'Graduation Day',
    description: 'You graduate with a long, impressive-sounding diploma, a handshake from an official, and a network of alumni you can call on for life.',
    effect: { type: 'graduate' },
    tone: 'blue', icon: 'space:cap-and-gown', tier: EVERY_BOARD,
  },
]

const GRAD_FAIR: SpaceContent = {
  id: 'fr-grad-forum', kind: 'stop', title: 'The Careers Forum',
  description: 'Former students of your school fill the great hall for one day, offering firm handshakes and firmer salary numbers. Two jobs are open. Pick one.',
  effect: { type: 'chooseCareer', pool: 'graduate' },
  tone: 'gold', icon: 'space:grad-job-fair', tier: EVERY_BOARD,
}

/**
 * Straight to Work: the apprenticeship signs you to a patron while the prépa
 * students are still buying flashcards — paid from day one, which is the only
 * thing this lane can genuinely offer against a diploma, and exactly what it
 * offers. The rest of the lane is the gamble the player asked for: a crêpe
 * van bet, a scratch card from the tobacconist, and rent that is due whatever
 * the week did.
 */
const WORK_LANE: readonly SpaceContent[] = [
  {
    id: 'fr-apprenticeship-day', kind: 'stop', title: 'Apprenticeship Day',
    description: 'A trade school finds you an employer on the spot. You sign Monday, and you are paid from Tuesday — while the exam students are still standing in line to enrol.',
    effect: { type: 'chooseCareer', pool: 'basic' },
    tone: 'gold', icon: 'space:first-job-fair', tier: EVERY_BOARD,
  },
  {
    id: 'fr-work-first-payslip', kind: 'normal', title: 'First Pay Slip',
    description: 'Your first French pay slip has forty lines on it. Your actual salary is somewhere below four different kinds of tax, but it still feels like a lot.',
    effect: { type: 'gainMoney', amount: 2_000, reason: 'First pay packet' },
    tone: 'orange', icon: 'space:first-paycheck', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'fr-work-payday-1', 'A full month worked, and the money lands while your friends are still students.', missedPayday(
    'veryHard',
    'Paid in Arrears',
    'Nobody told you: your first month is paid a month late. The landlord does not care.',
    900,
    'A month of living on nothing',
  )),
  {
    id: 'fr-work-moving-out', kind: 'stop', title: 'Moving Out',
    description: 'Now that you are earning, you are expected to move out: a deposit, a guarantor (your parents have to sign), and a rental application thicker than a job application.',
    effect: { type: 'payMoney', amount: 1_800, reason: 'Deposit and first month' },
    tone: 'orange', icon: 'space:rent-due', tier: EVERY_BOARD, unscaled: true,
  },
  {
    id: 'fr-work-gear', kind: 'stop', title: 'Work Gear Deposit',
    description: 'Two sets of overalls, steel-toed boots, an ID badge, and a deposit you doubt you will ever see again.',
    effect: { type: 'payMoney', amount: 1_500, reason: 'Work gear deposit' },
    tone: 'orange', icon: 'space:rent-due', tier: EVERY_BOARD, appearsFrom: 'hard',
  },
  {
    id: 'fr-work-sunday', kind: 'normal', title: 'Sunday Rates',
    description: 'You take the Sunday morning shift, which pays extra. The Sunday crowd also tips well — because for them, it is a day off.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'Sunday shift pay' },
    tone: 'orange', icon: 'space:overtime-shift', tier: STANDARD_UP,
  },
  {
    id: 'fr-work-crepe-van', kind: 'normal', title: 'The Crêpe Van Bet',
    description: 'You put every euro you have into a second-hand van and a good batter recipe. Spin to see what Saturday\'s market crowd thinks of it.',
    effect: { type: 'spinForMoney', perPip: 2_000, reason: 'What the crêpe van took' },
    tone: 'orange', icon: 'career:food-truck-owner', tier: STANDARD_UP,
  },
  setback('veryHard', STANDARD_UP, 'fr-work-late-rent', 'Late Rent',
    'Your rent goes in four days late. The guarantor company\'s warning letter arrives before your apology does.',
    { type: 'payMoney', amount: 2_500, reason: 'Late rent penalty' },
    'orange', 'space:rent-due'),
  payday(EVERY_BOARD, 'fr-work-payday-2', 'Another month, another pay slip. Still nobody has asked to see your diploma.', missedPayday(
    'hard',
    'Hours Cut',
    'Your boss posts next week\'s schedule with a sigh. Your name is on half as many shifts as last week.',
    1_200,
    'Half a month of shifts',
  )),
  flavour(LONG_ONLY, 'fr-work-evening-class', 'The Evening Certificate', 'You take an evening class at the trade school. Your boss suddenly treats you with new respect.', 'orange', 'space:new-skills', {
    from: 'hard',
    description: 'You take an evening class, and your boss respects you more for it — but you pay the course fee yourself.',
    effect: { type: 'payMoney', amount: 800, reason: 'Course fee' },
  }),
  flavour(STANDARD_UP, 'fr-work-known', 'Known at the Market', 'Two years without missing a single morning shift, and the market stallholders now save the best stock for you. That is a real honour here.', 'orange', 'space:steady-hustle'),
  payday(EVERY_BOARD, 'fr-work-payday-3', 'Three months in, and getting paid no longer feels like a surprise.'),
  {
    id: 'fr-work-festival', kind: 'normal', title: 'Festival Weekend',
    description: 'You spend two days setting up crowd barriers and hauling beer kegs for the village festival. It pays better than you expected.',
    effect: { type: 'gainMoney', amount: 900, reason: 'Festival weekend work' },
    tone: 'orange', icon: 'space:side-hustle', tier: LONG_ONLY,
  },
  {
    id: 'fr-work-scratch', kind: 'normal', title: 'Scratch Card',
    description: 'You buy a scratch card at the newsstand with your coffee change. Spin to see what is under the foil.',
    effect: { type: 'spinForMoney', perPip: 1_200, reason: 'Under the foil' },
    tone: 'orange', icon: 'space:lottery-ticket', tier: LONG_ONLY,
  },
  {
    id: 'fr-work-commute', kind: 'normal', title: 'The Commute',
    description: 'Your employer pays half your train pass, by law. Riding a scooter to the station, it turns out, is on you.',
    effect: { type: 'payMoney', amount: 400, reason: 'The uncovered leg of the commute' },
    tone: 'orange', icon: 'space:car-trouble', tier: LONG_ONLY,
  },
  {
    id: 'fr-work-keys', kind: 'normal', title: 'Keys to the Shop',
    description: 'Somebody has to open at six every morning and hold the keys. Spin — it might be you.',
    effect: { type: 'promotion', reason: 'Somebody has to hold the keys' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: LONG_ONLY,
  },
]

/**
 * The Boulevard, first half: the years between the first wage and the first
 * serious question about where the wage comes from. The trunk carries the
 * hazards so that everybody — not half the table — walks them.
 */
const BOULEVARD_EARLY: readonly SpaceContent[] = [
  flavour(STANDARD_UP, 'fr-main-dossier', 'The Rental Dossier', 'You gather pay slips, tax records, a guarantor, and a cover letter — just to rent a one-bedroom flat. It feels like applying for a job.', 'slate', 'space:apartment-hunt', {
    from: 'hard',
    description: 'You win the flat after a mountain of paperwork — and the agency fee, deposit, and move-in inspection fee are all listed separately, and all yours to pay.',
    effect: { type: 'payMoney', amount: 2_200, reason: 'Deposit and agency fee' },
  }),
  {
    id: 'fr-main-trial-period', kind: 'normal', title: 'Trial Period Ends',
    description: 'Your trial period ends today. Someone sits across from you with a form. Spin to find out what they say.',
    effect: { type: 'promotion', reason: 'The end of the trial period' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'fr-main-hypermarket', kind: 'normal', title: 'The Hypermarket Run',
    description: 'Your shopping cart somehow costs more than you planned. The huge cheese aisle is entirely to blame.',
    effect: { type: 'payMoney', amount: 800, reason: 'Groceries' },
    tone: 'slate', icon: 'space:grocery-run', tier: LONG_ONLY,
  },
  {
    id: 'fr-main-bank', kind: 'normal', title: 'Bank Appointment',
    description: 'Your personal banker meets you by appointment, offers you a coffee, and asks how your money is doing.',
    effect: { type: 'bank' },
    tone: 'slate', icon: 'finance:bank-visit', tier: EVERY_BOARD,
  },
  {
    id: 'fr-main-flea-stall', kind: 'normal', title: 'Flea Market Stall',
    description: 'You sell old things at a Sunday flea market. Clearing out one cupboard pays for a surprisingly good weekend.',
    effect: { type: 'gainMoney', amount: 1_500, reason: 'Flea market takings' },
    tone: 'slate', icon: 'space:side-hustle', tier: LONG_ONLY,
  },
  {
    id: 'fr-main-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'In France, insurance is not optional — home insurance is required by law, and a second policy called the mutuelle covers what health insurance does not. The broker has a folder ready for each.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office', tier: EVERY_BOARD,
  },
  {
    id: 'fr-main-burnout', kind: 'normal', title: 'Burnout',
    description: 'A year of skipped lunches catches up with you, and one Monday you simply cannot go in. The job does not wait for you to recover.',
    effect: { type: 'loseCareer', reason: 'Signed off, and the job did not wait' },
    tone: 'orange', icon: 'space:steady-hustle', tier: STANDARD_UP,
  },
  {
    id: 'fr-main-gym', kind: 'normal', title: 'Gym Membership',
    description: 'You sign up for the gym in January, along with everyone else in the country. You are not sure how often you will actually go.',
    effect: { type: 'payMoney', amount: 400, reason: 'Gym membership' },
    tone: 'slate', icon: 'space:gym-membership', tier: LONG_ONLY,
  },
  // The only payday in this stretch — see usa/route.ts main-6. Harshening it
  // zeroed every player's income for this whole run on Hard and Very Hard, so
  // it stays unconditional rather than joining every other lane's pattern of
  // harshening one of several paydays and leaving another alone.
  payday(EVERY_BOARD, 'fr-main-payday-1', 'The money lands on the 28th, like clockwork — the best notification of the week.'),
  {
    id: 'fr-main-stock-tip', kind: 'normal', title: 'Stock Tip',
    description: 'A coworker swears by a stock over lunch. The market is open until half past five.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'space:stock-tip', tier: EVERY_BOARD,
  },
  {
    id: 'fr-main-inspection', kind: 'normal', title: 'The Inspection',
    description: 'Your car fails its mandatory safety check. The inspector finds several things wrong, as inspectors do.',
    effect: { type: 'payMoney', amount: 1_200, reason: 'Inspection and repairs' },
    tone: 'slate', icon: 'space:car-trouble', tier: LONG_ONLY,
  },
  {
    id: 'fr-main-long-weekend', kind: 'normal', title: 'The Long Weekend',
    description: 'May has four public holidays. You take the extra days off around each one, and drive to the coast with what feels like the entire country.',
    effect: { type: 'payMoney', amount: 600, reason: 'Bridged holidays' },
    tone: 'slate', icon: 'space:weekend-trip', tier: LONG_ONLY,
  },
  {
    id: 'fr-main-fender-bender', kind: 'normal', title: 'Fender Bender',
    description: 'You and the other driver fill out the accident report on the hood of the car, and agree it was your fault.',
    effect: { type: 'payMoney', amount: 2_400, reason: 'Bodyshop bill', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: EVERY_BOARD,
  },
  setback('veryHard', EVERY_BOARD, 'fr-main-pileup', 'Ring Road Pileup',
    'Thick fog on the ring road, sudden brake lights, and four cars crushed together on the exit ramp. Nobody is hurt. The repair bills are not so lucky.',
    { type: 'payMoney', amount: 14_000, reason: 'Pileup repairs', hazard: 'accident' },
    'slate', 'space:fender-bender'),
  setback('hard', EVERY_BOARD, 'fr-main-dentist', 'The Dental Quote',
    'One crown, one lecture about flossing, and a bill whose biggest line item is not covered by insurance.',
    { type: 'payMoney', amount: 5_000, reason: 'Dental work' },
    'slate', 'space:gym-membership'),
  {
    id: 'fr-main-parking', kind: 'normal', title: 'Parking by Ear',
    description: 'In this city, drivers park by bumping the cars in front and behind until they fit. Today, someone bumped yours harder than usual.',
    effect: { type: 'payMoney', amount: 2_600, reason: 'Door and wing repairs', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'fr-main-flambe', kind: 'normal', title: 'The Flambé Incident',
    description: 'Your flaming crêpes catch a little more fire than intended, and the kitchen ceiling turns the colour of strong tea.',
    effect: { type: 'payMoney', amount: 6_000, reason: 'Kitchen fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'fr-main-word-from-director', kind: 'normal', title: 'A Word From the Director',
    description: 'The director walks across the whole office to tell you the client liked your work. A small bonus follows.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'Performance bonus' },
    tone: 'slate', icon: 'space:good-review', tier: LONG_ONLY,
  },
  {
    id: 'fr-main-lucky-find', kind: 'normal', title: 'Lucky Find',
    description: 'Something small and lucky happens to you — the kind of story you will tell at dinner for years.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'slate', icon: 'space:lucky-find', tier: EVERY_BOARD,
  },
]

/**
 * The mid-career crossroads: stay or go, in the country that invented the job
 * for life and then invented the paperwork for leaving it amicably. The
 * junction halts movement, as every fork must.
 */
const MID_CAREER_FORK: SpaceContent = {
  id: 'fr-crossroads', kind: 'stop', title: 'Five Years In',
  description: 'Five years into a permanent job, your pay rises slowly by seniority — and a recruiter\'s message is still sitting, unread, in your inbox. The road forks here.',
  effect: { type: 'none' },
  tone: 'orange', icon: 'space:networking-night', tier: EVERY_BOARD,
}

/**
 * The Permanent Contract road: the raise arrives because you were still there
 * to receive it. Everything on this side compounds, and everything it costs
 * is a thing the company decided on your behalf.
 */
const PERMANENT_CONTRACT_ROAD: readonly SpaceContent[] = [
  {
    id: 'fr-loyal-grid', kind: 'normal', title: 'The Seniority Grid',
    description: 'Your pay rises by one step every year, but the job above you only opens up when someone retires. Spin to find out if this is that year.',
    effect: { type: 'promotion', reason: 'The job above yours came free' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'fr-loyal-thirteenth', kind: 'payday', title: 'The Thirteenth Month',
    description: 'Every December your company simply pays you a thirteenth month of salary. Friends abroad never believe this is real.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: STANDARD_UP,
  },
  {
    id: 'fr-loyal-transfer', kind: 'normal', title: 'The Transfer',
    description: 'The company decides in February, and tells you on Friday: you are moving to the Lyon office in April. You pay for the moving van.',
    effect: { type: 'payMoney', amount: 3_000, reason: 'Relocating for the company' },
    tone: 'orange', icon: 'space:apartment-hunt', tier: STANDARD_UP,
  },
  {
    id: 'fr-loyal-black-ice', kind: 'normal', title: 'Black Ice',
    description: 'Nine years of the same forty-minute commute, and one icy January morning, a roundabout finally catches you off guard.',
    effect: { type: 'payMoney', amount: 4_000, reason: 'Commuter write-off', hazard: 'accident' },
    tone: 'orange', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'fr-loyal-medal', kind: 'normal', title: 'The Work Medal',
    description: 'Twenty years at the company earns you an actual medal from the state, a speech, a handshake, and one long story about the old workshop that everyone lets you finish.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'orange', icon: 'space:lucky-find', tier: LONG_ONLY,
  },
  {
    id: 'fr-loyal-collection', kind: 'normal', title: 'The Collection',
    description: 'You start collecting money for a coworker\'s leaving gift. When the total comes up short, as it always does, you cover the rest.',
    effect: { type: 'payEach', amount: 600, reason: 'Making up the collection' },
    tone: 'orange', icon: 'space:surprise-bonus', tier: LONG_ONLY,
  },
]

/**
 * Job-Hopper Alley: the raise arrives because you left — through the
 * negotiated exit the whole country signs when it wants to move on without a
 * fight. A compulsory re-draw at the head, and a gap where the paperwork
 * finds you between badges.
 */
const JOB_HOPPER_ALLEY: readonly SpaceContent[] = [
  {
    id: 'fr-hopper-exit', kind: 'stop', title: 'The Negotiated Exit',
    description: 'You and your company agree, in writing, to part ways. This "negotiated exit" gets you a payout, your full rights, and a fresh start — with a new job and a new salary.',
    effect: { type: 'careerChange', reason: 'You signed the negotiated exit', compulsory: true },
    tone: 'orange', icon: 'space:headhunted', tier: EVERY_BOARD,
  },
  {
    id: 'fr-hopper-bonus', kind: 'payday', title: 'Signing Bonus',
    description: 'Your new employer pays out your three-month notice period in cash. It lands like a whole extra pay check.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: STANDARD_UP,
  },
  {
    id: 'fr-hopper-gap', kind: 'normal', title: 'The Gap',
    description: 'Three weeks between jobs, and the unemployment office keeps asking for one more document. The paperwork is never finished. The rent is always due.',
    effect: { type: 'payMoney', amount: 3_000, reason: 'Three weeks between jobs' },
    tone: 'orange', icon: 'space:rent-due', tier: STANDARD_UP,
  },
  {
    id: 'fr-hopper-van', kind: 'normal', title: 'Moving Van',
    description: 'You drive a rental van to your new city yourself, and find out the hard way that it does not fit under the old town gate.',
    effect: { type: 'payMoney', amount: 4_000, reason: 'Van and barrier repairs', hazard: 'accident' },
    tone: 'orange', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'fr-hopper-freelance', kind: 'normal', title: 'Freelance Season',
    description: 'You register as a freelancer for a season and bill by the day. Spin to see how many of those days actually paid off.',
    effect: { type: 'spinForMoney', perPip: 1_200, reason: 'A season of day rates' },
    tone: 'orange', icon: 'space:startup-bet', tier: LONG_ONLY,
  },
  {
    id: 'fr-hopper-leaving-toast', kind: 'normal', title: 'The Leaving Toast',
    description: 'Your third leaving party this decade, with good sparkling wine this time. The card is huge, everyone chips in generously, and nobody quite remembers your job title.',
    effect: { type: 'collectFromEach', amount: 700, reason: 'The leaving collection' },
    tone: 'orange', icon: 'space:poker-night', tier: LONG_ONLY,
  },
]

/** The Boulevard, second half: the review, the redundancy plan, and the ring. */
const BOULEVARD_LATE: readonly SpaceContent[] = [
  {
    id: 'fr-main-annual-review', kind: 'stop', title: 'The Annual Review',
    description: 'A small meeting room, two managers, your file open on the table. One question: are you ready for the next job up? Spin to find out what they decide.',
    effect: { type: 'promotion', reason: 'Your annual review came round' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'fr-main-subscriptions', kind: 'normal', title: 'Streaming Bill',
    description: 'You are somehow subscribed to six streaming services. One of them exists only to show cycling races.',
    effect: { type: 'payMoney', amount: 300, reason: 'Streaming subscriptions' },
    tone: 'slate', icon: 'space:streaming-bill', tier: LONG_ONLY,
  },
  {
    id: 'fr-main-raise-talk', kind: 'normal', title: 'Pay Raise Talk',
    description: 'You ask for a raise, which people rarely do here, and get one, which is even rarer. Wisely, you tell no one.',
    effect: { type: 'payRaise' },
    tone: 'slate', icon: 'space:pay-raise-talk', tier: STANDARD_UP,
  },
  setback('veryHard', EVERY_BOARD, 'fr-main-tax-audit', 'Tax Audit',
    'A very polite letter from the tax office leads to a long afternoon sorting through a shoebox of receipts — and a final bill that seems to have been decided in advance.',
    { type: 'payMoney', amount: 15_000, reason: 'Tax audit settlement' },
    'slate', 'space:refund-check'),
  {
    id: 'fr-main-cdd-ends', kind: 'normal', title: 'The Fixed Term Ends',
    description: 'Your short-term contract, which everyone promised would become permanent, quietly is not renewed. The farewell card is very nice, at least.',
    effect: { type: 'loseCareer', reason: 'Contract not renewed' },
    tone: 'orange', icon: 'space:layoff-notice', tier: EVERY_BOARD, appearsFrom: 'hard',
  },
  {
    id: 'fr-main-redundancy', kind: 'normal', title: 'The Redundancy Plan',
    description: 'Everyone on your floor is called into one meeting with a consultant in an expensive suit. Afterward, your key card stops working.',
    effect: { type: 'loseCareer', reason: 'Restructured out' },
    tone: 'orange', icon: 'space:layoff-notice', tier: EVERY_BOARD,
  },
  {
    id: 'fr-main-employment-office', kind: 'stop', title: 'The Employment Office',
    description: 'A caseworker at the unemployment office reviews your file and finds two jobs that fit. Pick one.',
    effect: { type: 'careerChange', reason: 'A fresh start from the employment office' },
    tone: 'orange', icon: 'space:career-fair-return', tier: EVERY_BOARD,
  },
  {
    id: 'fr-main-points', kind: 'normal', title: 'Loyalty Card Points',
    description: 'A year of grocery points finally adds up to a free set of pans, and a very satisfying receipt.',
    effect: { type: 'gainMoney', amount: 400, reason: 'The points pay out' },
    tone: 'slate', icon: 'space:coupon-clipping', tier: LONG_ONLY,
  },
  setback('hard', LONG_ONLY, 'fr-main-parking-ticket', 'Parking Ticket',
    'You are eleven minutes over the limit. A very punctual warden leaves a ticket neatly under your wiper.',
    { type: 'payMoney', amount: 1_200, reason: 'Parking fine' },
    'slate', 'space:car-trouble'),
  {
    id: 'fr-main-apero', kind: 'normal', title: 'The Apéritif',
    description: 'You casually mention drinks on your terrace at six. By eleven, it has somehow become dinner for your whole office, and you are paying for all of it.',
    effect: { type: 'payEach', amount: 600, reason: 'The apéro became dinner' },
    tone: 'slate', icon: 'space:neighborhood-bbq', tier: LONG_ONLY,
    harsher: {
      from: 'hard',
      description: 'You mention drinks at six. By midnight there have been three courses, two rounds of after-dinner drinks, and a taxi ride — and every receipt lands on your table.',
      effect: { type: 'payEach', amount: 1_200, reason: 'The apéro became a banquet' },
    },
  },
  {
    id: 'fr-main-rtt-buyback', kind: 'normal', title: 'The Day Buyback',
    description: 'Your thirty-five-hour work week earns you extra days off that you never had time to take. In December, the company pays you for them instead.',
    effect: { type: 'gainMoney', amount: 2_000, reason: 'Untaken days bought back' },
    tone: 'slate', icon: 'space:overtime-shift', tier: LONG_ONLY,
  },
  {
    id: 'fr-main-gifts', kind: 'normal', title: 'Holiday Gifts',
    description: 'You buy a present for everyone at the table, chosen carefully and wrapped beautifully by the shop.',
    effect: { type: 'payEach', amount: 800, reason: 'A present for everyone' },
    tone: 'slate', icon: 'space:surprise-bonus', tier: EVERY_BOARD,
  },
  {
    id: 'fr-main-refund', kind: 'normal', title: 'Tax Refund',
    description: 'The tax office recalculates in your favour and refunds you without being asked. You mention it at dinner parties for a month.',
    effect: { type: 'gainMoney', amount: 700, reason: 'Tax refund' },
    tone: 'slate', icon: 'space:refund-check', tier: LONG_ONLY,
  },
  {
    id: 'fr-main-profit-share', kind: 'payday', title: 'The Profit Share',
    description: 'By law, part of the company\'s good year belongs to every employee — an extra pay check, and nobody had to ask for it.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:surprise-bonus', tier: LONG_ONLY,
    harsher: missedPayday(
      'veryHard',
      'The Formula Produces Zero',
      'By law you are owed a share of the profits. This year\'s letter explains, over two pages, that the formula came out to zero.',
      900,
      'A letter about the formula',
    ),
  },
  {
    id: 'fr-main-card-table', kind: 'normal', title: 'The Card Table',
    description: 'A friendly evening playing belote, the national card game, and tonight the cards are simply on your side.',
    effect: { type: 'collectFromEach', amount: 500, reason: 'Card night winnings' },
    tone: 'slate', icon: 'space:poker-night', tier: STANDARD_UP,
  },
  flavour(LONG_ONLY, 'fr-main-ring', 'Ring Shopping', 'You stand a little too long in front of a jeweller\'s window on the main square.', 'slate', 'space:ring-shopping'),
]

const MARRIAGE: SpaceContent = {
  id: 'fr-wedding', kind: 'stop', title: 'Wedding Day',
  description: 'You marry twice in one day: once at the town hall in front of the mayor, and once at a party that, by tradition, runs until dawn. Guests fill the gift envelope box on the table.',
  effect: { type: 'getMarried' },
  tone: 'pink', icon: 'space:wedding-day', tier: EVERY_BOARD,
}

/** Family Lane: the beats every French parent knows, in order of arrival. */
const FAMILY_LANE: readonly SpaceContent[] = [
  {
    id: 'fr-family-nursery-setup', kind: 'normal', title: 'Nursery Setup',
    description: 'You paint the nursery a cheerful yellow, build a crib at midnight, and pick up the health record book the state has already printed with your baby\'s name.',
    effect: { type: 'payMoney', amount: 2_000, reason: 'Nursery setup' },
    tone: 'purple', icon: 'space:nursery-setup', tier: EVERY_BOARD,
  },
  {
    id: 'fr-family-new-baby', kind: 'stop', title: 'New Baby',
    description: 'A tiny new family member arrives, and the state — which was ready and waiting — opens a file, a benefit, and a vaccination schedule for them.',
    effect: { type: 'haveChildren', count: 1 },
    tone: 'purple', icon: 'space:new-baby', tier: EVERY_BOARD,
  },
  {
    id: 'fr-family-august', kind: 'normal', title: 'August at the Seaside',
    description: 'The entire country goes on holiday in August, to the same coast, on the same motorway. You have a great time, mostly stuck in traffic.',
    effect: { type: 'payMoney', amount: 1_800, reason: 'The August holiday' },
    tone: 'purple', icon: 'space:family-vacation', tier: LONG_ONLY,
  },
  setback('hard', EVERY_BOARD, 'fr-family-creche', 'The Crèche Waitlist',
    'Getting a spot in the public daycare is as hard as passing an exam. The private childminder who fills the gap charges like one too.',
    { type: 'payPerChild', amount: 5_000, reason: 'Childcare per child' },
    'purple', 'space:nursery-setup'),
  setback('veryHard', STANDARD_UP, 'fr-family-tutoring', 'Private Tutoring',
    'Each of your children gets an hour a week of tutoring in math. Patience, it turns out, is billed by the hour.',
    { type: 'payPerChild', amount: 5_000, reason: 'Tutoring per child' },
    'purple', 'space:school-fees'),
  {
    id: 'fr-family-school-list', kind: 'normal', title: 'The School List',
    description: 'The back-to-school list asks for seventeen specific items per child, including one exact brand of notebook that is sold out everywhere.',
    effect: { type: 'payPerChild', amount: 3_000, reason: 'School supplies per child' },
    tone: 'purple', icon: 'space:school-fees', tier: EVERY_BOARD,
  },
  {
    id: 'fr-family-year-end-show', kind: 'normal', title: 'The Year-End Show',
    description: 'Your child says both of their lines perfectly in the school play, and you tear up in the third row behind a wall of phones.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'purple', icon: 'space:school-play', tier: EVERY_BOARD,
  },
  {
    id: 'fr-family-estate-car', kind: 'normal', title: 'The Family Estate',
    description: 'You back out of the driveway with three kids arguing in the back seat, and hit the one gatepost that has never moved.',
    effect: { type: 'payMoney', amount: 3_200, reason: 'Estate car bodywork', hazard: 'accident' },
    tone: 'purple', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'fr-family-conservatoire', kind: 'normal', title: 'The Conservatoire',
    description: 'The town music school takes on another student at a subsidised price. The scale practice is rough, but there is real talent in there somewhere.',
    effect: { type: 'payMoney', amount: 900, reason: 'Music lessons' },
    tone: 'purple', icon: 'space:piano-lessons', tier: LONG_ONLY,
  },
  {
    id: 'fr-family-twins', kind: 'normal', title: 'Twins',
    description: 'The technician goes quiet at the ultrasound, turns the screen around, and holds up two fingers.',
    effect: { type: 'haveChildren', count: 2 },
    tone: 'purple', icon: 'space:second-baby', tier: EVERY_BOARD,
  },
  {
    id: 'fr-family-saturday-football', kind: 'normal', title: 'Saturday Football',
    description: 'Your weekend mornings become sideline cheering and orange slices, with a coach who takes the under-nines exactly as seriously as the World Cup.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'purple', icon: 'space:soccer-season', tier: STANDARD_UP,
  },
  {
    id: 'fr-family-allowance', kind: 'normal', title: 'Family Allowance',
    description: 'The government pays a small monthly amount for every child in the house, automatically, without you having to ask.',
    effect: { type: 'collectPerChild', amount: 1_500, reason: 'Family allowance per child' },
    tone: 'purple', icon: 'space:child-benefit', tier: STANDARD_UP,
  },
  flavour(STANDARD_UP, 'fr-family-portrait', 'Family Portrait', 'Everyone actually smiles at the same time, for once, in front of the good curtains. Frame this one.', 'purple', 'space:family-portrait', {
    from: 'veryHard',
    description: 'Everyone smiles at once — for exactly one photo, out of a hundred — and the studio charges for the whole afternoon, the album, and extra copies for the grandparents.',
    effect: { type: 'payMoney', amount: 1_100, reason: 'The full photo package' },
  }),
  payday(STANDARD_UP, 'fr-family-payday', 'Payday arrives somewhere between the school run and bath time, and disappears in about the same window.'),
  {
    id: 'fr-family-back-to-work', kind: 'normal', title: 'Back to Work',
    description: 'You return from parental leave with sharper time-management skills, and use them to negotiate hard on your way back in.',
    effect: { type: 'payRaise' },
    tone: 'purple', icon: 'space:pay-raise-talk', tier: LONG_ONLY,
  },
  {
    id: 'fr-family-third', kind: 'normal', title: 'Another Arrival',
    description: 'A third child officially makes you a large family: you get a discount on trains, praise from the state, and a car that is now, everyone agrees, too small.',
    effect: { type: 'haveChildren', count: 1 },
    tone: 'purple', icon: 'space:new-baby', tier: LONG_ONLY,
  },
]

/** The Executive Track: pass cadre, and the overtime stops being counted. */
const EXECUTIVE_TRACK: readonly SpaceContent[] = [
  {
    id: 'fr-fast-cadre', kind: 'normal', title: 'The Executive Question',
    description: 'You are shortlisted for "cadre" status — a different job class, a different pension, and the same desk with more responsibility. Spin to find out.',
    effect: { type: 'promotion', reason: 'On the shortlist to pass cadre' },
    tone: 'orange', icon: 'space:big-promotion', tier: STANDARD_UP,
  },
  {
    id: 'fr-fast-alumni', kind: 'normal', title: 'The Alumni Dinner',
    description: 'At your old school\'s yearly dinner, a chance conversation over the cheese course turns into a real referral bonus.',
    effect: { type: 'gainMoney', amount: 1_200, reason: 'Referral bonus' },
    tone: 'orange', icon: 'space:networking-night', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'fr-fast-payday-1', 'Nobody counts your overtime anymore, but the pay check still arrives.'),
  {
    id: 'fr-fast-headhunted', kind: 'normal', title: 'Headhunted',
    description: 'A recruiter calls your personal phone during a meeting, with two job offers and zero patience.',
    effect: { type: 'careerChange', reason: 'Headhunted for something new' },
    tone: 'orange', icon: 'space:headhunted', tier: EVERY_BOARD,
  },
  {
    id: 'fr-fast-hire-car', kind: 'normal', title: 'Hire Car',
    description: 'You drive a rental car around an unfamiliar city for a client meeting, and back it into a bollard that has apparently stood there since before the war.',
    effect: { type: 'payMoney', amount: 3_200, reason: 'Hire car excess', hazard: 'accident' },
    tone: 'orange', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'fr-fast-client-win', kind: 'normal', title: 'Client Win',
    description: 'You land the account everyone said was impossible, over a lunch that ran four courses because it was going so well.',
    effect: { type: 'gainMoney', amount: 3_000, reason: 'Client win bonus' },
    tone: 'orange', icon: 'space:client-win', tier: STANDARD_UP,
  },
  {
    id: 'fr-fast-conference', kind: 'normal', title: 'Conference Talk',
    description: 'Your conference talk spreads through the whole industry in a week, and three more conferences now want you on stage.',
    effect: { type: 'gainMoney', amount: 4_400, reason: 'Speaking fees' },
    tone: 'orange', icon: 'space:conference-talk', tier: STANDARD_UP,
  },
  setback('hard', EVERY_BOARD, 'fr-fast-burnout', 'Burnout Leave',
    'A doctor signs you off work for six weeks and uses the word "overwork" without blinking. Your pay is much lighter by the time you return.',
    { type: 'payMoney', amount: 12_000, reason: 'Unpaid leave' },
    'orange', 'space:steady-hustle'),
  {
    id: 'fr-fast-reorg', kind: 'normal', title: 'The Reorganisation',
    description: 'The company chart is redrawn overnight, and your name ends up in a completely different box. Nobody asked you first — that is what a reorganisation is.',
    effect: { type: 'careerChange', reason: 'Reorganised into a new role', compulsory: true },
    tone: 'orange', icon: 'space:career-fair-return', tier: EVERY_BOARD, appearsFrom: 'veryHard',
  },
  {
    id: 'fr-fast-trading-desk', kind: 'normal', title: 'The Trading Desk',
    description: 'Your bonus is burning a hole in your pocket, and the business district is full of people happy to suggest where to put it.',
    effect: { type: 'buyStock' },
    tone: 'orange', icon: 'finance:trading-floor', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'fr-fast-payday-2', 'Another month down, another pay check in.', missedPayday(
    'hard',
    'Bonus Clawback',
    'An auditor in a distant office recalculates last year\'s bonus — downward, with a long explanation attached.',
    6_000,
    'Bonus clawed back',
  )),
  {
    id: 'fr-fast-bonus-season', kind: 'normal', title: 'Bonus Season',
    description: 'Your year-end bonus envelope is thicker than you expected. You quietly double-check the name on it.',
    effect: { type: 'gainMoney', amount: 5_000, reason: 'Year-end bonus' },
    tone: 'orange', icon: 'space:bonus-season', tier: STANDARD_UP,
  },
  flavour(LONG_ONLY, 'fr-fast-corner-office', 'Corner Office', 'You finally get a door that closes and a window with a nice view.', 'orange', 'space:corner-office', {
    from: 'hard',
    description: 'You finally get a door that closes and a window — looking into a bare room the company expects you to furnish yourself.',
    effect: { type: 'payMoney', amount: 1_800, reason: 'Furnishing the office' },
  }),
  {
    id: 'fr-fast-board-seat', kind: 'normal', title: 'Board Seat',
    description: 'A seat opens up at the long table on the top floor. Spin to find out whose name goes on the door.',
    effect: { type: 'promotion', reason: 'A chair at the long table' },
    tone: 'orange', icon: 'space:corner-office', tier: STANDARD_UP,
  },
  {
    id: 'fr-fast-retention', kind: 'normal', title: 'Retention Offer',
    description: 'You mention, casually over coffee, that someone else has been in touch. The counter-offer arrives before the coffee does.',
    effect: { type: 'payRaise' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'fr-fast-equity', kind: 'normal', title: 'Options Vest',
    description: 'Four years of paperwork from your startup days finally turn into a real number in a real account.',
    effect: { type: 'gainMoney', amount: 7_000, reason: 'Options vesting' },
    tone: 'orange', icon: 'space:bonus-season', tier: LONG_ONLY,
  },
]

/**
 * Midtown: the money act. The insurance office sells what France actually
 * requires by statute, the household tiles learn about the joint account,
 * and the trunk carries the hazards so that everybody — not half the table —
 * walks them.
 */
const MIDTOWN: readonly SpaceContent[] = [
  {
    id: 'fr-midtown-brokerage', kind: 'normal', title: 'The Brokerage',
    description: 'Screens everywhere, a line of retirees at the counter, and a broker who insists this stock is different.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'finance:trading-floor', tier: EVERY_BOARD,
  },
  {
    id: 'fr-midtown-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'Every share you own pays out quietly, and one of them even throws in a toll-road discount — which is the part you actually tell people about.',
    effect: { type: 'stockDividend', perShare: 3_000, reason: 'Quarterly dividend' },
    tone: 'slate', icon: 'space:dividend-day', tier: STANDARD_UP,
  },
  {
    id: 'fr-midtown-long-lunch', kind: 'normal', title: 'The Long Lunch',
    description: 'You got promoted, so lunch is on you for the whole floor. A proper French business lunch means several courses, plus a cheese trolley that keeps coming back.',
    effect: { type: 'payEach', amount: 800, reason: 'Lunch for the whole floor' },
    tone: 'slate', icon: 'space:neighborhood-bbq', tier: STANDARD_UP,
  },
  {
    id: 'fr-midtown-fryer', kind: 'normal', title: 'The Deep Fryer',
    description: 'Nobody has changed the fryer oil in years, and tonight your kitchen finds out the hard way.',
    effect: { type: 'payMoney', amount: 5_600, reason: 'Kitchen fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'fr-midtown-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'Before the notary will hand you the keys, they want proof of insurance — and the agent shows you a detailed flood-risk map of your future street.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office', tier: EVERY_BOARD,
  },
  // The only payday in this stretch too — see fr-main-payday-1. Harshening it
  // zeroed Very Hard's income for the whole run between the marriage fork and
  // the home-buying fork, so it stays unconditional.
  payday(EVERY_BOARD, 'fr-midtown-payday', 'Your pay lands the same week your apartment deposit is due.'),
  {
    id: 'fr-midtown-wiring', kind: 'normal', title: 'Wiring Fault',
    description: 'The building survey mentions the fuse box briefly. The fuse box brings it up again, much louder, at two in the morning.',
    effect: { type: 'payMoney', amount: 5_600, reason: 'Electrical fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'fr-midtown-boar', kind: 'normal', title: 'The Wild Boar',
    description: 'A wild boar walks out of the vineyard at dusk, looks at you, and walks off unhurt. Your car does not walk away so easily.',
    effect: { type: 'payMoney', amount: 3_600, reason: 'Front end rebuilt', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'fr-midtown-presentation', kind: 'normal', title: 'The Big Presentation',
    description: 'You present to the whole executive floor and win the room over. Spin to see if that is enough to win the promotion too.',
    effect: { type: 'promotion', reason: 'You won the room' },
    tone: 'orange', icon: 'space:client-win', tier: STANDARD_UP,
  },
  {
    id: 'fr-midtown-joint-account', kind: 'normal', title: 'The Joint Account',
    description: 'You merge your bank accounts at a formal appointment. For the first time, someone else\'s spending is now, unavoidably, your problem too.',
    effect: { type: 'household', reason: 'The joint account, settled up' },
    tone: 'purple', icon: 'finance:bank-visit', tier: EVERY_BOARD,
  },
  {
    id: 'fr-midtown-bonus', kind: 'payday', title: 'Year-End Bonus',
    description: 'Your December pay slip comes with an extra page: a bonus based on what you earn, so everyone at the table opens a different number.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: EVERY_BOARD,
  },
  {
    id: 'fr-midtown-raise', kind: 'normal', title: 'Mid-Career Raise',
    description: 'A quiet word by the elevator, a new number on your pay slip, and a firm handshake on the way out.',
    effect: { type: 'payRaise' },
    tone: 'slate', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  setback('veryHard', EVERY_BOARD, 'fr-midtown-rate-rise', 'Rate Rise',
    'Your fixed mortgage rate expires on a Thursday morning, and every monthly bill in the house moves along with it.',
    { type: 'payMoney', amount: 14_000, reason: 'Rates go the wrong way' },
    'slate', 'space:market-crash'),
  setback('hard', LONG_ONLY, 'fr-midtown-diagnostics', 'The Diagnostics File',
    'The legally required survey — checking for lead, termites, asbestos, and energy efficiency — comes back thorough. The energy rating is a G. G is bad.',
    { type: 'payMoney', amount: 8_000, reason: 'Survey findings and repairs' },
    'slate', 'space:house-hunting'),
  {
    id: 'fr-midtown-campsite', kind: 'normal', title: 'The Campsite',
    description: 'Three stars, a pool with a slide, a numbered pitch like a parking space — and rain from Friday straight through Sunday.',
    effect: { type: 'payMoney', amount: 700, reason: 'Camping weekend' },
    tone: 'slate', icon: 'space:weekend-trip', tier: LONG_ONLY,
  },
  {
    id: 'fr-midtown-fast-trains', kind: 'normal', title: 'The High-Speed Month',
    description: 'Four cities in five days on the high-speed train, and every receipt is yours to cover until your company reimburses you.',
    effect: { type: 'payMoney', amount: 1_500, reason: 'Travel expenses' },
    tone: 'slate', icon: 'space:weekend-trip', tier: LONG_ONLY,
  },
  {
    id: 'fr-midtown-bank', kind: 'normal', title: 'Bank Visit',
    description: 'Your branch manager now greets you by name and offers you the good coffee. You are not sure if that is a good sign.',
    effect: { type: 'bank' },
    tone: 'slate', icon: 'finance:bank-visit', tier: LONG_ONLY,
  },
  flavour(LONG_ONLY, 'fr-midtown-viewings', 'Six Viewings', 'You see six apartments in one Saturday. Each one is described as full of potential. You liked the second one best, all along.', 'slate', 'space:house-hunting', {
    from: 'hard',
    description: 'You see six apartments in one Saturday, and spend a full tank of fuel, three coffees, and a parking fee to do it.',
    effect: { type: 'payMoney', amount: 600, reason: 'A Saturday of viewings' },
  }),
]

const HOME_BUYING: SpaceContent = {
  id: 'fr-notary', kind: 'stop', title: 'The Notary\'s Office',
  description: 'A home is not officially yours until a notary reads the entire deed aloud, in a wood-panelled office. Their fee is really more of a tax, and it is yours to pay too.',
  effect: { type: 'buyHouse' },
  tone: 'gold', icon: 'space:house-hunting', tier: EVERY_BOARD,
}

/** Speculation Street: startups, margin, and a broker with beautiful cufflinks. */
const SPECULATION_STREET: readonly SpaceContent[] = [
  {
    id: 'fr-risky-startup', kind: 'normal', title: 'Startup Bet',
    description: 'You put your savings into a friend\'s startup at a big Paris accelerator. Spin to see what comes back.',
    effect: { type: 'spinForMoney', perPip: 2_000, reason: 'Startup investment payout' },
    tone: 'pink', icon: 'space:startup-bet', tier: EVERY_BOARD,
  },
  {
    id: 'fr-risky-bad-tip', kind: 'normal', title: 'Bad Stock Tip',
    description: 'Your "sure thing" stock tanks in a week. You buy the table dinner to make up for recommending it in the first place.',
    effect: { type: 'payEach', amount: 2_000, reason: 'Bad stock tip' },
    tone: 'pink', icon: 'space:stock-tip', tier: EVERY_BOARD,
  },
  {
    id: 'fr-risky-casino', kind: 'normal', title: 'The Casino Weekend',
    description: 'A weekend at a seaside casino goes perfectly: you quit while you are ahead, which nobody there has ever managed before.',
    effect: { type: 'collectFromEach', amount: 2_500, reason: 'One perfect evening' },
    tone: 'pink', icon: 'space:poker-night', tier: EVERY_BOARD,
  },
  {
    id: 'fr-risky-crash', kind: 'normal', title: 'Market Crash',
    description: 'The market drops hard and your portfolio takes the hit. An uncle mentions, again, that land never lets you down.',
    effect: { type: 'payMoney', amount: 9_000, reason: 'Market crash' },
    tone: 'pink', icon: 'space:market-crash', tier: EVERY_BOARD,
  },
  setback('hard', EVERY_BOARD, 'fr-risky-aftershock', 'Aftershock',
    'The market drops even further than anyone expected — all in one afternoon.',
    { type: 'payMoney', amount: 16_000, reason: 'The market falls again' },
    'pink', 'space:market-crash'),
  setback('veryHard', LONG_ONLY, 'fr-risky-wipeout', 'Margin Wipeout',
    'Your leveraged position is closed out automatically, at the worst possible moment, without anyone asking you first.',
    { type: 'payMoney', amount: 20_000, reason: 'Position closed out' },
    'pink', 'space:market-crash'),
  {
    id: 'fr-risky-roadster', kind: 'normal', title: 'One Careful Week',
    description: 'You finally buy the sports car you promised yourself at seventeen, and introduce it to an old stone curb before the plates even arrive.',
    effect: { type: 'payMoney', amount: 5_000, reason: 'Alloys, arch and pride', hazard: 'accident' },
    tone: 'pink', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'fr-risky-lottery', kind: 'normal', title: 'The Lottery Ticket',
    description: 'You buy a national lottery ticket from the newsstand everyone calls lucky. Spin to see if the luck was real.',
    effect: { type: 'spinForMoney', perPip: 3_500, reason: 'The national draw' },
    tone: 'pink', icon: 'space:lottery-ticket', tier: EVERY_BOARD,
  },
  {
    id: 'fr-risky-windfall', kind: 'normal', title: 'The Old Position',
    description: 'An investment you had honestly forgotten about finally pays off. Everyone at the table is a little jealous.',
    effect: { type: 'collectFromEach', amount: 2_000, reason: 'Surprise windfall' },
    tone: 'pink', icon: 'space:surprise-bonus', tier: STANDARD_UP,
  },
  {
    id: 'fr-risky-auction', kind: 'normal', title: 'The Wine Auction',
    description: 'A cellar clear-out at the old auction house turns competitive, and you end up bidding on one case too many.',
    effect: { type: 'payMoney', amount: 6_000, reason: 'Auction overspend' },
    tone: 'pink', icon: 'space:bidding-war', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'fr-risky-payday', 'Your pay lands while your investments are busy doing badly.'),
  {
    id: 'fr-risky-margin-call', kind: 'normal', title: 'Margin Call',
    description: 'Your broker calls at seven in the morning. From their tone alone, you already know it is bad news.',
    effect: { type: 'payMoney', amount: 4_000, reason: 'Margin call' },
    tone: 'pink', icon: 'space:market-crash', tier: LONG_ONLY,
  },
  {
    id: 'fr-risky-swap', kind: 'normal', title: 'Rival Swap',
    description: 'A long lunch, one handshake, and you and the current leader trade bank balances.',
    effect: { type: 'swapMoneyWithLeader', reason: 'A deal with the front-runner' },
    tone: 'pink', icon: 'space:rival-swap', tier: EVERY_BOARD,
  },
  {
    id: 'fr-risky-rooftop', kind: 'normal', title: 'The Rooftop Party',
    description: 'You book a rooftop with a great view for the party of the summer, and insist on covering every single bill.',
    effect: { type: 'payEach', amount: 1_500, reason: 'The whole rooftop, on you' },
    tone: 'pink', icon: 'space:neighborhood-bbq', tier: LONG_ONLY,
  },
  {
    id: 'fr-risky-angel', kind: 'normal', title: 'Angel Investing',
    description: 'You write three cheques to three tiny startups. Spin to find out if any of them made it.',
    effect: { type: 'spinForMoney', perPip: 1_500, reason: 'Angel investment return' },
    tone: 'pink', icon: 'space:startup-bet', tier: LONG_ONLY,
  },
  {
    id: 'fr-risky-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'Your riskiest investments have a surprisingly good quarter, and for once you do not downplay it.',
    effect: { type: 'stockDividend', perShare: 4_000, reason: 'Bumper dividend' },
    tone: 'pink', icon: 'space:dividend-day', tier: STANDARD_UP,
  },
  {
    id: 'fr-risky-cufflinks', kind: 'normal', title: 'A Very Confident Broker',
    description: 'The broker leans in and lowers his voice. His cufflinks are beautiful. That is no guarantee the tip is any good.',
    effect: { type: 'buyStock' },
    tone: 'pink', icon: 'space:stock-tip', tier: LONG_ONLY,
  },
]

/** Prudence Street: the savings booklet, the loyalty card, the wool sock in the drawer. */
const PRUDENCE_STREET: readonly SpaceContent[] = [
  {
    id: 'fr-safe-points', kind: 'normal', title: 'Loyalty Points Payout',
    description: 'You have used your grocery loyalty card faithfully all year. Today it covers your entire shopping cart.',
    effect: { type: 'gainMoney', amount: 800, reason: 'The points pay out' },
    tone: 'green', icon: 'space:coupon-clipping', tier: EVERY_BOARD,
  },
  {
    id: 'fr-safe-potager', kind: 'normal', title: 'The Kitchen Garden',
    description: 'Your tomatoes and zucchini all ripen at once, saving you a grocery trip and forcing every neighbour to take a bag.',
    effect: { type: 'gainMoney', amount: 600, reason: 'Kitchen garden harvest' },
    tone: 'green', icon: 'space:garden-harvest', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'fr-safe-payday', 'Your pay lands on the 28th, just like it always has.', missedPayday(
    'veryHard',
    'Wages Withheld',
    'You are told, calmly, that a paperwork mix-up means this month\'s wages will arrive next month instead, along with a formal apology.',
    1_000,
    'Wages held over a month',
  )),
  setback('hard', EVERY_BOARD, 'fr-safe-excess', 'Policy Excess',
    'Even the careful road has an insurance claim on it sometimes, and the deductible is yours to pay.',
    { type: 'payMoney', amount: 4_000, reason: 'Policy excess' },
    'green', 'finance:insurance-office'),
  setback('veryHard', STANDARD_UP, 'fr-safe-roof', 'Roof Repairs',
    'A storm knocks three tiles off your roof overnight, and the only roofer available is booked until Thursday.',
    { type: 'payMoney', amount: 9_000, reason: 'Roof repairs' },
    'green', 'space:house-hunting'),
  setback('hard', LONG_ONLY, 'fr-safe-fridge', 'Fridge Gives Up',
    'It hums, it rattles, it stops. Everything in the freezer is spoiled by lunchtime.',
    { type: 'payMoney', amount: 3_000, reason: 'A new fridge' },
    'green', 'space:grocery-run'),
  {
    id: 'fr-safe-trolley', kind: 'normal', title: 'Trolley Dent',
    description: 'A runaway shopping cart rolls all the way across the parking lot and finds your car door. Nobody saw who left it.',
    effect: { type: 'payMoney', amount: 3_000, reason: 'Panel and paint', hazard: 'accident' },
    tone: 'green', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'fr-safe-budget', kind: 'normal', title: 'Budget Win',
    description: 'You keep a household budget faithfully for a whole year, and it turns out you saved more than you thought.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'The ledger balances ahead' },
    tone: 'green', icon: 'space:budget-win', tier: EVERY_BOARD,
  },
  {
    id: 'fr-safe-booklet', kind: 'normal', title: 'The Savings Booklet',
    description: 'Almost every French person has a tax-free savings account since birth. Yours quietly earns interest at a rate set by law.',
    effect: { type: 'gainMoney', amount: 1_200, reason: 'Savings booklet interest' },
    tone: 'green', icon: 'space:interest-payout', tier: STANDARD_UP,
  },
  {
    id: 'fr-safe-sticky', kind: 'normal', title: 'Sticky Fingers',
    description: 'A rival leaves their most prized keepsake unattended by the coffee machine. Your hand hovers over it.',
    effect: { type: 'stealLifeTile', reason: 'A keepsake changes hands' },
    tone: 'green', icon: 'space:sticky-fingers', tier: STANDARD_UP,
  },
  {
    id: 'fr-safe-cashback', kind: 'normal', title: 'Cashback Bonus',
    description: 'The cashback program you signed up for by accident finally adds up to something worth having.',
    effect: { type: 'gainMoney', amount: 900, reason: 'Cashback bonus' },
    tone: 'green', icon: 'space:cashback-bonus', tier: LONG_ONLY,
  },
  {
    id: 'fr-safe-refund', kind: 'normal', title: 'Tax Refund',
    description: 'A tax refund arrives right when you had forgotten to expect it, with a long letter explaining why.',
    effect: { type: 'gainMoney', amount: 1_400, reason: 'Tax refund' },
    tone: 'green', icon: 'space:refund-check', tier: EVERY_BOARD,
  },
  {
    id: 'fr-safe-wool-sock', kind: 'normal', title: 'The Wool Sock',
    description: 'The old wool sock stuffed in the back of the drawer — the original French savings account — turns out to have grown, quietly, over the years.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'The sock pays out' },
    tone: 'green', icon: 'space:quiet-savings', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'fr-safe-payday-2', 'Another 28th, another quiet payday. That is the whole point.'),
  {
    id: 'fr-safe-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'Your steady, boring investments pay their steady, boring dividend — plus a small voucher for the highway rest-stop café.',
    effect: { type: 'stockDividend', perShare: 2_500, reason: 'Quarterly dividend' },
    tone: 'green', icon: 'space:dividend-day', tier: EVERY_BOARD,
  },
  {
    id: 'fr-safe-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'Late is better than never, and the broker is happy to pull out the folder for you all over again.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'green', icon: 'finance:insurance-office', tier: LONG_ONLY,
  },
  flavour(LONG_ONLY, 'fr-safe-fete', 'The Village Fête', 'Bunting, folding tables, a brass band, and a raffle you did not expect to enjoy this much.', 'green', 'space:neighborhood-bbq', {
    from: 'hard',
    description: 'Bunting, folding tables, a brass band — and this year, you are on the organising committee, which means the tent deposit is on you.',
    effect: { type: 'payMoney', amount: 700, reason: 'The marquee deposit' },
  }),
]

/** The Sunset Years: the sharpest material on the board, played warm. */
const SUNSET_YEARS: readonly SpaceContent[] = [
  {
    id: 'fr-sunset-number', kind: 'stop', title: 'The Number',
    description: 'You do the math on the back of an envelope: what would it take to stop working now, early, on your own terms? The number is smaller than you feared.',
    effect: { type: 'retireEarly' },
    tone: 'gold', icon: 'space:retirement-fund', tier: EVERY_BOARD,
  },
  {
    id: 'fr-sunset-upgrade', kind: 'normal', title: 'Home Upgrade',
    description: 'The estate agent calls about something brighter, higher up, and just within reach. The top floor is free, and the view is worth it.',
    effect: { type: 'upgradeHouse' },
    tone: 'slate', icon: 'space:home-upgrade', tier: EVERY_BOARD,
  },
  {
    id: 'fr-sunset-fire', kind: 'normal', title: 'House Fire',
    description: 'A pan left on the stove, a distracting phone call, and a kitchen that now needs rebuilding from the floor up.',
    effect: { type: 'payMoney', amount: 12_000, reason: 'Fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: EVERY_BOARD,
  },
  setback('veryHard', STANDARD_UP, 'fr-sunset-chimney', 'Chimney Fire',
    'A bird\'s nest in the chimney catches fire on the first cold night, and the whole chimney has to be rebuilt.',
    { type: 'payMoney', amount: 16_000, reason: 'Chimney fire damage', hazard: 'fire' },
    'slate', 'space:house-fire'),
  setback('hard', EVERY_BOARD, 'fr-sunset-care', 'Care Costs',
    'Someone who once looked after you now needs looking after, and the care home\'s waiting list is longer than you hoped. You would pay any amount for this. The bill takes you up on it.',
    { type: 'payMoney', amount: 20_000, reason: 'Caring for family' },
    'slate', 'space:family-portrait'),
  {
    id: 'fr-sunset-workshop', kind: 'normal', title: 'Workshop Fire',
    description: 'The barn full of supplies for your guest-house project burns down in eleven minutes flat — along with the project itself.',
    effect: { type: 'payMoney', amount: 7_000, reason: 'Workshop fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'fr-sunset-bollard', kind: 'normal', title: 'The New Bollard',
    description: 'The village installs a fancy stone bollard where there was never one before, and you manage to hit it twice in one month.',
    effect: { type: 'payMoney', amount: 3_800, reason: 'Rear bumper, again', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  payday(EVERY_BOARD, 'fr-sunset-payday-1', 'One of your very last pay checks lands.'),
  {
    id: 'fr-sunset-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'Decades of never selling a single share finally pay off, all at once.',
    effect: { type: 'stockDividend', perShare: 4_000, reason: 'Annual dividend' },
    tone: 'slate', icon: 'space:dividend-day', tier: STANDARD_UP,
  },
  {
    id: 'fr-sunset-swap', kind: 'normal', title: 'Rival Swap',
    description: 'One last bold deal over dinner, and the current leader\'s fortune leaves the table with you instead.',
    effect: { type: 'swapMoneyWithLeader', reason: 'The eleventh-hour swap' },
    tone: 'slate', icon: 'space:rival-swap', tier: EVERY_BOARD,
  },
  {
    id: 'fr-sunset-children-visit', kind: 'normal', title: 'The Children Visit',
    description: 'Your grown children come for Sunday lunch with a cake from the good bakery, and quietly leave an envelope of cash behind.',
    effect: { type: 'collectPerChild', amount: 4_000, reason: 'An envelope from each child' },
    tone: 'slate', icon: 'space:child-benefit', tier: EVERY_BOARD,
  },
  {
    id: 'fr-sunset-fund', kind: 'normal', title: 'Fund Blows Up',
    description: 'You retired early on one clever investment fund. This quarter, the fund sends a letter that begins with an apology.',
    effect: { type: 'payMoney', amount: 16_000, reason: 'The fund you retired on' },
    tone: 'slate', icon: 'space:market-crash', tier: STANDARD_UP,
  },
  {
    id: 'fr-sunset-sticky', kind: 'normal', title: 'Sticky Fingers',
    description: 'Over good brandy, you talk the current leader out of their best story from years ago.',
    effect: { type: 'stealLifeTile', reason: 'A story changes hands' },
    tone: 'slate', icon: 'space:sticky-fingers', tier: EVERY_BOARD,
  },
  {
    id: 'fr-sunset-last-title', kind: 'normal', title: 'One Last Title',
    description: 'One more promotion before you retire, if you can get it. Spin, and let this last review decide.',
    effect: { type: 'promotion', reason: 'The last review of your life' },
    tone: 'slate', icon: 'space:big-promotion', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'fr-sunset-payday-2', 'You stopped counting your paydays years ago. The 28th has not.'),
  {
    id: 'fr-sunset-farewell', kind: 'normal', title: 'The Farewell Tour',
    description: 'Every department wants to throw you a leaving party, and every department insists on paying for it.',
    effect: { type: 'collectFromEach', amount: 3_000, reason: 'Leaving gifts' },
    tone: 'slate', icon: 'space:surprise-bonus', tier: STANDARD_UP,
  },
  {
    id: 'fr-sunset-tombola', kind: 'normal', title: 'The Tombola',
    description: 'You run the raffle at the village fête, and it earns far more than anyone, even the brass band, expected.',
    effect: { type: 'gainMoney', amount: 1_100, reason: 'Tombola takings' },
    tone: 'green', icon: 'space:garage-sale', tier: LONG_ONLY,
  },
  {
    id: 'fr-sunset-attic-sale', kind: 'normal', title: 'The Attic Sale',
    description: 'You set up a table at the village attic sale, and strangers pay real money for things you nearly threw away.',
    effect: { type: 'gainMoney', amount: 700, reason: 'Attic sale takings' },
    tone: 'green', icon: 'space:yard-sale', tier: LONG_ONLY,
  },
  {
    id: 'fr-sunset-bric-a-brac', kind: 'normal', title: 'The Bric-a-Brac Stall',
    description: 'A dealer goes quiet at one of your boxes and asks, a little too casually, where the clock came from. Spin to find out what it is worth.',
    effect: { type: 'spinForMoney', perPip: 900, reason: 'The appraisal' },
    tone: 'slate', icon: 'space:garage-sale', tier: LONG_ONLY,
  },
  {
    id: 'fr-sunset-sit-down', kind: 'normal', title: 'The Sit-Down',
    description: 'You and your partner go through a whole year of the joint account together, and one of you has some explaining to do about a very nice coat.',
    effect: { type: 'household', reason: 'A year of the joint account, gone through properly' },
    tone: 'purple', icon: 'space:quiet-savings', tier: LONG_ONLY,
  },
  {
    id: 'fr-sunset-last-ticket', kind: 'normal', title: 'One Last Ticket',
    description: 'One final lottery ticket from the lucky newsstand on your way out. Spin for the payout.',
    effect: { type: 'spinForMoney', perPip: 3_500, reason: 'One last ticket' },
    tone: 'slate', icon: 'space:lottery-ticket', tier: STANDARD_UP,
  },
  setback('veryHard', EVERY_BOARD, 'fr-sunset-final-tax', 'Final Tax Bill',
    'One last letter from the tax office arrives just before you retire for good.',
    { type: 'payMoney', amount: 22_000, reason: 'Final tax bill' },
    'slate', 'space:refund-check'),
  flavour(EVERY_BOARD, 'fr-sunset-ahead', 'Sunset Ahead', 'The plane trees along the old road flicker by in the evening light — the same way they always have, on evenings you were too busy to notice.', 'slate', 'space:sunset-ahead'),
]

const RETIREMENT: SpaceContent = {
  id: 'fr-retirement', kind: 'retirement', title: 'Retirement Day',
  description: 'The last leaving party of them all, one final walk through the office with a cardboard box, and your first Monday in forty years with nowhere to be. The pension you spent a lifetime protecting is finally yours.',
  effect: { type: 'retire' },
  tone: 'gold', icon: 'space:retirement', tier: EVERY_BOARD,
}

// ---------------------------------------------------------------------------
// The route: start, four forks, four trunk runs, and retirement — the same
// grammar as every edition, with the summaries written as two uncles giving
// contradictory advice, because the argument at the table is the content.
// ---------------------------------------------------------------------------

const GRANDE_ECOLE_BRANCH: RouteBranch = {
  identity: {
    name: 'The Great Schools',
    summary: 'Two years of hard studying, one national exam, and a bill for the school it gets you into — due in full, before you earn a single euro. What the diploma buys you is a career ladder that mostly goes up, and a network of contacts for life.',
  },
  spaces: [...GRANDE_ECOLE_LANE, GRAD_FAIR],
}

const WORK_BRANCH: RouteBranch = {
  identity: {
    name: 'Straight to Work',
    summary: 'A trade school finds you an employer while the exam students are still studying. You are paid from day one, with no safety net — and the top of this ladder pays more than any diploma at this table.',
  },
  spaces: WORK_LANE,
}

const PERMANENT_BRANCH: RouteBranch = {
  identity: {
    name: 'The Permanent Contract',
    summary: 'Stay put. The CDI — France\'s famous permanent contract — raises your pay by seniority, pays a thirteenth month every December, and in exchange, decides where you live.',
  },
  spaces: PERMANENT_CONTRACT_ROAD,
}

const HOPPER_BRANCH: RouteBranch = {
  identity: {
    name: 'Job-Hopper Alley',
    summary: 'Leave. You sign a negotiated exit, take the payout, and draw a brand new salary from scratch — great if your last one was bad, risky if it was not.',
  },
  spaces: JOB_HOPPER_ALLEY,
}

const FAMILY_BRANCH: RouteBranch = {
  identity: {
    name: 'Family Lane',
    summary: 'School lists, music lessons, and a noisy house, with the government paying a monthly benefit and grown children visiting for Sunday lunch at the end. Fewer paydays, and every bill costs more.',
  },
  spaces: FAMILY_LANE,
}

const EXECUTIVE_BRANCH: RouteBranch = {
  identity: {
    name: 'The Executive Track',
    summary: 'You stop being paid for overtime, which is not the same as working less of it. The raises, bonuses, and corner office are real — so is the life you gave up for them.',
  },
  spaces: EXECUTIVE_TRACK,
}

const SPECULATION_BRANCH: RouteBranch = {
  identity: {
    name: 'Speculation Street',
    summary: 'Startups, margin trading, and a broker with beautiful cufflinks. If you are behind after buying a house, this is the road to catch up on. If you are ahead, think twice.',
  },
  spaces: SPECULATION_STREET,
}

const PRUDENCE_BRANCH: RouteBranch = {
  identity: {
    name: 'Prudence Street',
    summary: 'The savings account, the loyalty card, the old wool sock in the drawer. Nobody ever got rich here — but nobody ever got ruined either, which matters a lot if you are already winning.',
  },
  spaces: PRUDENCE_STREET,
}

export const ROUTE_FRANCE: RouteDefinition = {
  segments: [
    fork(START, GRANDE_ECOLE_BRANCH, WORK_BRANCH),
    run('the boulevard', BOULEVARD_EARLY),
    fork(MID_CAREER_FORK, PERMANENT_BRANCH, HOPPER_BRANCH),
    run('the boulevard, after the crossroads', BOULEVARD_LATE),
    fork(MARRIAGE, FAMILY_BRANCH, EXECUTIVE_BRANCH),
    run('midtown', MIDTOWN),
    fork(HOME_BUYING, SPECULATION_BRANCH, PRUDENCE_BRANCH),
    run('the sunset years', SUNSET_YEARS),
  ],
  terminal: RETIREMENT,
}
