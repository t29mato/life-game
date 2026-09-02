import type { IconName } from '@domain/model/icons'

import type { GlyphCategory } from './art/glyphs'

/**
 * Collapses every subject the domain can name onto the seventeen category
 * glyphs. This is what the board (and any other small rendering) shows: the
 * glyph says what *kind* of thing a space is — money in, money out, a hazard,
 * a milestone — and the tile's printed label says which one.
 *
 * Three rules keep the mapping honest:
 *
 *   • Ordinary spaces map by their **mechanical effect**, not their flavour —
 *     "Tuition Bill" is an expense arrow, "Poker Night" is a clover — so a
 *     glance at the board reads as gameplay.
 *   • The milestone glyphs (mortarboard, heart, pram, house, sunset) are
 *     **reserved for their beats**. Nursery Setup is an expense, not a pram,
 *     so New Baby stays unmistakable.
 *   • **One picture, one meaning.** An icon that two tiles use for opposite
 *     effects has to give one of them up. A playtester landed on a rising
 *     chart and got "The Bank: borrow a loan?", and drove past a coin and was
 *     charged $1,800 — both of those were this rule being broken. The bank
 *     has its own glyph now, and the coin belongs to payday alone.
 *
 * `effectVocabulary.ts` is what stops the rule from rotting: it states, per
 * effect, which glyphs may stand for it, and a test walks every tile of every
 * edition against it. If a mapping below looks arbitrary, that file explains
 * why it has to be what it is.
 *
 * The `Record<IconName, …>` annotation makes a missing mapping a compile
 * error, exactly like the art registry.
 */
export const categoryOf: Record<IconName, GlyphCategory> = {
  'career:architect': 'career',
  'career:construction-foreman': 'career',
  'career:corporate-lawyer': 'career',
  'career:delivery-courier': 'career',
  'career:food-truck-owner': 'career',
  'career:game-designer': 'career',
  'career:marine-biologist': 'career',
  'career:pastry-chef': 'career',
  'career:pet-groomer': 'career',
  'career:salon-owner': 'career',
  'career:software-engineer': 'career',
  'career:surgeon': 'career',
  'house:cozy-bungalow': 'home',
  'house:lakeside-villa': 'home',
  'house:lavish-estate': 'home',
  'house:modern-duplex': 'home',
  'house:suburban-townhouse': 'home',
  'house:tiny-cabin': 'home',
  'space:apartment-hunt': 'home',
  'space:bidding-war': 'expense',
  'space:big-promotion': 'career',
  // The board only ever prints a bonus on a `payday` tile, and a payday is
  // the coin — never the plain up-arrow a windfall gets.
  'space:bonus-season': 'payday',
  'space:budget-win': 'gain',
  'space:campus-job': 'gain',
  'space:cap-and-gown': 'grad',
  'space:car-trouble': 'hazard',
  'space:cashback-bonus': 'gain',
  'space:client-win': 'gain',
  'space:conference-talk': 'career',
  'space:corner-office': 'career',
  'space:coupon-clipping': 'gain',
  // Only ever Care Costs / Caring for Your Parents: money out, every time.
  'space:family-portrait': 'expense',
  'space:family-vacation': 'travel',
  'space:finals-week': 'study',
  'space:first-job-fair': 'career',
  'space:first-paycheck': 'gain',
  'space:garage-sale': 'luck',
  'space:garden-harvest': 'gain',
  'space:good-review': 'gain',
  'space:grad-job-fair': 'career',
  'space:grocery-run': 'expense',
  'space:group-project': 'study',
  'space:gym-membership': 'expense',
  'space:house-hunting': 'home',
  'space:interest-payout': 'gain',
  'space:late-night-study': 'study',
  'space:lottery-ticket': 'luck',
  'space:lucky-find': 'life',
  'space:market-crash': 'hazard',
  'space:move-in-day': 'home',
  'space:neighborhood-bbq': 'expense',
  // Only ever Five Years In, a crossroads tile where nothing happens at all.
  'space:networking-night': 'career',
  'space:new-baby': 'child',
  'space:new-skills': 'study',
  'space:nursery-setup': 'expense',
  // Only ever The Year You Had — a `tradeYear`, which is symmetric about the
  // die's middle and worth nothing on average. A coin would promise a profit.
  'space:overtime-shift': 'career',
  'space:pay-raise-talk': 'career',
  'space:payday': 'payday',
  'space:piano-lessons': 'expense',
  'space:poker-night': 'luck',
  'space:quiet-savings': 'gain',
  'space:refund-check': 'gain',
  'space:rent-due': 'expense',
  'space:retirement': 'retire',
  // Only ever The Number: the choice to stop working, not a payout.
  'space:retirement-fund': 'retire',
  'space:ring-shopping': 'love',
  'space:scholarship-win': 'gain',
  'space:school-play': 'life',
  'space:second-baby': 'child',
  'space:side-hustle': 'gain',
  'space:soccer-season': 'life',
  'space:start-of-life': 'life',
  'space:startup-bet': 'luck',
  // Only ever Steady Year, where nothing happens. The grind, not a windfall.
  'space:steady-hustle': 'career',
  'space:stock-tip': 'invest',
  'space:streaming-bill': 'expense',
  'space:sunset-ahead': 'retire',
  // The envelope of cash on this board is always the one *you* hand over —
  // Holiday Gifts, Seasonal Gifts, the Diwali Hampers, Godparent of
  // Everything. Every tile that uses it is a `payEach`.
  'space:surprise-bonus': 'expense',
  'space:tuition-bill': 'expense',
  'space:wedding-day': 'love',
  'space:weekend-trip': 'travel',
  'space:yard-sale': 'gain',
  'tile:animal-shelter': 'life',
  'tile:backpacking': 'life',
  'tile:cooking-contest': 'life',
  'tile:fantasy-league': 'life',
  'tile:food-blog': 'life',
  'tile:indie-album': 'life',
  'tile:invention': 'life',
  'tile:jingle': 'life',
  'tile:lemonade-stand': 'life',
  'tile:marathon': 'life',
  'tile:mountain-climb': 'life',
  'tile:mural': 'life',
  'tile:novel': 'life',
  'tile:podcast': 'life',
  'tile:pottery': 'life',
  'tile:prize-pumpkin': 'life',
  'tile:rescue-dog': 'life',
  'tile:rescue-kitten': 'life',
  'tile:surfing': 'life',
  'tile:treehouse': 'life',
  'tile:triathlon': 'life',
  'tile:vegetable-garden': 'life',
  'tile:vintage-motorcycle': 'life',
  'tile:youth-coach': 'life',
  // The bank, not the market. See the third rule above.
  'finance:bank-visit': 'bank',
  'finance:insurance-office': 'insurance',
  'finance:policy-auto': 'insurance',
  'finance:policy-home': 'insurance',
  'finance:policy-life': 'insurance',
  'finance:trading-floor': 'invest',
  'stock:green-energy': 'invest',
  'stock:noodle-chain': 'invest',
  'stock:orbital-freight': 'invest',
  'stock:robot-farms': 'invest',
  'stock:studio-pictures': 'invest',
  'space:career-fair-return': 'career',
  'space:child-benefit': 'gain',
  'space:dividend-day': 'invest',
  'space:fender-bender': 'hazard',
  'space:headhunted': 'career',
  'space:home-upgrade': 'home',
  'space:house-fire': 'hazard',
  'space:layoff-notice': 'hazard',
  'space:rival-swap': 'luck',
  'space:school-fees': 'expense',
  'space:sticky-fingers': 'luck',
  'career:actuary': 'career',
  'career:aerospace-engineer': 'career',
  'career:agency-owner': 'career',
  'career:agronomist': 'career',
  'career:apprentice-baker': 'career',
  'career:apprentice-mechanic': 'career',
  'career:bank-officer': 'career',
  'career:baseball-coach': 'career',
  'career:brass-musician': 'career',
  'career:chai-wallah': 'career',
  'career:cricket-coach': 'career',
  'career:dispatcher': 'career',
  'career:estate-agent': 'career',
  'career:geologist': 'career',
  'career:grill-cook': 'career',
  'career:import-trader': 'career',
  'career:investment-analyst': 'career',
  'career:journalist': 'career',
  'career:line-cook': 'career',
  'career:logistics-lead': 'career',
  'career:manga-artist': 'career',
  'career:market-gardener': 'career',
  'career:market-vendor': 'career',
  'career:mechanic': 'career',
  'career:minibus-owner': 'career',
  'career:ministry-official': 'career',
  'career:noodle-cook': 'career',
  'career:photographer': 'career',
  'career:product-manager': 'career',
  'career:professor': 'career',
  'career:quinoa-farmer': 'career',
  'career:radio-host': 'career',
  'career:radio-runner': 'career',
  'career:record-producer': 'career',
  'career:rice-apprentice': 'career',
  'career:rice-farmer': 'career',
  'career:robotics-engineer': 'career',
  'career:rocket-engineer': 'career',
  'career:salon-apprentice': 'career',
  'career:session-musician': 'career',
  'career:site-labourer': 'career',
  'career:soccer-coach': 'career',
  'career:station-owner': 'career',
  'career:sweet-maker': 'career',
  'career:trading-generalist': 'career',
  'career:veterinarian': 'career',
  'career:warehouse-picker': 'career',
  'career:wheat-farmer': 'career',
  'career:workshop-owner': 'career',
  'career:writer': 'career',
}
