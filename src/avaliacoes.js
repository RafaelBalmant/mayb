import { avaliacoesGoogle as config } from "./conteudo.js";

// Nota e avaliações da Dra. Mayara no Google, buscadas na hora pelo navegador (Google Maps JavaScript API,
// biblioteca Places). A chave e o Place ID ficam em conteudo.json → avaliacoesGoogle.
// Sem chave, sem resposta em 10 s ou com qualquer erro, devolve null e o início não mostra o bloco.

const LIMITE_MS = 10000;
let busca;

/** { nota, total, link, avaliacoes: [{ autor, linkAutor, foto, estrelas, texto, quando }] } ou null. */
export function carregarAvaliacoes() {
  if (!config?.chave || !config?.placeId) return Promise.resolve(null);
  busca ??= Promise.race([buscar(), new Promise(ok => setTimeout(() => ok(null), LIMITE_MS))])
    .catch(erro => { console.warn("Avaliações do Google indisponíveis:", erro); return null; });
  return busca;
}

async function buscar() {
  await carregarScript();
  const { Place } = await google.maps.importLibrary("places");
  const lugar = new Place({ id: config.placeId, requestedLanguage: "pt-BR" });
  await lugar.fetchFields({ fields: ["rating", "userRatingCount", "reviews", "googleMapsURI"] });

  const minimo = config.minimoEstrelas ?? 1;
  const avaliacoes = (lugar.reviews ?? [])
    .filter(r => (r.rating ?? 0) >= minimo && r.text?.trim())
    .map(r => ({
      autor: r.authorAttribution?.displayName ?? "",
      linkAutor: r.authorAttribution?.uri ?? "",
      foto: r.authorAttribution?.photoURI ?? "",
      estrelas: r.rating,
      texto: r.text.trim(),
      quando: r.relativePublishTimeDescription ?? "",
    }));

  if (!lugar.rating || !avaliacoes.length) return null;
  return { nota: lugar.rating, total: lugar.userRatingCount ?? 0, link: lugar.googleMapsURI ?? "", avaliacoes };
}

// Carrega o script do Google uma vez só. Chave recusada (domínio não liberado, API desligada) cai em
// gm_authFailure, que o Google chama em vez de dar erro.
function carregarScript() {
  if (window.google?.maps?.importLibrary) return Promise.resolve();
  return new Promise((ok, falha) => {
    window.__avaliacoesProntas = ok;
    window.gm_authFailure = () => falha(new Error("chave recusada pelo Google"));
    const s = document.createElement("script");
    const params = new URLSearchParams({ key: config.chave, v: "weekly", loading: "async", language: "pt-BR", region: "BR", callback: "__avaliacoesProntas" });
    s.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    s.async = true;
    s.onerror = () => falha(new Error("script do Google não carregou"));
    document.head.append(s);
  });
}
