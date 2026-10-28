import { state, ui, save, openOther } from "../state.js";
import { AREA_BY_CODE, labels, t } from "../content.js";
import { INTENSITY_SCALE } from "../config.js";
import { QUESTIONS } from "../domain/questions.js";
import { stepOf } from "../domain/flow.js";
import { app, bar, esc, topbar, keepScroll } from "../utils.js";
import { goTo } from "../main.js";

function group(field, legend, options, value, extra = "") {
  return `<fieldset class="question"><legend>${legend}</legend><div class="chips">${
    Object.entries(options).map(([k, v]) => `<button type="button" class="chip" data-field="${field}" data-value="${k}" aria-pressed="${value === k}">${v}</button>`).join("")
  }</div>${extra}</fieldset>`;
}

// One renderer per question type in data/questions.json.
const renderers = {
  textarea: (q, area, P) => `<div class="question"><label for="${q.field}">${P[q.labelKey ?? q.field]}</label>
      <textarea id="${q.field}" data-text="${q.field}" placeholder="${esc(t(q.placeholder))}">${esc(area[q.field])}</textarea></div>`,

  areaOptions: (q, area, P) => {
    const withOther = area.concernsOther !== "" || openOther.has(area.code);
    return `<fieldset class="question"><legend>${P[q.field]} <span class="hint">${esc(t("details.multipleAllowed"))}</span></legend><div class="chips">${
      AREA_BY_CODE[area.code].options.map((o, i) => `<button type="button" class="chip" data-option="${i}" aria-pressed="${area.concerns.includes(o.id)}">${esc(o.label)}</button>`).join("")
    }<button type="button" class="chip" id="other-btn" aria-pressed="${withOther}">${esc(t("details.other"))}</button></div>${
      withOther ? `<input type="text" id="other-txt" data-text="concernsOther" placeholder="${esc(t("details.otherPlaceholder"))}" value="${esc(area.concernsOther)}">` : ""
    }</fieldset>`;
  },

  single: (q, area, P) => {
    const d = q.detail;
    const detail = d && area[q.field] === d.showWhen
      ? `<input type="text" id="${d.field}-txt" data-text="${d.field}" placeholder="${esc(t(d.placeholder))}" value="${esc(area[d.field])}">` : "";
    return group(q.field, P[q.field], labels[q.labels], area[q.field], detail);
  },

  scale: (q, area, P) => `<fieldset class="question"><legend>${P[q.field]}</legend><div class="scale">${
    INTENSITY_SCALE.map(n => `<button type="button" class="chip" data-field="${q.field}" data-value="${n}" aria-pressed="${area[q.field] === n}">${n}</button>`).join("")
  }</div><div class="scale-legend"><span>${esc(t("details.intensityLow"))}</span><span>${esc(t("details.intensityHigh"))}</span></div></fieldset>`,
};

const isVisible = (q, def) =>
  (!q.onlyFor || q.onlyFor === def.code) && (!q.exceptFor || q.exceptFor !== def.code) && (!q.requires || def[q.requires]);

export function renderDetails() {
  const total = state.areas.length;
  ui.index = Math.min(ui.index, total - 1);
  const a = state.areas[ui.index];
  const def = AREA_BY_CODE[a.code];
  const P = t("details.questions");
  const isLast = ui.index === total - 1;

  const questions = QUESTIONS.filter(q => isVisible(q, def)).map(q => renderers[q.type](q, a, P)).join("\n      ");

  app.className = "app";
  app.innerHTML = `${topbar(stepOf("details"), t("details.step"))}
    <article class="card">
      <div class="head"><div class="counter">${esc(t("details.counter", { current: ui.index + 1, total }))}</div><h2>${esc(def.name)}</h2>
        <p class="sub">${esc(t("details.optional"))}</p></div>
      ${questions}
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
    const id = def.options[b.dataset.option].id;
    const chosen = a.concerns.includes(id) ? a.concerns.filter(x => x !== id) : [...a.concerns, id];
    a.concerns = def.options.map(o => o.id).filter(x => chosen.includes(x));
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
