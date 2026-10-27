import { beforeEach, describe, expect, it, vi } from "vitest";

const CHAVE = "site-mayara:v2";

function stubStorage(inicial = {}) {
  const dados = { ...inicial };
  vi.stubGlobal("sessionStorage", {
    getItem: k => (k in dados ? dados[k] : null),
    setItem: (k, v) => { dados[k] = String(v); },
  });
  return dados;
}

// estado.js lê o sessionStorage ao ser importado, então cada teste importa um módulo novo.
async function carregar(inicial) {
  vi.resetModules();
  const dados = stubStorage(inicial);
  return { dados, mod: await import("../src/estado.js") };
}

beforeEach(() => vi.unstubAllGlobals());

describe("novaArea", () => {
  it("cria a área com todos os campos vazios", async () => {
    const { mod } = await carregar();
    expect(mod.novaArea("testa")).toEqual({
      codigo: "testa", incomoda: [], incomodaOutro: "", descricao: "",
      lado: null, desde: null, intensidade: null, quandoAparece: null,
      procedimento: null, procedimentoDetalhe: "", comentario: "",
    });
  });
});

describe("alternarArea", () => {
  it("marca, desmarca e persiste", async () => {
    const { mod, dados } = await carregar();
    expect(mod.alternarArea("testa")).toBe(true);
    expect(mod.estaMarcada("testa")).toBe(true);
    expect(JSON.parse(dados[CHAVE]).estado.areas).toHaveLength(1);

    expect(mod.alternarArea("testa")).toBe(false);
    expect(mod.estado.areas).toEqual([]);
  });

  it("mantém a ordem em que as áreas foram marcadas", async () => {
    const { mod } = await carregar();
    ["olhos", "testa", "labios"].forEach(mod.alternarArea);
    expect(mod.estado.areas.map(a => a.codigo)).toEqual(["olhos", "testa", "labios"]);
  });
});

describe("persistência", () => {
  it("restaura estado e ui salvos", async () => {
    const salvo = {
      estado: { rosto: "masculino", sobre: { nome: "Ana" }, areas: [] },
      ui: { tela: "mapa", vista: "lado", indice: 2 },
    };
    const { mod } = await carregar({ [CHAVE]: JSON.stringify(salvo) });
    expect(mod.estado.rosto).toBe("masculino");
    expect(mod.estado.sobre.nome).toBe("Ana");
    expect(mod.ui).toMatchObject(salvo.ui);
  });

  it("ignora JSON inválido e usa o padrão", async () => {
    const { mod } = await carregar({ [CHAVE]: "{quebrado" });
    expect(mod.estado).toEqual({ rosto: null, sobre: { nome: "" }, areas: [] });
    expect(mod.ui).toEqual({ tela: "abertura", vista: "frente", indice: 0, aceite: false });
  });

  it("funciona sem sessionStorage disponível", async () => {
    vi.resetModules();
    vi.stubGlobal("sessionStorage", { getItem() { throw new Error("bloqueado"); }, setItem() { throw new Error("bloqueado"); } });
    const mod = await import("../src/estado.js");
    expect(() => mod.alternarArea("testa")).not.toThrow();
  });
});

describe("recomecar", () => {
  it("limpa tudo e volta para a abertura", async () => {
    const { mod } = await carregar();
    mod.estado.rosto = "feminino";
    mod.estado.sobre.nome = "Ana";
    mod.alternarArea("testa");
    Object.assign(mod.ui, { tela: "revisar", indice: 3 });

    mod.recomecar();

    expect(mod.estado).toEqual({ rosto: null, sobre: { nome: "" }, areas: [] });
    expect(mod.ui).toMatchObject({ tela: "abertura", vista: "frente", indice: 0, aceite: false });
  });
});
