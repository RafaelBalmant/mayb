import { t } from "./conteudo.js";
import { TOTAL_STEPS } from "./config.js";

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const app = document.getElementById("app");
export const barra = document.getElementById("barra-in");

/** Redesenha sem perder a posição de rolagem. */
export function manterRolagem(fn) {
  const y = window.scrollY;
  fn();
  window.scrollTo(0, y);
}

/** Parágrafos a partir de uma lista de textos. */
export const paragrafos = (lista, classe) => lista.map(p => `<p class="${classe}">${esc(p)}</p>`).join("");

export const marca = () => `<div class="marca">${esc(t("geral.marca"))}</div>`;

export function topo(etapa, titulo) {
  const barras = Array.from({ length: TOTAL_STEPS }, (_, i) => `<span class="${i < etapa ? "ok" : ""}"></span>`).join("");
  return `<header class="topo">${marca()}
    <div class="progresso" aria-hidden="true">${barras}</div>
    <div class="etapa">${esc(t("geral.etapa", { atual: etapa, total: TOTAL_STEPS, titulo }))}</div></header>`;
}
