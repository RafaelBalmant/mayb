import { JsonLd } from "../../components/JsonLd.jsx";
import content from "../../data/content.json";
import { routeMetadata } from "../../lib/seo/metadata.js";
import { siteContent } from "../../lib/seo/site.js";
import { breadcrumbs, pageStructuredData } from "../../lib/seo/structured-data.js";
import { PATHS } from "../../navigation/routes.js";
import { AgendaScreen } from "../../screens/AgendaScreen.jsx";

// The agenda, built at build time (SSG) with the build date; the browser moves on to its own date right after.
// The Docker image is rebuilt every day (docker.yml), so the HTML follows the current month.
export const metadata = routeMetadata("agenda", PATHS.agenda);

const { routes } = content.seo;

export default function AgendaPage() {
  const trail = [
    { name: routes.home.name, path: PATHS.start },
    { name: routes.agenda.name, path: PATHS.agenda },
  ];
  return (
    <>
      <JsonLd data={pageStructuredData([breadcrumbs(trail, siteContent())])} />
      <AgendaScreen builtAt={new Date().toISOString()} />
    </>
  );
}
