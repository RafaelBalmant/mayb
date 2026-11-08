// The prototype page: every page of the site in one HTML file, switched by #name (see shims/navigation.js).
import { createRoot } from "react-dom/client";
import { CasesProvider } from "../../src/components/CasesContext.jsx";
import { ClientProviders } from "../../src/components/ClientProviders.jsx";
import { FacesProvider } from "../../src/faces/FacesContext.jsx";
import { AGENDA_ENABLED } from "../../src/config.js";
import { useRouterBridge } from "../../src/navigation/RouterProvider.jsx";
import { PATHS } from "../../src/navigation/routes.js";
import { AgendaScreen } from "../../src/screens/AgendaScreen.jsx";
import { CasesScreen } from "../../src/screens/CasesScreen.jsx";
import { FaceFlow } from "../../src/screens/FaceFlow.jsx";
import { StartScreen } from "../../src/screens/StartScreen.jsx";
import { data } from "prototype:data";

const builtAt = new Date().toISOString();

function Pages() {
  const { pathname } = useRouterBridge();
  if (AGENDA_ENABLED && pathname === PATHS.agenda) return <AgendaScreen builtAt={builtAt} />;
  if (pathname === PATHS.cases) return <CasesScreen />;
  if (pathname === PATHS.flow) return <FaceFlow />;
  return <StartScreen rating={data.rating} pages={data.pages} />;
}

createRoot(document.getElementById("root")).render(
  <FacesProvider faces={data.faces}>
    <CasesProvider cases={data.cases}>
      <ClientProviders>
        <Pages />
      </ClientProviders>
    </CasesProvider>
  </FacesProvider>,
);
