import { TrackScreen } from "../components/TrackScreen.jsx";
import content from "../data/content.json";
import { siteContent } from "../lib/seo/site.js";
import { NotFoundPage } from "../screens/ServicePage.jsx";

// Written as 404.html; nginx answers it, with status 404, for any address that does not exist.
export const metadata = {
  title: content.pages.notFound.title,
  description: content.pages.notFound.text,
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <NotFoundPage content={siteContent()} />
      <TrackScreen />
    </>
  );
}
