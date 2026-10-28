import { t, profissional } from "../conteudo.js";
import { app, barra, esc } from "../util.js";
import { irPara, MOSTRAR_MAPA } from "../main.js";
import { linkWhatsapp } from "../resumo.js";

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
    <p class="perfil-chamada">${esc(t("inicio.chamada"))}</p>
    <a class="perfil-instagram" href="${esc(profissional.instagram)}" target="_blank" rel="noopener" aria-label="${esc(t("inicio.instagram"))}">${ICONE_INSTAGRAM}</a>`;

  fraseJaApareceu = true;

  // Enquanto a imagem não existir, fica só o fundo da área da foto.
  app.querySelectorAll(".perfil img").forEach(img => { img.onerror = () => img.remove(); });

  barra.innerHTML = "";
  barra.closest(".barra").hidden = true;

  document.getElementById("ir-agenda").onclick = () => irPara("agenda");
  if (MOSTRAR_MAPA) document.getElementById("ir-mapa").onclick = () => irPara("abertura");
}
