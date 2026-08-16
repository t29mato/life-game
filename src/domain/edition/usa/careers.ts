import type { Career } from '../../model/types'

/**
 * Careers, as ladders rather than as jobs.
 *
 * The board used to deal a **Salon Owner** to somebody on their first morning
 * out of school, which is not a career, it is a lottery ticket with a job title
 * printed on it. A career here is a *rung*: the fair hires you onto the bottom
 * of a trade, and everything above it is climbed, one review and one spin at a
 * time. Apprentice, stylist, salon owner. Line cook, food truck, restaurant.
 * The ladder is written as a chain of `promotesTo`, and the bottom rung is
 * whichever one nothing points at — so an edition draws a trade by writing it
 * out in order, and nothing anywhere records a rung number that could go stale.
 *
 * What a degree is worth, and what it costs you, survives the rewrite intact —
 * but it is now told by the *shape of the ladders* rather than by two flat
 * bands of salary, which is a better way to tell it:
 *
 * - **Graduate ladders are short and start high.** Two rungs, entry
 *   $53.9k-$65k, top $62k-$80k, and the one climb lands seven times in ten. The
 *   degree buys a floor and a nearly certain ceiling: you will never scrape by,
 *   and you will never run anything. A whole graduate life — every rung of
 *   every ladder — fits in a $26,100 band.
 * - **Basic ladders are long and start low.** Mostly three rungs, entry
 *   $24k-$62.7k, top $34k-$148.5k, and the last climb lands three times in ten.
 *   The bottom is grim, the top beats every graduate job on the board by most
 *   of half again, and which one you get is the gamble the lane is supposed to
 *   be. The band is $124,500 wide — nearly five times the graduate one, and
 *   that ratio is measured, because it *is* Straight to Work's volatility.
 *
 * That is where Straight to Work's volatility now lives. It used to be the
 * width of a single draw; it is the width of a draw *and* how far up it you
 * climb, which is a life rather than a card.
 *
 * And two ladders in each pool are not ladders at all. See `CALLINGS` below.
 */

/**
 * How hard each step up is, in spins.
 *
 * A first promotion lands seven times in ten and a corner office three, which
 * is the entire statement the design makes about what a ladder is: getting off
 * the bottom is normal, getting to the top is not. Both are written on the
 * rung being *left*, so a ladder's difficulty is read off the ladder.
 */
const FIRST_STEP = 4 as const
const TOP_STEP = 8 as const

/**
 * Entry-level careers open from the very first job, no degree needed — plus
 * every rung above them.
 *
 * Deliberately the volatile pool, twice over. The draw is a gamble, because
 * the ladders run from a grooming table to a lettings agency; and the climb is
 * a gamble, because the tallest of them takes two successful reviews to reach
 * the top and nobody is promised either.
 *
 * Several rungs carry `payPerPip` and are paid by the wheel rather than by
 * contract, which is the third kind of volatility down here. The test is
 * whether the work itself genuinely has good weeks and bad ones: a food truck
 * in the rain, a courier's drops, a salon's diary, a session player waiting on
 * the phone, an agent's completions. A warehouse, a building site and a bakery
 * are on the rota whatever the week does, so they stay salaried — and the
 * courier's ladder crosses the line halfway up, because a dispatcher is paid
 * for being in the building and a courier is paid for turning up at doors.
 * `salary` is exactly `payPerPip × 5.5`, the average spin, so the wage the
 * panel quotes is what the job really pays over a game.
 */
export const BASIC_CAREERS: readonly Career[] = [
  // --- the salon -----------------------------------------------------------
  {
    id: 'career-salon-apprentice',
    title: 'Salon Apprentice',
    salary: 29_700,
    payPerPip: 5_400,
    raiseStep: 3_100,
    requiresDegree: false,
    icon: 'space:new-skills',
    description: 'Sweeps up, washes hair, and watches the good scissors like a hawk.',
    promotesTo: 'career-stylist',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-stylist',
    title: 'Stylist',
    salary: 49_500,
    payPerPip: 9_000,
    raiseStep: 5_200,
    requiresDegree: false,
    icon: 'career:salon-owner',
    description: 'Has a chair, a diary that fills three weeks out, and regulars who follow them anywhere.',
    promotesTo: 'career-salon-owner',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-salon-owner',
    title: 'Salon Owner',
    salary: 104_500,
    payPerPip: 19_000,
    raiseStep: 10_600,
    requiresDegree: false,
    icon: 'career:salon-owner',
    description: 'Runs a buzzing salon that never runs short on chatter or good haircuts.',
  },
  // --- the bakery ----------------------------------------------------------
  {
    id: 'career-commis-baker',
    title: 'Commis Baker',
    salary: 32_000,
    raiseStep: 3_400,
    requiresDegree: false,
    icon: 'space:new-skills',
    description: 'In at four, out at noon, and already better at laminating dough than anyone admits.',
    promotesTo: 'career-pastry-chef',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-pastry-chef',
    title: 'Pastry Chef',
    salary: 50_000,
    raiseStep: 5_200,
    requiresDegree: false,
    icon: 'career:pastry-chef',
    description: 'Fills the shop window with croissants people photograph before they eat.',
    promotesTo: 'career-head-pastry-chef',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-head-pastry-chef',
    title: 'Head Pastry Chef',
    salary: 82_000,
    raiseStep: 8_400,
    requiresDegree: false,
    icon: 'career:pastry-chef',
    description: 'Writes the menu, trains the room, and still tastes every batch before it goes out.',
  },
  // --- the street kitchen --------------------------------------------------
  {
    id: 'career-line-cook',
    title: 'Line Cook',
    salary: 55_000,
    payPerPip: 10_000,
    raiseStep: 5_600,
    requiresDegree: false,
    icon: 'space:overtime-shift',
    description: 'Six burners, one ticket rail, and a lunch rush that decides what the week was worth.',
    promotesTo: 'career-food-truck-owner',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-food-truck-owner',
    title: 'Food Truck Owner',
    salary: 68_200,
    payPerPip: 12_400,
    raiseStep: 7_000,
    requiresDegree: false,
    icon: 'career:food-truck-owner',
    description: 'Parks in the perfect spot and turns lunch breaks into a small festival.',
    promotesTo: 'career-restaurant-owner',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-restaurant-owner',
    title: 'Restaurant Owner',
    salary: 121_000,
    payPerPip: 22_000,
    raiseStep: 12_400,
    requiresDegree: false,
    icon: 'career:food-truck-owner',
    description: 'Forty tables a night, one very good chili, and a booking line that rings at nine every morning.',
  },
  // --- the building site ---------------------------------------------------
  {
    id: 'career-site-labourer',
    title: 'Site Laborer',
    salary: 48_000,
    raiseStep: 5_000,
    requiresDegree: false,
    icon: 'space:overtime-shift',
    description: 'Carries, digs, mixes and lifts, and knows where every tool on the site actually is.',
    promotesTo: 'career-site-supervisor',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-site-supervisor',
    title: 'Site Supervisor',
    salary: 64_000,
    raiseStep: 6_600,
    requiresDegree: false,
    icon: 'career:construction-foreman',
    description: 'Runs the morning briefing, the sign-in sheet, and the argument with the scaffolders.',
    promotesTo: 'career-construction-foreman',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-construction-foreman',
    title: 'Construction Foreman',
    salary: 108_000,
    raiseStep: 11_000,
    requiresDegree: false,
    icon: 'career:construction-foreman',
    description: 'Turns rolled-up blueprints into buildings, one steady beam at a time, and prices the job properly.',
  },
  // --- the depot -----------------------------------------------------------
  {
    id: 'career-delivery-courier',
    title: 'Delivery Courier',
    salary: 31_900,
    payPerPip: 5_800,
    raiseStep: 3_300,
    requiresDegree: false,
    icon: 'career:delivery-courier',
    description: 'Zips across town keeping the whole neighborhood fed and unboxed.',
    promotesTo: 'career-depot-dispatcher',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-depot-dispatcher',
    title: 'Depot Dispatcher',
    salary: 48_000,
    raiseStep: 5_000,
    requiresDegree: false,
    icon: 'space:overtime-shift',
    description: 'Off the bike and onto the board, where every van in the city is a magnet with a name on it.',
    promotesTo: 'career-distribution-lead',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-distribution-lead',
    title: 'Distribution Lead',
    salary: 78_000,
    raiseStep: 8_000,
    requiresDegree: false,
    icon: 'space:overtime-shift',
    description: 'Moves a hundred thousand packages a night and gets home before anyone notices how.',
  },
  // --- the workshop --------------------------------------------------------
  {
    id: 'career-apprentice-mechanic',
    title: 'Apprentice Mechanic',
    salary: 35_000,
    raiseStep: 3_600,
    requiresDegree: false,
    icon: 'space:new-skills',
    description: 'Three years holding the flashlight and handing over tools, and a growing suspicion they can hear engine trouble too.',
    promotesTo: 'career-motorcycle-mechanic',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-motorcycle-mechanic',
    title: 'Motorcycle Mechanic',
    salary: 52_000,
    raiseStep: 5_400,
    requiresDegree: false,
    icon: 'tile:vintage-motorcycle',
    description: 'Hears what a bike is complaining about before the owner finishes the sentence.',
    promotesTo: 'career-workshop-owner',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-workshop-owner',
    title: 'Workshop Owner',
    salary: 86_000,
    raiseStep: 8_800,
    requiresDegree: false,
    icon: 'tile:vintage-motorcycle',
    description: 'Four ramps, a waiting list, and a wall of photographs of bikes that came in on a trailer.',
  },
  // --- the studio ----------------------------------------------------------
  {
    id: 'career-session-musician',
    title: 'Session Musician',
    salary: 26_400,
    payPerPip: 4_800,
    raiseStep: 2_800,
    requiresDegree: false,
    icon: 'tile:indie-album',
    description: 'Plays the bass line you have hummed a hundred times without ever seeing the sleeve.',
    promotesTo: 'career-touring-player',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-touring-player',
    title: 'Touring Player',
    salary: 44_000,
    payPerPip: 8_000,
    raiseStep: 4_600,
    requiresDegree: false,
    icon: 'tile:indie-album',
    description: 'Nine countries, one gear case, and a name that is finally on the poster in small print.',
    promotesTo: 'career-record-producer',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-record-producer',
    title: 'Record Producer',
    salary: 81_400,
    payPerPip: 14_800,
    raiseStep: 8_400,
    requiresDegree: false,
    icon: 'tile:indie-album',
    description: 'Sits behind the glass, says "again, but happier", and is somehow always right.',
  },
  // --- the microphone ------------------------------------------------------
  {
    id: 'career-radio-runner',
    title: 'Radio Runner',
    salary: 37_000,
    raiseStep: 3_800,
    requiresDegree: false,
    icon: 'tile:podcast',
    description: 'Fetches the coffee, cues the guest, and quietly learns how a whole show is built.',
    promotesTo: 'career-podcast-host',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-podcast-host',
    title: 'Podcast Host',
    salary: 57_000,
    raiseStep: 5_800,
    requiresDegree: false,
    icon: 'tile:podcast',
    description: 'Turns three microphones and one very good question into a Tuesday habit for thousands.',
    promotesTo: 'career-network-owner',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-network-owner',
    title: 'Network Owner',
    salary: 97_000,
    raiseStep: 9_800,
    requiresDegree: false,
    icon: 'tile:podcast',
    description: 'Runs eleven shows, hosts one of them, and sells the ads for all twelve.',
  },
  // --- the camera ----------------------------------------------------------
  {
    id: 'career-second-shooter',
    title: 'Second Shooter',
    salary: 26_400,
    payPerPip: 4_800,
    raiseStep: 2_800,
    requiresDegree: false,
    icon: 'space:family-portrait',
    description: 'Covers the back of the church and the bit of the speech everyone else missed.',
    promotesTo: 'career-portrait-photographer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-portrait-photographer',
    title: 'Portrait Photographer',
    salary: 42_900,
    payPerPip: 7_800,
    raiseStep: 4_400,
    requiresDegree: false,
    icon: 'space:family-portrait',
    description: 'Gets everyone in the family to smile at the same moment, which is the whole trick.',
  },
  // --- property ------------------------------------------------------------
  {
    id: 'career-lettings-negotiator',
    title: 'Leasing Agent',
    salary: 62_700,
    payPerPip: 11_400,
    raiseStep: 6_600,
    requiresDegree: false,
    icon: 'space:apartment-hunt',
    description: 'Shows eleven apartments every Saturday and remembers which one had a mold problem.',
    promotesTo: 'career-real-estate-agent',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-real-estate-agent',
    title: 'Real Estate Agent',
    salary: 74_250,
    payPerPip: 13_500,
    raiseStep: 7_600,
    requiresDegree: false,
    icon: 'space:house-hunting',
    description: 'Sells the kitchen first, the yard second, and the commute never at all.',
    promotesTo: 'career-agency-owner',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-agency-owner',
    title: 'Agency Owner',
    salary: 148_500,
    payPerPip: 27_000,
    raiseStep: 15_200,
    requiresDegree: false,
    icon: 'space:house-hunting',
    description: 'Your name is on signs outside four hundred houses. One good year carries three quiet ones.',
  },
  // --- the warehouse -------------------------------------------------------
  {
    id: 'career-warehouse-picker',
    title: 'Warehouse Picker',
    salary: 39_000,
    raiseStep: 4_000,
    requiresDegree: false,
    icon: 'space:overtime-shift',
    description: 'Walks eleven miles a shift and could find aisle forty in the dark.',
    promotesTo: 'career-warehouse-lead',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-warehouse-lead',
    title: 'Warehouse Lead',
    salary: 56_000,
    raiseStep: 5_800,
    requiresDegree: false,
    icon: 'space:overtime-shift',
    description: 'Keeps a building the size of four football fields running on coffee and clipboards.',
  },
  // --- grooming ------------------------------------------------------------
  {
    id: 'career-grooming-assistant',
    title: 'Grooming Assistant',
    salary: 24_000,
    raiseStep: 2_600,
    requiresDegree: false,
    icon: 'career:pet-groomer',
    description: 'Towels, treats, and the nerve to hold still while a very large dog decides about you.',
    promotesTo: 'career-pet-groomer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-pet-groomer',
    title: 'Master Groomer',
    salary: 34_000,
    raiseStep: 3_600,
    requiresDegree: false,
    icon: 'career:pet-groomer',
    description: 'Turns shaggy rescue dogs into runway models, one bubble bath at a time.',
  },
  // --- callings ------------------------------------------------------------
  {
    id: 'career-youth-coach',
    title: 'Youth Soccer Coach',
    salary: 50_000,
    raiseStep: 6_400,
    requiresDegree: false,
    icon: 'tile:youth-coach',
    description: 'Runs Saturday drills, hands out orange slices, and remembers every single name. There is no promotion from this and there was never going to be.',
    isCalling: true,
  },
  {
    id: 'career-market-gardener',
    title: 'Market Gardener',
    salary: 58_000,
    raiseStep: 7_400,
    requiresDegree: false,
    icon: 'space:garden-harvest',
    description: 'Grows the tomatoes the whole farmers market lines up for by seven in the morning, and has turned down every offer to grow more of them.',
    isCalling: true,
  },
]

/**
 * Careers unlocked only after graduating, and the one rung above each.
 *
 * The dependable pool. Two rungs, a tight entry band and a tight top band, and
 * a single climb that lands seven times in ten: a graduate almost always ends
 * the game running a good career and almost never ends it running anything
 * bigger. Losing one of these hurts far more than losing a basic job, because
 * a layoff costs the ladder as well as the wage — which is what makes the
 * burnout and layoff tiles bite hardest on exactly the players who bought
 * their way past them.
 *
 * Dependable extends to *how* they are paid: a surgeon, a professor and an
 * architect are on a contract, and none of them carry `payPerPip`. The one
 * exception is the writing ladder, paid in royalties — a degree cannot make a
 * book sell — so a graduate can still choose an unsteady life if one is dealt.
 */
export const GRADUATE_CAREERS: readonly Career[] = [
  {
    id: 'career-surgical-resident',
    title: 'Surgical Resident',
    salary: 64000,
    raiseStep: 6_200,
    requiresDegree: true,
    icon: 'career:surgeon',
    description: 'Six years of nights, held retractors, and being asked what they would do next.',
    promotesTo: 'career-surgeon',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-surgeon',
    title: 'Surgeon',
    salary: 79000,
    raiseStep: 8_200,
    requiresDegree: true,
    icon: 'career:surgeon',
    description: 'Saves lives with steady hands and an even steadier nerve.',
  },
  {
    id: 'career-junior-associate',
    title: 'Junior Associate',
    salary: 66000,
    raiseStep: 6_400,
    requiresDegree: true,
    icon: 'career:corporate-lawyer',
    description: 'Reads nine hundred pages so a partner can read the one paragraph that matters.',
    promotesTo: 'career-corporate-lawyer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-corporate-lawyer',
    title: 'Corporate Lawyer',
    salary: 81000,
    raiseStep: 8_400,
    requiresDegree: true,
    icon: 'career:corporate-lawyer',
    description: 'Wins boardroom battles with a sharp briefcase and a sharper argument.',
  },
  {
    id: 'career-architectural-assistant',
    title: 'Architectural Assistant',
    salary: 60000,
    raiseStep: 5_800,
    requiresDegree: true,
    icon: 'career:architect',
    description: 'Draws the stair detail eleven times and learns more from the eleventh than the first ten.',
    promotesTo: 'career-architect',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-architect',
    title: 'Architect',
    salary: 71000,
    raiseStep: 7_400,
    requiresDegree: true,
    icon: 'career:architect',
    description: 'Sketches skylines that turn ordinary streets into landmarks.',
  },
  {
    id: 'career-junior-engineer',
    title: 'Junior Engineer',
    salary: 62000,
    raiseStep: 6_000,
    requiresDegree: true,
    icon: 'career:software-engineer',
    description: 'Fixes the small bug nobody else wanted, and finds the big one on the way.',
    promotesTo: 'career-software-engineer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-software-engineer',
    title: 'Software Engineer',
    salary: 75000,
    raiseStep: 7_800,
    requiresDegree: true,
    icon: 'career:software-engineer',
    description: 'Ships the quiet code that keeps half the internet humming.',
  },
  {
    id: 'career-junior-designer',
    title: 'Junior Designer',
    salary: 58000,
    raiseStep: 5_600,
    requiresDegree: true,
    icon: 'career:game-designer',
    description: 'Balances the tutorial level for four months and watches strangers get through it.',
    promotesTo: 'career-game-designer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-game-designer',
    title: 'Game Designer',
    salary: 67000,
    raiseStep: 7_000,
    requiresDegree: true,
    icon: 'career:game-designer',
    description: 'Builds worlds players stay up far too late exploring.',
  },
  {
    id: 'career-robotics-graduate',
    title: 'Robotics Graduate',
    salary: 62000,
    raiseStep: 6_000,
    requiresDegree: true,
    icon: 'tile:invention',
    description: 'Spends a year teaching an arm to pick up a sock, and considers it time well spent.',
    promotesTo: 'career-robotics-engineer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-robotics-engineer',
    title: 'Robotics Engineer',
    salary: 73000,
    raiseStep: 7_600,
    requiresDegree: true,
    icon: 'tile:invention',
    description: 'Builds arms that fold laundry, then spends a year teaching them about socks.',
  },
  {
    id: 'career-investment-analyst',
    title: 'Investment Analyst',
    salary: 64000,
    raiseStep: 6_200,
    requiresDegree: true,
    icon: 'finance:trading-floor',
    description: 'Builds the spreadsheet the whole desk argues over, and is right about half of it.',
    promotesTo: 'career-fund-manager',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-fund-manager',
    title: 'Fund Manager',
    salary: 77000,
    raiseStep: 8_000,
    requiresDegree: true,
    icon: 'finance:trading-floor',
    description: "Moves other people's money around a screen and is right slightly more often than not.",
  },
  {
    id: 'career-actuarial-trainee',
    title: 'Actuarial Trainee',
    salary: 60000,
    raiseStep: 5_800,
    requiresDegree: true,
    icon: 'finance:insurance-office',
    description: 'Fifteen exams, taken one at a time, in a room that smells of radiators.',
    promotesTo: 'career-insurance-actuary',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-insurance-actuary',
    title: 'Insurance Actuary',
    salary: 69000,
    raiseStep: 7_200,
    requiresDegree: true,
    icon: 'finance:insurance-office',
    description: 'Knows exactly how likely your roof is to blow off, and prices it before lunch.',
  },
  {
    id: 'career-research-assistant',
    title: 'Research Assistant',
    salary: 56500,
    raiseStep: 5_400,
    requiresDegree: true,
    icon: 'career:marine-biologist',
    description: 'Counts things in cold water for somebody else\'s paper, and loves every minute of it.',
    promotesTo: 'career-marine-biologist',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-marine-biologist',
    title: 'Marine Biologist',
    salary: 63000,
    raiseStep: 6_600,
    requiresDegree: true,
    icon: 'career:marine-biologist',
    description: 'Studies coral reefs and befriends the occasional curious dolphin.',
  },
  {
    id: 'career-jobbing-writer',
    title: 'Freelance Writer',
    salary: 55_000,
    payPerPip: 10_000,
    raiseStep: 5_200,
    requiresDegree: true,
    icon: 'tile:novel',
    description: 'Copy, catalogs and one column every two weeks, while the real thing sits in a drawer.',
    promotesTo: 'career-novelist',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-novelist',
    title: 'Novelist',
    salary: 64_900,
    payPerPip: 11_800,
    raiseStep: 6_800,
    requiresDegree: true,
    icon: 'tile:novel',
    description: "Writes the book people keep pressing into a friend's hands at parties.",
  },
  // --- callings ------------------------------------------------------------
  {
    id: 'career-veterinarian',
    title: 'Veterinarian',
    salary: 68000,
    raiseStep: 8_000,
    requiresDegree: true,
    icon: 'tile:animal-shelter',
    description: 'Talks nervous owners down while quietly setting a very small broken leg. Would never run a chain of these, no matter how much money was offered.',
    isCalling: true,
  },
  {
    id: 'career-university-professor',
    title: 'University Professor',
    salary: 66000,
    raiseStep: 7_800,
    requiresDegree: true,
    icon: 'space:cap-and-gown',
    description: 'Lectures on Tuesdays, argues with colleagues on Wednesdays, changes minds by Friday, and has turned down the dean\'s office twice.',
    isCalling: true,
  },
]
