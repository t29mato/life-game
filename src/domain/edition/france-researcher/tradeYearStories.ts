import type { CareerFamily } from '../../rules/careerFamily'
import type { TradeYearStories } from '../../rules/tradeYear'

/**
 * What each face of the die did to a research year, by family, worst first.
 *
 * `TRADE_YEAR_STORIES` in the engine is written for a world of restaurants,
 * building sites and radio stations, and it is good writing — but its generic
 * science set has to cover a rocket engineer and a marine biologist at once,
 * so it says "the grant is not renewed" where this edition needs to say which
 * call, by how many points, and what the year looked like afterwards. The
 * engine takes an edition's own table for exactly this reason (see
 * `tradeYearStoriesFor`), and this is the highest-flavour-return file in the
 * whole edition: a `tradeYear` tile is one of the two guaranteed moments a
 * game spends on the work the player actually does.
 *
 * These are the French versions of that year. The evaluation agency's grade,
 * the national call that funds one project in seven, the summer everything
 * stops because everything stops — a reader who has worked in a French
 * laboratory should recognise the year before they reach the end of the
 * sentence, and a reader who has not should still get the joke.
 *
 * Seven families are written here, which is every family this board's three
 * shelves can deal. `pitch` is not among them and falls back to the global
 * table, which is correct rather than lazy: there is no sporting career on
 * this board to have a season.
 */
export const RESEARCHER_FRANCE_TRADE_YEAR_STORIES: Partial<Record<CareerFamily, TradeYearStories>> = {
  /** The laboratory: public and private alike, since both live on results. */
  science: [
    'Your headline result fails to replicate in two other laboratories. The correction is three sentences long and follows you to every conference for a decade.',
    'The national call funds one project in seven, and yours is ranked eighth. The year runs on leftover consumables and the goodwill of the laboratory manager.',
    'A group in another country publishes your idea first, done slightly worse. The second referee asks why you did not cite them.',
    'The side project a student ran at weekends turns out to be the real discovery. The next proposal writes itself.',
    'Your method spreads. Half the field cites you in their second paragraph, and the invitations start paying their own way.',
    'The telephone rings at five in the morning, from Stockholm. Everyone who rejected the original paper writes to congratulate you.',
  ],
  /** The station, where the year is decided by weather, permits and a boat. */
  field: [
    'The research vessel spends the whole campaign in dry dock in Brest. Twelve years of continuous data now has a hole in it with your name on it.',
    'The prefecture revokes the site permits in March and grants them again in November. The season happens in neither.',
    'Rain, mud, and a generator that dies twice. The data is fine, the paper is fine, and nobody will ever ask about either.',
    'A camera trap you forgot to collect catches something nobody has ever photographed. The clip funds three seasons.',
    'Yours turns out to be the only station that recorded the event. Suddenly everyone in Europe needs your data, on your terms.',
    'The species that carries your name turns out to matter enormously. Film crews now apply to the prefecture to visit your mud.',
  ],
  /** The desk the public hears it from: the press, the museum, the camera. */
  studio: [
    'You explain a preprint on the eight o\'clock news. The preprint is retracted the following week. The clip is not.',
    'The exhibition you gave two years to is put back a year, and every loan agreement in it expires in between.',
    'The piece is careful, accurate and good, and it runs in a week when the news is about something else entirely.',
    'A short explainer written in an afternoon is picked up by teachers in every academy in the country.',
    'Your name is on the series everybody is talking about, and what you can ask for doubles.',
    'Your explainer outlives the news cycle and becomes the thing teachers show first. The rights cheque arrives every quarter, forever.',
  ],
  /** The clinic, where the work is measured in people rather than in papers. */
  care: [
    'A patient comes to harm on a study you signed. It is investigated for eleven months, and all eleven of them are yours.',
    'Recruitment stalls at four in ten. The trial is extended, the funding is not, and the statistician stops answering.',
    'The result is a clean, careful null. It is correct, it is useful, and it takes nineteen months to place.',
    'The interim analysis is good enough that the committee lets you carry on, and two other hospitals ask to join.',
    'The trial reads out positive. The guideline committee asks for your slides before the paper is even out.',
    'The treatment is authorised. Somewhere there is a person alive because of a consent form you rewrote in a corridor.',
  ],
  /** The corridor the money comes down: ministries, patents, programmes. */
  office: [
    'The evaluation agency grades the unit B, and a decision taken four hundred kilometres away removes two posts from a laboratory you have run for a decade.',
    'The ministry reorganises its programmes. Everything you built a case for is now in somebody else\'s column.',
    'A quiet year of forms filled in correctly. Nothing goes wrong, nobody notices, and that is the job.',
    'A call you argued for is created, and eleven laboratories you know apply to it.',
    'The unit passes its evaluation with a recommendation to expand, and the panel puts it in writing.',
    'The programme is renewed for ten more years, and your name is on the first page of the document that did it.',
  ],
  /** The workshop and the platform: everyone else's results, kept true. */
  works: [
    'The instrument everybody depends on fails in a way the manufacturer has never seen, and the part is made in one factory, in another country.',
    'A power cut takes the building at three in the morning. The freezers hold; the six-month experiment does not.',
    'A year of steady maintenance and no drama whatsoever, which nobody has ever written an acknowledgement for.',
    'You fix in an afternoon a fault that had a whole group stuck for a year, and they say so at their next seminar.',
    'A part you machined by hand is copied by four other laboratories, who then ask you to make theirs as well.',
    'The instrument you built and nobody funded turns out to be the only one in Europe. Time on it is booked two years out.',
  ],
  /** The sensory laboratory and the food group, where a year is a harvest. */
  kitchen: [
    'Something gets into the strain collection. Two hundred lines, thirty years of work, and a very long list of what survived.',
    'The harvest is poor in every region at once, so every trial you had planned becomes a trial of the harvest instead.',
    'The batch is technically flawless and tastes of nothing in particular. The report says so, politely.',
    'A strain kept for no particular reason turns out to make the flavour the whole industry has been chasing.',
    'A house follows your protocol, wins the national prize with it, and says publicly where it came from.',
    'The process is licensed by half the industry. The royalty arrives every year, and so does a case of the result.',
  ],
}
