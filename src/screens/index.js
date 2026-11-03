import { DetailsScreen } from "./DetailsScreen.jsx";
import { MapScreen } from "./MapScreen.jsx";
import { NextScreen } from "./NextScreen.jsx";
import { OpeningScreen } from "./OpeningScreen.jsx";
import { ResultsScreen } from "./ResultsScreen.jsx";
import { ReviewScreen } from "./ReviewScreen.jsx";
import { SentScreen } from "./SentScreen.jsx";

/**
 * The steps of the face-map flow (page /mapa/): screen id (see data/flow.json) -> component. A new step is one
 * entry here plus one in flow.json. The start page, the agenda and the cases page are pages of their own (src/app/).
 */
export const FLOW_SCREENS = {
  opening: OpeningScreen,
  map: MapScreen,
  results: ResultsScreen,
  next: NextScreen,
  details: DetailsScreen,
  review: ReviewScreen,
  sent: SentScreen,
};
