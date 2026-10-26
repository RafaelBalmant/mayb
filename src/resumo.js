import { AREA, nomeCurto, profissional, rotulos, t } from "./conteudo.js";

/**
 * Bloco de áreas no formato do WhatsApp (doc de fluxo); os rótulos vêm de textos.resumo.
 * Campos pulados não aparecem. Ordem: prioritária primeiro (se houver),
 * depois por nível de incômodo; empate mantém a ordem em que foram marcadas.
 * `max` encurta os textos livres (para a mensagem caber no limite do link).
 */
export function formatarAreas(areas, prioritaria = null, max = Infinity) {
  const peso = a => (a.codigo === prioritaria ? 10 : a.intensidade || 0);
  const ordem = areas.map((a, i) => [a, i]).sort((x, y) => peso(y[0]) - peso(x[0]) || x[1] - y[1]).map(([a]) => a);
  const r = (chave, vars) => t(`resumo.${chave}`, vars);
  const livre = s => cortar(s.trim(), max);

  const linhas = [r("titulo", { n: ordem.length })];
  ordem.forEach((a, i) => {
    linhas.push("", r("area", { i: i + 1, area: nomeCurto(a.codigo) }) + (a.codigo === prioritaria ? r("prioridade") : ""));
    if (a.codigo === "outra" && a.descricao.trim()) linhas.push(r("outraDescricao", { texto: livre(a.descricao) }));
    const incomoda = [...a.incomoda.map(s => s.toLowerCase()), livre(a.incomodaOutro)].filter(Boolean);
    if (incomoda.length) linhas.push(r("incomoda", { texto: incomoda.join(", ") }));
    if (a.lado) linhas.push(r("lado", { texto: rotulos.lado[a.lado].toLowerCase() }));
    if (a.desde) linhas.push(r("desde", { texto: rotulos.desde[a.desde].toLowerCase() }));
    if (a.intensidade) linhas.push(r("intensidade", { n: a.intensidade }));
    if (a.quandoAparece && AREA[a.codigo].movimento) linhas.push(r("quandoAparece", { texto: rotulos.quandoAparece[a.quandoAparece].toLowerCase() }));
    if (a.procedimento) {
      const detalhe = a.procedimento === "sim" && a.procedimentoDetalhe.trim() ? r("procedimentoDetalhe", { texto: livre(a.procedimentoDetalhe) }) : "";
      linhas.push(r("procedimento", { texto: rotulos.procedimento[a.procedimento].toLowerCase() }) + detalhe);
    }
    if (a.comentario.trim()) linhas.push(r("comentario", { texto: livre(a.comentario) }));
  });
  return linhas.join("\n");
}

const cortar = (s, max) => (s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s);

/**
 * Mensagem inteira do WhatsApp: saudação, dados da pessoa, áreas e rodapé (textos.mensagem).
 * Se passar do limite (profissional.limiteMensagem), os textos livres vão sendo encurtados.
 */
export function montarMensagem(estado) {
  const m = (chave, vars) => t(`mensagem.${chave}`, vars);
  const nome = estado.sobre.nome.trim();
  const montar = max => [
    m("saudacao"),
    ...(nome ? ["", m("nome", { texto: cortar(nome, 60) })] : []),
    "",
    formatarAreas(estado.areas, null, max),
    "",
    m("rodape", { profissional: profissional.nome }),
  ].join("\n");

  let texto = montar(Infinity);
  for (let max = 200; texto.length > profissional.limiteMensagem && max >= 20; max -= 20) texto = montar(max);
  return texto;
}

/** Link wa.me com a mensagem já preenchida. */
export const linkWhatsapp = texto => `https://wa.me/${profissional.whatsapp}?text=${encodeURIComponent(texto)}`;
