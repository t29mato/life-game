import type { CareerFamily } from '../../rules/careerFamily'
import type { TradeYearStories } from '../../rules/tradeYear'

/**
 * What each face of the die did to a research year, by family, worst first.
 *
 * `TRADE_YEAR_STORIES` in the engine is written for a world of restaurants,
 * building sites and radio stations, and it is good writing — but the generic
 * science set has to cover a rocket engineer and a marine biologist at once,
 * so it says "the grant is not renewed" where this edition needs to say which
 * grant, by how much, and what the year looked like afterwards. The engine
 * takes an edition's own table for exactly this reason (see `tradeYearStoriesFor`),
 * and this is the highest-flavour-return file in the whole edition: a
 * `tradeYear` tile is one of the two guaranteed moments a game spends on the
 * work a player actually does.
 *
 * Seven families are written here, which is every family this board's three
 * shelves can deal. `pitch` is not among them and falls back to the global
 * table, which is correct rather than lazy: there is no sporting career on
 * this board to have a season.
 *
 * The calibration is the concept document's own, held to its own test — a
 * researcher reading face 1 should wince, and reading face 6 should be able to
 * name the person it happened to.
 */
export const RESEARCHER_TRADE_YEAR_STORIES: Partial<Record<CareerFamily, TradeYearStories>> = {
  /** The laboratory: academic and corporate alike, since both live on results. */
  science: [
    'Your biggest result fails to replicate in two other laboratories. The correction is three sentences long and follows you to every conference for a decade.',
    'The renewal scores one point below the funding line. The year runs on leftover reagents and the goodwill of the department administrator.',
    'A rival group publishes your idea first, done slightly worse. The second reviewer asks why you did not cite them.',
    'The side project a student ran at weekends turns out to be the real discovery. The next proposal writes itself.',
    'Your method spreads. Half the field cites you in their second paragraph, and the invitations start paying their own way.',
    'The phone rings at five in the morning, from Stockholm. Everyone who rejected the original paper writes to congratulate you.',
  ],
  /** The field station, where the year is decided by weather, permits and a boat. */
  field: [
    'The research vessel spends the entire sampling season in dry dock. Twelve years of continuous data now has a hole in it with your name on it.',
    'The site permits are revoked in March and granted again in November. The field season happens in neither.',
    'Rain, mud, and a generator that dies twice. The data is fine, the paper is fine, and nobody will ever ask about either.',
    'A camera trap you forgot to collect catches something nobody has ever photographed. The clip funds three seasons.',
    'Yours turns out to be the only station that recorded the event. Suddenly everyone needs your data, on your terms.',
    'The species that carries your name turns out to matter enormously. Film crews now file permits to visit your mud.',
  ],
  /** The communications desk: journals, museums, and the camera. */
  studio: [
    'You explain a preprint on live television. The preprint is retracted the following week. The clip is not.',
    'The exhibition you gave two years to is put back a year, and every loan agreement in it expires in between.',
    'The piece is careful, accurate and good, and it runs in a week when the news is about something else entirely.',
    'A short explainer you wrote in an afternoon is picked up by science teachers in every prefecture.',
    'Your name is on the series everybody is talking about, and what you can ask for doubles.',
    'Your explainer outlives the news cycle and becomes the thing teachers show first. The licensing cheque arrives quarterly, forever.',
  ],
  /** The clinic, where the work is measured in people rather than in papers. */
  care: [
    'A patient comes to harm on a study you signed off. It is investigated for eleven months, and all eleven of them are yours.',
    'Recruitment stalls at four in ten. The trial is extended, the funding is not, and the statistician stops answering.',
    'The result is a clean, careful null. It is correct, it is useful, and it takes nineteen months to place.',
    'The interim analysis is good enough that the committee lets you carry on, and the ward begins referring on its own.',
    'The trial reads out positive. The guideline committee asks for your slides before the paper is even out.',
    'The drug is approved. Somewhere there is a person alive because of a consent form you rewrote in a corridor.',
  ],
  /** The corridor the money comes down: programmes, patents, and centres. */
  office: [
    'The grant you shepherded is audited, and a spreadsheet nobody has opened in four years turns out to have been wrong in your favour.',
    'The ministry reorganises its programmes. Everything you built a case for is now in somebody else\'s column.',
    'A quiet year of forms filled in correctly. Nothing goes wrong, nobody notices, and that is the job.',
    'A funding call you argued for is created, and eleven groups you know apply to it.',
    'The centre passes its mid-term review with a recommendation to expand, and the panel says so in writing.',
    'The programme is renewed for ten more years, and your name is on the first page of the document that did it.',
  ],
  /** The machine shop and the core facility: everyone else's results, kept true. */
  works: [
    'The instrument everybody depends on fails in a way the manufacturer has never seen, and the part is made in one factory, abroad.',
    'A power cut takes the building at three in the morning. The freezers hold; the six-month experiment does not.',
    'A year of steady maintenance and no drama whatsoever, which nobody has ever written an acknowledgement for.',
    'You fix in an afternoon a fault that had a whole group stuck for a year, and they say so at their next talk.',
    'A part you machined by hand is copied by four other institutes, who then ask you to make theirs as well.',
    'The machine you built and nobody funded turns out to be the only one in the country. Time on it is booked two years out.',
  ],
  /** The research brewery, where the year is a harvest and a fermentation. */
  kitchen: [
    'Something gets into the strain collection. Two hundred lines, thirty years of work, and a very long list of what survived.',
    'The season\'s rice is poor everywhere, so every trial you had planned this year becomes a trial of the rice instead.',
    'The batch is technically flawless and tastes of nothing in particular. The paper says so, politely.',
    'A strain you kept for no particular reason turns out to make the flavour the whole industry has been chasing.',
    'A brewery follows your protocol, wins the national prize with it, and says publicly where it came from.',
    'The strain is licensed by half the industry. The royalty arrives every year, and so does a case of the result.',
  ],
}
