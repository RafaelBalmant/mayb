import { estado } from "../estado.js";
import { AREA, t, tn } from "../conteudo.js";
import { app, barra, esc, paragrafos, topo } from "../util.js";
import { irPara } from "../main.js";

// Entre o mapa e o detalhamento: explica o próximo passo e deixa a pessoa escolher.
export function telaProximo() {
  const nomes = estado.areas.map(a => `<li>${esc(AREA[a.codigo].nome)}</li>`).join("");

  app.className = "app";
  app.innerHTML = `${topo("rosto", 3)}
    <h1 class="pergunta-grande">${esc(t("proximo.titulo"))}</h1>
    <div class="bloco">
      <h3>${esc(tn("proximo.marcou", estado.areas.length))}</h3>
      <ul class="resumo-marcadas">${nomes}</ul>
    </div>
    ${paragrafos(t("proximo.explicacao"), "explica")}
    <div class="caminhos">
      <button class="caminho pri" id="mais-info">
        <strong>${esc(t("proximo.maisInfo"))}</strong>
        <span>${esc(t("proximo.maisInfoDetalhe"))}</span>
      </button>
      <button class="caminho" id="falar">
        <strong>${esc(t("proximo.falar"))}</strong>
        <span>${esc(t("proximo.falarDetalhe"))}</span>
      </button>
    </div>`;

  barra.innerHTML = `<button class="btn sec" id="voltar">${esc(t("proximo.voltar"))}</button>`;

  document.getElementById("mais-info").onclick = () => irPara("detalhes");
  document.getElementById("falar").onclick = () => irPara("revisar");
  document.getElementById("voltar").onclick = () => irPara("mapa");
}
