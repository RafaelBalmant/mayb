import { state, save } from "../state.js";
import { t } from "../content.js";
import { faceSvg } from "../faces/index.js";
import { app, bar, esc, brand, paragraphs } from "../utils.js";
import { goTo } from "../main.js";

// Opening: the question, what comes next and the choice of face.
export function renderOpening() {
  // art only, without the tappable zones
  const thumbnail = face => faceSvg(face, "front").replace(/<g class="zones">[\s\S]*?<\/g>/, "");
  const option = face =>
    `<button data-face="${face}" aria-pressed="${state.face === face}">${thumbnail(face)}${esc(t(`opening.${face}`))}</button>`;

  app.className = "app";
  app.innerHTML = `${brand()}
    <h1 class="question-big">${esc(t("opening.title"))}</h1>
    ${paragraphs(t("opening.explanation"), "explain")}
    <section class="block">
      <h3>${esc(t("opening.chooseFace"))}</h3>
      <div class="choice">${option("female")}${option("male")}</div>
    </section>`;

  bar.innerHTML = `<button class="btn primary" id="start" ${state.face ? "" : "disabled"}>${
    esc(t(state.face ? "opening.start" : "opening.startWithoutFace"))}</button>`;

  app.querySelectorAll("[data-face]").forEach(b => {
    b.querySelector("svg").setAttribute("aria-hidden", "true");
    b.onclick = () => { state.face = b.dataset.face; save(); renderOpening(); };
  });
  document.getElementById("start").onclick = () => goTo("map");
}
