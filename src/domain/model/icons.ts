/**
 * Every illustration the game can ask for.
 *
 * These name *subjects*, not pictures: the domain says a space is about a
 * wedding day and the presentation layer decides how a wedding day is drawn.
 * A space can therefore never reference art that does not exist — the icon
 * registry is checked against this union by a test.
 */
export type IconName =
  | 'career:architect'
  | 'career:construction-foreman'
  | 'career:corporate-lawyer'
  | 'career:delivery-courier'
  | 'career:food-truck-owner'
  | 'career:game-designer'
  | 'career:marine-biologist'
  | 'career:pastry-chef'
  | 'career:pet-groomer'
  | 'career:salon-owner'
  | 'career:software-engineer'
  | 'career:surgeon'
  | 'house:cozy-bungalow'
  | 'house:lakeside-villa'
  | 'house:lavish-estate'
  | 'house:modern-duplex'
  | 'house:suburban-townhouse'
  | 'house:tiny-cabin'
  | 'space:apartment-hunt'
  | 'space:bidding-war'
  | 'space:big-promotion'
  | 'space:bonus-season'
  | 'space:budget-win'
  | 'space:campus-job'
  | 'space:cap-and-gown'
  | 'space:car-trouble'
  | 'space:cashback-bonus'
  | 'space:client-win'
  | 'space:conference-talk'
  | 'space:corner-office'
  | 'space:coupon-clipping'
  | 'space:family-portrait'
  | 'space:family-vacation'
  | 'space:finals-week'
  | 'space:first-job-fair'
  | 'space:first-paycheck'
  | 'space:garage-sale'
  | 'space:garden-harvest'
  | 'space:good-review'
  | 'space:grad-job-fair'
  | 'space:grocery-run'
  | 'space:group-project'
  | 'space:gym-membership'
  | 'space:house-hunting'
  | 'space:interest-payout'
  | 'space:late-night-study'
  | 'space:lottery-ticket'
  | 'space:lucky-find'
  | 'space:market-crash'
  | 'space:move-in-day'
  | 'space:neighborhood-bbq'
  | 'space:networking-night'
  | 'space:new-baby'
  | 'space:new-skills'
  | 'space:nursery-setup'
  | 'space:overtime-shift'
  | 'space:pay-raise-talk'
  | 'space:payday'
  | 'space:piano-lessons'
  | 'space:poker-night'
  | 'space:quiet-savings'
  | 'space:refund-check'
  | 'space:rent-due'
  | 'space:retirement'
  | 'space:retirement-fund'
  | 'space:ring-shopping'
  | 'space:scholarship-win'
  | 'space:school-play'
  | 'space:second-baby'
  | 'space:side-hustle'
  | 'space:soccer-season'
  | 'space:start-of-life'
  | 'space:startup-bet'
  | 'space:steady-hustle'
  | 'space:stock-tip'
  | 'space:streaming-bill'
  | 'space:sunset-ahead'
  | 'space:surprise-bonus'
  | 'space:tuition-bill'
  | 'space:wedding-day'
  | 'space:weekend-trip'
  | 'space:yard-sale'
  | 'tile:animal-shelter'
  | 'tile:backpacking'
  | 'tile:cooking-contest'
  | 'tile:fantasy-league'
  | 'tile:food-blog'
  | 'tile:indie-album'
  | 'tile:invention'
  | 'tile:jingle'
  | 'tile:lemonade-stand'
  | 'tile:marathon'
  | 'tile:mountain-climb'
  | 'tile:mural'
  | 'tile:novel'
  | 'tile:podcast'
  | 'tile:pottery'
  | 'tile:prize-pumpkin'
  | 'tile:rescue-dog'
  | 'tile:rescue-kitten'
  | 'tile:surfing'
  | 'tile:treehouse'
  | 'tile:triathlon'
  | 'tile:vegetable-garden'
  | 'tile:vintage-motorcycle'
  | 'tile:youth-coach'
  // --- finance: stocks, policies and the bank ------------------------------
  | 'finance:bank-visit'
  | 'finance:insurance-office'
  | 'finance:policy-auto'
  | 'finance:policy-home'
  | 'finance:policy-life'
  | 'finance:trading-floor'
  | 'stock:green-energy'
  | 'stock:noodle-chain'
  | 'stock:orbital-freight'
  | 'stock:robot-farms'
  | 'stock:studio-pictures'
  // --- spaces added for career churn, upsets and family costs --------------
  | 'space:career-fair-return'
  | 'space:child-benefit'
  | 'space:dividend-day'
  | 'space:fender-bender'
  | 'space:headhunted'
  | 'space:home-upgrade'
  | 'space:house-fire'
  | 'space:layoff-notice'
  | 'space:rival-swap'
  | 'space:school-fees'
  | 'space:sticky-fingers'
  // --- careers drawn for the ladder trades, shared across editions ---------
  | 'career:actuary'
  | 'career:aerospace-engineer'
  | 'career:agency-owner'
  | 'career:agronomist'
  | 'career:apprentice-baker'
  | 'career:apprentice-mechanic'
  | 'career:bank-officer'
  | 'career:baseball-coach'
  | 'career:brass-musician'
  | 'career:chai-wallah'
  | 'career:cricket-coach'
  | 'career:dispatcher'
  | 'career:estate-agent'
  | 'career:geologist'
  | 'career:grill-cook'
  | 'career:import-trader'
  | 'career:investment-analyst'
  | 'career:journalist'
  | 'career:line-cook'
  | 'career:logistics-lead'
  | 'career:manga-artist'
  | 'career:market-gardener'
  | 'career:market-vendor'
  | 'career:mechanic'
  | 'career:minibus-owner'
  | 'career:ministry-official'
  | 'career:noodle-cook'
  | 'career:photographer'
  | 'career:product-manager'
  | 'career:professor'
  | 'career:quinoa-farmer'
  | 'career:radio-host'
  | 'career:radio-runner'
  | 'career:record-producer'
  | 'career:rice-apprentice'
  | 'career:rice-farmer'
  | 'career:robotics-engineer'
  | 'career:rocket-engineer'
  | 'career:salon-apprentice'
  | 'career:session-musician'
  | 'career:site-labourer'
  | 'career:soccer-coach'
  | 'career:station-owner'
  | 'career:sweet-maker'
  | 'career:trading-generalist'
  | 'career:veterinarian'
  | 'career:warehouse-picker'
  | 'career:wheat-farmer'
  | 'career:workshop-owner'
  | 'career:writer'

export const ALL_ICON_NAMES: readonly IconName[] = [
  'career:architect',
  'career:construction-foreman',
  'career:corporate-lawyer',
  'career:delivery-courier',
  'career:food-truck-owner',
  'career:game-designer',
  'career:marine-biologist',
  'career:pastry-chef',
  'career:pet-groomer',
  'career:salon-owner',
  'career:software-engineer',
  'career:surgeon',
  'house:cozy-bungalow',
  'house:lakeside-villa',
  'house:lavish-estate',
  'house:modern-duplex',
  'house:suburban-townhouse',
  'house:tiny-cabin',
  'space:apartment-hunt',
  'space:bidding-war',
  'space:big-promotion',
  'space:bonus-season',
  'space:budget-win',
  'space:campus-job',
  'space:cap-and-gown',
  'space:car-trouble',
  'space:cashback-bonus',
  'space:client-win',
  'space:conference-talk',
  'space:corner-office',
  'space:coupon-clipping',
  'space:family-portrait',
  'space:family-vacation',
  'space:finals-week',
  'space:first-job-fair',
  'space:first-paycheck',
  'space:garage-sale',
  'space:garden-harvest',
  'space:good-review',
  'space:grad-job-fair',
  'space:grocery-run',
  'space:group-project',
  'space:gym-membership',
  'space:house-hunting',
  'space:interest-payout',
  'space:late-night-study',
  'space:lottery-ticket',
  'space:lucky-find',
  'space:market-crash',
  'space:move-in-day',
  'space:neighborhood-bbq',
  'space:networking-night',
  'space:new-baby',
  'space:new-skills',
  'space:nursery-setup',
  'space:overtime-shift',
  'space:pay-raise-talk',
  'space:payday',
  'space:piano-lessons',
  'space:poker-night',
  'space:quiet-savings',
  'space:refund-check',
  'space:rent-due',
  'space:retirement',
  'space:retirement-fund',
  'space:ring-shopping',
  'space:scholarship-win',
  'space:school-play',
  'space:second-baby',
  'space:side-hustle',
  'space:soccer-season',
  'space:start-of-life',
  'space:startup-bet',
  'space:steady-hustle',
  'space:stock-tip',
  'space:streaming-bill',
  'space:sunset-ahead',
  'space:surprise-bonus',
  'space:tuition-bill',
  'space:wedding-day',
  'space:weekend-trip',
  'space:yard-sale',
  'tile:animal-shelter',
  'tile:backpacking',
  'tile:cooking-contest',
  'tile:fantasy-league',
  'tile:food-blog',
  'tile:indie-album',
  'tile:invention',
  'tile:jingle',
  'tile:lemonade-stand',
  'tile:marathon',
  'tile:mountain-climb',
  'tile:mural',
  'tile:novel',
  'tile:podcast',
  'tile:pottery',
  'tile:prize-pumpkin',
  'tile:rescue-dog',
  'tile:rescue-kitten',
  'tile:surfing',
  'tile:treehouse',
  'tile:triathlon',
  'tile:vegetable-garden',
  'tile:vintage-motorcycle',
  'tile:youth-coach',
  'finance:bank-visit',
  'finance:insurance-office',
  'finance:policy-auto',
  'finance:policy-home',
  'finance:policy-life',
  'finance:trading-floor',
  'stock:green-energy',
  'stock:noodle-chain',
  'stock:orbital-freight',
  'stock:robot-farms',
  'stock:studio-pictures',
  'space:career-fair-return',
  'space:child-benefit',
  'space:dividend-day',
  'space:fender-bender',
  'space:headhunted',
  'space:home-upgrade',
  'space:house-fire',
  'space:layoff-notice',
  'space:rival-swap',
  'space:school-fees',
  'space:sticky-fingers',
  'career:actuary',
  'career:aerospace-engineer',
  'career:agency-owner',
  'career:agronomist',
  'career:apprentice-baker',
  'career:apprentice-mechanic',
  'career:bank-officer',
  'career:baseball-coach',
  'career:brass-musician',
  'career:chai-wallah',
  'career:cricket-coach',
  'career:dispatcher',
  'career:estate-agent',
  'career:geologist',
  'career:grill-cook',
  'career:import-trader',
  'career:investment-analyst',
  'career:journalist',
  'career:line-cook',
  'career:logistics-lead',
  'career:manga-artist',
  'career:market-gardener',
  'career:market-vendor',
  'career:mechanic',
  'career:minibus-owner',
  'career:ministry-official',
  'career:noodle-cook',
  'career:photographer',
  'career:product-manager',
  'career:professor',
  'career:quinoa-farmer',
  'career:radio-host',
  'career:radio-runner',
  'career:record-producer',
  'career:rice-apprentice',
  'career:rice-farmer',
  'career:robotics-engineer',
  'career:rocket-engineer',
  'career:salon-apprentice',
  'career:session-musician',
  'career:site-labourer',
  'career:soccer-coach',
  'career:station-owner',
  'career:sweet-maker',
  'career:trading-generalist',
  'career:veterinarian',
  'career:warehouse-picker',
  'career:wheat-farmer',
  'career:workshop-owner',
  'career:writer',
]
