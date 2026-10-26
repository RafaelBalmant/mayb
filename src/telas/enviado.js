import { estado, recomecar } from "../estado.js";
import { t } from "../conteudo.js";
import { montarMensagem, linkWhatsapp } from "../resumo.js";
import { app, barra, esc, marca, paragrafos } from "../util.js";
import { irPara } from "../main.js";

// Depois do envio: o que acontece agora e uma saída caso o WhatsApp não tenha aberto.
export function telaEnviado() {
  app.className = "app";
  app.innerHTML = `${marca()}
    <h1 class="pergunta-grande">${esc(t("enviado.titulo"))}</h1>
    ${paragrafos(t("enviado.explicacao"), "explica")}
    <section class="bloco">
      <h3>${esc(t("enviado.naoAbriu"))}</h3>
      <a class="btn" id="de-novo" href="${esc(linkWhatsapp(montarMensagem(estado)))}" target="_blank" rel="noopener">${esc(t("enviado.abrirDeNovo"))}</a>
    </section>
    <p class="sub nota">${esc(t("enviado.privacidade"))}</p>
    <button type="button" class="pular" id="apagar">${esc(t("enviado.apagar"))}</button>`;

  barra.innerHTML = `<button class="btn sec" id="voltar">${esc(t("enviado.voltar"))}</button>`;

  document.getElementById("voltar").onclick = () => irPara("revisar");
  document.getElementById("apagar").onclick = () => { recomecar(); irPara("abertura"); };
}
