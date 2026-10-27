import { estado, salvar } from "../estado.js";
import { t } from "../conteudo.js";
import { svgRosto } from "../rostos/index.js";
import { app, barra, esc, paragrafos, topo } from "../util.js";
import { irPara } from "../main.js";

// Abertura do mapa: a pergunta, o que vem a seguir e a escolha do rosto.
export function telaAbertura() {
  // só a arte, sem as zonas tocáveis
  const miniatura = rosto => svgRosto(rosto, "frente").replace(/<g class="zonas"[^>]*>[\s\S]*?<\/g>/, "");
  const opcao = rosto =>
    `<button data-rosto="${rosto}" aria-pressed="${estado.rosto === rosto}">${miniatura(rosto)}${esc(t(`abertura.${rosto}`))}</button>`;

  app.className = "app";
  app.innerHTML = `${topo("rosto", 1)}
    <h1 class="pergunta-grande">${esc(t("abertura.titulo"))}</h1>
    ${paragrafos(t("abertura.explicacao"), "explica")}
    <section class="bloco">
      <h3>${esc(t("abertura.escolhaRosto"))}</h3>
      <div class="escolha">${opcao("feminino")}${opcao("masculino")}</div>
    </section>`;

  barra.innerHTML = `<button class="btn sec" id="voltar">${esc(t("geral.voltar"))}</button><button class="btn pri" id="comecar" ${estado.rosto ? "" : "disabled"}>${
    esc(t(estado.rosto ? "abertura.comecar" : "abertura.comecarSemRosto"))}</button>`;

  app.querySelectorAll("[data-rosto]").forEach(b => {
    b.querySelector("svg").setAttribute("aria-hidden", "true");
    b.onclick = () => { estado.rosto = b.dataset.rosto; salvar(); telaAbertura(); };
  });
  document.getElementById("voltar").onclick = () => irPara("inicio");
  document.getElementById("comecar").onclick = () => irPara("mapa");
}
