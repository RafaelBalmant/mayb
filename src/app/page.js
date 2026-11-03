import { LegacyHashLinks } from "../components/LegacyHashLinks.jsx";
import { TrackScreen } from "../components/TrackScreen.jsx";
import { texts } from "../content.js";
import content from "../data/content.json";
import { pageMetadata } from "../lib/seo/metadata.js";
import { loadRating } from "../lib/server/rating.js";
import { PATHS } from "../navigation/routes.js";
import { StartScreen } from "../screens/StartScreen.jsx";

// Start page, built at build time (SSG). The rating comes from the file saved by `npm run reviews`.
export const metadata = pageMetadata({
  title: texts.general.pageTitle,
  description: content.seo.description,
  path: PATHS.start,
  ogTitle: content.seo.content.title,
});

export default function StartPage() {
  return (
    <>
      <StartScreen rating={loadRating()} pages={content.pages.list} />
      <TrackScreen name="start" />
      <LegacyHashLinks />
    </>
  );
}
