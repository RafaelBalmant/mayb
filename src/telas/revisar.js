import { estado, salvar } from "../estado.js";
import { t } from "../conteudo.js";
import { montarMensagem, linkWhatsapp } from "../resumo.js";
import { app, barra, esc, topo } from "../util.js";
import { irPara } from "../main.js";

// Revisar e enviar: a mensagem exatamente como vai chegar, o aviso de privacidade e o botão do WhatsApp.
// Os dois caminhos depois do mapa ("falar com a Dra." e "passar mais informações") terminam aqui.
export function telaRevisar() {
  const respondeu = estado.areas.some(a =>
    a.incomoda.length || a.incomodaOutro || a.lado || a.desde || a.intensidade || a.quandoAparece || a.procedimento || a.comentario.trim());

  app.className = "app";
  app.innerHTML = `${topo("rosto", 4)}
    <div class="bloco" style="gap:6px"><h1>${esc(t("revisar.titulo"))}</h1>
      <p class="sub">${esc(t("revisar.explicacao"))}</p></div>
    <div class="pergunta"><label for="nome">${esc(t("revisar.nome"))} <span class="obs">${esc(t("revisar.nomeObs"))}</span></label>
      <input type="text" id="nome" autocomplete="given-name" placeholder="${esc(t("revisar.nomePlaceholder"))}" value="${esc(estado.sobre.nome)}"></div>
    <section class="bloco">
      <h3>${esc(t("revisar.previa"))}</h3>
      <pre class="zap" id="previa"></pre>
      <div class="editar-links">
        <button type="button" class="pular" id="editar-areas">${esc(t("revisar.editarAreas"))}</button>
        <button type="button" class="pular" id="editar-detalhes">${esc(t(respondeu ? "revisar.editarDetalhes" : "revisar.adicionarDetalhes"))}</button>
      </div>
    </section>
    <p class="privacidade">${esc(t("revisar.privacidade"))}</p>
    <p class="sub nota">${esc(t("revisar.aviso"))}</p>`;

  barra.innerHTML = `<button class="btn sec" id="voltar">${esc(t("geral.voltar"))}</button>
    <a class="btn pri" id="enviar" target="_blank" rel="noopener">${esc(t("revisar.enviar"))}</a>`;

  const previa = document.getElementById("previa");
  const enviar = document.getElementById("enviar");
  const atualizar = () => {
    const texto = montarMensagem(estado);
    previa.textContent = texto;
    enviar.href = linkWhatsapp(texto);
  };
  atualizar();

  document.getElementById("nome").oninput = e => { estado.sobre.nome = e.target.value; salvar(); atualizar(); };
  enviar.onclick = () => {
    // o link abre o WhatsApp; aqui só mostramos o que acontece depois
    setTimeout(() => irPara("enviado"), 300);
  };
  document.getElementById("editar-areas").onclick = () => irPara("mapa");
  document.getElementById("editar-detalhes").onclick = () => irPara("detalhes", 0);
  document.getElementById("voltar").onclick = () =>
    (respondeu ? irPara("detalhes", estado.areas.length - 1) : irPara("proximo"));
}
