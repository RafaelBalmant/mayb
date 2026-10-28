import { DetailsScreen } from "./DetailsScreen.jsx";
import { MapScreen } from "./MapScreen.jsx";
import { NextScreen } from "./NextScreen.jsx";
import { OpeningScreen } from "./OpeningScreen.jsx";
import { ReviewScreen } from "./ReviewScreen.jsx";
import { SentScreen } from "./SentScreen.jsx";

/** Screen id (see data/flow.json) -> component. A new screen is one entry here plus one in flow.json. */
export const SCREENS = {
  opening: OpeningScreen,
  map: MapScreen,
  next: NextScreen,
  details: DetailsScreen,
  review: ReviewScreen,
  sent: SentScreen,
};
