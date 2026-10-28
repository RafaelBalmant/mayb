// Reads data saved by the old Portuguese-named code (sessionStorage key "site-mayara:v2")
// and converts it to the current shape. This is the only place where the old names live on.
import { AREA_BY_CODE } from "./content.js";

const FACE = { feminino: "female", masculino: "male" };
const VIEW = { frente: "front", perfil: "profile" };
const SCREEN = {
  abertura: "opening", mapa: "map", proximo: "next", detalhes: "details", revisar: "review", enviado: "sent",
};
const AREA = {
  testa: "forehead", olhos: "eyes", bochechas: "cheeks", nariz: "nose", boca: "mouth", queixo: "chin",
  mandibula: "jawline", pescoco: "neck", pele: "skin", outra: "other",
};
const SIDE = { esquerdo: "left", direito: "right", os_dois: "both", nao_sei: "unknown" };
const SINCE = { menos_6m: "under_6m", "6m_2a": "6m_2y", mais_2a: "over_2y", sempre: "always" };
const APPEARS_WHEN = { parado: "still", movimento: "movement", ambos: "both", nao_sei: "unknown" };
const PROCEDURE = { nao: "no", sim: "yes", nao_lembro: "dont_remember" };

const map = (table, value) => (value == null ? null : (table[value] ?? null));

/** Old saves kept the option text; now we keep its id. Texts that no longer exist are dropped. */
function concernIds(areaCode, texts = []) {
  const options = AREA_BY_CODE[areaCode]?.options ?? [];
  return texts.map(text => options.find(o => o.label === text)?.id).filter(Boolean);
}

function migrateArea(a) {
  const code = map(AREA, a.codigo);
  return {
    code,
    concerns: concernIds(code, a.incomoda),
    concernsOther: a.incomodaOutro ?? "",
    description: a.descricao ?? "",
    side: map(SIDE, a.lado),
    since: map(SINCE, a.desde),
    intensity: a.intensidade ?? null,
    appearsWhen: map(APPEARS_WHEN, a.quandoAparece),
    procedure: map(PROCEDURE, a.procedimento),
    procedureDetail: a.procedimentoDetalhe ?? "",
    comment: a.comentario ?? "",
  };
}

/** Converts the parsed v2 payload `{ estado, ui }` to `{ state, ui }`. Unknown values become null. */
export function migrateV2(saved) {
  const { estado = {}, ui = {} } = saved ?? {};
  return {
    state: {
      face: map(FACE, estado.rosto),
      about: { name: estado.sobre?.nome ?? "" },
      areas: (estado.areas ?? []).map(migrateArea).filter(a => a.code),
    },
    ui: {
      screen: SCREEN[ui.tela] ?? "opening",
      view: VIEW[ui.vista] ?? "front",
      index: ui.indice ?? 0,
      consent: Boolean(ui.aceite),
    },
  };
}
