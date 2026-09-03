import type { LifeTile } from '../../model/types'

/**
 * Thirty-six small glories of a French research life — and the publication
 * record, which is the whole reason this deck needed no new machinery.
 *
 * A LIFE tile is already exactly the right mechanic for a paper: a one-off
 * keepsake, worth money at the final settlement, and stealable by whoever is
 * winning — which is what Sticky Fingers becomes when a co-author presents
 * your figure at a meeting you could not get the credit line to attend. No
 * counter, no second currency: the deck *is* the record, and a number would
 * make it a spreadsheet.
 *
 * The value curve is the country board's, slot for slot. Which values are
 * common and where the single outlier sits was measured rather than chosen,
 * so this deck inherits all of it and changes only the stories — each one held
 * to the same test: would somebody who has actually done this wince, or grin,
 * in recognition.
 */
export const LIFE_TILE_DECK: readonly LifeTile[] = [
  { id: 'tile-frr-first-author', title: 'The Paper With Your Name First', value: 15_000, icon: 'tile:novel' },
  { id: 'tile-frr-method-adopted', title: 'Everyone Uses Your Protocol Now', value: 40_000, icon: 'tile:invention' },
  { id: 'tile-frr-lab-cat', title: 'Adopted the Cat From the Loading Bay', value: 12_000, icon: 'tile:rescue-kitten' },
  { id: 'tile-frr-campaign-at-sea', title: 'A Campaign at Sea Out of Brest', value: 14_000, icon: 'tile:surfing' },
  { id: 'tile-frr-rooftop-plot', title: 'The Trial Plot on the Roof', value: 10_000, icon: 'tile:vegetable-garden' },
  { id: 'tile-frr-tasting-panel', title: 'Trained the Tasting Panel to Agree', value: 18_000, icon: 'tile:cooking-contest' },
  { id: 'tile-frr-field-season', title: 'The Season Where Nothing Broke', value: 25_000, icon: 'tile:backpacking' },
  { id: 'tile-frr-radio-series', title: 'The Radio Series They Repeated All Summer', value: 35_000, icon: 'tile:indie-album' },
  { id: 'tile-frr-built-the-rig', title: 'Built It From the Workshop Offcuts', value: 16_000, icon: 'tile:treehouse' },
  { id: 'tile-frr-student-paper', title: "Your Doctoral Student's Thesis, Better Than Yours", value: 45_000, icon: 'tile:novel' },
  { id: 'tile-frr-ran-the-congress', title: 'Ran the Congress and Nothing Went Wrong', value: 22_000, icon: 'tile:triathlon' },
  { id: 'tile-frr-open-day', title: 'Opened the Laboratory to the Village', value: 11_000, icon: 'tile:animal-shelter' },
  { id: 'tile-frr-summer-school', title: 'Taught the Summer School in the Alps', value: 20_000, icon: 'tile:lemonade-stand' },
  { id: 'tile-frr-cover-image', title: 'The Cover of the Journal, in Colour', value: 30_000, icon: 'tile:mural' },
  { id: 'tile-frr-clear-week', title: 'A Clear Week at the Observatory', value: 60_000, icon: 'tile:mountain-climb' },
  { id: 'tile-frr-public-lecture', title: 'The Evening Lecture Nobody Could Get Into', value: 50_000, icon: 'tile:podcast' },
  { id: 'tile-frr-instrument', title: 'The Instrument Half of Europe Ordered', value: 90_000, icon: 'tile:invention' },
  { id: 'tile-frr-lab-lunch', title: 'The Laboratory Lunch That Ran to Four', value: 10_000, icon: 'space:neighborhood-bbq' },
  { id: 'tile-frr-freezer-rescue', title: 'Saved the Freezer During the Power Cut', value: 12_000, icon: 'tile:rescue-dog' },
  { id: 'tile-frr-replicated', title: 'Two Laboratories Reproduced It', value: 55_000, icon: 'tile:novel' },
  { id: 'tile-frr-glassware', title: 'Learned to Blow Your Own Glass', value: 18_000, icon: 'tile:pottery' },
  { id: 'tile-frr-science-club', title: 'Coached the Lycée Science Club', value: 15_000, icon: 'tile:youth-coach' },
  { id: 'tile-frr-named-species', title: 'Something in the Museum Has Your Name', value: 70_000, icon: 'tile:jingle' },
  { id: 'tile-frr-prize-crystal', title: 'The Crystal That Finally Grew', value: 13_000, icon: 'tile:prize-pumpkin' },
  { id: 'tile-frr-dataset', title: 'The Database Everyone Downloads', value: 150_000, icon: 'tile:invention' },
  { id: 'tile-frr-restored-spectrometer', title: 'Restored the Machine From the Cellar', value: 42_000, icon: 'tile:vintage-motorcycle' },
  { id: 'tile-frr-camera-trap', title: 'The Trap You Left in the Forest', value: 12_000, icon: 'tile:rescue-dog' },
  { id: 'tile-frr-canteen-table', title: 'The Canteen Table That Solved It', value: 16_000, icon: 'space:conference-talk' },
  { id: 'tile-frr-collaboration', title: 'A Co-Author Who Became a Friend', value: 32_000, icon: 'space:sunset-ahead' },
  { id: 'tile-frr-museum-room', title: 'Designed a Room at the Museum', value: 48_000, icon: 'tile:mural' },
  { id: 'tile-frr-four-students', title: 'Every One of Your Students Landed', value: 14_000, icon: 'tile:rescue-kitten' },
  { id: 'tile-frr-twelve-weeks', title: 'The Whole of August in the Laboratory', value: 11_000, icon: 'tile:marathon' },
  { id: 'tile-frr-review-article', title: 'The Review Article That Would Not Die', value: 24_000, icon: 'tile:food-blog' },
  { id: 'tile-frr-long-walk', title: 'Solved It Walking in the Vercors', value: 28_000, icon: 'tile:backpacking' },
  { id: 'tile-frr-rescued-archive', title: 'Saved the Archive From the Skip', value: 65_000, icon: 'tile:indie-album' },
  { id: 'tile-frr-long-series', title: 'Sixty Years of Unbroken Records', value: 80_000, icon: 'tile:vegetable-garden' },
]
