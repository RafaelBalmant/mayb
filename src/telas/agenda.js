import agenda from "../data/agenda.json";
import { ui } from "../estado.js";
import { t } from "../conteudo.js";
import { app, barra, esc, marca } from "../util.js";
import { irPara } from "../main.js";

// Agenda: o paciente escolhe o mês (atual + 3 seguintes) e vê, dia a dia,
// se a Dra. atende em Maringá, em Siqueira Campos ou não atende.
// As datas ficam em data/agenda.json; os nomes das cidades em conteudo.json.
const QTD_MESES = 4;

/** Os meses que dá para escolher, a partir do mês atual. */
function mesesVisiveis(hoje) {
  return Array.from({ length: QTD_MESES }, (_, i) => new Date(hoje.getFullYear(), hoje.getMonth() + i, 1));
}

const chaveMes = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** { dia: [códigos das cidades] } do mês, a partir do agenda.json. */
function locaisPorDia(mes) {
  const dias = {};
  for (const [local, lista] of Object.entries(agenda.atendimentos[chaveMes(mes)] || {})) {
    for (const dia of lista) (dias[dia] ||= []).push(local);
  }
  return dias;
}

export function telaAgenda() {
  const hoje = new Date();
  const meses = mesesVisiveis(hoje);
  const indice = Math.min(Math.max(ui.mesAgenda || 0, 0), QTD_MESES - 1);
  const mes = meses[indice];
  const nomesMes = t("agenda.meses");
  const semana = t("agenda.diasSemana");
  const locais = t("agenda.locais");
  const dias = locaisPorDia(mes);
  const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const ehMesAtual = indice === 0;
  const nomeMes = nomesMes[mes.getMonth()].toLowerCase();

  const botaoMes = (m, i) => `<button data-mes="${i}" aria-pressed="${i === indice}">${esc(t("agenda.mesesCurtos")[m.getMonth()])}</button>`;
  const situacao = dia => (dias[dia] || []).map(l => locais[l] ?? l).join(" · ") || t("agenda.naoAtende");

  const vazios = Array.from({ length: mes.getDay() }, () => `<span></span>`).join("");
  const celulas = Array.from({ length: total }, (_, i) => {
    const dia = i + 1;
    const lista = dias[dia] || [];
    const classes = ["dia", ...lista.map(l => `local-${l}`)];
    if (lista.length > 1) classes.push("varios");
    if (ehMesAtual && dia < hoje.getDate()) classes.push("passou");
    const rotulo = t("agenda.diaRotulo", { dia, mes: nomeMes, situacao: situacao(dia) });
    return `<span class="${classes.join(" ")}" role="gridcell" aria-label="${esc(rotulo)}">${dia}</span>`;
  }).join("");

  const legenda = [...Object.entries(locais).map(([codigo, nome]) => `<li><i class="local-${codigo}"></i>${esc(nome)}</li>`),
    `<li><i></i>${esc(t("agenda.naoAtende"))}</li>`].join("");

  const atendidos = Object.keys(dias).map(Number).sort((a, b) => a - b)
    .filter(dia => dia <= total && !(ehMesAtual && dia < hoje.getDate()));
  const lista = atendidos.length
    ? `<ul class="agenda-lista">${atendidos.map(dia => {
        const data = new Date(mes.getFullYear(), mes.getMonth(), dia);
        return `<li><span>${esc(t("agenda.listaItem", { semana: semana[data.getDay()], dia, mes: nomeMes }))}</span>
          <strong>${dias[dia].map(l => `<em class="local-${l}">${esc(locais[l] ?? l)}</em>`).join("")}</strong></li>`;
      }).join("")}</ul>`
    : `<p class="vazio">${esc(t("agenda.semDatas"))}</p>`;

  app.className = "app";
  app.innerHTML = `${marca()}
    <h1>${esc(t("agenda.titulo"))}</h1>
    <p class="explica">${esc(t("agenda.explicacao"))}</p>
    <div class="seg meses" role="group" aria-label="${esc(t("agenda.escolhaMes"))}">${meses.map(botaoMes).join("")}</div>
    <section class="calendario">
      <h2>${esc(t("agenda.mesAno", { mes: nomesMes[mes.getMonth()], ano: mes.getFullYear() }))}</h2>
      <div class="grade" role="grid">
        ${semana.map(s => `<span class="semana" aria-hidden="true">${esc(s)}</span>`).join("")}
        ${vazios}${celulas}
      </div>
      <ul class="legenda" aria-label="${esc(t("agenda.legenda"))}">${legenda}</ul>
    </section>
    <section class="bloco">
      <h3>${esc(t("agenda.listaTitulo"))}</h3>
      ${lista}
    </section>
    <p class="sub nota">${esc(t("agenda.aviso"))}</p>`;

  barra.innerHTML = `<button class="btn sec" id="voltar">${esc(t("agenda.voltar"))}</button>`;

  app.querySelectorAll("[data-mes]").forEach(b => {
    b.onclick = () => { ui.mesAgenda = Number(b.dataset.mes); irPara("agenda"); };
  });
  document.getElementById("voltar").onclick = () => irPara("inicio");
}
