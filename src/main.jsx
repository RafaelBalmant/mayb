import { render } from "preact";
import "@fontsource/figtree/400.css";
import "@fontsource/figtree/500.css";
import "@fontsource/figtree/600.css";
import "@fontsource/figtree/700.css";
import "@fontsource/young-serif/400.css";
import "./theme.css";
import "./style.css";
import { App } from "./App.jsx";
import { t } from "./content.js";
import { StoreProvider } from "./store/StoreProvider.jsx";

document.title = t("general.pageTitle");

render(
  <StoreProvider>
    <App />
  </StoreProvider>,
  document.getElementById("root"),
);
