import { t } from "./conteudo.js";

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

/**
 * Barra de progresso de um fluxo: progresso("rosto", 2) → "Etapa 2 de 4 · Marcar no rosto".
 * Cada fluxo tem as próprias etapas, em conteudo.json (textos.etapas). A página inicial não conta.
 */
export function progresso(fluxo, etapa) {
  const nomes = t(`etapas.${fluxo}`);
  const barras = nomes.map((_, i) => `<span class="${i < etapa ? "ok" : ""}"></span>`).join("");
  return `<div class="progresso" aria-hidden="true">${barras}</div>
    <div class="etapa">${esc(t("geral.etapa", { atual: etapa, total: nomes.length, titulo: nomes[etapa - 1] }))}</div>`;
}

/** Topo das telas de um fluxo: marca + progresso. */
export const topo = (fluxo, etapa) => `<header class="topo">${marca()}${progresso(fluxo, etapa)}</header>`;
