import { estado, ui, salvar } from "../estado.js";
import { AREA, rotulos, t } from "../conteudo.js";
import { app, barra, esc, topo, manterRolagem } from "../util.js";
import { irPara } from "../main.js";

// "Outro" aberto mas ainda vazio (não vai para o estado)
const outroAberto = new Set();

function grupo(campo, legenda, opcoes, valor, extra = "") {
  return `<fieldset class="pergunta"><legend>${legenda}</legend><div class="chips">${
    Object.entries(opcoes).map(([k, v]) => `<button type="button" class="chip" data-campo="${campo}" data-valor="${k}" aria-pressed="${valor === k}">${v}</button>`).join("")
  }</div>${extra}</fieldset>`;
}

export function telaDetalhes() {
  const total = estado.areas.length;
  ui.indice = Math.min(ui.indice, total - 1);
  const a = estado.areas[ui.indice];
  const def = AREA[a.codigo];
  const P = t("detalhes.perguntas");
  const ultima = ui.indice === total - 1;

  let incomoda;
  if (a.codigo === "outra") {
    incomoda = `<div class="pergunta"><label for="descricao">${P.outraDescricao}</label>
      <textarea id="descricao" data-texto="descricao" placeholder="${esc(t("detalhes.outraPlaceholder"))}">${esc(a.descricao)}</textarea></div>`;
  } else {
    const comOutro = a.incomodaOutro !== "" || outroAberto.has(a.codigo);
    incomoda = `<fieldset class="pergunta"><legend>${P.incomoda} <span class="obs">${esc(t("detalhes.variasOpcoes"))}</span></legend><div class="chips">${
      def.opcoes.map((o, i) => `<button type="button" class="chip" data-opcao="${i}" aria-pressed="${a.incomoda.includes(o)}">${esc(o)}</button>`).join("")
    }<button type="button" class="chip" id="outro-btn" aria-pressed="${comOutro}">${esc(t("detalhes.outro"))}</button></div>${
      comOutro ? `<input type="text" id="outro-txt" data-texto="incomodaOutro" placeholder="${esc(t("detalhes.outroPlaceholder"))}" value="${esc(a.incomodaOutro)}">` : ""
    }</fieldset>`;
  }

  const intensidade = `<fieldset class="pergunta"><legend>${P.intensidade}</legend><div class="escala">${
    [1, 2, 3, 4, 5].map(n => `<button type="button" class="chip" data-campo="intensidade" data-valor="${n}" aria-pressed="${a.intensidade === n}">${n}</button>`).join("")
  }</div><div class="escala-leg"><span>${esc(t("detalhes.intensidadePouco"))}</span><span>${esc(t("detalhes.intensidadeMuito"))}</span></div></fieldset>`;

  const detalheProc = a.procedimento === "sim"
    ? `<input type="text" id="proc-txt" data-texto="procedimentoDetalhe" placeholder="${esc(t("detalhes.procedimentoPlaceholder"))}" value="${esc(a.procedimentoDetalhe)}">` : "";

  app.className = "app";
  app.innerHTML = `${topo("rosto", 3)}
    <article class="cartao">
      <div class="cab"><div class="contador">${esc(t("detalhes.contador", { atual: ui.indice + 1, total }))}</div><h2>${esc(def.nome)}</h2>
        <p class="sub">${esc(t("detalhes.opcionais"))}</p></div>
      ${incomoda}
      ${grupo("lado", P.lado, rotulos.lado, a.lado)}
      ${grupo("desde", P.desde, rotulos.desde, a.desde)}
      ${intensidade}
      ${def.movimento ? grupo("quandoAparece", P.quandoAparece, rotulos.quandoAparece, a.quandoAparece) : ""}
      ${grupo("procedimento", P.procedimento, rotulos.procedimento, a.procedimento, detalheProc)}
      <div class="pergunta"><label for="comentario">${P.comentario}</label>
        <textarea id="comentario" data-texto="comentario" placeholder="${esc(t("detalhes.comentarioPlaceholder"))}">${esc(a.comentario)}</textarea></div>
      <button type="button" class="pular" id="pular">${esc(t("detalhes.pular"))}</button>
    </article>`;

  barra.innerHTML = `<button class="btn sec" id="voltar">${esc(t("geral.voltar"))}</button><button class="btn pri" id="proxima">${esc(t(ultima ? "detalhes.concluir" : "detalhes.proxima"))}</button>`;

  const redesenhar = foco => { manterRolagem(telaDetalhes); if (foco) app.querySelector(foco)?.focus({ preventScroll: true }); };

  app.querySelectorAll("[data-campo]").forEach(b => b.onclick = () => {
    const { campo, valor } = b.dataset;
    const v = campo === "intensidade" ? Number(valor) : valor;
    a[campo] = a[campo] === v ? null : v;
    salvar();
    redesenhar(`[data-campo="${campo}"][data-valor="${valor}"]`);
  });
  app.querySelectorAll("[data-opcao]").forEach(b => b.onclick = () => {
    const o = def.opcoes[b.dataset.opcao];
    const escolhidas = a.incomoda.includes(o) ? a.incomoda.filter(x => x !== o) : [...a.incomoda, o];
    a.incomoda = def.opcoes.filter(x => escolhidas.includes(x));
    salvar();
    redesenhar(`[data-opcao="${b.dataset.opcao}"]`);
  });
  document.getElementById("outro-btn")?.addEventListener("click", () => {
    if (a.incomodaOutro !== "" || outroAberto.has(a.codigo)) {
      a.incomodaOutro = "";
      outroAberto.delete(a.codigo);
      salvar();
      redesenhar("#outro-btn");
    } else {
      outroAberto.add(a.codigo);
      redesenhar("#outro-txt");
    }
  });
  app.querySelectorAll("[data-texto]").forEach(i => i.oninput = () => { a[i.dataset.texto] = i.value; salvar(); });

  const avancar = () => (ultima ? irPara("revisar") : irPara("detalhes", ui.indice + 1));
  document.getElementById("pular").onclick = avancar;
  document.getElementById("proxima").onclick = avancar;
  document.getElementById("voltar").onclick = () => (ui.indice === 0 ? irPara("proximo") : irPara("detalhes", ui.indice - 1));
}
