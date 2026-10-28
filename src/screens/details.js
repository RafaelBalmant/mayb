import { state, ui, save, openOther } from "../state.js";
import { AREA_BY_CODE, labels, t } from "../content.js";
import { INTENSITY_SCALE } from "../config.js";
import { app, bar, esc, topbar, keepScroll } from "../utils.js";
import { goTo } from "../main.js";

function group(field, legend, options, value, extra = "") {
  return `<fieldset class="question"><legend>${legend}</legend><div class="chips">${
    Object.entries(options).map(([k, v]) => `<button type="button" class="chip" data-field="${field}" data-value="${k}" aria-pressed="${value === k}">${v}</button>`).join("")
  }</div>${extra}</fieldset>`;
}

export function renderDetails() {
  const total = state.areas.length;
  ui.index = Math.min(ui.index, total - 1);
  const a = state.areas[ui.index];
  const def = AREA_BY_CODE[a.code];
  const P = t("details.questions");
  const isLast = ui.index === total - 1;

  let concerns;
  if (a.code === "other") {
    concerns = `<div class="question"><label for="description">${P.otherDescription}</label>
      <textarea id="description" data-text="description" placeholder="${esc(t("details.otherAreaPlaceholder"))}">${esc(a.description)}</textarea></div>`;
  } else {
    const withOther = a.concernsOther !== "" || openOther.has(a.code);
    concerns = `<fieldset class="question"><legend>${P.concerns} <span class="hint">${esc(t("details.multipleAllowed"))}</span></legend><div class="chips">${
      def.options.map((o, i) => `<button type="button" class="chip" data-option="${i}" aria-pressed="${a.concerns.includes(o)}">${esc(o)}</button>`).join("")
    }<button type="button" class="chip" id="other-btn" aria-pressed="${withOther}">${esc(t("details.other"))}</button></div>${
      withOther ? `<input type="text" id="other-txt" data-text="concernsOther" placeholder="${esc(t("details.otherPlaceholder"))}" value="${esc(a.concernsOther)}">` : ""
    }</fieldset>`;
  }

  const intensity = `<fieldset class="question"><legend>${P.intensity}</legend><div class="scale">${
    INTENSITY_SCALE.map(n => `<button type="button" class="chip" data-field="intensity" data-value="${n}" aria-pressed="${a.intensity === n}">${n}</button>`).join("")
  }</div><div class="scale-legend"><span>${esc(t("details.intensityLow"))}</span><span>${esc(t("details.intensityHigh"))}</span></div></fieldset>`;

  const procDetail = a.procedure === "yes"
    ? `<input type="text" id="proc-txt" data-text="procedureDetail" placeholder="${esc(t("details.procedurePlaceholder"))}" value="${esc(a.procedureDetail)}">` : "";

  app.className = "app";
  app.innerHTML = `${topbar(4, t("details.step"))}
    <article class="card">
      <div class="head"><div class="counter">${esc(t("details.counter", { current: ui.index + 1, total }))}</div><h2>${esc(def.name)}</h2>
        <p class="sub">${esc(t("details.optional"))}</p></div>
      ${concerns}
      ${group("side", P.side, labels.side, a.side)}
      ${group("since", P.since, labels.since, a.since)}
      ${intensity}
      ${def.movement ? group("appearsWhen", P.appearsWhen, labels.appearsWhen, a.appearsWhen) : ""}
      ${group("procedure", P.procedure, labels.procedure, a.procedure, procDetail)}
      <div class="question"><label for="comment">${P.comment}</label>
        <textarea id="comment" data-text="comment" placeholder="${esc(t("details.commentPlaceholder"))}">${esc(a.comment)}</textarea></div>
      <button type="button" class="skip" id="skip">${esc(t("details.skip"))}</button>
    </article>`;

  bar.innerHTML = `<button class="btn secondary" id="back">${esc(t("general.back"))}</button><button class="btn primary" id="nextArea">${esc(t(isLast ? "details.finish" : "details.nextArea"))}</button>`;

  const redraw = focusSelector => { keepScroll(renderDetails); if (focusSelector) app.querySelector(focusSelector)?.focus({ preventScroll: true }); };

  app.querySelectorAll("[data-field]").forEach(b => b.onclick = () => {
    const { field, value } = b.dataset;
    const v = field === "intensity" ? Number(value) : value;
    a[field] = a[field] === v ? null : v;
    save();
    redraw(`[data-field="${field}"][data-value="${value}"]`);
  });
  app.querySelectorAll("[data-option]").forEach(b => b.onclick = () => {
    const o = def.options[b.dataset.option];
    const chosen = a.concerns.includes(o) ? a.concerns.filter(x => x !== o) : [...a.concerns, o];
    a.concerns = def.options.filter(x => chosen.includes(x));
    save();
    redraw(`[data-option="${b.dataset.option}"]`);
  });
  document.getElementById("other-btn")?.addEventListener("click", () => {
    if (a.concernsOther !== "" || openOther.has(a.code)) {
      a.concernsOther = "";
      openOther.delete(a.code);
      save();
      redraw("#other-btn");
    } else {
      openOther.add(a.code);
      redraw("#other-txt");
    }
  });
  app.querySelectorAll("[data-text]").forEach(i => i.oninput = () => { a[i.dataset.text] = i.value; save(); });

  const advance = () => (isLast ? goTo("review") : goTo("details", ui.index + 1));
  document.getElementById("skip").onclick = advance;
  document.getElementById("nextArea").onclick = advance;
  document.getElementById("back").onclick = () => (ui.index === 0 ? goTo("next") : goTo("details", ui.index - 1));
}
