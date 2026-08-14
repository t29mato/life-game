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
 * The voice rule, applied on every tile below: **wit travels; vocabulary does
 * not.** The joke is the situation, described concretely enough to explain
 * itself; a French word appears only where the sentence teaches it in passing
 * (the notaire, the concours, the apéro), and never in a title. Prefer the
 * wince of recognition to the postcard — the château is on the board, but the
 * tile is about the fee for the man who reads the deed aloud.
 */

const START: SpaceContent = {
  ...flavour(EVERY_BOARD, 'fr-start', 'Start of Life', 'Your journey begins one September morning at the great national restart the whole country calls the rentrée: shoes new, timetable posted, futures assigned.', 'slate', 'space:start-of-life'),
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
  flavour(STANDARD_UP, 'fr-uni-move-in', 'The Maid\'s Room', 'Nine square metres under the zinc roof, six floors up, no lift: the chambre de bonne is your first address, and every ambition you have fits in it.', 'blue', 'space:move-in-day', {
    from: 'hard',
    description: 'Nine square metres under the zinc roof — and the agency wants a deposit, a guarantor, and a separate fee for having introduced you to the room.',
    effect: { type: 'payMoney', amount: 1_400, reason: 'Deposit and agency fee' },
  }),
  {
    id: 'fr-uni-fees', kind: 'stop', title: 'The School Fees',
    description: 'Two years of prépa were free, and the concours at the end of them went your way. The grande école it wins you now sends an invoice the Republic does not subsidise, due before anyone shows you the library.',
    effect: { type: 'payMoney', amount: 0, reason: 'Grande école fees' },
    tone: 'blue', icon: 'space:tuition-bill', tier: EVERY_BOARD, unscaled: true,
    amountFrom: 'collegeTuition',
  },
  flavour(LONG_ONLY, 'fr-uni-library', 'Library Marathon', 'The university library closes at ten and the exam is at eight; between the two stand you, three highlighters, and one vending machine.', 'blue', 'space:late-night-study', {
    from: 'hard',
    description: 'The library closes at ten, the exam is at eight, and the copy shop by the gate charges by the page for everything in between.',
    effect: { type: 'payMoney', amount: 500, reason: 'Coffee and copying' },
  }),
  setback('veryHard', STANDARD_UP, 'fr-uni-laptop', 'Laptop Dies',
    'Your laptop gives up two days before the dissertation deadline, and the replacement is not the cheap one.',
    { type: 'payMoney', amount: 3_000, reason: 'Emergency laptop' },
    'blue', 'space:late-night-study'),
  {
    id: 'fr-uni-harvest', kind: 'normal', title: 'The Grape Harvest',
    description: 'Three September weeks picking grapes for a domaine that feeds you magnificently at noon — the vendange pays in cash, calluses, and one bottle you are saving.',
    effect: { type: 'gainMoney', amount: 9_000, reason: 'Harvest wages' },
    tone: 'blue', icon: 'space:campus-job', tier: EVERY_BOARD,
  },
  setback('hard', EVERY_BOARD, 'fr-uni-overdraft', 'Overdraft Charges',
    'The account dips below zero for a single day, and the bank\'s charges arrive with compound enthusiasm and a leaflet about budgeting.',
    { type: 'payMoney', amount: 2_500, reason: 'Overdraft charges' },
    'blue', 'finance:bank-visit'),
  flavour(LONG_ONLY, 'fr-uni-expose', 'The Group Presentation', 'Somehow you end up doing most of the slides. Again. The others contribute opinions.', 'blue', 'space:group-project', {
    from: 'hard',
    description: 'Somehow you end up doing most of the slides, and printing the handouts for all five of you at the copy shop.',
    effect: { type: 'payMoney', amount: 400, reason: 'Printing for five' },
  }),
  {
    id: 'fr-uni-grant', kind: 'normal', title: 'The Merit Grant',
    description: 'A foundation grant with criteria you meet exactly — you read the letter twice to confirm it is actually a gift — and it covers a serious chunk of the fees.',
    effect: { type: 'gainMoney', amount: 24_000, reason: 'Foundation grant' },
    tone: 'blue', icon: 'space:scholarship-win', tier: STANDARD_UP,
  },
  {
    id: 'fr-uni-pasta', kind: 'normal', title: 'Pasta Weeks',
    description: 'Dinner is pasta in the shared kitchen for a fortnight, seasoned with whatever the flatmate abandoned, and the grocery bill still stings.',
    effect: { type: 'payMoney', amount: 600, reason: 'Groceries on a student budget' },
    tone: 'blue', icon: 'space:grocery-run', tier: LONG_ONLY,
  },
  flavour(STANDARD_UP, 'fr-uni-exams', 'Exam Fortnight', 'Five written papers and one oral in which a jury of three watches you reason at a blackboard. You survive on coffee and fatalism.', 'blue', 'space:finals-week', {
    from: 'hard',
    description: 'Five written papers, one blackboard oral, and a private tutor hired in a panic for the subject you dread most.',
    effect: { type: 'payMoney', amount: 1_600, reason: 'Emergency tutoring' },
  }),
  {
    id: 'fr-uni-stage', kind: 'normal', title: 'The Internship',
    description: 'Six months of real work titled "observation" — the stage — for a monthly stipend the law sets just high enough to be called gratitude. The coffee machine learns your name; payroll never does.',
    effect: { type: 'gainMoney', amount: 5_000, reason: 'Internship stipend' },
    tone: 'blue', icon: 'space:new-skills', tier: LONG_ONLY,
  },
  {
    id: 'fr-uni-pitch', kind: 'normal', title: 'Pitch Night',
    description: 'You pitch your dorm-room idea at the incubator\'s open evening — spin to see who bites.',
    effect: { type: 'spinForMoney', perPip: 400, reason: 'Pitch night winnings' },
    tone: 'blue', icon: 'space:startup-bet', tier: LONG_ONLY,
  },
  {
    id: 'fr-uni-erasmus', kind: 'normal', title: 'The Erasmus Year',
    description: 'A year abroad on a European grant that covers roughly half of it, rearranges how you see everything, and ruins you for punctual trains.',
    effect: { type: 'payMoney', amount: 4_000, reason: 'The uncovered half of the year abroad' },
    tone: 'blue', icon: 'space:weekend-trip', tier: STANDARD_UP,
  },
  {
    id: 'fr-uni-loan', kind: 'normal', title: 'The School Loan',
    description: 'The bank lent against the diploma with visible confidence, and the repayments start the month the gown goes back.',
    effect: { type: 'payMoney', amount: 5_000, reason: 'School loan repayments' },
    tone: 'blue', icon: 'finance:bank-visit', tier: STANDARD_UP,
  },
  {
    id: 'fr-uni-graduation', kind: 'stop', title: 'Graduation Day',
    description: 'The diploma has a triple-barrelled name, a handshake from a minister\'s deputy, and a network attached to it for life. Officially a graduate.',
    effect: { type: 'graduate' },
    tone: 'blue', icon: 'space:cap-and-gown', tier: EVERY_BOARD,
  },
]

const GRAD_FAIR: SpaceContent = {
  id: 'fr-grad-forum', kind: 'stop', title: 'The Careers Forum',
  description: 'The school\'s alumni descend on the great hall for one day of firm handshakes and firmer salary bands. Two doors open; pick one.',
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
    description: 'The trade school has a patron for you: indentures signed Monday, paid from Tuesday, while the students are still queueing to enrol.',
    effect: { type: 'chooseCareer', pool: 'basic' },
    tone: 'gold', icon: 'space:first-job-fair', tier: EVERY_BOARD,
  },
  {
    id: 'fr-work-first-payslip', kind: 'normal', title: 'First Pay Slip',
    description: 'Your first French pay slip is forty lines long. Somewhere below the fourth kind of social contribution is your salary, and it feels enormous anyway.',
    effect: { type: 'gainMoney', amount: 2_000, reason: 'First pay packet' },
    tone: 'orange', icon: 'space:first-paycheck', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'fr-work-payday-1', 'A full month on the books, and the transfer lands while your classmates are still photocopying lecture notes.', missedPayday(
    'veryHard',
    'Paid in Arrears',
    'Nobody mentioned that the first month is paid a month behind, and the landlord does not care.',
    900,
    'A month of living on nothing',
  )),
  {
    id: 'fr-work-moving-out', kind: 'stop', title: 'Moving Out',
    description: 'You are earning, so you are expected to be housed: a deposit, a guarantor your parents must sign for, and a rental dossier thicker than the lease it hopes to win.',
    effect: { type: 'payMoney', amount: 1_800, reason: 'Deposit and first month' },
    tone: 'orange', icon: 'space:rent-due', tier: EVERY_BOARD, unscaled: true,
  },
  {
    id: 'fr-work-gear', kind: 'stop', title: 'Work Gear Deposit',
    description: 'Two sets of overalls, steel-toed boots, a badge, and a deposit you have a feeling you will never see again.',
    effect: { type: 'payMoney', amount: 1_500, reason: 'Work gear deposit' },
    tone: 'orange', icon: 'space:rent-due', tier: EVERY_BOARD, appearsFrom: 'hard',
  },
  {
    id: 'fr-work-sunday', kind: 'normal', title: 'Sunday Rates',
    description: 'You take the Sunday-morning shift, which pays half again — and the market crowd tips like it is on holiday, because it is.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'Sunday shift pay' },
    tone: 'orange', icon: 'space:overtime-shift', tier: STANDARD_UP,
  },
  {
    id: 'fr-work-crepe-van', kind: 'normal', title: 'The Crêpe Van Bet',
    description: 'Every euro you have goes into a second-hand van and a very good batter — spin to see what the Saturday market crowd does.',
    effect: { type: 'spinForMoney', perPip: 2_000, reason: 'What the crêpe van took' },
    tone: 'orange', icon: 'career:food-truck-owner', tier: STANDARD_UP,
  },
  setback('veryHard', STANDARD_UP, 'fr-work-late-rent', 'Late Rent',
    'The rent goes in four days late, and the guarantor agency\'s letter is on the doormat before your apology is.',
    { type: 'payMoney', amount: 2_500, reason: 'Late rent penalty' },
    'orange', 'space:rent-due'),
  payday(EVERY_BOARD, 'fr-work-payday-2', 'Another month, another transfer, and still nobody has ever asked to see a diploma.', missedPayday(
    'hard',
    'Hours Cut',
    'The patron pins up next week\'s rota with a sigh, and your name is on half as many lines as last week.',
    1_200,
    'Half a month of shifts',
  )),
  flavour(LONG_ONLY, 'fr-work-evening-class', 'The Evening Certificate', 'An evening course at the trade chamber adds a line to your card that the patron treats with sudden respect.', 'orange', 'space:new-skills', {
    from: 'hard',
    description: 'An evening course at the trade chamber adds a line to your card the patron respects — with the course fee yours to find.',
    effect: { type: 'payMoney', amount: 800, reason: 'Course fee' },
  }),
  flavour(STANDARD_UP, 'fr-work-known', 'Known at the Market', 'Two years without missing a morning, and the stallholders now hold things back for you. Locally, this is a knighthood.', 'orange', 'space:steady-hustle'),
  payday(EVERY_BOARD, 'fr-work-payday-3', 'Three months in and the transfers have stopped feeling like a surprise.'),
  {
    id: 'fr-work-festival', kind: 'normal', title: 'Festival Weekend',
    description: 'Two days hauling crowd barriers and beer kegs for the village festival pays better than it has any right to.',
    effect: { type: 'gainMoney', amount: 900, reason: 'Festival weekend work' },
    tone: 'orange', icon: 'space:side-hustle', tier: LONG_ONLY,
  },
  {
    id: 'fr-work-scratch', kind: 'normal', title: 'Scratch Card',
    description: 'Bought at the tobacconist\'s with the change from the coffee, scratched against the counter — spin for what is under the foil.',
    effect: { type: 'spinForMoney', perPip: 1_200, reason: 'Under the foil' },
    tone: 'orange', icon: 'space:lottery-ticket', tier: LONG_ONLY,
  },
  {
    id: 'fr-work-commute', kind: 'normal', title: 'The Commute',
    description: 'The employer pays half the train pass by law; the moped to the station, it emerges, is considered a personal hobby.',
    effect: { type: 'payMoney', amount: 400, reason: 'The uncovered leg of the commute' },
    tone: 'orange', icon: 'space:car-trouble', tier: LONG_ONLY,
  },
  {
    id: 'fr-work-keys', kind: 'normal', title: 'Keys to the Shop',
    description: 'Somebody has to open at six, hold the keys, and write the rota. Spin: it might as well be you.',
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
  flavour(STANDARD_UP, 'fr-main-dossier', 'The Rental Dossier', 'You assemble payslips, tax notices, a guarantor and a cover letter to rent a one-bedroom flat, and are shortlisted, like a job.', 'slate', 'space:apartment-hunt', {
    from: 'hard',
    description: 'You assemble the dossier, win the flat — and the agency\'s fee, the deposit and the inventory-of-fixtures fee are itemised beautifully.',
    effect: { type: 'payMoney', amount: 2_200, reason: 'Deposit and agency fee' },
  }),
  {
    id: 'fr-main-trial-period', kind: 'normal', title: 'Trial Period Ends',
    description: 'The permanent contract\'s trial period runs out today, and somebody sits down opposite you with a form in duplicate. Spin.',
    effect: { type: 'promotion', reason: 'The end of the trial period' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'fr-main-hypermarket', kind: 'normal', title: 'The Hypermarket Run',
    description: 'The trolley somehow costs more than you planned. The cheese aisle, which has its own postcode, is entirely to blame.',
    effect: { type: 'payMoney', amount: 800, reason: 'Groceries' },
    tone: 'slate', icon: 'space:grocery-run', tier: LONG_ONLY,
  },
  {
    id: 'fr-main-bank', kind: 'normal', title: 'Bank Appointment',
    description: 'Your personal adviser receives you by appointment, slides a coffee across the desk, and asks how the money is treating you.',
    effect: { type: 'bank' },
    tone: 'slate', icon: 'finance:bank-visit', tier: EVERY_BOARD,
  },
  {
    id: 'fr-main-flea-stall', kind: 'normal', title: 'Flea Market Stall',
    description: 'A Sunday stand at the flea market turns the back of one cupboard into a surprisingly good weekend.',
    effect: { type: 'gainMoney', amount: 1_500, reason: 'Flea market takings' },
    tone: 'slate', icon: 'space:side-hustle', tier: LONG_ONLY,
  },
  {
    id: 'fr-main-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'In France cover is less a product than a citizenship requirement: home insurance is compulsory, the mutuelle tops up the doctor, and the broker has a laminated folder for each.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office', tier: EVERY_BOARD,
  },
  {
    id: 'fr-main-burnout', kind: 'normal', title: 'Burnout',
    description: 'A year of skipped lunches in a country that considers that a medical symptom, and one Monday morning you simply cannot go in. The job does not wait.',
    effect: { type: 'loseCareer', reason: 'Signed off, and the job did not wait' },
    tone: 'orange', icon: 'space:steady-hustle', tier: STANDARD_UP,
  },
  {
    id: 'fr-main-gym', kind: 'normal', title: 'Gym Membership',
    description: 'You commit to the gym by the canal in January, along with the entire country. The treadmill and the annual contract both remain sceptical.',
    effect: { type: 'payMoney', amount: 400, reason: 'Gym membership' },
    tone: 'slate', icon: 'space:gym-membership', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'fr-main-payday-1', 'The transfer lands on the 28th like clockwork — the best notification of the week.', missedPayday(
    'hard',
    'Payroll Delayed',
    'The payroll system is migrated over a long weekend, of which France has many, and the overdraft desk is delighted to bridge the gap.',
    1_500,
    'Overdraft while payroll is fixed',
  )),
  {
    id: 'fr-main-stock-tip', kind: 'normal', title: 'Stock Tip',
    description: 'A colleague swears by a ticker over the second course of lunch. The market is open until half past five.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'space:stock-tip', tier: EVERY_BOARD,
  },
  {
    id: 'fr-main-inspection', kind: 'normal', title: 'The Inspection',
    description: 'The car\'s mandatory roadworthiness test — the contrôle technique — finds, as it is legally required to, several things.',
    effect: { type: 'payMoney', amount: 1_200, reason: 'Inspection and repairs' },
    tone: 'slate', icon: 'space:car-trouble', tier: LONG_ONLY,
  },
  {
    id: 'fr-main-long-weekend', kind: 'normal', title: 'The Long Weekend',
    description: 'May has four public holidays, you bridge every one of them, and you drive to the coast with, statistically, everyone else in France.',
    effect: { type: 'payMoney', amount: 600, reason: 'Bridged holidays' },
    tone: 'slate', icon: 'space:weekend-trip', tier: LONG_ONLY,
  },
  {
    id: 'fr-main-fender-bender', kind: 'normal', title: 'Fender Bender',
    description: 'You and the other driver fill in the friendly accident form on the warm bonnet, agreeing amiably that it was your fault.',
    effect: { type: 'payMoney', amount: 2_400, reason: 'Bodyshop bill', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: EVERY_BOARD,
  },
  setback('veryHard', EVERY_BOARD, 'fr-main-pileup', 'Ring Road Pileup',
    'Fog on the périphérique, brake lights, and four cars concertinaed on the slip road. Everyone walks away; the invoices do not.',
    { type: 'payMoney', amount: 14_000, reason: 'Pileup repairs', hazard: 'accident' },
    'slate', 'space:fender-bender'),
  setback('hard', EVERY_BOARD, 'fr-main-dentist', 'The Dental Quote',
    'One crown, one lecture about flossing, and a quote whose largest line is the part no insurance recognises.',
    { type: 'payMoney', amount: 5_000, reason: 'Dental work' },
    'slate', 'space:gym-membership'),
  {
    id: 'fr-main-parking', kind: 'normal', title: 'Parking by Ear',
    description: 'In this city bumpers are for touching — it is practically the driving test — and today somebody played yours like a percussion section.',
    effect: { type: 'payMoney', amount: 2_600, reason: 'Door and wing repairs', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'fr-main-flambe', kind: 'normal', title: 'The Flambé Incident',
    description: 'The crêpes flambées exceed all expectations, and the kitchen ceiling turns the exact colour of strong tea.',
    effect: { type: 'payMoney', amount: 6_000, reason: 'Kitchen fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'fr-main-word-from-director', kind: 'normal', title: 'A Word From the Director',
    description: 'The director crosses the entire open-plan floor to say the client noticed your work. A small envelope follows.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'Performance bonus' },
    tone: 'slate', icon: 'space:good-review', tier: LONG_ONLY,
  },
  {
    id: 'fr-main-lucky-find', kind: 'normal', title: 'Lucky Find',
    description: 'You stumble into a little story worth telling at every dinner for the next decade.',
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
  description: 'Five years on a permanent contract, a pay grid that moves by seniority, and a recruiter\'s message you have somehow still not deleted. The road forks here.',
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
    description: 'The pay grid advances one line per year of service, and the job above yours only frees when somebody finally retires. Spin to see whether this was the year.',
    effect: { type: 'promotion', reason: 'The job above yours came free' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'fr-loyal-thirteenth', kind: 'payday', title: 'The Thirteenth Month',
    description: 'Every December the company simply pays a thirteenth month of salary. Nobody abroad believes you either.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: STANDARD_UP,
  },
  {
    id: 'fr-loyal-transfer', kind: 'normal', title: 'The Transfer',
    description: 'The company decided in February and told you on Friday: the Lyon office, from April. The removal van is yours to pay for.',
    effect: { type: 'payMoney', amount: 3_000, reason: 'Relocating for the company' },
    tone: 'orange', icon: 'space:apartment-hunt', tier: STANDARD_UP,
  },
  {
    id: 'fr-loyal-black-ice', kind: 'normal', title: 'Black Ice',
    description: 'Forty minutes each way for nine years, and one January morning a roundabout — this country owns half the world\'s supply — finds you before you find it.',
    effect: { type: 'payMoney', amount: 4_000, reason: 'Commuter write-off', hazard: 'accident' },
    tone: 'orange', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'fr-loyal-medal', kind: 'normal', title: 'The Work Medal',
    description: 'Twenty years of service earn an actual medal from the Republic, presented with a speech, a handshake, and a story about the old workshop everybody lets you finish.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'orange', icon: 'space:lucky-find', tier: LONG_ONLY,
  },
  {
    id: 'fr-loyal-collection', kind: 'normal', title: 'The Collection',
    description: 'You start the envelope going round for a colleague\'s leaving present, which makes the shortfall at the end of it — there is always a shortfall — yours.',
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
    description: 'You and the company agree, in writing, to disagree: the rupture conventionnelle hands you a severance cheque, your full rights, and a clean slate. The new title arrives with a new number attached.',
    effect: { type: 'careerChange', reason: 'You signed the negotiated exit', compulsory: true },
    tone: 'orange', icon: 'space:headhunted', tier: EVERY_BOARD,
  },
  {
    id: 'fr-hopper-bonus', kind: 'payday', title: 'Signing Bonus',
    description: 'The new firm buys out your three-month notice period — three months being the French kind — and the transfer lands like a whole extra pay packet.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: STANDARD_UP,
  },
  {
    id: 'fr-hopper-gap', kind: 'normal', title: 'The Gap',
    description: 'Three weeks between badges, during which the unemployment office asks for one more document. The file is never complete; the rent always is.',
    effect: { type: 'payMoney', amount: 3_000, reason: 'Three weeks between jobs' },
    tone: 'orange', icon: 'space:rent-due', tier: STANDARD_UP,
  },
  {
    id: 'fr-hopper-van', kind: 'normal', title: 'Moving Van',
    description: 'You drive the hire van to the new city yourself, and learn its exact height from the mediaeval gate the satnav swore was a road.',
    effect: { type: 'payMoney', amount: 4_000, reason: 'Van and barrier repairs', hazard: 'accident' },
    tone: 'orange', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'fr-hopper-freelance', kind: 'normal', title: 'Freelance Season',
    description: 'You register as a one-person company for a season and invoice by the day — spin to find out how many of the days were good ones.',
    effect: { type: 'spinForMoney', perPip: 1_200, reason: 'A season of day rates' },
    tone: 'orange', icon: 'space:startup-bet', tier: LONG_ONLY,
  },
  {
    id: 'fr-hopper-leaving-toast', kind: 'normal', title: 'The Leaving Toast',
    description: 'Your third leaving drinks of the decade — the pot de départ, with the good crémant this time. The card is enormous, the collection is generous, and nobody quite remembers your job title.',
    effect: { type: 'collectFromEach', amount: 700, reason: 'The leaving collection' },
    tone: 'orange', icon: 'space:poker-night', tier: LONG_ONLY,
  },
]

/** The Boulevard, second half: the review, the redundancy plan, and the ring. */
const BOULEVARD_LATE: readonly SpaceContent[] = [
  {
    id: 'fr-main-annual-review', kind: 'stop', title: 'The Annual Review',
    description: 'A small meeting room, two managers with your file open between them, and one question: are you ready for the job above yours? Spin, and hear what they say.',
    effect: { type: 'promotion', reason: 'Your annual review came round' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'fr-main-subscriptions', kind: 'normal', title: 'Streaming Bill',
    description: 'Somehow you are subscribed to six services, one of which exists solely to show cycling in July.',
    effect: { type: 'payMoney', amount: 300, reason: 'Streaming subscriptions' },
    tone: 'slate', icon: 'space:streaming-bill', tier: LONG_ONLY,
  },
  {
    id: 'fr-main-raise-talk', kind: 'normal', title: 'Pay Raise Talk',
    description: 'You ask for a raise, which is not done, and receive one, which is unheard of. You tell nobody, which is wise.',
    effect: { type: 'payRaise' },
    tone: 'slate', icon: 'space:pay-raise-talk', tier: STANDARD_UP,
  },
  setback('veryHard', EVERY_BOARD, 'fr-main-tax-audit', 'Tax Audit',
    'A very courteous letter from the tax office, a long afternoon with a shoebox of receipts, and a figure at the bottom that has clearly already been decided.',
    { type: 'payMoney', amount: 15_000, reason: 'Tax audit settlement' },
    'slate', 'space:refund-check'),
  {
    id: 'fr-main-cdd-ends', kind: 'normal', title: 'The Fixed Term Ends',
    description: 'The short contract everyone swore blind would roll into a permanent one is, very quietly, not renewed. The farewell card is lovely.',
    effect: { type: 'loseCareer', reason: 'Contract not renewed' },
    tone: 'orange', icon: 'space:layoff-notice', tier: EVERY_BOARD, appearsFrom: 'hard',
  },
  {
    id: 'fr-main-redundancy', kind: 'normal', title: 'The Redundancy Plan',
    description: 'The whole floor is called into one meeting with a consultant in a very good suit, and afterwards your badge stops working.',
    effect: { type: 'loseCareer', reason: 'Restructured out' },
    tone: 'orange', icon: 'space:layoff-notice', tier: EVERY_BOARD,
  },
  {
    id: 'fr-main-employment-office', kind: 'stop', title: 'The Employment Office',
    description: 'The agency\'s adviser has stapled your working life into a folder and found two openings that fit it; pick one.',
    effect: { type: 'careerChange', reason: 'A fresh start from the employment office' },
    tone: 'orange', icon: 'space:career-fair-return', tier: EVERY_BOARD,
  },
  {
    id: 'fr-main-points', kind: 'normal', title: 'Loyalty Card Points',
    description: 'The hypermarket\'s points, hoarded all year, finally converge on a free set of saucepans and a satisfying receipt.',
    effect: { type: 'gainMoney', amount: 400, reason: 'The points pay out' },
    tone: 'slate', icon: 'space:coupon-clipping', tier: LONG_ONLY,
  },
  setback('hard', LONG_ONLY, 'fr-main-parking-ticket', 'Parking Ticket',
    'Eleven minutes over, one warden with excellent timing, and a fine tucked under the wiper with great neatness.',
    { type: 'payMoney', amount: 1_200, reason: 'Parking fine' },
    'slate', 'space:car-trouble'),
  {
    id: 'fr-main-apero', kind: 'normal', title: 'The Apéritif',
    description: 'You mention, casually, an apéro on your terrace at six. By eleven it is somehow dinner for the whole floor, and every glass is on you.',
    effect: { type: 'payEach', amount: 600, reason: 'The apéro became dinner' },
    tone: 'slate', icon: 'space:neighborhood-bbq', tier: LONG_ONLY,
    harsher: {
      from: 'hard',
      description: 'You mention an apéro at six. By midnight there have been three courses, two rounds of digestifs, and a taxi across half the city, and every receipt finds its way to you.',
      effect: { type: 'payEach', amount: 1_200, reason: 'The apéro became a banquet' },
    },
  },
  {
    id: 'fr-main-rtt-buyback', kind: 'normal', title: 'The Day Buyback',
    description: 'The thirty-five-hour week credited you days off you never managed to take, and the company buys them back with a line on the December payslip you read twice.',
    effect: { type: 'gainMoney', amount: 2_000, reason: 'Untaken days bought back' },
    tone: 'slate', icon: 'space:overtime-shift', tier: LONG_ONLY,
  },
  {
    id: 'fr-main-gifts', kind: 'normal', title: 'Holiday Gifts',
    description: 'A present for everyone at the table, chosen with more thought than budget, and wrapped by the shop with more skill than both.',
    effect: { type: 'payEach', amount: 800, reason: 'A present for everyone' },
    tone: 'slate', icon: 'space:surprise-bonus', tier: EVERY_BOARD,
  },
  {
    id: 'fr-main-refund', kind: 'normal', title: 'Tax Refund',
    description: 'The tax office recalculates in your favour and pays you back without being asked, which you mention at dinners for a month.',
    effect: { type: 'gainMoney', amount: 700, reason: 'Tax refund' },
    tone: 'slate', icon: 'space:refund-check', tier: LONG_ONLY,
  },
  {
    id: 'fr-main-profit-share', kind: 'payday', title: 'The Profit Share',
    description: 'By law, a slice of the firm\'s good year belongs to every badge in the building — a whole extra pay packet, and nobody had to ask.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:surprise-bonus', tier: LONG_ONLY,
    harsher: missedPayday(
      'veryHard',
      'The Formula Produces Zero',
      'By law a slice of the profits is yours; this year\'s letter explains, over two annexes, that the formula produced zero.',
      900,
      'A letter about the formula',
    ),
  },
  {
    id: 'fr-main-card-table', kind: 'normal', title: 'The Card Table',
    description: 'A friendly evening of belote, the national card game of looking calm — and tonight the cards simply like you.',
    effect: { type: 'collectFromEach', amount: 500, reason: 'Card night winnings' },
    tone: 'slate', icon: 'space:poker-night', tier: STANDARD_UP,
  },
  flavour(LONG_ONLY, 'fr-main-ring', 'Ring Shopping', 'You linger a little too long at a jeweller\'s window on the grand square, under an awning older than the Republic\'s current constitution.', 'slate', 'space:ring-shopping'),
]

const MARRIAGE: SpaceContent = {
  id: 'fr-wedding', kind: 'stop', title: 'Wedding Day',
  description: 'Married twice in one day — once by the deputy mayor under the portrait of the Republic, once at a dinner that ends, as required, at dawn. The gift urn on the table fills with envelopes.',
  effect: { type: 'getMarried' },
  tone: 'pink', icon: 'space:wedding-day', tier: EVERY_BOARD,
}

/** Family Lane: the beats every French parent knows, in order of arrival. */
const FAMILY_LANE: readonly SpaceContent[] = [
  {
    id: 'fr-family-nursery-setup', kind: 'normal', title: 'Nursery Setup',
    description: 'You paint the nursery a cheerful yellow, assemble a crib at midnight, and collect the child health record book the State has already printed with their name.',
    effect: { type: 'payMoney', amount: 2_000, reason: 'Nursery setup' },
    tone: 'purple', icon: 'space:nursery-setup', tier: EVERY_BOARD,
  },
  {
    id: 'fr-family-new-baby', kind: 'stop', title: 'New Baby',
    description: 'A tiny new roommate arrives, and the State — which has been waiting — opens a file, a benefit, and a vaccination schedule on their behalf.',
    effect: { type: 'haveChildren', count: 1 },
    tone: 'purple', icon: 'space:new-baby', tier: EVERY_BOARD,
  },
  {
    id: 'fr-family-august', kind: 'normal', title: 'August at the Seaside',
    description: 'The entire country goes on holiday in the same month, to the same coast, on the same motorway. You have a wonderful time in a queue with a windbreak.',
    effect: { type: 'payMoney', amount: 1_800, reason: 'The August holiday' },
    tone: 'purple', icon: 'space:family-vacation', tier: LONG_ONLY,
  },
  setback('hard', EVERY_BOARD, 'fr-family-creche', 'The Crèche Waitlist',
    'A public crèche place is won like a competitive examination, and the childminder who bridges the gap invoices like one.',
    { type: 'payPerChild', amount: 5_000, reason: 'Childcare per child' },
    'purple', 'space:nursery-setup'),
  setback('veryHard', STANDARD_UP, 'fr-family-tutoring', 'Private Tutoring',
    'Every child gets an hour a week with somebody patient about mathematics, and patience turns out to be billed hourly.',
    { type: 'payPerChild', amount: 5_000, reason: 'Tutoring per child' },
    'purple', 'space:school-fees'),
  {
    id: 'fr-family-school-list', kind: 'normal', title: 'The School List',
    description: 'The back-to-school list specifies seventeen items per child, including one very particular brand of notebook stocked, this week, nowhere in the country.',
    effect: { type: 'payPerChild', amount: 3_000, reason: 'School supplies per child' },
    tone: 'purple', icon: 'space:school-fees', tier: EVERY_BOARD,
  },
  {
    id: 'fr-family-year-end-show', kind: 'normal', title: 'The Year-End Show',
    description: 'Your child delivers both lines perfectly in the school spectacle, and you tear up in the third row behind a forest of phones.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'purple', icon: 'space:school-play', tier: EVERY_BOARD,
  },
  {
    id: 'fr-family-estate-car', kind: 'normal', title: 'The Family Estate',
    description: 'Reversing off the drive with three children adjudicating behind you, into the one gatepost that has never once moved.',
    effect: { type: 'payMoney', amount: 3_200, reason: 'Estate car bodywork', hazard: 'accident' },
    tone: 'purple', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'fr-family-conservatoire', kind: 'normal', title: 'The Conservatoire',
    description: 'The municipal conservatoire takes another small student at a subsidised rate that still, somehow, adds up. The scales are rough, but there is real promise in there.',
    effect: { type: 'payMoney', amount: 900, reason: 'Music lessons' },
    tone: 'purple', icon: 'space:piano-lessons', tier: LONG_ONLY,
  },
  {
    id: 'fr-family-twins', kind: 'normal', title: 'Twins',
    description: 'The technician goes quiet at the scan, turns the screen around, and holds up two fingers.',
    effect: { type: 'haveChildren', count: 2 },
    tone: 'purple', icon: 'space:second-baby', tier: EVERY_BOARD,
  },
  {
    id: 'fr-family-saturday-football', kind: 'normal', title: 'Saturday Football',
    description: 'Weekend mornings become touchline cheering, orange quarters, and a coach who takes the under-nines exactly as seriously as the World Cup.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'purple', icon: 'space:soccer-season', tier: STANDARD_UP,
  },
  {
    id: 'fr-family-allowance', kind: 'normal', title: 'Family Allowance',
    description: 'The family-benefits office pays a quiet monthly sum for every small person in the house, without ever being asked.',
    effect: { type: 'collectPerChild', amount: 1_500, reason: 'Family allowance per child' },
    tone: 'purple', icon: 'space:child-benefit', tier: STANDARD_UP,
  },
  flavour(STANDARD_UP, 'fr-family-portrait', 'Family Portrait', 'Everyone actually smiles at the same time, in front of the good shutters — frame it immediately.', 'purple', 'space:family-portrait', {
    from: 'veryHard',
    description: 'Everyone smiles at the same time exactly once, and the studio charges for the whole afternoon, the album, and the grandparents\' reprints.',
    effect: { type: 'payMoney', amount: 1_100, reason: 'The full photo package' },
  }),
  payday(STANDARD_UP, 'fr-family-payday', 'Payday lands somewhere between the school run and bath time, and is spent in roughly the same window.'),
  {
    id: 'fr-family-back-to-work', kind: 'normal', title: 'Back to Work',
    description: 'You return from parental leave with new scheduling superpowers, and negotiate hard on the way back in.',
    effect: { type: 'payRaise' },
    tone: 'purple', icon: 'space:pay-raise-talk', tier: LONG_ONLY,
  },
  {
    id: 'fr-family-third', kind: 'normal', title: 'Another Arrival',
    description: 'Three children makes you officially a large family: the railways discount you, the State salutes you, and nobody minds that the car is now too small in the slightest.',
    effect: { type: 'haveChildren', count: 1 },
    tone: 'purple', icon: 'space:new-baby', tier: LONG_ONLY,
  },
]

/** The Executive Track: pass cadre, and the overtime stops being counted. */
const EXECUTIVE_TRACK: readonly SpaceContent[] = [
  {
    id: 'fr-fast-cadre', kind: 'normal', title: 'The Executive Question',
    description: 'Your name is on the shortlist to pass cadre — a different status, a different pension scheme, and the same desk with more of it. Spin.',
    effect: { type: 'promotion', reason: 'On the shortlist to pass cadre' },
    tone: 'orange', icon: 'space:big-promotion', tier: STANDARD_UP,
  },
  {
    id: 'fr-fast-alumni', kind: 'normal', title: 'The Alumni Dinner',
    description: 'The old school\'s annual dinner: one chance conversation over the cheese course turns into a referral worth real money.',
    effect: { type: 'gainMoney', amount: 1_200, reason: 'Referral bonus' },
    tone: 'orange', icon: 'space:networking-night', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'fr-fast-payday-1', 'The overtime is no longer counted, but the transfer still is.'),
  {
    id: 'fr-fast-headhunted', kind: 'normal', title: 'Headhunted',
    description: 'A recruiter calls your personal phone during the Monday meeting, with two offers and no patience.',
    effect: { type: 'careerChange', reason: 'Headhunted for something new' },
    tone: 'orange', icon: 'space:headhunted', tier: EVERY_BOARD,
  },
  {
    id: 'fr-fast-hire-car', kind: 'normal', title: 'Hire Car',
    description: 'An unfamiliar city, a client\'s industrial estate, and a bollard that had been standing there, by all accounts, since before the war.',
    effect: { type: 'payMoney', amount: 3_200, reason: 'Hire car excess', hazard: 'accident' },
    tone: 'orange', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'fr-fast-client-win', kind: 'normal', title: 'Client Win',
    description: 'You land the account everyone said was impossible, over a lunch that ran to four courses because it was going well.',
    effect: { type: 'gainMoney', amount: 3_000, reason: 'Client win bonus' },
    tone: 'orange', icon: 'space:client-win', tier: STANDARD_UP,
  },
  {
    id: 'fr-fast-conference', kind: 'normal', title: 'Conference Talk',
    description: 'Your talk goes round the whole industry in a week, and the organisers of the next three conferences would like your calendar.',
    effect: { type: 'gainMoney', amount: 4_400, reason: 'Speaking fees' },
    tone: 'orange', icon: 'space:conference-talk', tier: STANDARD_UP,
  },
  setback('hard', EVERY_BOARD, 'fr-fast-burnout', 'Burnout Leave',
    'Six weeks signed off by a doctor who uses the word "overwork" without blinking, and the pay packet is a great deal lighter by the time you walk back in.',
    { type: 'payMoney', amount: 12_000, reason: 'Unpaid leave' },
    'orange', 'space:steady-hustle'),
  {
    id: 'fr-fast-reorg', kind: 'normal', title: 'The Reorganisation',
    description: 'The org chart is redrawn overnight and your name turns up in a different box entirely. Nobody asked, which is what a reorganisation is.',
    effect: { type: 'careerChange', reason: 'Reorganised into a new role', compulsory: true },
    tone: 'orange', icon: 'space:career-fair-return', tier: EVERY_BOARD, appearsFrom: 'veryHard',
  },
  {
    id: 'fr-fast-trading-desk', kind: 'normal', title: 'The Trading Desk',
    description: 'The bonus is burning a hole in your pocket, and the towers of the business district glitter with suggestions.',
    effect: { type: 'buyStock' },
    tone: 'orange', icon: 'finance:trading-floor', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'fr-fast-payday-2', 'Another month down, another transfer in.', missedPayday(
    'hard',
    'Bonus Clawback',
    'Last year\'s bonus is recalculated by an auditor in a distant tower, and recalculated downwards, with annexes.',
    6_000,
    'Bonus clawed back',
  )),
  {
    id: 'fr-fast-bonus-season', kind: 'normal', title: 'Bonus Season',
    description: 'The year-end envelope is thicker than expected. You check the name on it twice, quietly, in the corridor.',
    effect: { type: 'gainMoney', amount: 5_000, reason: 'Year-end bonus' },
    tone: 'orange', icon: 'space:bonus-season', tier: STANDARD_UP,
  },
  flavour(LONG_ONLY, 'fr-fast-corner-office', 'Corner Office', 'You finally get a door that closes, a window with a view of the courtyard chestnut, and a radiator with personal opinions.', 'orange', 'space:corner-office', {
    from: 'hard',
    description: 'You finally get a door that closes and a window that opens — onto an empty room the budget expects you to furnish yourself.',
    effect: { type: 'payMoney', amount: 1_800, reason: 'Furnishing the office' },
  }),
  {
    id: 'fr-fast-board-seat', kind: 'normal', title: 'Board Seat',
    description: 'A chair has come free at the long table on the top floor. Spin to find out whose name ends up on the door card.',
    effect: { type: 'promotion', reason: 'A chair at the long table' },
    tone: 'orange', icon: 'space:corner-office', tier: STANDARD_UP,
  },
  {
    id: 'fr-fast-retention', kind: 'normal', title: 'Retention Offer',
    description: 'You mention, lightly, over coffee, that somebody else has been in touch. The counter-offer arrives before the coffee does.',
    effect: { type: 'payRaise' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'fr-fast-equity', kind: 'normal', title: 'Options Vest',
    description: 'Four years of paperwork from the startup years turn into an actual number in an actual account.',
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
    description: 'Screens everywhere, a queue of pensioners at the counter, and a broker who insists this one is different.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'finance:trading-floor', tier: EVERY_BOARD,
  },
  {
    id: 'fr-midtown-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'Every share you hold quietly posts a cheque, and one of them encloses a shareholder discount on its own toll roads, which is the part you tell people about.',
    effect: { type: 'stockDividend', perShare: 3_000, reason: 'Quarterly dividend' },
    tone: 'slate', icon: 'space:dividend-day', tier: STANDARD_UP,
  },
  {
    id: 'fr-midtown-long-lunch', kind: 'normal', title: 'The Long Lunch',
    description: 'You got the promotion, so lunch for the whole floor is on you — and a French business lunch has courses, plural, and a cheese trolley with momentum.',
    effect: { type: 'payEach', amount: 800, reason: 'Lunch for the whole floor' },
    tone: 'slate', icon: 'space:neighborhood-bbq', tier: STANDARD_UP,
  },
  {
    id: 'fr-midtown-fryer', kind: 'normal', title: 'The Deep Fryer',
    description: 'Nobody has changed the fryer oil since the last World Cup final, and tonight the kitchen is the first to hear about it.',
    effect: { type: 'payMoney', amount: 5_600, reason: 'Kitchen fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'fr-midtown-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'Before any notary hands you keys, somebody would like proof of cover — and unrolls a flood map of your future street that is thorough, recent, and quietly persuasive.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'fr-midtown-payday', 'A transfer lands the week the deposit on an apartment is due.', missedPayday(
    'veryHard',
    'Pay Frozen',
    'A pay freeze is announced by all-staff email on the very morning the deposit was supposed to land, with regrets and a graph.',
    2_000,
    'Nothing to draw on this month',
  )),
  {
    id: 'fr-midtown-wiring', kind: 'normal', title: 'Wiring Fault',
    description: 'The building survey mentions the fuse box in passing. The fuse box mentions it again at two in the morning, rather louder.',
    effect: { type: 'payMoney', amount: 5_600, reason: 'Electrical fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'fr-midtown-boar', kind: 'normal', title: 'The Wild Boar',
    description: 'It trots out of the vineyard at dusk, considers you carefully, and walks away. The bonnet does not walk away.',
    effect: { type: 'payMoney', amount: 3_600, reason: 'Front end rebuilt', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'fr-midtown-presentation', kind: 'normal', title: 'The Big Presentation',
    description: 'You present to the executive floor and win the room. Spin to find out whether winning the room is the same as being given the job that runs it.',
    effect: { type: 'promotion', reason: 'You won the room' },
    tone: 'orange', icon: 'space:client-win', tier: STANDARD_UP,
  },
  {
    id: 'fr-midtown-joint-account', kind: 'normal', title: 'The Joint Account',
    description: 'You merge the accounts at a solemn bank appointment, and for the first time somebody else\'s spending is also, unavoidably, your spending.',
    effect: { type: 'household', reason: 'The joint account, settled up' },
    tone: 'purple', icon: 'finance:bank-visit', tier: EVERY_BOARD,
  },
  {
    id: 'fr-midtown-bonus', kind: 'payday', title: 'Year-End Bonus',
    description: 'The December payslip arrives with its longest supplement of the year: a bonus sized to what you earn, and every one of you unfolds a different number.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: EVERY_BOARD,
  },
  {
    id: 'fr-midtown-raise', kind: 'normal', title: 'Mid-Career Raise',
    description: 'A quiet word by the lift, a new number, and a handshake of exactly matched firmness on the way out.',
    effect: { type: 'payRaise' },
    tone: 'slate', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  setback('veryHard', EVERY_BOARD, 'fr-midtown-rate-rise', 'Rate Rise',
    'The fixed-rate era ends on a Thursday morning, and every monthly figure in the household moves with it.',
    { type: 'payMoney', amount: 14_000, reason: 'Rates go the wrong way' },
    'slate', 'space:market-crash'),
  setback('hard', LONG_ONLY, 'fr-midtown-diagnostics', 'The Diagnostics File',
    'The seller\'s legally required file — lead, termites, asbestos, energy class — is thorough, and the energy class is a G. G is not a good grade.',
    { type: 'payMoney', amount: 8_000, reason: 'Survey findings and repairs' },
    'slate', 'space:house-hunting'),
  {
    id: 'fr-midtown-campsite', kind: 'normal', title: 'The Campsite',
    description: 'Three stars, a pool with a slide, a pitch numbered like a parking space, and rain from Friday to Sunday.',
    effect: { type: 'payMoney', amount: 700, reason: 'Camping weekend' },
    tone: 'slate', icon: 'space:weekend-trip', tier: LONG_ONLY,
  },
  {
    id: 'fr-midtown-fast-trains', kind: 'normal', title: 'The High-Speed Month',
    description: 'Four cities in five days at three hundred kilometres an hour, and every one of the receipts is yours until the expense forms clear.',
    effect: { type: 'payMoney', amount: 1_500, reason: 'Travel expenses' },
    tone: 'slate', icon: 'space:weekend-trip', tier: LONG_ONLY,
  },
  {
    id: 'fr-midtown-bank', kind: 'normal', title: 'Bank Visit',
    description: 'The branch manager now greets you by name and offers the good coffee, which is either flattering or ominous.',
    effect: { type: 'bank' },
    tone: 'slate', icon: 'finance:bank-visit', tier: LONG_ONLY,
  },
  flavour(LONG_ONLY, 'fr-midtown-viewings', 'Six Viewings', 'Six apartments in one Saturday, each with "unmissable potential" and one with an actual pigeon, and you liked the second one best all along.', 'slate', 'space:house-hunting', {
    from: 'hard',
    description: 'Six apartments in one Saturday, and a tank of fuel, three coffees and a paid car park to show for the day.',
    effect: { type: 'payMoney', amount: 600, reason: 'A Saturday of viewings' },
  }),
]

const HOME_BUYING: SpaceContent = {
  id: 'fr-notary', kind: 'stop', title: 'The Notary\'s Office',
  description: 'Nothing is yours until the notaire reads the deed aloud, every page of it, in an office of green leather. The fee is not a fee so much as a tax with a wig on — and it is yours too.',
  effect: { type: 'buyHouse' },
  tone: 'gold', icon: 'space:house-hunting', tier: EVERY_BOARD,
}

/** Speculation Street: startups, margin, and a broker with beautiful cufflinks. */
const SPECULATION_STREET: readonly SpaceContent[] = [
  {
    id: 'fr-risky-startup', kind: 'normal', title: 'Startup Bet',
    description: 'You pour savings into a friend\'s startup at the big Paris incubator and spin to see what comes back.',
    effect: { type: 'spinForMoney', perPip: 2_000, reason: 'Startup investment payout' },
    tone: 'pink', icon: 'space:startup-bet', tier: EVERY_BOARD,
  },
  {
    id: 'fr-risky-bad-tip', kind: 'normal', title: 'Bad Stock Tip',
    description: 'Your "sure thing" tanks in a week, and you buy the table dinner to make up for having recommended it over two full courses.',
    effect: { type: 'payEach', amount: 2_000, reason: 'Bad stock tip' },
    tone: 'pink', icon: 'space:stock-tip', tier: EVERY_BOARD,
  },
  {
    id: 'fr-risky-casino', kind: 'normal', title: 'The Casino Weekend',
    description: 'A seafront casino, a linen jacket, and one perfectly judged evening — you leave while ahead, a first for everyone present.',
    effect: { type: 'collectFromEach', amount: 2_500, reason: 'One perfect evening' },
    tone: 'pink', icon: 'space:poker-night', tier: EVERY_BOARD,
  },
  {
    id: 'fr-risky-crash', kind: 'normal', title: 'Market Crash',
    description: 'The market dips hard and your portfolio winces. An uncle mentions, again, that land never let anyone down.',
    effect: { type: 'payMoney', amount: 9_000, reason: 'Market crash' },
    tone: 'pink', icon: 'space:market-crash', tier: EVERY_BOARD,
  },
  setback('hard', EVERY_BOARD, 'fr-risky-aftershock', 'Aftershock',
    'The index finds a lower floor than anyone believed it had, and finds it inside a single afternoon session.',
    { type: 'payMoney', amount: 16_000, reason: 'The market falls again' },
    'pink', 'space:market-crash'),
  setback('veryHard', LONG_ONLY, 'fr-risky-wipeout', 'Margin Wipeout',
    'The leveraged position is closed for you at the worst possible hour, and nobody asks first.',
    { type: 'payMoney', amount: 20_000, reason: 'Position closed out' },
    'pink', 'space:market-crash'),
  {
    id: 'fr-risky-roadster', kind: 'normal', title: 'One Careful Week',
    description: 'You buy the roadster you promised yourself at seventeen, and introduce it to a mediaeval kerbstone before the plates arrive.',
    effect: { type: 'payMoney', amount: 5_000, reason: 'Alloys, arch and pride', hazard: 'accident' },
    tone: 'pink', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'fr-risky-lottery', kind: 'normal', title: 'The Lottery Ticket',
    description: 'The national draw, bought at the lucky tobacconist because the lucky tobacconist is famously lucky. Spin for what the luck was worth.',
    effect: { type: 'spinForMoney', perPip: 3_500, reason: 'The national draw' },
    tone: 'pink', icon: 'space:lottery-ticket', tier: EVERY_BOARD,
  },
  {
    id: 'fr-risky-windfall', kind: 'normal', title: 'The Old Position',
    description: 'An investment you had honestly forgotten finally pays off, and everyone at the table chips in envy.',
    effect: { type: 'collectFromEach', amount: 2_000, reason: 'Surprise windfall' },
    tone: 'pink', icon: 'space:surprise-bonus', tier: STANDARD_UP,
  },
  {
    id: 'fr-risky-auction', kind: 'normal', title: 'The Wine Auction',
    description: 'A cellar clearance at the old auction house gets competitive, and your paddle goes up one case too many.',
    effect: { type: 'payMoney', amount: 6_000, reason: 'Auction overspend' },
    tone: 'pink', icon: 'space:bidding-war', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'fr-risky-payday', 'A pay packet lands while your investments are busy misbehaving.'),
  {
    id: 'fr-risky-margin-call', kind: 'normal', title: 'Margin Call',
    description: 'The broker rings at seven in the morning, and the courtesy of the voice says it all.',
    effect: { type: 'payMoney', amount: 4_000, reason: 'Margin call' },
    tone: 'pink', icon: 'space:market-crash', tier: LONG_ONLY,
  },
  {
    id: 'fr-risky-swap', kind: 'normal', title: 'Rival Swap',
    description: 'One handshake over one very long lunch, and you and the front-runner trade bank balances.',
    effect: { type: 'swapMoneyWithLeader', reason: 'A deal with the front-runner' },
    tone: 'pink', icon: 'space:rival-swap', tier: EVERY_BOARD,
  },
  {
    id: 'fr-risky-rooftop', kind: 'normal', title: 'The Rooftop Party',
    description: 'You book a rooftop with a view of the tower for the party of the summer, and insist on picking up every single tab.',
    effect: { type: 'payEach', amount: 1_500, reason: 'The whole rooftop, on you' },
    tone: 'pink', icon: 'space:neighborhood-bbq', tier: LONG_ONLY,
  },
  {
    id: 'fr-risky-angel', kind: 'normal', title: 'Angel Investing',
    description: 'Three cheques into three garage startups — spin to find out which one grew up.',
    effect: { type: 'spinForMoney', perPip: 1_500, reason: 'Angel investment return' },
    tone: 'pink', icon: 'space:startup-bet', tier: LONG_ONLY,
  },
  {
    id: 'fr-risky-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'The speculative end of your portfolio has a very good quarter for once, and you say nothing modest about it.',
    effect: { type: 'stockDividend', perShare: 4_000, reason: 'Bumper dividend' },
    tone: 'pink', icon: 'space:dividend-day', tier: STANDARD_UP,
  },
  {
    id: 'fr-risky-cufflinks', kind: 'normal', title: 'A Very Confident Broker',
    description: 'The broker leans in and lowers his voice. The cufflinks are beautiful, which is not the same thing as a beautiful tip.',
    effect: { type: 'buyStock' },
    tone: 'pink', icon: 'space:stock-tip', tier: LONG_ONLY,
  },
]

/** Prudence Street: the savings booklet, the loyalty card, the wool sock in the drawer. */
const PRUDENCE_STREET: readonly SpaceContent[] = [
  {
    id: 'fr-safe-points', kind: 'normal', title: 'Loyalty Points Payout',
    description: 'The hypermarket card, swiped faithfully for a year, covers the whole trolley at the checkout, and you accept the applause of the queue.',
    effect: { type: 'gainMoney', amount: 800, reason: 'The points pay out' },
    tone: 'green', icon: 'space:coupon-clipping', tier: EVERY_BOARD,
  },
  {
    id: 'fr-safe-potager', kind: 'normal', title: 'The Kitchen Garden',
    description: 'The tomatoes and courgettes finally ripen all at once, saving a grocery trip and obliging every neighbour to accept a bag.',
    effect: { type: 'gainMoney', amount: 600, reason: 'Kitchen garden harvest' },
    tone: 'green', icon: 'space:garden-harvest', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'fr-safe-payday', 'The transfer arrives on the 28th, as it has every month since you can remember.', missedPayday(
    'veryHard',
    'Wages Withheld',
    'An administrative formality, you are assured, means this month\'s wages will arrive next month, along with an apology drafted by a committee.',
    1_000,
    'Wages held over a month',
  )),
  setback('hard', EVERY_BOARD, 'fr-safe-excess', 'Policy Excess',
    'Even the careful road has a claim form on it, and the excess is yours to cover, in exact change.',
    { type: 'payMoney', amount: 4_000, reason: 'Policy excess' },
    'green', 'finance:insurance-office'),
  setback('veryHard', STANDARD_UP, 'fr-safe-roof', 'Roof Repairs',
    'The autumn storm takes three slates in the night, and the man with the ladder is booked until Thursday.',
    { type: 'payMoney', amount: 9_000, reason: 'Roof repairs' },
    'green', 'space:house-hunting'),
  setback('hard', LONG_ONLY, 'fr-safe-fridge', 'Fridge Gives Up',
    'It hums, it rattles, it stops. Everything in the freezer, including the emergency confit, goes in the bin by lunchtime.',
    { type: 'payMoney', amount: 3_000, reason: 'A new fridge' },
    'green', 'space:grocery-run'),
  {
    id: 'fr-safe-trolley', kind: 'normal', title: 'Trolley Dent',
    description: 'A runaway trolley crosses the entire hypermarket car park to find your door, and nobody at all saw a thing.',
    effect: { type: 'payMoney', amount: 3_000, reason: 'Panel and paint', hazard: 'accident' },
    tone: 'green', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'fr-safe-budget', kind: 'normal', title: 'Budget Win',
    description: 'You keep the household accounts book faithfully for one whole year, column by column, and the book quietly wins.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'The ledger balances ahead' },
    tone: 'green', icon: 'space:budget-win', tier: EVERY_BOARD,
  },
  {
    id: 'fr-safe-booklet', kind: 'normal', title: 'The Savings Booklet',
    description: 'The tax-free savings booklet every French person has held since birth quietly earns its keep, at a rate set by decree and defended like the flag.',
    effect: { type: 'gainMoney', amount: 1_200, reason: 'Savings booklet interest' },
    tone: 'green', icon: 'space:interest-payout', tier: STANDARD_UP,
  },
  {
    id: 'fr-safe-sticky', kind: 'normal', title: 'Sticky Fingers',
    description: 'A rival leaves their proudest keepsake unattended by the coffee machine, and your hand hovers over it.',
    effect: { type: 'stealLifeTile', reason: 'A keepsake changes hands' },
    tone: 'green', icon: 'space:sticky-fingers', tier: STANDARD_UP,
  },
  {
    id: 'fr-safe-cashback', kind: 'normal', title: 'Cashback Bonus',
    description: 'The bank card\'s cashback scheme, joined by accident, finally adds up to something real.',
    effect: { type: 'gainMoney', amount: 900, reason: 'Cashback bonus' },
    tone: 'green', icon: 'space:cashback-bonus', tier: LONG_ONLY,
  },
  {
    id: 'fr-safe-refund', kind: 'normal', title: 'Tax Refund',
    description: 'A tax refund shows up right when you had forgotten to expect it, with a letter explaining itself at length.',
    effect: { type: 'gainMoney', amount: 1_400, reason: 'Tax refund' },
    tone: 'green', icon: 'space:refund-check', tier: EVERY_BOARD,
  },
  {
    id: 'fr-safe-wool-sock', kind: 'normal', title: 'The Wool Sock',
    description: 'The wool sock at the back of the drawer — the oldest bank in France, as every grandmother will confirm — turns out to have quietly grown.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'The sock pays out' },
    tone: 'green', icon: 'space:quiet-savings', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'fr-safe-payday-2', 'Another 28th, another quiet transfer. This is the whole idea.'),
  {
    id: 'fr-safe-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'The steady half of your portfolio posts its steady little cheque, plus a shareholder voucher for the motorway café.',
    effect: { type: 'stockDividend', perShare: 2_500, reason: 'Quarterly dividend' },
    tone: 'green', icon: 'space:dividend-day', tier: EVERY_BOARD,
  },
  {
    id: 'fr-safe-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'Late is better than never, and the broker is delighted to unroll the laminated folder for you again.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'green', icon: 'finance:insurance-office', tier: LONG_ONLY,
  },
  flavour(LONG_ONLY, 'fr-safe-fete', 'The Village Fête', 'Bunting, folding tables, a brass band of variable enthusiasm, and a tombola nobody expected to enjoy this much.', 'green', 'space:neighborhood-bbq', {
    from: 'hard',
    description: 'Bunting, folding tables, a brass band — and you, it turns out, are this year\'s committee, which means the marquee deposit is yours.',
    effect: { type: 'payMoney', amount: 700, reason: 'The marquee deposit' },
  }),
]

/** The Sunset Years: the sharpest material on the board, played warm. */
const SUNSET_YEARS: readonly SpaceContent[] = [
  {
    id: 'fr-sunset-number', kind: 'stop', title: 'The Number',
    description: 'The back of an envelope fills with arithmetic: what you would need to stop now, early, on your own terms, before anyone can reform the age again. The number is smaller than you feared, and it does not withdraw itself.',
    effect: { type: 'retireEarly' },
    tone: 'gold', icon: 'space:retirement-fund', tier: EVERY_BOARD,
  },
  {
    id: 'fr-sunset-upgrade', kind: 'normal', title: 'Home Upgrade',
    description: 'The agent calls about something brighter, higher, and just about within reach — the top floor has come free, and the top floor has a view.',
    effect: { type: 'upgradeHouse' },
    tone: 'slate', icon: 'space:home-upgrade', tier: EVERY_BOARD,
  },
  {
    id: 'fr-sunset-fire', kind: 'normal', title: 'House Fire',
    description: 'A pan, a tea towel, one distracted phone call, and a kitchen that needs rebuilding from the tiles up.',
    effect: { type: 'payMoney', amount: 12_000, reason: 'Fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: EVERY_BOARD,
  },
  setback('veryHard', STANDARD_UP, 'fr-sunset-chimney', 'Chimney Fire',
    'A jackdaw nest, the first cold night, and a chimney breast that has to come out of a three-hundred-year-old wall and go back in again.',
    { type: 'payMoney', amount: 16_000, reason: 'Chimney fire damage', hazard: 'fire' },
    'slate', 'space:house-fire'),
  setback('hard', EVERY_BOARD, 'fr-sunset-care', 'Care Costs',
    'Somebody who once carried you now needs carrying, and the retirement home\'s waitlist is longer than its brochure. You would never count the cost. The invoice counts it anyway.',
    { type: 'payMoney', amount: 20_000, reason: 'Caring for family' },
    'slate', 'space:family-portrait'),
  {
    id: 'fr-sunset-workshop', kind: 'normal', title: 'Workshop Fire',
    description: 'The barn full of materials for the guest-house conversion goes up in eleven minutes flat, along with the guest-house conversion.',
    effect: { type: 'payMoney', amount: 7_000, reason: 'Workshop fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'fr-sunset-bollard', kind: 'normal', title: 'The New Bollard',
    description: 'The village installs a heritage-grade granite bollard where no bollard has ever stood, and you formally introduce the rear bumper to it twice in one month.',
    effect: { type: 'payMoney', amount: 3_800, reason: 'Rear bumper, again', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  payday(EVERY_BOARD, 'fr-sunset-payday-1', 'One of your very last pay packets lands.'),
  {
    id: 'fr-sunset-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'Decades of never once selling pay out, share by share, all at once.',
    effect: { type: 'stockDividend', perShare: 4_000, reason: 'Annual dividend' },
    tone: 'slate', icon: 'space:dividend-day', tier: STANDARD_UP,
  },
  {
    id: 'fr-sunset-swap', kind: 'normal', title: 'Rival Swap',
    description: 'One final audacious deal over the digestifs, and the leader watches their fortune fold its napkin and leave with you.',
    effect: { type: 'swapMoneyWithLeader', reason: 'The eleventh-hour swap' },
    tone: 'slate', icon: 'space:rival-swap', tier: EVERY_BOARD,
  },
  {
    id: 'fr-sunset-children-visit', kind: 'normal', title: 'The Children Visit',
    description: 'Every grown-up child arrives for Sunday lunch with a tart from the good bakery, and quietly leaves an envelope under the box.',
    effect: { type: 'collectPerChild', amount: 4_000, reason: 'An envelope from each child' },
    tone: 'slate', icon: 'space:child-benefit', tier: EVERY_BOARD,
  },
  {
    id: 'fr-sunset-fund', kind: 'normal', title: 'Fund Blows Up',
    description: 'You retired early on one clever fund, and this is the quarter the clever fund issues a letter that begins with an apology.',
    effect: { type: 'payMoney', amount: 16_000, reason: 'The fund you retired on' },
    tone: 'slate', icon: 'space:market-crash', tier: STANDARD_UP,
  },
  {
    id: 'fr-sunset-sticky', kind: 'normal', title: 'Sticky Fingers',
    description: 'Over the good brandy, you begin talking the front-runner out of their finest story.',
    effect: { type: 'stealLifeTile', reason: 'A story changes hands' },
    tone: 'slate', icon: 'space:sticky-fingers', tier: EVERY_BOARD,
  },
  {
    id: 'fr-sunset-last-title', kind: 'normal', title: 'One Last Title',
    description: 'One more title before the door, if they can be persuaded. Spin, and let the last review of your life decide it.',
    effect: { type: 'promotion', reason: 'The last review of your life' },
    tone: 'slate', icon: 'space:big-promotion', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'fr-sunset-payday-2', 'You stopped counting the paydays years ago; the 28th has not.'),
  {
    id: 'fr-sunset-farewell', kind: 'normal', title: 'The Farewell Tour',
    description: 'Every department insists on throwing you a leaving toast, and every department insists on paying.',
    effect: { type: 'collectFromEach', amount: 3_000, reason: 'Leaving gifts' },
    tone: 'slate', icon: 'space:surprise-bonus', tier: STANDARD_UP,
  },
  {
    id: 'fr-sunset-tombola', kind: 'normal', title: 'The Tombola',
    description: 'You run the fête\'s tombola, and the takings are far better than anybody, including the brass band, predicted.',
    effect: { type: 'gainMoney', amount: 1_100, reason: 'Tombola takings' },
    tone: 'green', icon: 'space:garage-sale', tier: LONG_ONLY,
  },
  {
    id: 'fr-sunset-attic-sale', kind: 'normal', title: 'The Attic Sale',
    description: 'You take a table at the village attic sale, and strangers pay real money for the things you nearly threw away.',
    effect: { type: 'gainMoney', amount: 700, reason: 'Attic sale takings' },
    tone: 'green', icon: 'space:yard-sale', tier: LONG_ONLY,
  },
  {
    id: 'fr-sunset-bric-a-brac', kind: 'normal', title: 'The Bric-a-Brac Stall',
    description: 'A dealer goes very quiet at one of your boxes and asks, too casually, where the clock came from — spin for the appraisal.',
    effect: { type: 'spinForMoney', perPip: 900, reason: 'The appraisal' },
    tone: 'slate', icon: 'space:garage-sale', tier: LONG_ONLY,
  },
  {
    id: 'fr-sunset-sit-down', kind: 'normal', title: 'The Sit-Down',
    description: 'You both go through a year of the joint account at the kitchen table, and one of you has some explaining to do about a very nice coat.',
    effect: { type: 'household', reason: 'A year of the joint account, gone through properly' },
    tone: 'purple', icon: 'space:quiet-savings', tier: LONG_ONLY,
  },
  {
    id: 'fr-sunset-last-ticket', kind: 'normal', title: 'One Last Ticket',
    description: 'One final ticket from the lucky tobacconist on the way out the door — spin for the payout.',
    effect: { type: 'spinForMoney', perPip: 3_500, reason: 'One last ticket' },
    tone: 'slate', icon: 'space:lottery-ticket', tier: STANDARD_UP,
  },
  setback('veryHard', EVERY_BOARD, 'fr-sunset-final-tax', 'Final Tax Bill',
    'One last envelope from the tax office arrives before the office door closes behind you for good.',
    { type: 'payMoney', amount: 22_000, reason: 'Final tax bill' },
    'slate', 'space:refund-check'),
  flavour(EVERY_BOARD, 'fr-sunset-ahead', 'Sunset Ahead', 'The plane trees along the old road flicker past in the evening light, the way they have every evening you were too busy to look.', 'slate', 'space:sunset-ahead'),
]

const RETIREMENT: SpaceContent = {
  id: 'fr-retirement', kind: 'retirement', title: 'Retirement Day',
  description: 'The leaving toast to end them all, one round of the office with a cardboard box, and the first Monday in forty years with nowhere to be. The pension you spent a lifetime defending is, at last, yours.',
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
    summary: 'Two years of ferocious cramming, one national exam, and the bill for the grande école it wins you — due up front, in full, before you have earned a euro. What the diploma buys is a ladder that mostly goes up, and a network that never stops taking your calls.',
  },
  spaces: [...GRANDE_ECOLE_LANE, GRAD_FAIR],
}

const WORK_BRANCH: RouteBranch = {
  identity: {
    name: 'Straight to Work',
    summary: 'The trade school signs you to a patron while the prépa students are still buying flashcards. Paid from day one, no safety net, and a trade ladder whose bottom rung is grim and whose top rung out-earns every diploma at this table.',
  },
  spaces: WORK_LANE,
}

const PERMANENT_BRANCH: RouteBranch = {
  identity: {
    name: 'The Permanent Contract',
    summary: 'Stay. The CDI — the permanent contract, the castle of French working life — advances your pay by seniority, pays a thirteenth month every December, and decides, in return, where you live.',
  },
  spaces: PERMANENT_CONTRACT_ROAD,
}

const HOPPER_BRANCH: RouteBranch = {
  identity: {
    name: 'Job-Hopper Alley',
    summary: 'Leave. You sign the negotiated exit, take the severance, and draw fresh from the whole salary table — glorious if you drew badly the first time, and a real risk if you did not.',
  },
  spaces: JOB_HOPPER_ALLEY,
}

const FAMILY_BRANCH: RouteBranch = {
  identity: {
    name: 'Family Lane',
    summary: 'School lists, the conservatoire, and a house full of noise, with the benefits office paying in monthly and every grown-up child at Sunday lunch at the end. Far fewer paydays, and every bill arrives multiplied.',
  },
  spaces: FAMILY_LANE,
}

const EXECUTIVE_BRANCH: RouteBranch = {
  identity: {
    name: 'The Executive Track',
    summary: 'Pass cadre and the overtime stops being counted, which is not the same as stopping. The raises, the bonuses and the long table are real; the life you might have had is itemised separately.',
  },
  spaces: EXECUTIVE_TRACK,
}

const SPECULATION_BRANCH: RouteBranch = {
  identity: {
    name: 'Speculation Street',
    summary: 'Startups, margin, and a broker with beautiful cufflinks. Whoever is behind at the notary\'s should be here; whoever is ahead should think hard about it.',
  },
  spaces: SPECULATION_STREET,
}

const PRUDENCE_BRANCH: RouteBranch = {
  identity: {
    name: 'Prudence Street',
    summary: 'The savings booklet, the loyalty card, the wool sock at the back of the drawer. Nobody ever got rich down here, or ruined — which is worth a great deal if you are already winning.',
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
