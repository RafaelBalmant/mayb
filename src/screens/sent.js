import { state, restart } from "../state.js";
import { t } from "../content.js";
import { buildMessage, whatsappLink } from "../summary.js";
import { app, bar, esc, brand, paragraphs } from "../utils.js";
import { goTo } from "../main.js";

// After sending: what happens now and a way out in case WhatsApp did not open.
export function renderSent() {
  app.className = "app";
  app.innerHTML = `${brand()}
    <h1 class="question-big">${esc(t("sent.title"))}</h1>
    ${paragraphs(t("sent.explanation"), "explain")}
    <section class="block">
      <h3>${esc(t("sent.didNotOpen"))}</h3>
      <a class="btn" id="again" href="${esc(whatsappLink(buildMessage(state)))}" target="_blank" rel="noopener">${esc(t("sent.openAgain"))}</a>
    </section>
    <p class="sub note">${esc(t("sent.privacy"))}</p>
    <button type="button" class="skip" id="erase">${esc(t("sent.erase"))}</button>`;

  bar.innerHTML = `<button class="btn secondary" id="back">${esc(t("sent.back"))}</button>`;

  document.getElementById("back").onclick = () => goTo("review");
  document.getElementById("erase").onclick = () => { restart(); goTo("opening"); };
}
