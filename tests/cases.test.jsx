import { renderToString } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { CaseCard, areasLabel } from "../src/components/CaseCard.jsx";
import {
  areasWithCases,
  casesOf,
  filesByFolder,
  groupByArea,
  loadCases,
  pairsOf,
  partsWithCases,
  withExamples,
} from "../src/domain/cases.js";

const files = {
  "../cases/labios-01/antes.jpg": "/a/labios-antes.jpg",
  "../cases/labios-01/depois.jpg": "/a/labios-depois.jpg",
  "../cases/labios-01/antes-2.JPG": "/a/labios-antes-2.jpg",
  "../cases/labios-01/depois-2.webp": "/a/labios-depois-2.webp",
  "../cases/labios-01/audio.mp3": "/a/labios.mp3",
  "../cases/nariz-01/antes.png": "/a/nariz-antes.png",
  "../cases/nariz-01/depois.png": "/a/nariz-depois.png",
  "../cases/sem-depois/antes.jpg": "/a/x.jpg",
};
const list = [
  { folder: "labios-01", title: "Lábios", areas: ["chin", "mouth"], audio: "audio.mp3", audioText: "Explicação" },
  { folder: "nariz-01", title: "Nariz", areas: ["nose"], procedures: ["Rinomodelação"], after: "15 dias depois" },
  { folder: "escondido", title: "Fora do ar", areas: ["nose"], visible: false },
  { folder: "sem-depois", title: "Sem depois", areas: ["nose"] },
  { folder: "nao-existe", title: "Sem pasta", areas: ["chin"] },
];
const cases = loadCases(list, files);

describe("case folders", () => {
  it("groups files by folder with lower-case names", () => {
    expect(filesByFolder(files)["labios-01"]["antes-2.jpg"]).toBe("/a/labios-antes-2.jpg");
  });

  it("pairs antes/depois, then antes-2/depois-2…, stopping at the first incomplete pair", () => {
    const folders = filesByFolder(files);
    expect(pairsOf(folders["labios-01"])).toEqual([
      { before: "/a/labios-antes.jpg", after: "/a/labios-depois.jpg" },
      { before: "/a/labios-antes-2.jpg", after: "/a/labios-depois-2.webp" },
    ]);
    expect(pairsOf(folders["sem-depois"])).toEqual([]);
    expect(pairsOf(undefined)).toEqual([]);
  });

  it("keeps visible cases that have photos, in list order, with areas in face order and the audio url", () => {
    expect(cases.map((c) => c.folder)).toEqual(["labios-01", "nariz-01"]);
    expect(cases[0].areas).toEqual(["mouth", "chin"]);
    expect(cases[0].audio).toBe("/a/labios.mp3");
    expect(cases[1].audio).toBeNull();
    expect(cases[0].procedures).toEqual([]);
  });
});

describe("grouping by area", () => {
  it("lists the areas with cases in face order, and the cases of each area", () => {
    expect(areasWithCases(cases)).toEqual(["nose", "mouth", "chin"]);
    expect(casesOf("chin", cases).map((c) => c.folder)).toEqual(["labios-01"]);
  });

  it("shows a case with several areas only once, under the first chosen area in face order", () => {
    const groups = groupByArea(["chin", "nose", "mouth"], cases);
    expect(groups.map((g) => [g.code, g.cases.map((c) => c.folder)])).toEqual([
      ["nose", ["nariz-01"]],
      ["mouth", ["labios-01"]],
    ]);
    expect(groupByArea(["chin"], cases).map((g) => g.code)).toEqual(["chin"]);
    expect(groupByArea([], cases)).toEqual([]);
  });

  it("the results step gets a card per marked part, in marking order ('other' has none)", () => {
    expect(partsWithCases([{ code: "eyes" }, { code: "other" }, { code: "forehead" }])).toEqual(["eyes", "forehead"]);
  });
});

describe("case card", () => {
  const html = (item) => renderToString(<CaseCard item={item} onOpen={() => {}} />);

  it("shows the areas joined with +, the audio with its text, and before above after for each pair", () => {
    expect(areasLabel(["mouth", "chin"])).toBe("Boca e lábios + Queixo");
    const out = html(cases[0]);
    expect(out).toContain("Boca e lábios + Queixo");
    expect(out).toContain('src="/a/labios.mp3"');
    expect(out).toContain("Ler o que ela disse");
    expect(out.match(/class="case-pair"/g)).toHaveLength(2);
    expect(out.indexOf("labios-antes.jpg")).toBeLessThan(out.indexOf("labios-depois.jpg"));
  });

  it("a case with one area and no audio shows neither; 'after' goes on the after label", () => {
    const out = html(cases[1]);
    expect(out).not.toContain("case-areas");
    expect(out).not.toContain("<audio");
    expect(out).toContain("Rinomodelação");
    expect(out).toContain("Depois · 15 dias depois");
  });
});

describe("example cases", () => {
  it("come after the real ones, tagged, only while shown", () => {
    const real = [{ folder: "a" }];
    const sample = [{ folder: "b" }];
    expect(withExamples(real, sample, true)).toEqual([{ folder: "a" }, { folder: "b", example: true }]);
    expect(withExamples(real, sample, false)).toBe(real);
  });

  it("the card shows the 'Exemplo' tag only on examples", () => {
    const html = (item) => renderToString(<CaseCard item={item} onOpen={() => {}} />);
    expect(html({ ...cases[1], example: true })).toContain("Exemplo");
    expect(html(cases[1])).not.toContain("case-example");
  });
});
