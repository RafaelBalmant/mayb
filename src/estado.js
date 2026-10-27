// Estado do paciente. Fica só no navegador (memória + sessionStorage para
// sobreviver a um recarregar). Nada vai para servidor.
//
// Formato, reutilizado pelo resumo e pelo envio por WhatsApp:
// {
//   rosto: "feminino" | "masculino" | null,
//   sobre: { nome: string },        // só o nome por enquanto (idade e período virão na etapa "Sobre você")
//   areas: [{                       // na ordem em que foram marcadas
//     codigo,                       // ver data/conteudo.json
//     incomoda: [string],           // opções escolhidas, na ordem do conteúdo
//     incomodaOutro: string,        // "Outro" em texto
//     descricao: string,            // só para "outra"
//     lado, desde, quandoAparece,   // códigos de rotulos.*, ou null
//     intensidade: 1..5 | null,
//     procedimento: "nao" | "sim" | "nao_lembro" | null,
//     procedimentoDetalhe: string,
//     comentario: string
//   }]
// }
const CHAVE = "site-mayara:v2";

export const estado = { rosto: null, sobre: { nome: "" }, areas: [] };
export const ui = { tela: "inicio", vista: "frente", indice: 0, mesAgenda: 0, aberta: null, viuCasos: false };

try {
  const salvo = JSON.parse(sessionStorage.getItem(CHAVE));
  if (salvo) { Object.assign(estado, salvo.estado); Object.assign(ui, salvo.ui); }
  estado.sobre = { nome: "", ...estado.sobre };
} catch {}

export function salvar() {
  try { sessionStorage.setItem(CHAVE, JSON.stringify({ estado, ui })); } catch {}
}

export function novaArea(codigo) {
  return {
    codigo, incomoda: [], incomodaOutro: "", descricao: "",
    lado: null, desde: null, intensidade: null, quandoAparece: null,
    procedimento: null, procedimentoDetalhe: "", comentario: "",
  };
}

export const estaMarcada = codigo => estado.areas.some(a => a.codigo === codigo);

/** Marca ou desmarca a área. Devolve true se ficou marcada. */
export function alternarArea(codigo) {
  if (estaMarcada(codigo)) estado.areas = estado.areas.filter(a => a.codigo !== codigo);
  else estado.areas.push(novaArea(codigo));
  salvar();
  return estaMarcada(codigo);
}

export function recomecar() {
  estado.rosto = null;
  estado.sobre = { nome: "" };
  estado.areas = [];
  Object.assign(ui, { tela: "abertura", vista: "frente", indice: 0, aberta: null, viuCasos: false });
  salvar();
}
