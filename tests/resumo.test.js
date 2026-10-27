import { describe, expect, it } from "vitest";
import { formatarAreas, linkWhatsapp, montarMensagem } from "../src/resumo.js";
import { profissional } from "../src/conteudo.js";
import { novaArea } from "../src/estado.js";

const area = (codigo, campos = {}) => ({ ...novaArea(codigo), ...campos });
const estadoCom = (areas, nome = "") => ({ rosto: "feminino", sobre: { nome }, areas });

const completa = area("testa", {
  incomoda: ["Linhas ao franzir"],
  incomodaOutro: "Marca antiga",
  lado: "direito",
  desde: "6m_2a",
  intensidade: 4,
  quandoAparece: "movimento",
  procedimento: "sim",
  procedimentoDetalhe: "Toxina há um ano",
  comentario: "Me incomoda em fotos",
});

describe("formatarAreas", () => {
  it("área vazia só mostra o título e o nome da área", () => {
    expect(formatarAreas([area("testa")])).toMatchSnapshot();
  });

  it("área totalmente preenchida", () => {
    expect(formatarAreas([completa])).toMatchSnapshot();
  });

  it("ordena por intensidade e, no empate, pela ordem de marcação", () => {
    const texto = formatarAreas([
      area("testa", { intensidade: 2 }),
      area("olhos", { intensidade: 5 }),
      area("boca", { intensidade: 2 }),
    ]);
    expect(texto).toMatchSnapshot();
  });

  it("área 'outra' inclui a descrição", () => {
    expect(formatarAreas([area("outra", { descricao: "Cicatriz no queixo" })])).toMatchSnapshot();
  });

  it("encurta textos livres quando max é pequeno", () => {
    const longa = area("testa", { comentario: "x".repeat(300) });
    const texto = formatarAreas([longa], null, 20);
    expect(texto).toContain("x".repeat(19) + "…");
    expect(texto).not.toContain("x".repeat(20));
  });
});

describe("montarMensagem", () => {
  it("sem nome omite a linha do nome", () => {
    expect(montarMensagem(estadoCom([area("testa")]))).toMatchSnapshot();
  });

  it("com nome e várias áreas", () => {
    expect(montarMensagem(estadoCom([completa, area("olhos", { intensidade: 3 })], "Ana"))).toMatchSnapshot();
  });

  it("corta o nome em 60 caracteres", () => {
    const texto = montarMensagem(estadoCom([area("testa")], "N".repeat(100)));
    expect(texto).toContain("N".repeat(59) + "…");
    expect(texto).not.toContain("N".repeat(60));
  });

  it("respeita o limite da mensagem encurtando textos livres", () => {
    const areas = ["testa", "olhos", "boca", "queixo"].map(c => area(c, { comentario: "y".repeat(600) }));
    const texto = montarMensagem(estadoCom(areas, "Ana"));
    expect(texto.length).toBeLessThanOrEqual(profissional.limiteMensagem);
    expect(texto).toContain("…");
  });

  it("mensagem curta não é alterada pelo encurtamento", () => {
    expect(montarMensagem(estadoCom([completa]))).not.toContain("…");
  });
});

describe("linkWhatsapp", () => {
  it("monta o link wa.me com o texto codificado", () => {
    const link = linkWhatsapp("olá & tchau\nlinha 2");
    expect(link).toBe(`https://wa.me/${profissional.whatsapp}?text=${encodeURIComponent("olá & tchau\nlinha 2")}`);
  });
});
