import { state } from "../state.js";
import { AREA_BY_CODE, t, tn } from "../content.js";
import { app, bar, esc, brand, paragraphs } from "../utils.js";
import { goTo } from "../main.js";

// Between the map and the details: explains the next step and lets the visitor choose.
export function renderNext() {
  const names = state.areas.map(a => `<li>${esc(AREA_BY_CODE[a.code].name)}</li>`).join("");

  app.className = "app";
  app.innerHTML = `${brand()}
    <h1 class="question-big">${esc(t("next.title"))}</h1>
    <div class="block">
      <h3>${esc(tn("next.marked", state.areas.length))}</h3>
      <ul class="summary-marked">${names}</ul>
    </div>
    ${paragraphs(t("next.explanation"), "explain")}
    <div class="routes">
      <button class="route primary" id="more-info">
        <strong>${esc(t("next.moreInfo"))}</strong>
        <span>${esc(t("next.moreInfoDetail"))}</span>
      </button>
      <button class="route" id="talk">
        <strong>${esc(t("next.talk"))}</strong>
        <span>${esc(t("next.talkDetail"))}</span>
      </button>
    </div>`;

  bar.innerHTML = `<button class="btn secondary" id="back">${esc(t("next.back"))}</button>`;

  document.getElementById("more-info").onclick = () => goTo("details");
  document.getElementById("talk").onclick = () => goTo("review");
  document.getElementById("back").onclick = () => goTo("map");
}
