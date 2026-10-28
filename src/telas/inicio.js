import { t, tn, profissional } from "../conteudo.js";
import { app, barra, esc } from "../util.js";
import { irPara, MOSTRAR_MAPA } from "../main.js";
import { linkWhatsapp } from "../resumo.js";
import { carregarAvaliacoes } from "../avaliacoes.js";

// A foto fica em public/ (nome em conteudo.json → profissional.foto).
const imagem = arquivo => import.meta.env.BASE_URL + arquivo;

// A frase de efeito surge devagar só na primeira vez que o início aparece (voltar da agenda não repete).
let fraseJaApareceu = false;

// Ícone do Instagram em traço (a cor vem do CSS).
const ICONE_INSTAGRAM = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle class="ponto" cx="17.3" cy="6.7" r="1.1"/></svg>`;

// Página inicial: foto no topo (mesma largura do texto), nome em letras grandes por cima da borda de baixo, e os caminhos.
// Depois estes botões podem ir para o site institucional (que pode abrir direto em #agenda ou #mapa).
export function telaInicio() {
  app.className = "app app-inicio";
  app.innerHTML = `
    <header class="perfil">
      <div class="perfil-foto"><img src="${esc(imagem(profissional.foto))}" alt="${esc(t("inicio.altFoto"))}" /></div>
      <div class="perfil-texto">
        <h1 class="perfil-nome">${t("inicio.nome").map(linha => `<span>${esc(linha)}</span>`).join("")}</h1>
        <p class="perfil-frase${fraseJaApareceu ? "" : " surgir"}">${esc(t("inicio.frase"))}</p>
      </div>
    </header>
    <div class="inicio-botoes">
      <button class="btn pri" id="ir-agenda">${esc(t("inicio.agenda"))}</button>
      <a class="btn" href="${esc(linkWhatsapp(t("inicio.mensagemContato")))}" target="_blank" rel="noopener">${esc(t("inicio.contato"))}</a>
      <a class="btn" href="${esc(profissional.avaliacaoGoogle)}" target="_blank" rel="noopener">${esc(t("inicio.avaliar"))}</a>
      ${MOSTRAR_MAPA ? `<button class="btn" id="ir-mapa">${esc(t("inicio.mapa"))}</button>` : ""}
    </div>
    <section class="avaliacoes" id="avaliacoes" aria-label="${esc(t("avaliacoes.titulo"))}" hidden></section>
    <p class="perfil-chamada">${esc(t("inicio.chamada"))}</p>
    <a class="perfil-instagram" href="${esc(profissional.instagram)}" target="_blank" rel="noopener" aria-label="${esc(t("inicio.instagram"))}">${ICONE_INSTAGRAM}</a>`;

  fraseJaApareceu = true;

  // Enquanto a imagem não existir, fica só o fundo da área da foto.
  app.querySelectorAll(".perfil img").forEach(img => { img.onerror = () => img.remove(); });

  barra.innerHTML = "";
  barra.closest(".barra").hidden = true;

  document.getElementById("ir-agenda").onclick = () => irPara("agenda");
  if (MOSTRAR_MAPA) document.getElementById("ir-mapa").onclick = () => irPara("abertura");

  // As avaliações chegam do Google depois; se não vierem, o bloco continua escondido.
  const secao = document.getElementById("avaliacoes");
  carregarAvaliacoes().then(dados => { if (dados && secao.isConnected) mostrarAvaliacoes(secao, dados); });
}

const numero = n => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// Cinco estrelas preenchidas até a nota (4,8 → a última fica 80% cheia). O preenchimento vem do CSS (--nota).
const estrelas = nota =>
  `<span class="estrelas" style="--nota:${Number(nota)}" role="img" aria-label="${esc(t("avaliacoes.estrelas", { n: numero(nota) }))}">★★★★★</span>`;

// Avaliações do Google: nota geral e um carrossel que passa sozinho (para de vez quando a pessoa mexe nele).
function mostrarAvaliacoes(secao, { nota, total, link, avaliacoes }) {
  const n = avaliacoes.length;
  secao.innerHTML = `
    <h2 class="avaliacoes-titulo">${esc(t("avaliacoes.titulo"))}</h2>
    <div class="avaliacoes-resumo">
      <span class="avaliacoes-nota" aria-label="${esc(t("avaliacoes.nota", { nota: numero(nota) }))}">${esc(numero(nota))}</span>
      ${estrelas(nota)}
      <span class="avaliacoes-total">${esc(tn("avaliacoes.total", total))}</span>
    </div>
    <div class="avaliacoes-trilho" role="region" aria-label="${esc(t("avaliacoes.lista"))}" tabindex="0">
      ${avaliacoes.map((a, i) => `
        <figure class="avaliacao" aria-label="${esc(t("avaliacoes.posicao", { atual: i + 1, total: n }))}">
          ${estrelas(a.estrelas)}
          <blockquote class="avaliacao-texto">${esc(a.texto)}</blockquote>
          <button class="avaliacao-mais" type="button" hidden>${esc(t("avaliacoes.lerMais"))}</button>
          <figcaption class="avaliacao-autor">
            ${a.foto ? `<img src="${esc(a.foto)}" alt="" referrerpolicy="no-referrer" loading="lazy" />` : ""}
            <span>${a.linkAutor ? `<a href="${esc(a.linkAutor)}" target="_blank" rel="noopener">${esc(a.autor)}</a>` : esc(a.autor)}${a.quando ? ` · ${esc(a.quando)}` : ""}</span>
          </figcaption>
        </figure>`).join("")}
    </div>
    ${n > 1 ? `<div class="avaliacoes-pontos">${avaliacoes.map((_, i) =>
      `<button type="button" aria-label="${esc(t("avaliacoes.irPara", { n: i + 1 }))}"${i ? "" : ` aria-current="true"`}></button>`).join("")}</div>` : ""}
    ${link ? `<a class="avaliacoes-link" href="${esc(link)}" target="_blank" rel="noopener">${esc(t("avaliacoes.verTodas"))}</a>` : ""}
    <p class="avaliacoes-fonte">${esc(t("avaliacoes.fonte"))}</p>`;
  secao.hidden = false;

  secao.querySelectorAll(".avaliacao img").forEach(img => { img.onerror = () => img.remove(); });

  // "Ler mais" só aparece quando o texto não coube nas linhas do cartão.
  secao.querySelectorAll(".avaliacao").forEach(cartao => {
    const texto = cartao.querySelector(".avaliacao-texto");
    const botao = cartao.querySelector(".avaliacao-mais");
    botao.hidden = texto.scrollHeight <= texto.clientHeight + 1;
    botao.onclick = () => {
      const aberta = cartao.classList.toggle("aberta");
      botao.textContent = t(aberta ? "avaliacoes.lerMenos" : "avaliacoes.lerMais");
    };
  });

  const trilho = secao.querySelector(".avaliacoes-trilho");
  const pontos = [...secao.querySelectorAll(".avaliacoes-pontos button")];
  let relogio;
  const parar = () => clearInterval(relogio);
  const atual = () => Math.round(trilho.scrollLeft / trilho.clientWidth);
  const irPara = i => trilho.scrollTo({ left: i * trilho.clientWidth, behavior: "smooth" });

  trilho.addEventListener("scroll", () => {
    const i = atual();
    pontos.forEach((p, j) => p.toggleAttribute("aria-current", j === i));
  }, { passive: true });
  pontos.forEach((p, i) => { p.onclick = () => { parar(); irPara(i); }; });

  if (n < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  relogio = setInterval(() => {
    if (!secao.isConnected) return parar();
    if (document.hidden) return;
    irPara((atual() + 1) % n);
  }, 7000);
  ["pointerdown", "touchstart", "focusin", "wheel"].forEach(ev => secao.addEventListener(ev, parar, { passive: true, once: true }));
}
