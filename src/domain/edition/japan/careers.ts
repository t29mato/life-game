import type { Career } from '../../model/types'

/**
 * Japan's careers, as ladders — which is where 終身雇用 versus 転職 actually lives.
 *
 * The Japan proposal was written against flat salaries and mapped job for job;
 * careers became *ladders* since — a fair hires the bottom rung, a review tile
 * spins for the climb, a layoff costs the ladder as well as the wage — and that
 * machinery tells the Japanese story better than the mapping it replaced. The
 * long apprenticeship is the most Japanese career shape there is: years of
 * washing rice before anyone lets you near the fish is exactly what a
 * three-rung ladder with a hard top step *is*, so the ladders below are the
 * design doc's careers re-hung on the shapes the engine now speaks.
 *
 * Every number is the tuned USA ladder at ×100 — same salaries, same raise
 * steps, same `payPerPip` slots, same two promotion difficulties — because the
 * shape of the two pools *is* the measured balance of the opening fork, and the
 * unit is the only thing a country is allowed to change about it. What is
 * Japanese here is which trade sits on which rung, and every word of the copy.
 *
 * The pools keep their meaning, sharpened by where they are dealt from:
 * - **Graduate ladders** are the shūkatsu prize — short, dependable, and half
 *   of them are arguably the same job at different companies, which is true to
 *   rotational sōgō-shoku hiring and worth playing straight. You will never
 *   scrape by, and you will never run anything.
 * - **Basic ladders** are the trades — long, unvetted, with rungs at both
 *   ends. The bottom is grim, the top out-earns every graduate at the table,
 *   and which one you get is the gamble the lane is supposed to be.
 *
 * Two per pool are callings (天職): no rung above, and a layoff cannot touch
 * them — the coach on the dirt field and the farmer in the paddies were never
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
 * Trades open from Placement Day, no degree needed — plus every rung above.
 *
 * The volatile pool, twice over: the draw runs from a pet salon to a property
 * agency, and the tallest ladders take two reviews nobody is promised. The
 * `payPerPip` rungs are the trades whose weeks genuinely differ — a ramen
 * stall's queue, a courier's peak season, a wedding photographer's diary — and
 * `salary` is exactly `payPerPip × 3.5` so the wage the panel quotes is what
 * the job really pays over a game.
 */
export const BASIC_CAREERS: readonly Career[] = [
  // --- the salon -----------------------------------------------------------
  {
    id: 'career-jp-salon-apprentice',
    title: 'Salon Apprentice',
    salary: 2_975_000,
    payPerPip: 850_000,
    raiseStep: 310_000,
    requiresDegree: false,
    icon: 'career:salon-apprentice',
    description: 'Two years of shampooing before anyone hands you scissors, and evening cutting practice on a wig with a name.',
    promotesTo: 'career-jp-stylist',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-stylist',
    title: 'Stylist',
    salary: 4_935_000,
    payPerPip: 1_410_000,
    raiseStep: 520_000,
    requiresDegree: false,
    icon: 'career:salon-owner',
    description: 'Has a chair, a diary that fills three weeks out, and regulars who follow them to any station on the line.',
    promotesTo: 'career-jp-salon-owner',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-jp-salon-owner',
    title: 'Salon Owner',
    salary: 10_465_000,
    payPerPip: 2_990_000,
    raiseStep: 1_060_000,
    requiresDegree: false,
    icon: 'career:salon-owner',
    description: 'Runs a salon two minutes from the station where the chatter never stops and neither do the bookings.',
  },
  // --- the sushi counter ---------------------------------------------------
  {
    id: 'career-jp-rice-apprentice',
    title: 'Rice Apprentice',
    salary: 3_200_000,
    raiseStep: 340_000,
    requiresDegree: false,
    icon: 'career:rice-apprentice',
    description: 'In at five, out at ten, and not yet allowed to touch the fish. The rice, you are told, is the entire job.',
    promotesTo: 'career-jp-sushi-chef',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-sushi-chef',
    title: 'Sushi Chef',
    salary: 5_000_000,
    raiseStep: 520_000,
    requiresDegree: false,
    icon: 'career:pastry-chef',
    description: 'Stands the counter, reads the customer, and slices to the exact thickness of their mood.',
    promotesTo: 'career-jp-sushi-master',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-jp-sushi-master',
    title: 'Sushi Master',
    salary: 8_200_000,
    raiseStep: 840_000,
    requiresDegree: false,
    icon: 'career:pastry-chef',
    description: 'Eight seats, no menu, and a reservation list that opens at midnight on the first of the month and closes at 12:04.',
  },
  // --- the ramen counter ---------------------------------------------------
  {
    id: 'career-jp-noodle-cook',
    title: 'Noodle Cook',
    salary: 5_495_000,
    payPerPip: 1_570_000,
    raiseStep: 560_000,
    requiresDegree: false,
    icon: 'career:noodle-cook',
    description: 'Six pots, one ticket machine, and a lunch rush that decides what the week was worth.',
    promotesTo: 'career-jp-ramen-stall-owner',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-ramen-stall-owner',
    title: 'Ramen Stall Owner',
    salary: 6_825_000,
    payPerPip: 1_950_000,
    raiseStep: 700_000,
    requiresDegree: false,
    icon: 'career:food-truck-owner',
    description: 'Parks the yatai by the station at dusk and turns the last train crowd into a small festival. The queue is the wheel.',
    promotesTo: 'career-jp-ramen-shop-owner',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-jp-ramen-shop-owner',
    title: 'Ramen Shop Owner',
    salary: 12_110_000,
    payPerPip: 3_460_000,
    raiseStep: 1_240_000,
    requiresDegree: false,
    icon: 'career:food-truck-owner',
    description: 'Eleven counter stools, one uncompromising broth, and a queue the neighbouring shops set their clocks by.',
  },
  // --- the building site ---------------------------------------------------
  {
    id: 'career-jp-site-labourer',
    title: 'Site Labourer',
    salary: 4_800_000,
    raiseStep: 500_000,
    requiresDegree: false,
    icon: 'career:site-labourer',
    description: 'Leads the morning calisthenics at eight, shouts the safety call with feeling, and knows where every tool on the site actually is.',
    promotesTo: 'career-jp-site-supervisor',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-site-supervisor',
    title: 'Site Supervisor',
    salary: 6_400_000,
    raiseStep: 660_000,
    requiresDegree: false,
    icon: 'career:construction-foreman',
    description: 'Runs the morning briefing, the sign-in board, and the standing argument with the scaffolders.',
    promotesTo: 'career-jp-site-foreman',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-jp-site-foreman',
    title: 'Site Foreman',
    salary: 10_800_000,
    raiseStep: 1_100_000,
    requiresDegree: false,
    icon: 'career:construction-foreman',
    description: 'Turns rolled-up blueprints into buildings that shrug off earthquakes, and prices the job properly.',
  },
  // --- the depot -----------------------------------------------------------
  {
    id: 'career-jp-parcel-courier',
    title: 'Parcel Courier',
    salary: 3_185_000,
    payPerPip: 910_000,
    raiseStep: 330_000,
    requiresDegree: false,
    icon: 'career:delivery-courier',
    description: 'Delivers to the minute inside a two-hour window, and carries a pad of redelivery slips worn soft at the corners.',
    promotesTo: 'career-jp-depot-dispatcher',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-depot-dispatcher',
    title: 'Depot Dispatcher',
    salary: 4_800_000,
    raiseStep: 500_000,
    requiresDegree: false,
    icon: 'career:dispatcher',
    description: 'Off the scooter and onto the board, where every van in the ward is a magnet with a name on it.',
    promotesTo: 'career-jp-distribution-lead',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-jp-distribution-lead',
    title: 'Distribution Centre Lead',
    salary: 7_800_000,
    raiseStep: 800_000,
    requiresDegree: false,
    icon: 'career:logistics-lead',
    description: 'Moves a hundred thousand parcels through the night sort and gets home before the first train notices how.',
  },
  // --- the workshop --------------------------------------------------------
  {
    id: 'career-jp-apprentice-mechanic',
    title: 'Apprentice Mechanic',
    salary: 3_500_000,
    raiseStep: 360_000,
    requiresDegree: false,
    icon: 'career:apprentice-mechanic',
    description: 'Three years of holding the torch for the master, and a growing suspicion the kei trucks can hear it too.',
    promotesTo: 'career-jp-scooter-mechanic',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-scooter-mechanic',
    title: 'Scooter Mechanic',
    salary: 5_200_000,
    raiseStep: 540_000,
    requiresDegree: false,
    icon: 'career:mechanic',
    description: 'Hears what a delivery scooter is complaining about before its rider finishes the sentence.',
    promotesTo: 'career-jp-workshop-owner',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-jp-workshop-owner',
    title: 'Workshop Owner',
    salary: 8_600_000,
    raiseStep: 880_000,
    requiresDegree: false,
    icon: 'career:workshop-owner',
    description: 'Four ramps, a shaken-season waiting list, and a wall of photographs of bikes that came in on a trailer.',
  },
  // --- the studio ----------------------------------------------------------
  {
    id: 'career-jp-session-player',
    title: 'Session Player',
    salary: 2_625_000,
    payPerPip: 750_000,
    raiseStep: 280_000,
    requiresDegree: false,
    icon: 'career:session-musician',
    description: 'Plays the bass line on an enka record the whole country has hummed without ever seeing the sleeve, and waits on the phone between them.',
    promotesTo: 'career-jp-touring-player',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-touring-player',
    title: 'Touring Player',
    salary: 4_410_000,
    payPerPip: 1_260_000,
    raiseStep: 460_000,
    requiresDegree: false,
    icon: 'career:session-musician',
    description: 'Forty-seven prefectures, one flight case, and a name finally on the hall poster in small print.',
    promotesTo: 'career-jp-record-producer',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-jp-record-producer',
    title: 'Record Producer',
    salary: 8_155_000,
    payPerPip: 2_330_000,
    raiseStep: 840_000,
    requiresDegree: false,
    icon: 'career:record-producer',
    description: 'Sits behind the glass, says "again, but sadder", and is somehow always right.',
  },
  // --- the microphone ------------------------------------------------------
  {
    id: 'career-jp-radio-runner',
    title: 'Radio Runner',
    salary: 3_700_000,
    raiseStep: 380_000,
    requiresDegree: false,
    icon: 'career:radio-runner',
    description: 'Fetches the tea, cues the guest, sorts the listeners\' postcards, and quietly learns how a whole show is built.',
    promotesTo: 'career-jp-late-night-host',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-late-night-host',
    title: 'Late-Night Radio Host',
    salary: 5_700_000,
    raiseStep: 580_000,
    requiresDegree: false,
    icon: 'career:radio-host',
    description: 'Reads postcards from truck drivers and insomniac students at two in the morning, and is famous to exactly the people who are awake to hear it.',
    promotesTo: 'career-jp-programme-director',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-jp-programme-director',
    title: 'Programme Director',
    salary: 9_700_000,
    raiseStep: 980_000,
    requiresDegree: false,
    icon: 'career:station-owner',
    description: 'Runs eleven shows, still hosts one of them under a pseudonym, and sells the sponsor slots for all twelve.',
  },
  // --- the camera ----------------------------------------------------------
  {
    id: 'career-jp-second-shooter',
    title: 'Second Shooter',
    salary: 2_625_000,
    payPerPip: 750_000,
    raiseStep: 280_000,
    requiresDegree: false,
    icon: 'career:photographer',
    description: 'Covers the back of the banquet hall and the exact moment the father of the bride stops pretending not to cry.',
    promotesTo: 'career-jp-wedding-photographer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-wedding-photographer',
    title: 'Wedding Photographer',
    salary: 4_305_000,
    payPerPip: 1_230_000,
    raiseStep: 440_000,
    requiresDegree: false,
    icon: 'career:photographer',
    description: 'June weekends are booked two years out and February is silence — the diary is the wheel, and shrine season decides the year.',
  },
  // --- property ------------------------------------------------------------
  {
    id: 'career-jp-rental-agent',
    title: 'Rental Agent',
    salary: 6_265_000,
    payPerPip: 1_790_000,
    raiseStep: 660_000,
    requiresDegree: false,
    icon: 'career:estate-agent',
    description: 'Shows eleven one-rooms a Saturday, and remembers which one measured the "walk to station" at a run.',
    promotesTo: 'career-jp-property-agent',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-property-agent',
    title: 'Property Agent',
    salary: 7_420_000,
    payPerPip: 2_120_000,
    raiseStep: 760_000,
    requiresDegree: false,
    icon: 'career:estate-agent',
    description: 'Sells the kitchen first, the balcony second, and the ninety-minute commute never at all.',
    promotesTo: 'career-jp-agency-owner',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-jp-agency-owner',
    title: 'Agency Owner',
    salary: 14_840_000,
    payPerPip: 4_240_000,
    raiseStep: 1_520_000,
    requiresDegree: false,
    icon: 'career:agency-owner',
    description: 'Your name is on the boards outside four hundred buildings. One good tower year carries three quiet ones.',
  },
  // --- the warehouse -------------------------------------------------------
  {
    id: 'career-jp-warehouse-picker',
    title: 'Warehouse Picker',
    salary: 3_900_000,
    raiseStep: 400_000,
    requiresDegree: false,
    icon: 'career:warehouse-picker',
    description: 'Walks eleven miles a shift past the same robot arm, and could find aisle forty in the dark.',
    promotesTo: 'career-jp-warehouse-lead',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-warehouse-lead',
    title: 'Warehouse Lead',
    salary: 5_600_000,
    raiseStep: 580_000,
    requiresDegree: false,
    icon: 'career:warehouse-picker',
    description: 'Keeps a building the size of four baseball grounds running on canned coffee and clipboards.',
  },
  // --- the pet salon -------------------------------------------------------
  {
    id: 'career-jp-grooming-assistant',
    title: 'Grooming Assistant',
    salary: 2_400_000,
    raiseStep: 260_000,
    requiresDegree: false,
    icon: 'career:pet-groomer',
    description: 'Towels, treats, and the nerve to hold still while a very small dog in a very small raincoat decides about you.',
    promotesTo: 'career-jp-pet-salon-groomer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-pet-salon-groomer',
    title: 'Pet Salon Groomer',
    salary: 3_400_000,
    raiseStep: 360_000,
    requiresDegree: false,
    icon: 'career:pet-groomer',
    description: 'Gives the neighbourhood\'s toy poodles their monthly teddy-bear cut, and is photographed more than most idols.',
  },
  // --- callings ------------------------------------------------------------
  {
    id: 'career-jp-baseball-coach',
    title: 'Baseball Club Coach',
    salary: 5_000_000,
    raiseStep: 640_000,
    requiresDegree: false,
    icon: 'career:baseball-coach',
    description: 'Runs Saturday drills on a dirt field, pours the barley tea, and remembers every single name. There is no promotion from this and there was never going to be.',
    isCalling: true,
  },
  {
    id: 'career-jp-rice-farmer',
    title: 'Rice Farmer',
    salary: 5_800_000,
    raiseStep: 740_000,
    requiresDegree: false,
    icon: 'career:rice-farmer',
    description: 'Grows the rice the whole village queues for by seven in the morning, and has turned down the golf-course men three times, each more politely than the last.',
    isCalling: true,
  },
]

/**
 * Careers unlocked only by a degree — the shūkatsu prize pool.
 *
 * Two rungs, a tight entry band, a tight top band, and a first climb that
 * lands four times in six: a graduate almost always ends the game running a
 * good career and almost never anything bigger. Losing one hurts far more
 * than losing a trade, because a layoff costs the ladder as well as the wage.
 *
 * Dependable extends to how they are paid: the surgeon, the bureaucrat and
 * the trading-house generalist are on contracts, and none carry `payPerPip`.
 * The one exception is the manga ladder, paid in royalties — a degree cannot
 * make a serialisation survive its reader survey.
 */
export const GRADUATE_CAREERS: readonly Career[] = [
  {
    id: 'career-jp-surgical-resident',
    title: 'Surgical Resident',
    salary: 6_400_000,
    raiseStep: 620_000,
    requiresDegree: true,
    icon: 'career:surgeon',
    description: 'Six years of nights at the university hospital, assisting in surgery for hours at a stretch, and being asked what the professor would do next.',
    promotesTo: 'career-jp-hospital-surgeon',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-hospital-surgeon',
    title: 'Hospital Surgeon',
    salary: 7_900_000,
    raiseStep: 820_000,
    requiresDegree: true,
    icon: 'career:surgeon',
    description: 'Saves lives with steady hands, an even steadier nerve, and rounds that begin before the trains do.',
  },
  {
    id: 'career-jp-junior-associate',
    title: 'Junior Associate',
    salary: 6_600_000,
    raiseStep: 640_000,
    requiresDegree: true,
    icon: 'career:corporate-lawyer',
    description: 'Reads nine hundred pages so a partner can read the one paragraph that matters, in an office above the old moat.',
    promotesTo: 'career-jp-corporate-lawyer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-corporate-lawyer',
    title: 'Corporate Lawyer',
    salary: 8_100_000,
    raiseStep: 840_000,
    requiresDegree: true,
    icon: 'career:corporate-lawyer',
    description: 'Wins boardroom battles with a sharp briefcase, a sharper argument, and a bow of precisely judged depth.',
  },
  {
    id: 'career-jp-architectural-assistant',
    title: 'Architectural Assistant',
    salary: 6_000_000,
    raiseStep: 580_000,
    requiresDegree: true,
    icon: 'career:architect',
    description: 'Draws the stair detail eleven times for a house on a lot the width of a parked car, and learns more from the eleventh than the first ten.',
    promotesTo: 'career-jp-architect',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-architect',
    title: 'Architect',
    salary: 7_100_000,
    raiseStep: 740_000,
    requiresDegree: true,
    icon: 'career:architect',
    description: 'Pours exposed concrete into impossible corners and makes six square metres of garden feel like a forest.',
  },
  {
    id: 'career-jp-junior-systems-engineer',
    title: 'Junior Systems Engineer',
    salary: 6_200_000,
    raiseStep: 600_000,
    requiresDegree: true,
    icon: 'career:software-engineer',
    description: 'Fixes the small bug nobody else wanted, and documents it in a spreadsheet with forty-one tabs.',
    promotesTo: 'career-jp-systems-engineer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-systems-engineer',
    title: 'Systems Engineer',
    salary: 7_500_000,
    raiseStep: 780_000,
    requiresDegree: true,
    icon: 'career:software-engineer',
    description: 'The business card says "SE", the country says it constantly, and the quiet code underneath keeps half of it humming.',
  },
  {
    id: 'career-jp-junior-designer',
    title: 'Junior Game Designer',
    salary: 5_800_000,
    raiseStep: 560_000,
    requiresDegree: true,
    icon: 'career:game-designer',
    description: 'Balances the tutorial level for four months at the Kyoto studio, then watches strangers get through it without reading a word.',
    promotesTo: 'career-jp-game-designer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-game-designer',
    title: 'Game Designer',
    salary: 6_700_000,
    raiseStep: 700_000,
    requiresDegree: true,
    icon: 'career:game-designer',
    description: 'Builds worlds the whole planet stays up too late exploring. This was always Japan\'s export, and now it is your desk.',
  },
  {
    id: 'career-jp-robotics-graduate',
    title: 'Robotics Graduate',
    salary: 6_200_000,
    raiseStep: 600_000,
    requiresDegree: true,
    icon: 'career:robotics-engineer',
    description: 'Spends a year teaching an arm to bow at the correct angle, and considers it time well spent.',
    promotesTo: 'career-jp-robotics-engineer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-robotics-engineer',
    title: 'Robotics Engineer',
    salary: 7_300_000,
    raiseStep: 760_000,
    requiresDegree: true,
    icon: 'career:robotics-engineer',
    description: 'Builds caregivers for an ageing nation, one joint at a time, and answers the same question at every family gathering.',
  },
  {
    id: 'career-jp-trading-house-trainee',
    title: 'Trading House Trainee',
    salary: 6_400_000,
    raiseStep: 620_000,
    requiresDegree: true,
    icon: 'career:trading-generalist',
    description: 'Learns to sell iron ore, salmon and insurance in the same week, and is measured for a posting abroad.',
    promotesTo: 'career-jp-trading-house-generalist',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-trading-house-generalist',
    title: 'Trading House Generalist',
    salary: 7_700_000,
    raiseStep: 800_000,
    requiresDegree: true,
    icon: 'career:trading-generalist',
    description: 'Posted to three continents before forty. Nobody, including you, can explain your job at parties, but the bonus arrives twice a year.',
  },
  {
    id: 'career-jp-ministry-recruit',
    title: 'Ministry Recruit',
    salary: 6_000_000,
    raiseStep: 580_000,
    requiresDegree: true,
    icon: 'career:ministry-official',
    description: 'Passes the national exam, joins the ministry, and learns that the district\'s lights stay on past midnight for a reason.',
    promotesTo: 'career-jp-ministry-section-chief',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-ministry-section-chief',
    title: 'Ministry Section Chief',
    salary: 6_900_000,
    raiseStep: 720_000,
    requiresDegree: true,
    icon: 'career:ministry-official',
    description: 'Drafts the answers a minister reads aloud at seven the next morning. The overtime is measured in national budgets.',
  },
  {
    id: 'career-jp-research-assistant',
    title: 'Research Assistant',
    salary: 5_650_000,
    raiseStep: 540_000,
    requiresDegree: true,
    icon: 'career:marine-biologist',
    description: 'Counts things in cold water for somebody else\'s paper, and loves every minute of it.',
    promotesTo: 'career-jp-aquarium-researcher',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-aquarium-researcher',
    title: 'Aquarium Researcher',
    salary: 6_300_000,
    raiseStep: 660_000,
    requiresDegree: true,
    icon: 'career:marine-biologist',
    description: 'Studies the tank the whole city queues for, and is on first-name terms with one extremely curious dolphin.',
  },
  {
    id: 'career-jp-manga-assistant',
    title: 'Manga Assistant',
    salary: 5_495_000,
    payPerPip: 1_570_000,
    raiseStep: 520_000,
    requiresDegree: true,
    icon: 'career:manga-artist',
    description: 'Inks backgrounds until four in the morning for a weekly that never misses, while the real thing sits in a drawer.',
    promotesTo: 'career-jp-manga-artist',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-jp-manga-artist',
    title: 'Manga Artist',
    salary: 6_475_000,
    payPerPip: 1_850_000,
    raiseStep: 680_000,
    requiresDegree: true,
    icon: 'career:manga-artist',
    description: 'Serialised at last. The royalties are a wheel, the reader survey is a guillotine, and the deadline is weekly forever.',
  },
  // --- callings ------------------------------------------------------------
  {
    id: 'career-jp-veterinarian',
    title: 'Veterinarian',
    salary: 6_800_000,
    raiseStep: 800_000,
    requiresDegree: true,
    icon: 'career:veterinarian',
    description: 'Talks nervous owners down while quietly setting a very small broken leg. Would not run a chain of these for any money you could name.',
    isCalling: true,
  },
  {
    id: 'career-jp-university-professor',
    title: 'University Professor',
    salary: 6_600_000,
    raiseStep: 780_000,
    requiresDegree: true,
    icon: 'career:professor',
    description: 'Lectures on Tuesdays, argues with colleagues on Wednesdays, changes minds by Friday, and has turned down the dean\'s office twice.',
    isCalling: true,
  },
]
