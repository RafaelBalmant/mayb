import agenda from "../data/agenda.json";
import { ui } from "../estado.js";
import { t } from "../conteudo.js";
import { linkWhatsapp } from "../resumo.js";
import { app, barra, esc, topo, progresso } from "../util.js";
import { irPara } from "../main.js";

// Agenda: o paciente escolhe o mês e vê, dia a dia, se a Dra. atende em Maringá,
// em Siqueira Campos ou não atende. Os meses do seletor são os que estão em data/agenda.json
// (do mês atual em diante, no máximo 4); os nomes das cidades ficam em conteudo.json.
const QTD_MESES = 4;

const chaveMes = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** Os meses que dá para escolher: os cadastrados no agenda.json, a partir do mês atual. */
function mesesVisiveis(hoje) {
  const atual = chaveMes(hoje);
  const meses = Object.keys(agenda.atendimentos).filter(chave => chave >= atual).sort().slice(0, QTD_MESES)
    .map(chave => { const [ano, mes] = chave.split("-").map(Number); return new Date(ano, mes - 1, 1); });
  return meses.length ? meses : [new Date(hoje.getFullYear(), hoje.getMonth(), 1)];
}

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
  const indice = Math.min(Math.max(ui.mesAgenda || 0, 0), meses.length - 1);
  const mes = meses[indice];
  const nomesMes = t("agenda.meses");
  const semana = t("agenda.diasSemana");
  const locais = t("agenda.locais");
  const dias = locaisPorDia(mes);
  const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const ehMesAtual = chaveMes(mes) === chaveMes(hoje);
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

  const legenda = Object.entries(locais).map(([codigo, nome]) => `<li><i class="local-${codigo}"></i>${esc(nome)}</li>`).join("");

  const atendidos = Object.keys(dias).map(Number).sort((a, b) => a - b)
    .filter(dia => dia <= total && !(ehMesAtual && dia < hoje.getDate()));

  app.className = "app";
  app.innerHTML = `${topo("agenda", 1)}
    <h1>${esc(t("agenda.titulo"))}</h1>
    <p class="explica">${esc(t("agenda.explicacao"))}</p>
    <div class="seg meses" role="group" aria-label="${esc(t("agenda.escolhaMes"))}"><span class="indicador" aria-hidden="true"></span>${meses.map(botaoMes).join("")}</div>
    <section class="calendario${ui.deslize ? ` entra-${ui.deslize}` : ""}">
      <h2>${esc(t("agenda.mesAno", { mes: nomesMes[mes.getMonth()], ano: mes.getFullYear() }))}</h2>
      <div class="grade" role="grid">
        ${semana.map(s => `<span class="semana" aria-hidden="true">${esc(s)}</span>`).join("")}
        ${vazios}${celulas}
      </div>
      <ul class="legenda" aria-label="${esc(t("agenda.legenda"))}">${legenda}</ul>
    </section>
    ${atendidos.length ? "" : `<p class="vazio">${esc(t("agenda.semDatas"))}</p>`}`;

  barra.innerHTML = `<button class="btn sec" id="voltar">${esc(t("agenda.voltar"))}</button>
    <button class="btn pri" id="agendar" ${atendidos.length ? "" : "disabled"}>${esc(t("agenda.agendar", { mes: nomeMes }))}</button>`;

  // o destaque do mês desliza do mês anterior até o escolhido (mesmo ritmo do calendário)
  const indicador = app.querySelector(".meses .indicador");
  const posicao = i => { indicador.style.width = `calc((100% - 6px) / ${meses.length})`; indicador.style.transform = `translateX(${i * 100}%)`; };
  posicao(ui.mesAnterior ?? indice);
  if (ui.mesAnterior != null && ui.mesAnterior !== indice) {
    indicador.getBoundingClientRect();
    indicador.classList.add("anda");
    posicao(indice);
  }
  ui.mesAnterior = null;

  // troca de mês sem voltar ao topo da página; "lado" diz de onde o calendário novo entra
  const irParaMes = i => {
    if (i < 0 || i >= meses.length || i === indice) return;
    const rolagem = window.scrollY;
    ui.mesAnterior = indice;
    ui.mesAgenda = i;
    ui.deslize = i > indice ? "dir" : "esq";
    irPara("agenda");
    window.scrollTo(0, rolagem);
    ui.deslize = null;
  };
  app.querySelectorAll("[data-mes]").forEach(b => {
    b.onclick = () => irParaMes(Number(b.dataset.mes));
  });

  // arrastar o calendário para o lado: para a esquerda vai ao mês seguinte, para a direita volta ao anterior
  const calendario = app.querySelector(".calendario");
  let inicio = null;
  calendario.addEventListener("touchstart", e => {
    const toque = e.touches[0];
    inicio = e.touches.length === 1 ? { x: toque.clientX, y: toque.clientY } : null;
  }, { passive: true });
  calendario.addEventListener("touchend", e => {
    if (!inicio) return;
    const toque = e.changedTouches[0];
    const dx = toque.clientX - inicio.x, dy = toque.clientY - inicio.y;
    inicio = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      // o gesto não vira toque, e a tela só é refeita depois que o toque termina:
      // trocar o calendário no meio do toque fazia o celular (Safari) engolir o toque seguinte
      if (e.cancelable) e.preventDefault();
      setTimeout(() => irParaMes(indice + (dx < 0 ? 1 : -1)));
    }
  }, { passive: false });
  calendario.addEventListener("touchcancel", () => { inicio = null; }, { passive: true });
  document.getElementById("voltar").onclick = () => irPara("inicio");
  document.getElementById("agendar").onclick = () =>
    abrirModalAgendar({ mes, nomeMes, dias: atendidos.map(dia => ({ dia, locais: dias[dia] })) });
}

// "Agendar horário": a pessoa escolhe só a cidade; o mês é o que está aberto na agenda. Não escolhe dia:
// os dias de cada cidade aparecem só para ela ter uma noção, e a Dra. combina a data pelo WhatsApp.
function abrirModalAgendar({ mes, nomeMes, dias }) {
  const m = (chave, vars) => esc(t(`agenda.modal.${chave}`, vars));
  const locais = t("agenda.locais");
  const escolha = { local: null };
  const diasDo = local => dias.filter(d => d.locais.includes(local)).map(d => d.dia);

  const fundo = document.createElement("div");
  fundo.className = "modal-fundo";
  // a caixa do modal é criada uma vez só; cada toque troca apenas o conteúdo (senão a animação de abrir repete)
  fundo.innerHTML = `<div class="modal modal-agendar" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modal-titulo"></div>`;
  const modal = fundo.querySelector(".modal");
  document.body.append(fundo);
  document.body.classList.add("com-modal");

  const mensagem = () => t("agenda.mensagem.pedido", { cidade: locais[escolha.local], mes: nomeMes });

  const desenhar = () => {
    const pronto = Boolean(escolha.local);
    const opcaoLocal = ([codigo, nome]) => {
      const nums = diasDo(codigo);
      return `<button type="button" class="caminho local-${codigo}" data-local="${codigo}" aria-pressed="${escolha.local === codigo}" ${nums.length ? "" : "disabled"}>
          <strong><i aria-hidden="true"></i>${esc(nome)}</strong>${nums.length ? "" : `<span>${m("semDiasCidade")}</span>`}</button>`;
    };
    modal.innerHTML = `
        <button class="modal-fechar" id="modal-fechar" aria-label="${m("fechar")}">×</button>
        <div class="topo">${progresso("agenda", 2)}</div>
        <h2 id="modal-titulo">${m("titulo", { mes: nomeMes })}</h2>
        <fieldset class="pergunta"><legend>${m("cidade")}</legend>
          <div class="caminhos">${Object.entries(locais).map(opcaoLocal).join("")}</div>
          <div class="info-card" role="note">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v6M12 7.5v.01"/></svg>
            <p>${m("info")}</p></div></fieldset>
        <div class="modal-acoes">
          <button class="btn sec" id="modal-cancelar">${m("cancelar")}</button>
          <a class="btn pri" id="modal-enviar" target="_blank" rel="noopener" ${
            pronto ? `href="${esc(linkWhatsapp(mensagem()))}"` : `aria-disabled="true"`}>${m(pronto ? "enviar" : "faltaEscolha")}</a>
        </div>`;

    fundo.querySelector("#modal-fechar").onclick = fechar;
    fundo.querySelector("#modal-cancelar").onclick = fechar;
    fundo.querySelectorAll("[data-local]").forEach(b => b.onclick = () => {
      escolha.local = b.dataset.local;
      redesenhar(`[data-local="${b.dataset.local}"]`);
    });
    fundo.querySelector("#modal-enviar").onclick = e => {
      if (!pronto) return e.preventDefault();
      setTimeout(fechar, 300);
    };
  };

  // redesenha mantendo a rolagem e o foco no botão tocado
  const redesenhar = foco => {
    const y = modal.scrollTop;
    desenhar();
    modal.scrollTop = y;
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
  modal.focus({ preventScroll: true });
}
