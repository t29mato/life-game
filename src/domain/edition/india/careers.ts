import type { Career } from '../../model/types'

/**
 * India's careers, as ladders — which is where the entrance-exam economy
 * actually lives.
 *
 * The two pools are the country's oldest argument, sharpened by where they are
 * dealt from:
 * - **Graduate ladders** are what the exam bought — short, dependable, and
 *   arguably half of them are the same job at different companies, which is
 *   true to campus-placement hiring and worth playing straight. You will never
 *   scrape by, and you will never run anything.
 * - **Basic ladders** are the trades — long, unvetted, with rungs at both
 *   ends. The bottom is grim, the top out-earns every graduate at the table,
 *   and which one you get is the gamble the lane is supposed to be. The chai
 *   stall that stays a chai stall and the dosa griddle that becomes a highway
 *   dhaba are both in the deal.
 *
 * Every number is the tuned USA ladder at ×100 — same salaries, same raise
 * steps, same `payPerPip` slots, same two promotion difficulties — because the
 * shape of the two pools *is* the measured balance of the opening fork, and
 * the unit is the only thing a country is allowed to change about it. What is
 * Indian here is which trade sits on which rung, and every word of the copy.
 *
 * Two per pool are callings: no rung above, and a layoff cannot touch them —
 * the cricket coach on the dust ground and the farmer in the wheat were never
 * on anybody's ladder to begin with.
 */

/**
 * How hard each step up is, in spins: the first climb lands seven times in
 * ten, the last three — getting off the bottom is normal, getting to the top
 * is not. Same two numbers as every edition, because they are the engine's
 * statement about ladders, not a country's.
 */
const FIRST_STEP = 3 as const
const TOP_STEP = 5 as const

/**
 * Trades open from the first job onward, no degree needed — plus every rung
 * above.
 *
 * The volatile pool, twice over: the draw runs from a chai stall to a
 * builder's office, and the tallest ladders take two reviews nobody is
 * promised. The `payPerPip` rungs are the trades whose weeks genuinely differ
 * — a chaat cart's evening crowd, a delivery rider's surge hours, a wedding
 * photographer's season — and `salary` is exactly `payPerPip × 3.5` so the
 * wage the panel quotes is what the job really pays over a game.
 */
export const BASIC_CAREERS: readonly Career[] = [
  // --- the parlour ---------------------------------------------------------
  {
    id: 'career-in-parlour-apprentice',
    title: 'Parlour Apprentice',
    salary: 2_975_000,
    payPerPip: 850_000,
    raiseStep: 310_000,
    requiresDegree: false,
    icon: 'career:salon-apprentice',
    description: 'Two years of holding the hairdryer and sweeping the floor before anyone hands you scissors, and threading practice on your own patient sister.',
    promotesTo: 'career-in-beautician',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-beautician',
    title: 'Beautician',
    salary: 4_935_000,
    payPerPip: 1_410_000,
    raiseStep: 520_000,
    requiresDegree: false,
    icon: 'career:salon-owner',
    description: 'Has a chair, a November diary that filled in July, and brides who will cross the whole city for nobody else\'s hands.',
    promotesTo: 'career-in-bridal-salon-owner',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-in-bridal-salon-owner',
    title: 'Bridal Salon Owner',
    salary: 10_465_000,
    payPerPip: 2_990_000,
    raiseStep: 1_060_000,
    requiresDegree: false,
    icon: 'career:salon-owner',
    description: 'Runs the salon every wedding in three neighbourhoods books first. The season is four months long and pays for all twelve.',
  },
  // --- the sweet shop ------------------------------------------------------
  {
    id: 'career-in-sweet-shop-apprentice',
    title: 'Sweet-Shop Apprentice',
    salary: 3_200_000,
    raiseStep: 340_000,
    requiresDegree: false,
    icon: 'career:sweet-maker',
    description: 'In at four, out at ten, and not yet allowed near the syrup. Boiling the milk right, you are told, is the whole job for now.',
    promotesTo: 'career-in-sweet-maker',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-sweet-maker',
    title: 'Sweet Maker',
    salary: 5_000_000,
    raiseStep: 520_000,
    requiresDegree: false,
    icon: 'career:pastry-chef',
    description: 'Stands the vats, reads the sugar, and can tell by the smell of the ghee alone exactly when to stop talking and check the pan.',
    promotesTo: 'career-in-sweet-shop-owner',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-in-sweet-shop-owner',
    title: 'Sweet-Shop Owner',
    salary: 8_200_000,
    raiseStep: 840_000,
    requiresDegree: false,
    icon: 'career:pastry-chef',
    description: 'One counter, one recipe nobody has ever extracted, and a festival-week queue the police politely help to manage.',
  },
  // --- the griddle ---------------------------------------------------------
  {
    id: 'career-in-dosa-griddle-cook',
    title: 'Dosa Griddle Cook',
    salary: 5_495_000,
    payPerPip: 1_570_000,
    raiseStep: 560_000,
    requiresDegree: false,
    icon: 'career:line-cook',
    description: 'One four-foot griddle, six batters, and an office-lunch rush that decides what the week was worth.',
    promotesTo: 'career-in-chaat-cart-owner',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-chaat-cart-owner',
    title: 'Chaat Cart Owner',
    salary: 6_825_000,
    payPerPip: 1_950_000,
    raiseStep: 700_000,
    requiresDegree: false,
    icon: 'career:food-truck-owner',
    description: 'Parks the cart by the market at five and turns the evening crowd into a small festival. The queue is the wheel.',
    promotesTo: 'career-in-dhaba-owner',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-in-dhaba-owner',
    title: 'Highway Dhaba Owner',
    salary: 12_110_000,
    payPerPip: 3_460_000,
    raiseStep: 1_240_000,
    requiresDegree: false,
    icon: 'career:food-truck-owner',
    description: 'Forty string cots, one uncompromising dal, and every truck driver on the national highway knows exactly when your kitchen opens.',
  },
  // --- the building site ---------------------------------------------------
  {
    id: 'career-in-site-labourer',
    title: 'Site Labourer',
    salary: 4_800_000,
    raiseStep: 500_000,
    requiresDegree: false,
    icon: 'career:site-labourer',
    description: 'Carries the headload up nine floors of scaffolding, knows where every tool on the site actually is, and is the only one the crane operator trusts.',
    promotesTo: 'career-in-site-supervisor',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-site-supervisor',
    title: 'Site Supervisor',
    salary: 6_400_000,
    raiseStep: 660_000,
    requiresDegree: false,
    icon: 'career:construction-foreman',
    description: 'Runs the morning muster, the attendance register, and the standing argument with the cement supplier.',
    promotesTo: 'career-in-building-contractor',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-in-building-contractor',
    title: 'Building Contractor',
    salary: 10_800_000,
    raiseStep: 1_100_000,
    requiresDegree: false,
    icon: 'career:construction-foreman',
    description: 'Turns rolled-up blueprints into towers that survive the monsoon, and prices the job before the architect finishes the sentence.',
  },
  // --- the delivery hub ----------------------------------------------------
  {
    id: 'career-in-delivery-rider',
    title: 'Delivery Rider',
    salary: 3_185_000,
    payPerPip: 910_000,
    raiseStep: 330_000,
    requiresDegree: false,
    icon: 'career:delivery-courier',
    description: 'Threads a scooter through traffic the app calls "moderate", and knows which building\'s lift is broken before the customer does. Surge hours are the wheel.',
    promotesTo: 'career-in-hub-dispatcher',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-hub-dispatcher',
    title: 'Hub Dispatcher',
    salary: 4_800_000,
    raiseStep: 500_000,
    requiresDegree: false,
    icon: 'career:dispatcher',
    description: 'Off the scooter and onto the dashboard, where every rider in the zone is a dot with a name and a family.',
    promotesTo: 'career-in-logistics-lead',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-in-logistics-lead',
    title: 'Logistics Lead',
    salary: 7_800_000,
    raiseStep: 800_000,
    requiresDegree: false,
    icon: 'career:logistics-lead',
    description: 'Moves a festival sale\'s worth of parcels through the night sort and is home before the milk van notices how.',
  },
  // --- the garage ----------------------------------------------------------
  {
    id: 'career-in-garage-apprentice',
    title: 'Garage Apprentice',
    salary: 3_500_000,
    raiseStep: 360_000,
    requiresDegree: false,
    icon: 'career:apprentice-mechanic',
    description: 'Three years of fetching the fourteen-millimetre spanner for the master, and a growing suspicion the scooters can hear him coming.',
    promotesTo: 'career-in-scooter-mechanic',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-scooter-mechanic',
    title: 'Scooter Mechanic',
    salary: 5_200_000,
    raiseStep: 540_000,
    requiresDegree: false,
    icon: 'career:mechanic',
    description: 'Hears what a delivery scooter is complaining about before its rider finishes describing the noise.',
    promotesTo: 'career-in-garage-owner',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-in-garage-owner',
    title: 'Garage Owner',
    salary: 8_600_000,
    raiseStep: 880_000,
    requiresDegree: false,
    icon: 'career:workshop-owner',
    description: 'Four pits, a monsoon-season waiting list, and a wall of photographs of motorcycles that arrived on the back of a truck.',
  },
  // --- the studio ----------------------------------------------------------
  {
    id: 'career-in-session-player',
    title: 'Session Player',
    salary: 2_625_000,
    payPerPip: 750_000,
    raiseStep: 280_000,
    requiresDegree: false,
    icon: 'career:session-musician',
    description: 'Plays the flute line on a film song the whole country has hummed without ever reading the credits, and waits by the phone between them.',
    promotesTo: 'career-in-wedding-band-leader',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-wedding-band-leader',
    title: 'Wedding Band Leader',
    salary: 4_410_000,
    payPerPip: 1_260_000,
    raiseStep: 460_000,
    requiresDegree: false,
    icon: 'career:brass-musician',
    description: 'Leads the brass down the middle of the road in a white-and-gold uniform, and the season\'s bookings are the wheel.',
    promotesTo: 'career-in-music-director',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-in-music-director',
    title: 'Music Director',
    salary: 8_155_000,
    payPerPip: 2_330_000,
    raiseStep: 840_000,
    requiresDegree: false,
    icon: 'career:record-producer',
    description: 'Sits behind the glass, says "again, but with more longing", and is somehow always right.',
  },
  // --- the microphone ------------------------------------------------------
  {
    id: 'career-in-radio-runner',
    title: 'Radio Runner',
    salary: 3_700_000,
    raiseStep: 380_000,
    requiresDegree: false,
    icon: 'career:radio-runner',
    description: 'Fetches the chai, cues the guest, screens the callers, and quietly learns how a whole show is built.',
    promotesTo: 'career-in-radio-jockey',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-radio-jockey',
    title: 'Radio Jockey',
    salary: 5_700_000,
    raiseStep: 580_000,
    requiresDegree: false,
    icon: 'career:radio-host',
    description: 'Takes dedications from truck drivers and sleepless students at two in the morning, and is loved nationwide without ever being seen.',
    promotesTo: 'career-in-station-director',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-in-station-director',
    title: 'Station Director',
    salary: 9_700_000,
    raiseStep: 980_000,
    requiresDegree: false,
    icon: 'career:station-owner',
    description: 'Runs eleven shows, still hosts one of them under a stage name, and sells the sponsor slots for all twelve.',
  },
  // --- the camera ----------------------------------------------------------
  {
    id: 'career-in-second-shooter',
    title: 'Second Shooter',
    salary: 2_625_000,
    payPerPip: 750_000,
    raiseStep: 280_000,
    requiresDegree: false,
    icon: 'career:photographer',
    description: 'Covers the back of the wedding hall and the exact moment the bride\'s father stops pretending not to cry.',
    promotesTo: 'career-in-wedding-photographer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-wedding-photographer',
    title: 'Wedding Photographer',
    salary: 4_305_000,
    payPerPip: 1_230_000,
    raiseStep: 440_000,
    requiresDegree: false,
    icon: 'career:photographer',
    description: 'November to February is booked two years out and July is silence — the diary is the wheel, and the wedding season decides the year.',
  },
  // --- property ------------------------------------------------------------
  {
    id: 'career-in-rental-broker',
    title: 'Rental Broker',
    salary: 6_265_000,
    payPerPip: 1_790_000,
    raiseStep: 660_000,
    requiresDegree: false,
    icon: 'career:estate-agent',
    description: 'Shows eleven one-bedroom flats a Saturday, and remembers which one measured the "two minutes from the metro" at a sprint.',
    promotesTo: 'career-in-property-dealer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-property-dealer',
    title: 'Property Dealer',
    salary: 7_420_000,
    payPerPip: 2_120_000,
    raiseStep: 760_000,
    requiresDegree: false,
    icon: 'career:estate-agent',
    description: 'Sells the balcony first, the clubhouse second, and the ninety-minute commute never at all.',
    promotesTo: 'career-in-builder',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-in-builder',
    title: 'Builder',
    salary: 14_840_000,
    payPerPip: 4_240_000,
    raiseStep: 1_520_000,
    requiresDegree: false,
    icon: 'career:agency-owner',
    description: 'Your name is on hoardings above four flyovers. One good launch year carries three quiet ones.',
  },
  // --- the warehouse -------------------------------------------------------
  {
    id: 'career-in-warehouse-picker',
    title: 'Warehouse Picker',
    salary: 3_900_000,
    raiseStep: 400_000,
    requiresDegree: false,
    icon: 'career:warehouse-picker',
    description: 'Walks eleven miles a shift past the same conveyor belt, and could find aisle forty in a power cut.',
    promotesTo: 'career-in-warehouse-lead',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-warehouse-lead',
    title: 'Warehouse Lead',
    salary: 5_600_000,
    raiseStep: 580_000,
    requiresDegree: false,
    icon: 'career:warehouse-picker',
    description: 'Keeps a building the size of four cricket grounds running on cutting chai and clipboards through the festival sale.',
  },
  // --- the chai stall ------------------------------------------------------
  {
    id: 'career-in-chai-stall-helper',
    title: 'Chai Stall Helper',
    salary: 2_400_000,
    raiseStep: 260_000,
    requiresDegree: false,
    icon: 'career:chai-wallah',
    description: 'Washes the glasses, runs the tray to four offices, and can carry six teas up a staircase without a tray at all.',
    promotesTo: 'career-in-chai-stall-owner',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-chai-stall-owner',
    title: 'Chai Stall Owner',
    salary: 3_400_000,
    raiseStep: 360_000,
    requiresDegree: false,
    icon: 'career:chai-wallah',
    description: 'Boils the same perfect tea a thousand times a day outside an office tower, and knows more about the company than its board does.',
  },
  // --- callings ------------------------------------------------------------
  {
    id: 'career-in-cricket-coach',
    title: 'Cricket Academy Coach',
    salary: 5_000_000,
    raiseStep: 640_000,
    requiresDegree: false,
    icon: 'career:cricket-coach',
    description: 'Runs dawn nets on a dust ground, feeds the ball machine by hand, and remembers every single cover drive. There is no promotion from this and there was never going to be.',
    isCalling: true,
  },
  {
    id: 'career-in-farmer',
    title: 'Farmer',
    salary: 5_800_000,
    raiseStep: 740_000,
    requiresDegree: false,
    icon: 'career:wheat-farmer',
    description: 'Grows the wheat the whole district\'s market opens for, and has turned down the land developers three times, each more finally than the last.',
    isCalling: true,
  },
]

/**
 * Careers unlocked only by a degree — what the entrance exam was for.
 *
 * Two rungs, a tight entry band, a tight top band, and a first climb that
 * lands four times in six: a graduate almost always ends the game running a
 * good career and almost never anything bigger. Losing one hurts far more
 * than losing a trade, because a layoff costs the ladder as well as the wage.
 *
 * Dependable extends to how they are paid: the surgeon, the district collector
 * and the bank officer are on scales and grades, and none carry `payPerPip`.
 * The one exception is the screenwriting ladder, paid by the ratings — a
 * degree cannot make a serial survive its Thursday numbers.
 */
export const GRADUATE_CAREERS: readonly Career[] = [
  {
    id: 'career-in-medical-resident',
    title: 'Medical Resident',
    salary: 6_400_000,
    raiseStep: 620_000,
    requiresDegree: true,
    icon: 'career:surgeon',
    description: 'Cleared the medical entrance on the second attempt, and now works nights at the government hospital where the queue starts before the building opens.',
    promotesTo: 'career-in-hospital-surgeon',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-hospital-surgeon',
    title: 'Hospital Surgeon',
    salary: 7_900_000,
    raiseStep: 820_000,
    requiresDegree: true,
    icon: 'career:surgeon',
    description: 'Saves lives with steady hands, an even steadier nerve, and an out-patient line that thinks of you as family.',
  },
  {
    id: 'career-in-junior-advocate',
    title: 'Junior Advocate',
    salary: 6_600_000,
    raiseStep: 640_000,
    requiresDegree: true,
    icon: 'career:corporate-lawyer',
    description: 'Carries the senior\'s files up the High Court steps, drafts the nine hundred pages, and waits years for the one paragraph that is yours.',
    promotesTo: 'career-in-high-court-advocate',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-high-court-advocate',
    title: 'High Court Advocate',
    salary: 8_100_000,
    raiseStep: 840_000,
    requiresDegree: true,
    icon: 'career:corporate-lawyer',
    description: 'Wins the courtroom with a sharp black gown, a sharper citation, and a talent for the adjournment nobody saw coming.',
  },
  {
    id: 'career-in-architectural-assistant',
    title: 'Architectural Assistant',
    salary: 6_000_000,
    raiseStep: 580_000,
    requiresDegree: true,
    icon: 'career:architect',
    description: 'Draws the staircase detail eleven times for a house on a plot the width of a parked car, and learns more from the eleventh than the first ten.',
    promotesTo: 'career-in-architect',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-architect',
    title: 'Architect',
    salary: 7_100_000,
    raiseStep: 740_000,
    requiresDegree: true,
    icon: 'career:architect',
    description: 'Pours a courtyard into an impossible plot and makes six square metres of verandah feel like a village morning.',
  },
  {
    id: 'career-in-software-trainee',
    title: 'Software Trainee',
    salary: 6_200_000,
    raiseStep: 600_000,
    requiresDegree: true,
    icon: 'career:software-engineer',
    description: 'Three months of training campus, one badge, and a first project everyone calls "support" and nobody calls simple.',
    promotesTo: 'career-in-software-engineer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-software-engineer',
    title: 'Software Engineer',
    salary: 7_500_000,
    raiseStep: 780_000,
    requiresDegree: true,
    icon: 'career:software-engineer',
    description: 'Takes the eleven-thirty call with the client\'s time zone, ships the release, and keeps half the world\'s back office quietly humming.',
  },
  {
    id: 'career-in-associate-product-manager',
    title: 'Associate Product Manager',
    salary: 5_800_000,
    raiseStep: 560_000,
    requiresDegree: true,
    icon: 'career:product-manager',
    description: 'Writes user stories for a Bengaluru app for four months, then watches a stranger on the metro use the feature without reading a word.',
    promotesTo: 'career-in-product-manager',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-product-manager',
    title: 'Product Manager',
    salary: 6_700_000,
    raiseStep: 700_000,
    requiresDegree: true,
    icon: 'career:product-manager',
    description: 'Owns a roadmap, a metric, and a meeting that could have been an email but is instead your entire Tuesday.',
  },
  {
    id: 'career-in-propulsion-graduate',
    title: 'Junior Propulsion Engineer',
    salary: 6_200_000,
    raiseStep: 600_000,
    requiresDegree: true,
    icon: 'career:rocket-engineer',
    description: 'Spends a year testing one valve for the space programme, and considers it — correctly — time well spent.',
    promotesTo: 'career-in-spacecraft-engineer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-spacecraft-engineer',
    title: 'Spacecraft Engineer',
    salary: 7_300_000,
    raiseStep: 760_000,
    requiresDegree: true,
    icon: 'career:rocket-engineer',
    description: 'Lands a spacecraft on a budget other agencies spend on the launch party, and answers the same question at every family gathering.',
  },
  {
    id: 'career-in-bank-probationary-officer',
    title: 'Bank Probationary Officer',
    salary: 6_400_000,
    raiseStep: 620_000,
    requiresDegree: true,
    icon: 'career:bank-officer',
    description: 'Beat a million applicants to the officer\'s exam, and now learns the branch from the cash counter up, one transferred posting at a time.',
    promotesTo: 'career-in-bank-branch-manager',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-bank-branch-manager',
    title: 'Bank Branch Manager',
    salary: 7_700_000,
    raiseStep: 800_000,
    requiresDegree: true,
    icon: 'career:bank-officer',
    description: 'Runs the branch every shopkeeper on the road banks at, and is invited to more weddings than any relative you have.',
  },
  {
    id: 'career-in-civil-service-probationer',
    title: 'Civil Service Probationer',
    salary: 6_000_000,
    raiseStep: 580_000,
    requiresDegree: true,
    icon: 'career:ministry-official',
    description: 'Gave three years of your twenties to one examination, cleared it on the attempt you had promised would be the last, and now learns to run a district the way you once studied for an exam.',
    promotesTo: 'career-in-district-collector',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-district-collector',
    title: 'District Collector',
    salary: 6_900_000,
    raiseStep: 720_000,
    requiresDegree: true,
    icon: 'career:ministry-official',
    description: 'Runs a district of three million people from a hundred-year-old office, and the morning queue outside it believes — mostly correctly — that you can fix anything.',
  },
  {
    id: 'career-in-research-assistant',
    title: 'Research Assistant',
    salary: 5_650_000,
    raiseStep: 540_000,
    requiresDegree: true,
    icon: 'career:marine-biologist',
    description: 'Counts things in wet grass at dawn for somebody else\'s paper, and loves every minute of it.',
    promotesTo: 'career-in-tiger-reserve-biologist',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-tiger-reserve-biologist',
    title: 'Tiger Reserve Biologist',
    salary: 6_300_000,
    raiseStep: 660_000,
    requiresDegree: true,
    icon: 'career:marine-biologist',
    description: 'Studies the reserve the whole country queues for, and is on first-name terms with one extremely photographed tigress.',
  },
  {
    id: 'career-in-writers-room-assistant',
    title: 'Writers\' Room Assistant',
    salary: 5_495_000,
    payPerPip: 1_570_000,
    raiseStep: 520_000,
    requiresDegree: true,
    icon: 'career:writer',
    description: 'Drafts wedding scenes until four in the morning for a serial that never misses an episode, while the real script sits in a drawer.',
    promotesTo: 'career-in-tv-serial-writer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-in-tv-serial-writer',
    title: 'TV Serial Writer',
    salary: 6_475_000,
    payPerPip: 1_850_000,
    raiseStep: 680_000,
    requiresDegree: true,
    icon: 'career:writer',
    description: 'Serialised at last. The pay is a wheel, the Thursday ratings can cancel the whole show without warning, and the wedding episode is annual forever.',
  },
  // --- callings ------------------------------------------------------------
  {
    id: 'career-in-veterinarian',
    title: 'Veterinarian',
    salary: 6_800_000,
    raiseStep: 800_000,
    requiresDegree: true,
    icon: 'career:veterinarian',
    description: 'Talks a nervous farmer down while quietly setting a buffalo\'s leg, and would not trade the practice for any clinic chain you could name.',
    isCalling: true,
  },
  {
    id: 'career-in-university-professor',
    title: 'University Professor',
    salary: 6_600_000,
    raiseStep: 780_000,
    requiresDegree: true,
    icon: 'career:professor',
    description: 'Lectures on Tuesdays, argues in the staff room on Wednesdays, changes minds by Friday, and has turned down the dean\'s office twice.',
    isCalling: true,
  },
]
