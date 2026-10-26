import agenda from "../data/agenda.json";
import { ui } from "../estado.js";
import { t, tn } from "../conteudo.js";
import { linkWhatsapp } from "../resumo.js";
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

  barra.innerHTML = `<button class="btn sec" id="voltar">${esc(t("agenda.voltar"))}</button>
    <button class="btn pri" id="agendar" ${atendidos.length ? "" : "disabled"}>${esc(t("agenda.agendar"))}</button>`;

  app.querySelectorAll("[data-mes]").forEach(b => {
    b.onclick = () => { ui.mesAgenda = Number(b.dataset.mes); irPara("agenda"); };
  });
  document.getElementById("voltar").onclick = () => irPara("inicio");
  document.getElementById("agendar").onclick = () =>
    abrirModalAgendar({ mes, nomeMes, dias: atendidos.map(dia => ({ dia, locais: dias[dia] })) });
}

// "Agendar horário" em dois passos: 1) cidade, 2) qualquer dia do mês ou os dias preferidos entre os que ela
// atende naquela cidade → WhatsApp. É um pedido: a Dra. confirma a disponibilidade.
function abrirModalAgendar({ mes, nomeMes, dias }) {
  const m = (chave, vars) => esc(t(`agenda.modal.${chave}`, vars));
  const locais = t("agenda.locais");
  const semana = t("agenda.diasSemana");
  // dias: os que a pessoa prefere (pode ser mais de um; a Dra. confirma a disponibilidade). qualquer: qualquer dia do mês.
  const escolha = { local: null, qualquer: false, dias: [] };
  const diasDo = local => dias.filter(d => d.locais.includes(local)).map(d => d.dia);
  const nomeSemana = dia => semana[new Date(mes.getFullYear(), mes.getMonth(), dia).getDay()];

  const fundo = document.createElement("div");
  fundo.className = "modal-fundo";
  document.body.append(fundo);
  document.body.classList.add("com-modal");

  const mensagem = () => {
    const vars = { cidade: locais[escolha.local], mes: nomeMes };
    if (escolha.qualquer) return t("agenda.mensagem.qualquerDia", vars);
    const longos = t("agenda.diasSemanaLongos");
    const lista = escolha.dias.map(dia =>
      t("agenda.mensagem.diaItem", { dia, mes: nomeMes, semana: longos[new Date(mes.getFullYear(), mes.getMonth(), dia).getDay()] }));
    return t("agenda.mensagem.diasPreferidos", { ...vars, dias: lista.join("\n") });
  };

  const desenhar = () => {
    const passo = escolha.local ? 2 : 1;
    const pronto = escolha.local && (escolha.qualquer || escolha.dias.length > 0);
    const cabecalho = `
        <button class="modal-fechar" id="modal-fechar" aria-label="${m("fechar")}">×</button>
        <div class="contador">${m("passo", { atual: passo, total: 2 })}</div>
        <h2 id="modal-titulo">${m("titulo", { mes: nomeMes })}</h2>`;

    let corpo;
    if (passo === 1) {
      const opcaoLocal = ([codigo, nome]) => {
        const qtd = diasDo(codigo).length;
        return `<button type="button" class="caminho" data-local="${codigo}" ${qtd ? "" : "disabled"}>
          <strong>${esc(nome)}</strong><span>${qtd ? esc(tn("agenda.modal.diasNaCidade", qtd)) : m("semDiasCidade")}</span></button>`;
      };
      corpo = `
        <p class="sub">${m("explicacaoCidade")}</p>
        <fieldset class="pergunta"><legend>${m("cidade")}</legend>
          <div class="caminhos">${Object.entries(locais).map(opcaoLocal).join("")}</div></fieldset>
        <div class="modal-acoes"><button class="btn sec" id="modal-cancelar">${m("cancelar")}</button></div>`;
    } else {
      const marcado = valor => (valor === "qualquer" ? escolha.qualquer : escolha.dias.includes(valor));
      const chipDia = (valor, rotulo) =>
        `<button type="button" class="chip" data-dia="${valor}" aria-pressed="${marcado(valor)}">${esc(rotulo)}</button>`;
      corpo = `
        <p class="sub">${m("explicacaoDia", { cidade: locais[escolha.local] })}</p>
        <fieldset class="pergunta"><legend>${m("dia")} <span class="obs">${m("variosDias")}</span></legend>
          <div class="chips">${chipDia("qualquer", t("agenda.modal.qualquerDia"))}${
            diasDo(escolha.local).map(dia => chipDia(dia, t("agenda.modal.diaChip", { semana: nomeSemana(dia), dia }))).join("")}</div></fieldset>
        <div class="modal-acoes">
          <button class="btn sec" id="modal-voltar">${m("voltar")}</button>
          <a class="btn pri" id="modal-enviar" target="_blank" rel="noopener" ${
            pronto ? `href="${esc(linkWhatsapp(mensagem()))}"` : `aria-disabled="true"`}>${m(pronto ? "enviar" : "faltaEscolha")}</a>
        </div>`;
    }

    fundo.innerHTML = `
      <div class="modal modal-agendar" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">${cabecalho}${corpo}</div>`;

    fundo.querySelector("#modal-fechar").onclick = fechar;
    fundo.querySelectorAll("[data-local]").forEach(b => b.onclick = () => {
      escolha.local = b.dataset.local;
      escolha.qualquer = false;
      escolha.dias = [];
      redesenhar();
    });
    fundo.querySelectorAll("[data-dia]").forEach(b => b.onclick = () => {
      // "qualquer dia" e dias específicos não se misturam: escolher um desmarca o outro
      if (b.dataset.dia === "qualquer") {
        escolha.qualquer = !escolha.qualquer;
        escolha.dias = [];
      } else {
        const dia = Number(b.dataset.dia);
        escolha.qualquer = false;
        escolha.dias = escolha.dias.includes(dia) ? escolha.dias.filter(d => d !== dia) : [...escolha.dias, dia].sort((a, b) => a - b);
      }
      redesenhar(`[data-dia="${b.dataset.dia}"]`);
    });
    fundo.querySelector("#modal-cancelar")?.addEventListener("click", fechar);
    fundo.querySelector("#modal-voltar")?.addEventListener("click", () => {
      const anterior = escolha.local;
      escolha.local = null;
      escolha.qualquer = false;
      escolha.dias = [];
      redesenhar(`[data-local="${anterior}"]`);
    });
    const enviar = fundo.querySelector("#modal-enviar");
    if (enviar) enviar.onclick = e => {
      if (!pronto) return e.preventDefault();
      setTimeout(fechar, 300);
    };
  };

  // redesenha; dentro do mesmo passo mantém a rolagem e o foco no botão tocado
  const redesenhar = foco => {
    const y = fundo.querySelector(".modal").scrollTop;
    desenhar();
    const modal = fundo.querySelector(".modal");
    if (foco) modal.scrollTop = y;
    ((foco && fundo.querySelector(foco)) || modal).focus({ preventScroll: true });
  };

  const fechar = () => {
    fundo.remove();
    document.body.classList.remove("com-modal");
    document.removeEventListener("keydown", teclas);
    document.getElementById("agendar")?.focus({ preventScroll: true });
  };
  const teclas = e => { if (e.key === "Escape") fechar(); };
  document.addEventListener("keydown", teclas);
  fundo.onclick = e => { if (e.target === fundo) fechar(); };

  desenhar();
  fundo.querySelector(".modal").focus({ preventScroll: true });
}
