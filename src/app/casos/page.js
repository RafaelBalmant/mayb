import { CasesProvider } from "../../components/CasesContext.jsx";
import { MAP_ENABLED } from "../../config.js";
import { routeMetadata } from "../../lib/seo/metadata.js";
import { loadAllCases } from "../../lib/server/cases.js";
import { PATHS } from "../../navigation/routes.js";
import { CasesScreen } from "../../screens/CasesScreen.jsx";

// Real cases, built at build time (SSG) from data/cases.json and public/cases/. Behind the map switch: out of Google
// (and of the sitemap) while MAP_ENABLED is off.
export const metadata = routeMetadata("cases", PATHS.cases, MAP_ENABLED);

export default function CasesPage() {
  return (
    <CasesProvider cases={loadAllCases()}>
      <CasesScreen />
    </CasesProvider>
  );
}
