import { render } from "preact";
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
