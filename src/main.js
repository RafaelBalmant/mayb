import "./theme.css";
import "./style.css";
import { t } from "./content.js";
import { state, ui, save } from "./state.js";
import { renderOpening } from "./screens/opening.js";
import { renderMap } from "./screens/map.js";
import { renderNext } from "./screens/next.js";
import { renderDetails } from "./screens/details.js";
import { renderReview } from "./screens/review.js";
import { renderSent } from "./screens/sent.js";

/** Shows the right screen for the current state. */
export function render() {
  save();
  if (ui.screen === "opening" || !state.face) { ui.screen = "opening"; return renderOpening(); }
  if (ui.screen === "next" && state.areas.length) return renderNext();
  if (ui.screen === "details" && state.areas.length) return renderDetails();
  if (ui.screen === "review" && state.areas.length) return renderReview();
  if (ui.screen === "sent" && state.areas.length) return renderSent();
  ui.screen = "map";
  return renderMap();
}

/** Switches screen and scrolls back to the top. */
export function goTo(screen, index = 0) {
  ui.screen = screen;
  ui.index = index;
  render();
  window.scrollTo(0, 0);
}

document.title = t("general.pageTitle");
render();
