import type { Career } from '../../model/types'

/**
 * Bolivia's careers, as ladders — and as the places a ladder is the wrong
 * picture, as callings and as `payPerPip`.
 *
 * Most Bolivian working life is not a salary with a rung above it. It is the
 * market stall that becomes a second stall, the minibus that becomes two
 * minibuses, the grill that becomes a lunch house with a queue. The engine
 * already speaks that language better than it knows: a `payPerPip` rung is a
 * business whose week the wheel decides, a three-rung basic ladder is a
 * trade built floor by floor, and a calling is a life that was never on
 * anybody's org chart and cannot be laid off from it. So the trades below
 * are mostly *businesses at three sizes* rather than employees of anyone —
 * which is the honest shape of the informal economy, told entirely in
 * machinery the engine already had.
 *
 * Every number is the tuned USA ladder at ×1 — same salaries, same raise
 * steps, same `payPerPip` slots, same two promotion difficulties — because
 * the shape of the two pools *is* the measured balance of the opening fork,
 * and the unit is the only thing a country is allowed to change about it
 * (here, not even that: see `economy.ts` on why the factor is one). What is
 * Bolivian is which life sits on which rung, and every word of the copy.
 *
 * The pools keep their meaning, sharpened by where they are dealt from:
 * - **Graduate ladders** are the professional card — the framed degree on
 *   the consulting-room wall, the licensed engineer's stamp. Short,
 *   dependable, and paid on the payroll with a pension. You will never
 *   scrape by, and you will never own the building.
 * - **Basic ladders** are the market and the road — long, unvetted, with
 *   rungs at both ends. The bottom is hard graft, the top out-earns every
 *   graduate at the table, and which one you get is the gamble the lane is
 *   supposed to be.
 *
 * Two per pool are callings: no rung above, and a layoff cannot touch them —
 * the coach on the four-thousand-metre pitch and the quinoa farmer working
 * her neighbours' rows were never on a ladder to begin with.
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
 * Trades open from the first morning at the market, no degree needed — plus
 * every rung above.
 *
 * The volatile pool, twice over: the draw runs from a grooming table to a
 * whole shopping arcade, and the tallest ladders take two climbs nobody is
 * promised. The `payPerPip` rungs are the businesses whose weeks genuinely
 * differ — a stall's foot traffic, a fare-caller's passengers, a brass
 * band's fiesta season — and `salary` is exactly `payPerPip × 3.5`, so the
 * wage the panel quotes is what the work really pays over a game.
 */
export const BASIC_CAREERS: readonly Career[] = [
  // --- the produce market --------------------------------------------------
  {
    id: 'career-bo-market-runner',
    title: 'Market Runner',
    salary: 29_750,
    payPerPip: 8_500,
    raiseStep: 3_100,
    requiresDegree: false,
    icon: 'space:new-skills',
    description: 'Hauls crates before dawn, learns every price in the hall by heart, and is trusted to mind three stalls at once by seven.',
    promotesTo: 'career-bo-stall-holder',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-stall-holder',
    title: 'Stall Holder',
    salary: 49_350,
    payPerPip: 14_100,
    raiseStep: 5_200,
    requiresDegree: false,
    icon: 'space:grocery-run',
    description: 'Has a stall of her own now, regulars who get the little extra on top of every sale, and a mental ledger sharper than any till.',
    promotesTo: 'career-bo-market-matriarch',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-bo-market-matriarch',
    title: 'Market Row Matriarch',
    salary: 104_650,
    payPerPip: 29_900,
    raiseStep: 10_600,
    requiresDegree: false,
    icon: 'space:garage-sale',
    description: 'Runs a whole row of the market, banks for half of it, and settles disputes nobody would dream of taking anywhere else.',
  },
  // --- the salteña oven ----------------------------------------------------
  {
    id: 'career-bo-saltena-junior',
    title: 'Salteña Kitchen Junior',
    salary: 32_000,
    raiseStep: 3_400,
    requiresDegree: false,
    icon: 'space:new-skills',
    description: 'In at four, sold out by noon. Two years of crimping pastry before anyone lets you near the broth recipe, which is the entire point of the shop.',
    promotesTo: 'career-bo-saltena-baker',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-saltena-baker',
    title: 'Salteña Baker',
    salary: 50_000,
    raiseStep: 5_200,
    requiresDegree: false,
    icon: 'career:pastry-chef',
    description: 'Seals a pastry that somehow holds a spoonful of soup inside without leaking, and always eats standing up and leaning forward — the way you learn to after the first shirt gets ruined.',
    promotesTo: 'career-bo-saltena-house-owner',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-bo-saltena-house-owner',
    title: 'Salteña House Owner',
    salary: 82_000,
    raiseStep: 8_400,
    requiresDegree: false,
    icon: 'career:pastry-chef',
    description: 'Owns the mid-morning queue of the whole neighbourhood, and closes at one because there is nothing left to sell. There is never anything left to sell.',
  },
  // --- the grill -----------------------------------------------------------
  {
    id: 'career-bo-grill-hand',
    title: 'Grill Hand',
    salary: 54_950,
    payPerPip: 15_700,
    raiseStep: 5_600,
    requiresDegree: false,
    icon: 'space:overtime-shift',
    description: 'Works the night grill on the corner, reads the after-party crowd like a weather chart, and never once drops a skewer.',
    promotesTo: 'career-bo-anticucho-cart',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-anticucho-cart',
    title: 'Anticucho Cart Owner',
    salary: 68_250,
    payPerPip: 19_500,
    raiseStep: 7_000,
    requiresDegree: false,
    icon: 'career:food-truck-owner',
    description: 'Wheels the grill cart to the same corner at dusk and turns beef-heart skewers and peanut sauce into a small nightly festival. The queue is the wheel.',
    promotesTo: 'career-bo-lunch-house-owner',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-bo-lunch-house-owner',
    title: 'Lunch House Owner',
    salary: 121_100,
    payPerPip: 34_600,
    raiseStep: 12_400,
    requiresDegree: false,
    icon: 'career:food-truck-owner',
    description: 'Serves one set lunch, soup first, to a room that fills twice over by half past twelve. The office towers empty into your dining room daily.',
  },
  // --- the building site ---------------------------------------------------
  {
    id: 'career-bo-hod-carrier',
    title: 'Hod Carrier',
    salary: 48_000,
    raiseStep: 5_000,
    requiresDegree: false,
    icon: 'space:overtime-shift',
    description: 'Carries brick and mortar up ladders all day at an altitude visiting football teams complain about, and does not mention it.',
    promotesTo: 'career-bo-bricklayer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-bricklayer',
    title: 'Bricklayer',
    salary: 64_000,
    raiseStep: 6_600,
    requiresDegree: false,
    icon: 'career:construction-foreman',
    description: 'Lays the red brick half the city is built from, straight and level by eye alone, and leaves the roof rebar standing — every house here plans to grow another floor.',
    promotesTo: 'career-bo-master-builder',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-bo-master-builder',
    title: 'Master Builder',
    salary: 108_000,
    raiseStep: 11_000,
    requiresDegree: false,
    icon: 'career:construction-foreman',
    description: 'Prices a whole building on a napkin, builds it floor by floor as the money arrives, and has never once been wrong about the napkin.',
  },
  // --- the minibus line ----------------------------------------------------
  {
    id: 'career-bo-fare-caller',
    title: 'Minibus Fare Caller',
    salary: 31_850,
    payPerPip: 9_100,
    raiseStep: 3_300,
    requiresDegree: false,
    icon: 'career:delivery-courier',
    description: 'Hangs out the sliding door singing the whole route in one breath, makes change from a fist of coins, and fills the bus by force of voice alone.',
    promotesTo: 'career-bo-minibus-driver',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-minibus-driver',
    title: 'Minibus Driver',
    salary: 48_000,
    raiseStep: 5_000,
    requiresDegree: false,
    icon: 'career:delivery-courier',
    description: 'Threads a fourteen-seat bus carrying nineteen people through streets built for donkeys, daily, on schedule, with a dashboard full of saints.',
    promotesTo: 'career-bo-route-owner',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-bo-route-owner',
    title: 'Route Line Owner',
    salary: 78_000,
    raiseStep: 8_000,
    requiresDegree: false,
    icon: 'space:corner-office',
    description: 'Owns four minibuses on the busiest line in the city and holds a seat on the transport union board, which decides more than the town hall does.',
  },
  // --- the workshop --------------------------------------------------------
  {
    id: 'career-bo-apprentice-mechanic',
    title: 'Apprentice Mechanic',
    salary: 35_000,
    raiseStep: 3_600,
    requiresDegree: false,
    icon: 'space:new-skills',
    description: 'Three years of passing the master the right spanner before he asks, and a growing suspicion the minibuses confide in you.',
    promotesTo: 'career-bo-minibus-mechanic',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-minibus-mechanic',
    title: 'Minibus Mechanic',
    salary: 52_000,
    raiseStep: 5_400,
    requiresDegree: false,
    icon: 'tile:vintage-motorcycle',
    description: 'Keeps thirty-year-old vans alive at altitudes their engineers never imagined, with parts from three continents and one drawer.',
    promotesTo: 'career-bo-workshop-owner',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-bo-workshop-owner',
    title: 'Workshop Owner',
    salary: 86_000,
    raiseStep: 8_800,
    requiresDegree: false,
    icon: 'tile:vintage-motorcycle',
    description: 'Four ramps, a waiting list the whole transport union respects, and a wall of photographs of vehicles that arrived on the end of a rope.',
  },
  // --- the brass band ------------------------------------------------------
  {
    id: 'career-bo-band-trumpeter',
    title: 'Brass Band Trumpeter',
    salary: 26_250,
    payPerPip: 7_500,
    raiseStep: 2_800,
    requiresDegree: false,
    icon: 'tile:indie-album',
    description: 'Plays weddings, saints\' days and graduations at full volume and full altitude, and waits by the phone between them. Fiesta season is the wheel.',
    promotesTo: 'career-bo-touring-band',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-touring-band',
    title: 'Touring Band Player',
    salary: 44_100,
    payPerPip: 12_600,
    raiseStep: 4_600,
    requiresDegree: false,
    icon: 'tile:indie-album',
    description: 'Nine departments, one dented flight case, and a name finally printed on the festival poster — in the small type, but printed.',
    promotesTo: 'career-bo-bandleader',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-bo-bandleader',
    title: 'Bandleader',
    salary: 81_550,
    payPerPip: 23_300,
    raiseStep: 8_400,
    requiresDegree: false,
    icon: 'tile:indie-album',
    description: 'Runs sixty musicians whose sound arrives a full street before they do, and books the carnival two years out.',
  },
  // --- the radio -----------------------------------------------------------
  {
    id: 'career-bo-radio-runner',
    title: 'Radio Runner',
    salary: 37_000,
    raiseStep: 3_800,
    requiresDegree: false,
    icon: 'tile:podcast',
    description: 'Fetches the coffee, cues the dedications, sorts the listeners\' messages, and quietly learns how a whole station is run before anyone thinks to hide it.',
    promotesTo: 'career-bo-morning-host',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-morning-host',
    title: 'Morning Show Host',
    salary: 57_000,
    raiseStep: 5_800,
    requiresDegree: false,
    icon: 'tile:podcast',
    description: 'Wakes half the city at five with prices, saints\' days and dedications, and is recognised everywhere by voice and nowhere by face.',
    promotesTo: 'career-bo-station-owner',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-bo-station-owner',
    title: 'Station Owner',
    salary: 97_000,
    raiseStep: 9_800,
    requiresDegree: false,
    icon: 'tile:podcast',
    description: 'Owns the frequency every minibus in the city is tuned to, and sells the morning advertising by the minute, in cash, to a queue.',
  },
  // --- the camera ----------------------------------------------------------
  {
    id: 'career-bo-second-shooter',
    title: 'Second Shooter',
    salary: 26_250,
    payPerPip: 7_500,
    raiseStep: 2_800,
    requiresDegree: false,
    icon: 'space:family-portrait',
    description: 'Covers the back of the hall and the exact moment the godfather of the fiesta stops pretending not to cry.',
    promotesTo: 'career-bo-fiesta-photographer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-fiesta-photographer',
    title: 'Fiesta Photographer',
    salary: 43_050,
    payPerPip: 12_300,
    raiseStep: 4_400,
    requiresDegree: false,
    icon: 'space:family-portrait',
    description: 'August is booked two years solid, and Lent brings no work at all — the fiesta calendar is the wheel, and the sponsors decide the year.',
  },
  // --- the import trade ----------------------------------------------------
  {
    id: 'career-bo-import-stall-trader',
    title: 'Import Stall Trader',
    salary: 62_650,
    payPerPip: 17_900,
    raiseStep: 6_600,
    requiresDegree: false,
    icon: 'space:side-hustle',
    description: 'Sells electronics from a stall two metres wide, knows exactly what everything cost to import, down to the centavo, and undercuts the shops by knowing it.',
    promotesTo: 'career-bo-container-importer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-container-importer',
    title: 'Container Importer',
    salary: 74_200,
    payPerPip: 21_200,
    raiseStep: 7_600,
    requiresDegree: false,
    icon: 'finance:trading-floor',
    description: 'Rides the overnight bus to the free port on the coast, fills a container by instinct, and finds out at the market whether the instinct held.',
    promotesTo: 'career-bo-galleria-owner',
    promotionSpin: TOP_STEP,
  },
  {
    id: 'career-bo-galleria-owner',
    title: 'Shopping Arcade Owner',
    salary: 148_400,
    payPerPip: 42_400,
    raiseStep: 15_200,
    requiresDegree: false,
    icon: 'space:corner-office',
    description: 'Owns the arcade the stalls rent, three floors of it, built one good year at a time. One strong import season carries three quiet ones.',
  },
  // --- the depot -----------------------------------------------------------
  {
    id: 'career-bo-depot-hand',
    title: 'Brewery Depot Hand',
    salary: 39_000,
    raiseStep: 4_000,
    requiresDegree: false,
    icon: 'space:overtime-shift',
    description: 'Stacks crates of the national lager to the ceiling all day, and can price a fiesta by the size of its order alone.',
    promotesTo: 'career-bo-depot-foreman',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-depot-foreman',
    title: 'Depot Foreman',
    salary: 56_000,
    raiseStep: 5_800,
    requiresDegree: false,
    icon: 'space:overtime-shift',
    description: 'Keeps a warehouse the size of a stadium moving on clipboards and shouted nicknames, and has never once lost a crate.',
  },
  // --- the pet salon -------------------------------------------------------
  {
    id: 'career-bo-kennel-assistant',
    title: 'Kennel Assistant',
    salary: 24_000,
    raiseStep: 2_600,
    requiresDegree: false,
    icon: 'career:pet-groomer',
    description: 'Towels, treats, and the nerve to hold still while a very small dog in a very warm knitted jumper decides what it thinks of you.',
    promotesTo: 'career-bo-pet-groomer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-pet-groomer',
    title: 'City Pet Groomer',
    salary: 34_000,
    raiseStep: 3_600,
    requiresDegree: false,
    icon: 'career:pet-groomer',
    description: 'Grooms the pampered lapdogs of the city\'s leafy south side, every one of whom owns more knitwear than most people.',
  },
  // --- callings ------------------------------------------------------------
  {
    id: 'career-bo-football-coach',
    title: 'Football Club Coach',
    salary: 50_000,
    raiseStep: 6_400,
    requiresDegree: false,
    icon: 'tile:youth-coach',
    description: 'Runs Saturday drills on a pitch four kilometres up, where visiting teams gasp and your kids do not. There is no promotion from this and there was never going to be.',
    isCalling: true,
  },
  {
    id: 'career-bo-quinoa-farmer',
    title: 'Quinoa Farmer',
    salary: 58_000,
    raiseStep: 7_400,
    requiresDegree: false,
    icon: 'space:garden-harvest',
    description: 'Plants her neighbours\' rows in the week they plant hers — help repaid in help, the oldest bank in the mountains — and has turned the export men away three times, each more politely than the last.',
    isCalling: true,
  },
]

/**
 * Careers unlocked only by a degree — the professional card.
 *
 * Two rungs, a tight entry band, a tight top band, and a first climb that
 * lands four times in six: a graduate almost always ends the game holding a
 * good title and almost never owning the building. These are the payroll
 * jobs — the pension, the Christmas double wage, the framed certificate on
 * the wall — and losing one hurts far more than losing a trade, because a
 * layoff costs the ladder as well as the wage.
 *
 * Dependable extends to how they are paid: the surgeon, the engineer and the
 * branch manager are on contracts, and none carry `payPerPip`. The one
 * exception is the correspondent, paid by the story filed — a degree cannot
 * make the news happen on schedule.
 */
export const GRADUATE_CAREERS: readonly Career[] = [
  {
    id: 'career-bo-surgical-resident',
    title: 'Surgical Resident',
    salary: 64_000,
    raiseStep: 6_200,
    requiresDegree: true,
    icon: 'career:surgeon',
    description: 'Six years of nights at the teaching hospital, held retractors, and learning what surgery means where the air itself is thin.',
    promotesTo: 'career-bo-hospital-surgeon',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-hospital-surgeon',
    title: 'Hospital Surgeon',
    salary: 79_000,
    raiseStep: 8_200,
    requiresDegree: true,
    icon: 'career:surgeon',
    description: 'Operates at an altitude most medical textbooks barely mention, with steady hands — and doctors fly in from around the world just to study how bodies work up here.',
  },
  {
    id: 'career-bo-junior-associate',
    title: 'Junior Associate',
    salary: 66_000,
    raiseStep: 6_400,
    requiresDegree: true,
    icon: 'career:corporate-lawyer',
    description: 'Reads nine hundred pages of a land dispute so a partner can read the one paragraph that decides it, in an office above the old plaza.',
    promotesTo: 'career-bo-corporate-lawyer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-corporate-lawyer',
    title: 'Corporate Lawyer',
    salary: 81_000,
    raiseStep: 8_400,
    requiresDegree: true,
    icon: 'career:corporate-lawyer',
    description: 'Closes soy-belt deals in the lowland boom city, where the money is new, the suits are sharp, and the contracts run long.',
  },
  {
    id: 'career-bo-architectural-assistant',
    title: 'Architectural Assistant',
    salary: 60_000,
    raiseStep: 5_800,
    requiresDegree: true,
    icon: 'career:architect',
    description: 'Draws the ballroom staircase eleven times for a client who knows exactly what she wants, and learns more from the eleventh than the first ten.',
    promotesTo: 'career-bo-new-andean-architect',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-new-andean-architect',
    title: 'New Andean Architect',
    salary: 71_000,
    raiseStep: 7_400,
    requiresDegree: true,
    icon: 'career:architect',
    description: 'Designs façades in greens and golds the old school calls impossible and the whole high city now sees as completely normal. Your buildings are visible from the cable car, which is the point.',
  },
  {
    id: 'career-bo-junior-developer',
    title: 'Junior Developer',
    salary: 62_000,
    raiseStep: 6_000,
    requiresDegree: true,
    icon: 'career:software-engineer',
    description: 'Fixes the small bug nobody else wanted, and documents it so thoroughly the fix becomes the onboarding guide.',
    promotesTo: 'career-bo-software-engineer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-software-engineer',
    title: 'Software Engineer',
    salary: 75_000,
    raiseStep: 7_800,
    requiresDegree: true,
    icon: 'career:software-engineer',
    description: 'Ships code for clients three time zones away from a desk with a view of the mountain, and takes the meetings at whatever hour the clients think it is.',
  },
  {
    id: 'career-bo-field-agronomist',
    title: 'Field Agronomist',
    salary: 58_000,
    raiseStep: 5_600,
    requiresDegree: true,
    icon: 'tile:vegetable-garden',
    description: 'Walks soy rows to the horizon with a notebook and a soil kit, and calls the harvest within two per cent from the smell of the field.',
    promotesTo: 'career-bo-seed-agronomist',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-seed-agronomist',
    title: 'Seed Company Agronomist',
    salary: 67_000,
    raiseStep: 7_000,
    requiresDegree: true,
    icon: 'tile:vegetable-garden',
    description: 'Breeds the variety half the lowlands will plant next season, and answers for it personally at every farm gate in three provinces.',
  },
  {
    id: 'career-bo-junior-geologist',
    title: 'Junior Geologist',
    salary: 62_000,
    raiseStep: 6_000,
    requiresDegree: true,
    icon: 'tile:mountain-climb',
    description: 'Logs cores on a salt flat so vast and so white the horizon disappears, and considers it the best office in the hemisphere.',
    promotesTo: 'career-bo-lithium-geologist',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-lithium-geologist',
    title: 'Lithium Plant Geologist',
    salary: 73_000,
    raiseStep: 7_600,
    requiresDegree: true,
    icon: 'tile:mountain-climb',
    description: 'Reads the brine under the world\'s largest salt flat, where a meaningful fraction of every future battery is currently a very still pond.',
  },
  {
    id: 'career-bo-microcredit-analyst',
    title: 'Microcredit Analyst',
    salary: 64_000,
    raiseStep: 6_200,
    requiresDegree: true,
    icon: 'finance:bank-visit',
    description: 'Walks the market rows pricing loans against inventory nobody wrote down, and is right more often than the collateral models are.',
    promotesTo: 'career-bo-microfinance-manager',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-microfinance-manager',
    title: 'Microfinance Branch Manager',
    salary: 77_000,
    raiseStep: 8_000,
    requiresDegree: true,
    icon: 'finance:bank-visit',
    description: 'Runs the branch that banks the stalls the big banks never learned to see, and knows every borrower\'s business better than their family does.',
  },
  {
    id: 'career-bo-junior-civil-engineer',
    title: 'Junior Civil Engineer',
    salary: 60_000,
    raiseStep: 5_800,
    requiresDegree: true,
    icon: 'career:architect',
    description: 'Checks culvert drawings for a mountain highway, and learns that in these mountains, the rock often proves the drawing wrong.',
    promotesTo: 'career-bo-highway-engineer',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-highway-engineer',
    title: 'Highway Engineer',
    salary: 69_000,
    raiseStep: 7_200,
    requiresDegree: true,
    icon: 'career:architect',
    description: 'Builds roads that descend two vertical kilometres in an afternoon, and retired the one the guidebooks called the most dangerous on earth.',
  },
  {
    id: 'career-bo-research-assistant',
    title: 'Research Assistant',
    salary: 56_500,
    raiseStep: 5_400,
    requiresDegree: true,
    icon: 'career:marine-biologist',
    description: 'Counts things in very cold, very high water for somebody else\'s paper, and loves every minute of it.',
    promotesTo: 'career-bo-lake-biologist',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-lake-biologist',
    title: 'Lake Titicaca Biologist',
    salary: 63_000,
    raiseStep: 6_600,
    requiresDegree: true,
    icon: 'career:marine-biologist',
    description: 'Studies the highest great lake in the world and its giant frog, which breathes through its skin and is in no hurry whatsoever.',
  },
  {
    id: 'career-bo-stringer-journalist',
    title: 'Stringer Journalist',
    salary: 54_950,
    payPerPip: 15_700,
    raiseStep: 5_200,
    requiresDegree: true,
    icon: 'tile:novel',
    description: 'Files by the story from wherever the story is, and the month pays what the news decided to do. Some weeks the phone does not stop; some weeks it does not start.',
    promotesTo: 'career-bo-foreign-correspondent',
    promotionSpin: FIRST_STEP,
  },
  {
    id: 'career-bo-foreign-correspondent',
    title: 'Foreign Correspondent',
    salary: 64_750,
    payPerPip: 18_500,
    raiseStep: 6_800,
    requiresDegree: true,
    icon: 'tile:novel',
    description: 'Explains the Andes to three foreign desks at once, each paying by the piece, none on the same deadline. The byline is the steady part; the income is the wheel.',
  },
  // --- callings ------------------------------------------------------------
  {
    id: 'career-bo-veterinarian',
    title: 'Veterinarian',
    salary: 68_000,
    raiseStep: 8_000,
    requiresDegree: true,
    icon: 'tile:animal-shelter',
    description: 'Sets a llama\'s leg in the morning and a lapdog\'s in the afternoon, and would not trade the practice for a chain of them at any price you could name.',
    isCalling: true,
  },
  {
    id: 'career-bo-university-professor',
    title: 'University Professor',
    salary: 66_000,
    raiseStep: 7_800,
    requiresDegree: true,
    icon: 'space:cap-and-gown',
    description: 'Lectures on Tuesdays, sits thesis defences on Fridays in front of entire weeping families, and has turned down the dean\'s office twice.',
    isCalling: true,
  },
]
