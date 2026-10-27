import { estado, ui, salvar, estaMarcada, alternarArea } from "../estado.js";
import { AREA, t } from "../conteudo.js";
import { svgRosto } from "../rostos/index.js";
import { app, barra, esc, progresso } from "../util.js";
import { irPara } from "../main.js";

let avisoTimer;

// Tela do mapa: só o rosto, a lista do que foi marcado embaixo, os controles e a navegação.
export function telaMapa(aviso = "") {
  const n = estado.areas.length;
  const seg = (campo, valor, atual) =>
    `<button data-${campo}="${valor}" aria-pressed="${atual === valor}">${esc(t(`mapa.${valor}`))}</button>`;
  const lista = n
    ? `<ol class="marcadas">${estado.areas.map(a => (a.codigo === "outra"
      ? `<li><button data-editar-outra aria-label="${esc(t("mapa.editar", { area: nomeNaLista(a) }))}"><span>${esc(nomeNaLista(a))}</span><span class="x" aria-hidden="true">✎</span></button></li>`
      : `<li><button data-remover="${a.codigo}" aria-label="${esc(t("mapa.remover", { area: AREA[a.codigo].nome }))}"><span>${esc(nomeNaLista(a))}</span><span class="x" aria-hidden="true">×</span></button></li>`)).join("")}</ol>`
    : `<p class="vazio">${esc(t("mapa.vazio"))}</p>`;
  const extra = codigo =>
    `<button class="extra" data-area="${codigo}" aria-pressed="${estaMarcada(codigo)}">${estaMarcada(codigo) ? "✓" : "+"} ${esc(t(`mapa.${codigo}`))}</button>`;

  app.className = "app app-mapa";
  app.innerHTML = `
    <header class="topo topo-compacto">${progresso("rosto", 2)}</header>
    <div class="controles">
      <div class="seg" role="group" aria-label="${esc(t("mapa.vista"))}">${seg("vista", "frente", ui.vista)}${seg("vista", "perfil", ui.vista)}</div>
      <div class="seg" role="group" aria-label="${esc(t("mapa.rosto"))}">${seg("rosto", "feminino", estado.rosto)}${seg("rosto", "masculino", estado.rosto)}</div>
    </div>
    <div class="palco">
      <div class="mapa">${svgRosto(estado.rosto, ui.vista)}<div class="aviso" id="aviso" role="status" aria-live="polite"></div></div>
      <aside class="lado">
        <h3>${esc(n ? t("mapa.marcouQuantas", { n }) : t("mapa.marcou"))}</h3>
        ${lista}
        <div class="extras">${extra("pele")}${extra("outra")}</div>
      </aside>
    </div>`;

  barra.innerHTML = `<button class="btn sec" id="voltar">${esc(t("geral.voltar"))}</button>
    <button class="btn pri" id="seguir" ${n ? "" : "disabled"}>${esc(t("mapa.continuar"))}</button>`;

  // zonas do SVG: acessíveis por teclado e leitor de tela
  const svg = app.querySelector(".mapa svg");
  svg.setAttribute("role", "group");
  svg.setAttribute("aria-label", t("mapa.descricaoDesenho", { rosto: t(`mapa.${estado.rosto}`), vista: t(`mapa.${ui.vista}`) }));
  svg.querySelectorAll(".zona").forEach(z => {
    const codigo = z.dataset.area;
    z.classList.toggle("sel", estaMarcada(codigo));
    z.setAttribute("tabindex", "0");
    z.setAttribute("role", "button");
    z.setAttribute("aria-pressed", estaMarcada(codigo));
    z.setAttribute("aria-label", AREA[codigo].nome);
    z.onclick = () => tocar(codigo, `.zona[data-area="${codigo}"]`);
    z.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); z.onclick(); } };
  });

  app.querySelectorAll("button[data-area]").forEach(b => b.onclick = () =>
    b.dataset.area === "outra" ? abrirModalOutra() : tocar(b.dataset.area, `button[data-area="${b.dataset.area}"]`));
  app.querySelectorAll("[data-remover]").forEach(b => b.onclick = () => tocar(b.dataset.remover));
  app.querySelector("[data-editar-outra]")?.addEventListener("click", abrirModalOutra);
  app.querySelectorAll("[data-vista]").forEach(b => b.onclick = () => { ui.vista = b.dataset.vista; salvar(); telaMapa(); });
  app.querySelectorAll("[data-rosto]").forEach(b => b.onclick = () => { estado.rosto = b.dataset.rosto; salvar(); telaMapa(); });
  document.getElementById("voltar").onclick = () => irPara("abertura");
  document.getElementById("seguir").onclick = () => irPara("proximo");

  if (aviso) {
    const el = document.getElementById("aviso");
    el.textContent = aviso;
    el.classList.add("on");
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => el.classList.remove("on"), 1400);
  }
}

const nomeNaLista = a =>
  a.codigo === "outra" && a.descricao.trim() ? t("mapa.outraNaLista", { texto: a.descricao.trim() }) : AREA[a.codigo].nome;

// "Outra parte": modal em tela cheia com o fundo desfocado. Tocar de novo reabre para editar.
function abrirModalOutra() {
  const atual = estado.areas.find(a => a.codigo === "outra");
  const m = textoModal => esc(t(`mapa.outraModal.${textoModal}`));
  const fundo = document.createElement("div");
  fundo.className = "modal-fundo";
  fundo.innerHTML = `
    <div class="modal" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
      <button class="modal-fechar" id="modal-fechar" aria-label="${m("fechar")}">×</button>
      <h2 id="modal-titulo">${m("titulo")}</h2>
      <p class="sub">${m("explicacao")}</p>
      <textarea id="modal-texto" rows="4" placeholder="${m("placeholder")}">${esc(atual?.descricao ?? "")}</textarea>
      <div class="modal-acoes">
        <button class="btn sec" id="modal-cancelar">${m("cancelar")}</button>
        <button class="btn pri" id="modal-salvar">${m("salvar")}</button>
      </div>
      ${atual ? `<button class="btn excluir" id="modal-remover">${m("remover")}</button>` : ""}
    </div>`;
  document.body.append(fundo);
  document.body.classList.add("com-modal");

  const campo = fundo.querySelector("#modal-texto");
  const salvarBtn = fundo.querySelector("#modal-salvar");
  const atualizar = () => { salvarBtn.disabled = !campo.value.trim(); };
  atualizar();
  // foco no diálogo, não no campo: no celular o teclado subiria e cobriria o texto do modal
  fundo.querySelector(".modal").focus({ preventScroll: true });

  const fechar = aviso => {
    fundo.remove();
    document.body.classList.remove("com-modal");
    document.removeEventListener("keydown", teclas);
    telaMapa(aviso);
    app.querySelector('button[data-area="outra"]')?.focus({ preventScroll: true });
  };
  const teclas = e => { if (e.key === "Escape") fechar(); };
  document.addEventListener("keydown", teclas);

  campo.oninput = atualizar;
  fundo.onclick = e => { if (e.target === fundo) fechar(); };
  fundo.querySelector("#modal-fechar").onclick = () => fechar();
  fundo.querySelector("#modal-cancelar").onclick = () => fechar();
  salvarBtn.onclick = () => {
    const area = atual ?? (alternarArea("outra"), estado.areas.find(a => a.codigo === "outra"));
    area.descricao = campo.value.trim();
    salvar();
    fechar(t("mapa.avisoMarcada", { area: AREA.outra.nome }));
  };
  fundo.querySelector("#modal-remover")?.addEventListener("click", () => {
    alternarArea("outra");
    fechar(t("mapa.avisoDesmarcada", { area: AREA.outra.nome }));
  });
}

function tocar(codigo, foco) {
  const ligada = alternarArea(codigo);
  telaMapa(t(ligada ? "mapa.avisoMarcada" : "mapa.avisoDesmarcada", { area: AREA[codigo].nome }));
  if (foco) app.querySelector(foco)?.focus({ preventScroll: true });
  return ligada;
}
