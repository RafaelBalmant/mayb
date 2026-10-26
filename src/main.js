import "./tema.css";
import "./style.css";
import { t } from "./conteudo.js";
import { estado, ui, salvar } from "./estado.js";
import { telaAbertura } from "./telas/abertura.js";
import { telaMapa } from "./telas/mapa.js";
import { telaProximo } from "./telas/proximo.js";
import { telaDetalhes } from "./telas/detalhes.js";
import { telaRevisar } from "./telas/revisar.js";
import { telaEnviado } from "./telas/enviado.js";

/** Mostra a tela certa para o estado atual. */
export function render() {
  salvar();
  if (ui.tela === "abertura" || !estado.rosto) { ui.tela = "abertura"; return telaAbertura(); }
  if (ui.tela === "proximo" && estado.areas.length) return telaProximo();
  if (ui.tela === "detalhes" && estado.areas.length) return telaDetalhes();
  if (ui.tela === "revisar" && estado.areas.length) return telaRevisar();
  if (ui.tela === "enviado" && estado.areas.length) return telaEnviado();
  ui.tela = "mapa";
  return telaMapa();
}

/** Troca de tela e volta ao topo. */
export function irPara(tela, indice = 0) {
  ui.tela = tela;
  ui.indice = indice;
  render();
  window.scrollTo(0, 0);
}

document.title = t("geral.tituloPagina");
render();
