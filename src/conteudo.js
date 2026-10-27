import conteudo from "./data/conteudo.json";

export const { profissional, areas, rotulos, faq, textos } = conteudo;

/** Área pelo código. */
export const AREA = Object.fromEntries(areas.map(a => [a.codigo, a]));

/** Nome sem a explicação entre parênteses. */
export const nomeCurto = codigo => AREA[codigo].nome.replace(/ \(.+\)$/, "");

/**
 * Texto do site: t("mapa.nomes"), t("geral.etapa", { atual: 3, total: 8, titulo: "…" }).
 * Todo texto que aparece para o paciente vem de data/conteudo.json (seção "textos").
 */
export function t(chave, vars = {}) {
  const valor = chave.split(".").reduce((o, k) => o?.[k], textos);
  if (valor === undefined) {
    console.warn(`Texto não encontrado em conteudo.json: textos.${chave}`);
    return chave;
  }
  if (typeof valor !== "string") return valor;
  return valor.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

/** Texto com singular/plural: { "um": "...", "varios": "... {n} ..." }. */
export const tn = (chave, n, vars = {}) => t(`${chave}.${n === 1 ? "um" : "varios"}`, { n, ...vars });
