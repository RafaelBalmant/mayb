import { t } from "./content.js";
import { TOTAL_STEPS } from "./domain/flow.js";

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const app = document.getElementById("app");
export const bar = document.getElementById("bar-in");

/** Redraws without losing the scroll position. */
export function keepScroll(fn) {
  const y = window.scrollY;
  fn();
  window.scrollTo(0, y);
}

/** Paragraphs from a list of texts. */
export const paragraphs = (list, cssClass) => list.map(p => `<p class="${cssClass}">${esc(p)}</p>`).join("");

export const brand = () => `<div class="brand">${esc(t("general.brand"))}</div>`;

export function topbar(step, title) {
  const bars = Array.from({ length: TOTAL_STEPS }, (_, i) => `<span class="${i < step ? "ok" : ""}"></span>`).join("");
  return `<header class="topbar">${brand()}
    <div class="progress" aria-hidden="true">${bars}</div>
    <div class="step">${esc(t("general.step", { current: step, total: TOTAL_STEPS, title }))}</div></header>`;
}
