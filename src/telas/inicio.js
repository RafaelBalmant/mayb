import { t, profissional } from "../conteudo.js";
import { app, barra, esc } from "../util.js";
import { irPara, MOSTRAR_MAPA } from "../main.js";

// A foto fica em public/ (nome em conteudo.json → profissional.foto).
const imagem = arquivo => import.meta.env.BASE_URL + arquivo;

// A frase de efeito surge devagar só na primeira vez que o início aparece (voltar da agenda não repete).
let fraseJaApareceu = false;

// Página inicial: foto no topo (mesma largura do texto), nome em letras grandes por cima da borda de baixo, e os caminhos.
// Depois estes botões podem ir para o site institucional (que pode abrir direto em #agenda ou #mapa).
export function telaInicio() {
  app.className = "app app-inicio";
  app.innerHTML = `
    <header class="perfil">
      <div class="perfil-foto"><img src="${esc(imagem(profissional.foto))}" alt="${esc(t("inicio.altFoto"))}" /></div>
      <div class="perfil-texto">
        <p class="perfil-chamada">${esc(t("inicio.chamada"))}</p>
        <h1 class="perfil-nome">${t("inicio.nome").map(linha => `<span>${esc(linha)}</span>`).join("")}</h1>
        <p class="perfil-frase${fraseJaApareceu ? "" : " surgir"}">${esc(t("inicio.frase"))}</p>
      </div>
    </header>
    <div class="inicio-botoes">
      <button class="btn pri" id="ir-agenda">${esc(t("inicio.agenda"))}</button>
      ${MOSTRAR_MAPA ? `<button class="btn" id="ir-mapa">${esc(t("inicio.mapa"))}</button>` : ""}
    </div>`;

  fraseJaApareceu = true;

  // Enquanto a imagem não existir, fica só o fundo da área da foto.
  app.querySelectorAll(".perfil img").forEach(img => { img.onerror = () => img.remove(); });

  barra.innerHTML = "";
  barra.closest(".barra").hidden = true;

  document.getElementById("ir-agenda").onclick = () => irPara("agenda");
  if (MOSTRAR_MAPA) document.getElementById("ir-mapa").onclick = () => irPara("abertura");
}
