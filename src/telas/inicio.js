import { t, profissional } from "../conteudo.js";
import { app, barra, esc } from "../util.js";
import { irPara, MOSTRAR_MAPA } from "../main.js";

// Imagens ficam em public/ (nomes em conteudo.json → profissional.capa / profissional.foto).
const imagem = arquivo => import.meta.env.BASE_URL + arquivo;

// Página inicial no estilo "link na bio": capa, foto redonda, nome e os caminhos.
// Depois estes botões podem ir para o site institucional (que pode abrir direto em #agenda ou #mapa).
export function telaInicio() {
  app.className = "app app-inicio";
  app.innerHTML = `
    <header class="perfil">
      <div class="perfil-capa"><img src="${esc(imagem(profissional.capa))}" alt="${esc(t("inicio.altCapa"))}" /></div>
      <div class="perfil-foto" data-iniciais="${esc(t("inicio.iniciais"))}"><img src="${esc(imagem(profissional.foto))}" alt="${esc(t("inicio.altFoto"))}" /></div>
      <h1 class="perfil-nome">${esc(t("inicio.nome"))}</h1>
      <p class="perfil-descricao">${esc(t("inicio.descricao"))}</p>
    </header>
    <div class="inicio-botoes">
      <button class="btn pri" id="ir-agenda">${esc(t("inicio.agenda"))}</button>
      ${MOSTRAR_MAPA ? `<button class="btn" id="ir-mapa">${esc(t("inicio.mapa"))}</button>` : ""}
    </div>`;

  // Enquanto a imagem não existir, fica o espaço reservado (fundo da capa / iniciais na foto).
  app.querySelectorAll(".perfil img").forEach(img => { img.onerror = () => img.remove(); });

  barra.innerHTML = "";
  barra.closest(".barra").hidden = true;

  document.getElementById("ir-agenda").onclick = () => irPara("agenda");
  if (MOSTRAR_MAPA) document.getElementById("ir-mapa").onclick = () => irPara("abertura");
}
