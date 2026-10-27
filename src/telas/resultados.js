import { estado, ui, salvar } from "../estado.js";
import { AREA, t, tn } from "../conteudo.js";
import casos from "../data/casos.json";
import { app, barra, esc, manterRolagem, topo } from "../util.js";
import { irPara } from "../main.js";

// Quantos quadros "Fotos em breve" mostrar numa parte que ainda não tem fotos (um par antes/depois).
const VAGAS = 2;

/** As fotos vêm sempre intercaladas: antes, depois, antes, depois… */
const momento = i => t(i % 2 ? "resultados.depois" : "resultados.antes");

/** Endereço da foto: as fotos ficam em public/casos/ (a lista está em data/casos.json). */
const urlFoto = foto => `${import.meta.env.BASE_URL}casos/${foto}`;

// Logo depois do mapa: convida a ver fotos de casos reais, em cartões por parte marcada.
// Só entram as partes que existem em casos.json ("Outra parte" não tem fotos). Pode pular.
export function telaResultados() {
  const partes = estado.areas.map(a => a.codigo).filter(c => Array.isArray(casos[c]));
  if (!partes.includes(ui.aberta)) ui.aberta = null;

  const cartao = codigo => {
    const lista = casos[codigo];
    const aberto = ui.aberta === codigo;
    const nome = AREA[codigo].nome;
    const fotos = lista.length
      ? lista.map((c, i) => `<figure><span class="momento">${esc(momento(i))}</span>
          <button class="foto" data-foto="${i}" aria-label="${esc(t("resultados.abrirFoto", { momento: momento(i), area: nome }))}">
          <img src="${esc(urlFoto(c.foto))}" alt="${esc(c.legenda || t("resultados.foto", { momento: momento(i), area: nome }))}" loading="lazy"></button>
          ${c.legenda ? `<figcaption>${esc(c.legenda)}</figcaption>` : ""}</figure>`).join("")
      : Array.from({ length: VAGAS }, (_, i) => `<figure><span class="momento">${esc(momento(i))}</span><div class="foto vaga" aria-hidden="true"><span>${esc(t("resultados.emBreve"))}</span></div></figure>`).join("");
    return `<section class="cartao-caso${aberto ? " aberto" : ""}" data-codigo="${codigo}">
      <button class="cartao-topo" aria-expanded="${aberto}" aria-controls="fotos-${codigo}">
        <strong>${esc(nome)}</strong>
        <span>${esc(lista.length ? tn("resultados.fotos", Math.ceil(lista.length / 2)) : t("resultados.emBreve"))}</span>
        <i aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></i>
      </button>
      <div class="galeria" id="fotos-${codigo}" ${aberto ? "" : "hidden"}>
        ${lista.length ? "" : `<p class="sub">${esc(t("resultados.semFotos"))}</p>`}
        <div class="fotos">${fotos}</div>
      </div>
    </section>`;
  };

  app.className = "app";
  app.innerHTML = `${topo("rosto", 3)}
    <div class="bloco" style="gap:8px"><h1>${esc(t("resultados.titulo"))}</h1>
      <p class="sub">${esc(t(partes.length ? "resultados.explicacao" : "resultados.nenhuma"))}</p></div>
    <div class="cartoes-casos">${partes.map(cartao).join("")}</div>
    ${partes.length ? `<p class="sub nota">${esc(t("resultados.aviso"))}</p>` : ""}`;

  barra.innerHTML = `<button class="btn sec" id="voltar">${esc(t("geral.voltar"))}</button>
    <button class="btn pri" id="pular">${esc(t(ui.viuCasos ? "resultados.continuar" : "resultados.pular"))}</button>`;

  app.querySelectorAll(".cartao-topo").forEach(b => b.onclick = () => {
    const codigo = b.closest(".cartao-caso").dataset.codigo;
    ui.aberta = ui.aberta === codigo ? null : codigo;
    if (ui.aberta) ui.viuCasos = true;
    salvar();
    manterRolagem(telaResultados);
    app.querySelector(`[data-codigo="${codigo}"] .cartao-topo`).focus({ preventScroll: true });
  });
  app.querySelectorAll("[data-foto]").forEach(b => b.onclick = () =>
    ampliar(casos[b.closest(".cartao-caso").dataset.codigo][b.dataset.foto], momento(Number(b.dataset.foto)), b));
  document.getElementById("voltar").onclick = () => irPara("mapa");
  document.getElementById("pular").onclick = () => irPara("proximo");
}

// Foto em tela cheia, com a etiqueta (antes/depois) e a legenda. Fecha no ×, no fundo ou com Esc.
function ampliar(caso, rotulo, origem) {
  const fundo = document.createElement("div");
  fundo.className = "modal-fundo foto-fundo";
  fundo.innerHTML = `
    <div class="foto-grande" tabindex="-1" role="dialog" aria-modal="true" aria-label="${esc(rotulo)}">
      <button class="modal-fechar" aria-label="${esc(t("resultados.fechar"))}">×</button>
      <span class="momento">${esc(rotulo)}</span>
      <img src="${esc(urlFoto(caso.foto))}" alt="${esc(caso.legenda || "")}">
      ${caso.legenda ? `<p>${esc(caso.legenda)}</p>` : ""}
    </div>`;
  document.body.append(fundo);
  document.body.classList.add("com-modal");
  fundo.querySelector(".foto-grande").focus({ preventScroll: true });

  const fechar = () => {
    fundo.remove();
    document.body.classList.remove("com-modal");
    document.removeEventListener("keydown", teclas);
    origem.focus({ preventScroll: true });
  };
  const teclas = e => { if (e.key === "Escape") fechar(); };
  document.addEventListener("keydown", teclas);
  fundo.onclick = e => { if (e.target === fundo || e.target.closest(".modal-fechar")) fechar(); };
}
