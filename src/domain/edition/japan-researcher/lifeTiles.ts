import type { LifeTile } from '../../model/types'

/**
 * Thirty-six small glories of a research life — and the publication record,
 * which is the whole reason this deck needed no new machinery.
 *
 * A LIFE tile is already exactly the right mechanic for a paper: a one-off
 * keepsake, worth money at the final settlement, and stealable by whoever is
 * winning — which is what Sticky Fingers becomes when the co-author who
 * presented your figure at a meeting you could not afford to attend turns out
 * to have presented it as theirs. No h-index, no second currency, no counter:
 * the deck *is* the record, and a number would make it a spreadsheet.
 *
 * The value curve is the tuned one, slot for slot, at the country board's
 * scale — which values are common and where the single outlier sits is
 * measured, and this deck inherits all of it. Only the stories are new, and
 * every one of them is held to the same test: would somebody who has actually
 * done this wince, or grin, in recognition.
 */
export const LIFE_TILE_DECK: readonly LifeTile[] = [
  { id: 'tile-jpr-first-author', title: 'Your First First-Author Paper', value: 1_500_000, icon: 'tile:novel' },
  { id: 'tile-jpr-method-adopted', title: 'Your Method Became the Standard One', value: 4_000_000, icon: 'tile:invention' },
  { id: 'tile-jpr-lab-cat', title: 'Adopted the Stray Behind the Building', value: 1_200_000, icon: 'tile:rescue-kitten' },
  { id: 'tile-jpr-cruise', title: 'Six Weeks on the Research Vessel', value: 1_400_000, icon: 'tile:surfing' },
  { id: 'tile-jpr-rooftop-plot', title: 'Grew the Rooftop Trial Plot', value: 1_000_000, icon: 'tile:vegetable-garden' },
  { id: 'tile-jpr-live-demo', title: 'The Talk Where the Live Demo Worked', value: 1_800_000, icon: 'space:conference-talk' },
  { id: 'tile-jpr-field-season', title: 'A Field Season That Went Exactly Right', value: 2_500_000, icon: 'tile:backpacking' },
  { id: 'tile-jpr-textbook-figure', title: 'Your Figure Is in the Textbook Now', value: 3_500_000, icon: 'tile:mural' },
  { id: 'tile-jpr-built-the-rig', title: 'Built the Rig Out of Scrap and It Worked', value: 1_600_000, icon: 'tile:treehouse' },
  { id: 'tile-jpr-student-paper', title: "Your Student's First Paper — Better Than Yours", value: 4_500_000, icon: 'tile:novel' },
  { id: 'tile-jpr-conference-run', title: 'Ran the Conference and Nothing Went Wrong', value: 2_200_000, icon: 'tile:triathlon' },
  { id: 'tile-jpr-open-day', title: 'Ran the Laboratory Open Day', value: 1_100_000, icon: 'tile:animal-shelter' },
  { id: 'tile-jpr-summer-school', title: 'Taught the Summer School', value: 2_000_000, icon: 'tile:lemonade-stand' },
  { id: 'tile-jpr-cover-image', title: 'Your Image Made the Cover', value: 3_000_000, icon: 'tile:mural' },
  { id: 'tile-jpr-replicated', title: 'Two Other Groups Replicated It', value: 6_000_000, icon: 'tile:novel' },
  { id: 'tile-jpr-public-lecture', title: 'The Public Lecture That Sold Out', value: 5_000_000, icon: 'tile:podcast' },
  { id: 'tile-jpr-instrument', title: 'Invented an Instrument Everyone Now Owns', value: 9_000_000, icon: 'tile:invention' },
  { id: 'tile-jpr-lab-dinner', title: 'The Lab Dinner Nobody Wanted to End', value: 1_000_000, icon: 'space:neighborhood-bbq' },
  { id: 'tile-jpr-freezer-rescue', title: 'Saved the Freezer During the Blackout', value: 1_200_000, icon: 'tile:rescue-dog' },
  { id: 'tile-jpr-observing-run', title: 'A Clear Week on the Mountain Telescope', value: 5_500_000, icon: 'tile:mountain-climb' },
  { id: 'tile-jpr-glassware', title: 'Blew Your Own Glassware, Finally', value: 1_800_000, icon: 'tile:pottery' },
  { id: 'tile-jpr-science-club', title: 'Coached the School Science Club', value: 1_500_000, icon: 'tile:youth-coach' },
  { id: 'tile-jpr-named-species', title: 'A Species Carries Your Name', value: 7_000_000, icon: 'tile:jingle' },
  { id: 'tile-jpr-prize-specimen', title: 'Grew the Prize Crystal', value: 1_300_000, icon: 'tile:prize-pumpkin' },
  { id: 'tile-jpr-dataset', title: 'The Dataset the Whole Field Uses', value: 15_000_000, icon: 'tile:invention' },
  { id: 'tile-jpr-restored-instrument', title: 'Restored the 1950s Spectrometer', value: 4_200_000, icon: 'tile:vintage-motorcycle' },
  { id: 'tile-jpr-camera-trap', title: 'The Camera Trap You Forgot to Collect', value: 1_200_000, icon: 'tile:rescue-dog' },
  { id: 'tile-jpr-lab-lunch', title: 'The Bento That Ran the Lab Meeting', value: 1_600_000, icon: 'tile:cooking-contest' },
  { id: 'tile-jpr-collaboration', title: 'A Collaboration That Became a Friendship', value: 3_200_000, icon: 'space:sunset-ahead' },
  { id: 'tile-jpr-museum-room', title: 'Designed a Room at the Science Museum', value: 4_800_000, icon: 'tile:mural' },
  { id: 'tile-jpr-fostered-students', title: 'Four Students, Four Good Posts', value: 1_400_000, icon: 'tile:rescue-kitten' },
  { id: 'tile-jpr-stamp-card', title: 'Twelve Straight Weeks in the Building', value: 1_100_000, icon: 'tile:marathon' },
  { id: 'tile-jpr-review-article', title: 'Wrote the Review Everyone Cites', value: 2_400_000, icon: 'tile:food-blog' },
  { id: 'tile-jpr-long-walk', title: 'Walked Out the Problem Over Three Days', value: 2_800_000, icon: 'tile:backpacking' },
  { id: 'tile-jpr-rebuilt-archive', title: 'Rescued the Institute Archive', value: 6_500_000, icon: 'tile:indie-album' },
  { id: 'tile-jpr-long-series', title: 'A Data Series Now Sixty Years Long', value: 8_000_000, icon: 'tile:vegetable-garden' },
]
