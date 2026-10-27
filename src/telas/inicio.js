import { t } from "../conteudo.js";
import { app, barra, esc, marca } from "../util.js";
import { irPara, MOSTRAR_MAPA } from "../main.js";

// Página inicial: só os dois caminhos. Depois estes botões vão para o site institucional
// (que pode abrir direto em #agenda ou #mapa).
export function telaInicio() {
  app.className = "app";
  app.innerHTML = `${marca()}
    <h1 class="pergunta-grande">${esc(t("inicio.titulo"))}</h1>
    <div class="inicio-botoes">
      <button class="btn pri" id="ir-agenda">${esc(t("inicio.agenda"))}</button>
      ${MOSTRAR_MAPA ? `<button class="btn" id="ir-mapa">${esc(t("inicio.mapa"))}</button>` : ""}
    </div>`;

  barra.innerHTML = "";
  barra.closest(".barra").hidden = true;

  document.getElementById("ir-agenda").onclick = () => irPara("agenda");
  if (MOSTRAR_MAPA) document.getElementById("ir-mapa").onclick = () => irPara("abertura");
}
