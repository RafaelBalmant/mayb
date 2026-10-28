import { state, ui, save, isMarked, toggleArea } from "../state.js";
import { AREA_BY_CODE, t } from "../content.js";
import { faceSvg } from "../faces/index.js";
import { app, bar, esc } from "../utils.js";
import { NOTICE_DURATION_MS } from "../config.js";
import { goTo } from "../main.js";

let noticeTimer;

// Map screen: just the face, the list of what was marked beside it, the controls and navigation.
export function renderMap(notice = "") {
  const n = state.areas.length;
  const segmented = (field, value, current) =>
    `<button data-${field}="${value}" aria-pressed="${current === value}">${esc(t(`map.${value}`))}</button>`;
  const list = n
    ? `<ol class="marked">${state.areas.map(a => (a.code === "other"
      ? `<li><button data-edit-other aria-label="${esc(t("map.edit", { area: nameInList(a) }))}"><span>${esc(nameInList(a))}</span><span class="x" aria-hidden="true">✎</span></button></li>`
      : `<li><button data-remove="${a.code}" aria-label="${esc(t("map.remove", { area: AREA_BY_CODE[a.code].name }))}"><span>${esc(nameInList(a))}</span><span class="x" aria-hidden="true">×</span></button></li>`)).join("")}</ol>`
    : `<p class="empty">${esc(t("map.empty"))}</p>`;
  const extra = code =>
    `<button class="extra" data-area="${code}" aria-pressed="${isMarked(code)}">${isMarked(code) ? "✓" : "+"} ${esc(AREA_BY_CODE[code].name)}</button>`;

  app.className = "app app-map";
  app.innerHTML = `
    <div class="controls">
      <div class="segmented" role="group" aria-label="${esc(t("map.view"))}">${segmented("view", "front", ui.view)}${segmented("view", "profile", ui.view)}</div>
      <div class="segmented" role="group" aria-label="${esc(t("map.face"))}">${segmented("face", "female", state.face)}${segmented("face", "male", state.face)}</div>
    </div>
    <div class="stage">
      <div class="map">${faceSvg(state.face, ui.view)}<div class="notice" id="notice" role="status" aria-live="polite"></div></div>
      <aside class="side">
        <h3>${esc(n ? t("map.markedCount", { n }) : t("map.marked"))}</h3>
        ${list}
        <div class="extras">${extra("skin")}${extra("other")}</div>
      </aside>
    </div>`;

  bar.innerHTML = `<button class="btn secondary" id="back">${esc(t("general.back"))}</button>
    <button class="btn primary" id="proceed" ${n ? "" : "disabled"}>${esc(t("map.continue"))}</button>`;

  // SVG zones: reachable by keyboard and screen reader
  const svg = app.querySelector(".map svg");
  svg.setAttribute("role", "group");
  svg.setAttribute("aria-label", t("map.drawingDescription", { face: t(`map.${state.face}`), view: t(`map.${ui.view}`) }));
  svg.querySelectorAll(".zone").forEach(z => {
    const code = z.dataset.area;
    z.classList.toggle("selected", isMarked(code));
    z.setAttribute("tabindex", "0");
    z.setAttribute("role", "button");
    z.setAttribute("aria-pressed", isMarked(code));
    z.setAttribute("aria-label", AREA_BY_CODE[code].name);
    z.onclick = () => tap(code, `.zone[data-area="${code}"]`);
    z.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); z.onclick(); } };
  });

  app.querySelectorAll("button[data-area]").forEach(b => b.onclick = () =>
    b.dataset.area === "other" ? openOtherModal() : tap(b.dataset.area, `button[data-area="${b.dataset.area}"]`));
  app.querySelectorAll("[data-remove]").forEach(b => b.onclick = () => tap(b.dataset.remove));
  app.querySelector("[data-edit-other]")?.addEventListener("click", openOtherModal);
  app.querySelectorAll("[data-view]").forEach(b => b.onclick = () => { ui.view = b.dataset.view; save(); renderMap(); });
  app.querySelectorAll("[data-face]").forEach(b => b.onclick = () => { state.face = b.dataset.face; save(); renderMap(); });
  document.getElementById("back").onclick = () => goTo("opening");
  document.getElementById("proceed").onclick = () => goTo("next");

  if (notice) {
    const el = document.getElementById("notice");
    el.textContent = notice;
    el.classList.add("on");
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => el.classList.remove("on"), NOTICE_DURATION_MS);
  }
}

const nameInList = a =>
  a.code === "other" && a.description.trim() ? t("map.otherInList", { text: a.description.trim() }) : AREA_BY_CODE[a.code].name;

// "Other part": full-screen modal with a blurred backdrop. Tapping again reopens it for editing.
function openOtherModal() {
  const current = state.areas.find(a => a.code === "other");
  const m = modalKey => esc(t(`map.otherModal.${modalKey}`));
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="modal-close" id="modal-close" aria-label="${m("close")}">×</button>
      <h2 id="modal-title">${m("title")}</h2>
      <p class="sub">${m("explanation")}</p>
      <textarea id="modal-text" rows="4" placeholder="${m("placeholder")}">${esc(current?.description ?? "")}</textarea>
      <div class="modal-actions">
        <button class="btn secondary" id="modal-cancel">${m("cancel")}</button>
        <button class="btn primary" id="modal-save">${m("save")}</button>
      </div>
      ${current ? `<button class="btn delete" id="modal-remove">${m("remove")}</button>` : ""}
    </div>`;
  document.body.append(backdrop);
  document.body.classList.add("with-modal");

  const field = backdrop.querySelector("#modal-text");
  const saveBtn = backdrop.querySelector("#modal-save");
  const update = () => { saveBtn.disabled = !field.value.trim(); };
  update();
  field.focus();
  field.setSelectionRange(field.value.length, field.value.length);

  const close = notice => {
    backdrop.remove();
    document.body.classList.remove("with-modal");
    document.removeEventListener("keydown", onKeys);
    renderMap(notice);
    app.querySelector('button[data-area="other"]')?.focus({ preventScroll: true });
  };
  const onKeys = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKeys);

  field.oninput = update;
  backdrop.onclick = e => { if (e.target === backdrop) close(); };
  backdrop.querySelector("#modal-close").onclick = () => close();
  backdrop.querySelector("#modal-cancel").onclick = () => close();
  saveBtn.onclick = () => {
    const area = current ?? (toggleArea("other"), state.areas.find(a => a.code === "other"));
    area.description = field.value.trim();
    save();
    close(t("map.noticeMarked", { area: AREA_BY_CODE.other.name }));
  };
  backdrop.querySelector("#modal-remove")?.addEventListener("click", () => {
    toggleArea("other");
    close(t("map.noticeUnmarked", { area: AREA_BY_CODE.other.name }));
  });
}

function tap(code, focusSelector) {
  const nowMarked = toggleArea(code);
  renderMap(t(nowMarked ? "map.noticeMarked" : "map.noticeUnmarked", { area: AREA_BY_CODE[code].name }));
  if (focusSelector) app.querySelector(focusSelector)?.focus({ preventScroll: true });
  return nowMarked;
}
