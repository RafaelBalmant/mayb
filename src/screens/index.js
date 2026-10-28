import { AgendaScreen } from "./AgendaScreen.jsx";
import { DetailsScreen } from "./DetailsScreen.jsx";
import { MapScreen } from "./MapScreen.jsx";
import { NextScreen } from "./NextScreen.jsx";
import { OpeningScreen } from "./OpeningScreen.jsx";
import { ResultsScreen } from "./ResultsScreen.jsx";
import { ReviewScreen } from "./ReviewScreen.jsx";
import { SentScreen } from "./SentScreen.jsx";
import { StartScreen } from "./StartScreen.jsx";

/** Screen id (see data/flow.json) -> component. A new screen is one entry here plus one in flow.json. */
export const SCREENS = {
  start: StartScreen,
  agenda: AgendaScreen,
  opening: OpeningScreen,
  map: MapScreen,
  results: ResultsScreen,
  next: NextScreen,
  details: DetailsScreen,
  review: ReviewScreen,
  sent: SentScreen,
};
