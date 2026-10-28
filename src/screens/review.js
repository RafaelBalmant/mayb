import { state, ui, save } from "../state.js";
import { t } from "../content.js";
import { buildMessage, whatsappLink } from "../summary.js";
import { app, bar, esc, topbar } from "../utils.js";
import { SEND_REDIRECT_DELAY_MS } from "../config.js";
import { goTo } from "../main.js";

// Review and send: the message exactly as it will arrive, the privacy consent and the WhatsApp button.
// Both paths after the map ("talk to the doctor" and "give more information") end here.
export function renderReview() {
  const answered = state.areas.some(a =>
    a.concerns.length || a.concernsOther || a.side || a.since || a.intensity || a.appearsWhen || a.procedure || a.comment.trim());

  app.className = "app";
  app.innerHTML = `${topbar(8, t("review.step"))}
    <div class="block" style="gap:6px"><h1>${esc(t("review.title"))}</h1>
      <p class="sub">${esc(t("review.explanation"))}</p></div>
    <div class="question"><label for="name">${esc(t("review.name"))} <span class="hint">${esc(t("review.nameHint"))}</span></label>
      <input type="text" id="name" autocomplete="given-name" placeholder="${esc(t("review.namePlaceholder"))}" value="${esc(state.about.name)}"></div>
    <section class="block">
      <h3>${esc(t("review.preview"))}</h3>
      <pre class="preview" id="preview"></pre>
      <div class="edit-links">
        <button type="button" class="skip" id="edit-areas">${esc(t("review.editAreas"))}</button>
        <button type="button" class="skip" id="edit-details">${esc(t(answered ? "review.editDetails" : "review.addDetails"))}</button>
      </div>
    </section>
    <label class="consent"><input type="checkbox" id="consent" ${ui.consent ? "checked" : ""}><span>${esc(t("review.consent"))}</span></label>
    <p class="sub note">${esc(t("review.notice"))}</p>
    <p class="missing" id="missing" role="status" aria-live="polite"></p>`;

  bar.innerHTML = `<button class="btn secondary" id="back">${esc(t("general.back"))}</button>
    <a class="btn primary" id="send" target="_blank" rel="noopener">${esc(t("review.send"))}</a>`;

  const preview = document.getElementById("preview");
  const send = document.getElementById("send");
  const missing = document.getElementById("missing");
  const update = () => {
    const text = buildMessage(state);
    preview.textContent = text;
    send.href = whatsappLink(text);
    send.setAttribute("aria-disabled", String(!ui.consent));
    if (ui.consent) missing.textContent = "";
  };
  update();

  document.getElementById("name").oninput = e => { state.about.name = e.target.value; save(); update(); };
  document.getElementById("consent").onchange = e => { ui.consent = e.target.checked; save(); update(); };
  send.onclick = e => {
    if (!ui.consent) {
      e.preventDefault();
      missing.textContent = t("review.consentMissing");
      document.getElementById("consent").focus();
      return;
    }
    // the link opens WhatsApp; here we only show what happens next
    setTimeout(() => goTo("sent"), SEND_REDIRECT_DELAY_MS);
  };
  document.getElementById("edit-areas").onclick = () => goTo("map");
  document.getElementById("edit-details").onclick = () => goTo("details", 0);
  document.getElementById("back").onclick = () =>
    (answered ? goTo("details", state.areas.length - 1) : goTo("next"));
}
