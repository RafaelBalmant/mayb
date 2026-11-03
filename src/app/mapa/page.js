import { CasesProvider } from "../../components/CasesContext.jsx";
import { FacesProvider } from "../../faces/FacesContext.jsx";
import { routeMetadata } from "../../lib/seo/metadata.js";
import { loadAllCases } from "../../lib/server/cases.js";
import { loadFaces } from "../../lib/server/faces.js";
import { PATHS } from "../../navigation/routes.js";
import { FaceFlow } from "../../screens/FaceFlow.jsx";

// The face-map flow: one page whose steps run in the browser (the answers stay in this tab). Never in Google: it is
// a form, not content. The drawings and the cases are read at build time.
export const metadata = routeMetadata("map", PATHS.flow, false);

export default function MapPage() {
  return (
    <FacesProvider faces={loadFaces()}>
      <CasesProvider cases={loadAllCases()}>
        <FaceFlow />
      </CasesProvider>
    </FacesProvider>
  );
}
