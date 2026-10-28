import { describe, expect, it } from "vitest";
import { buildMessage, formatAreas, whatsappLink } from "../src/domain/summary.js";
import { professional } from "../src/content.js";
import { newArea } from "../src/domain/questions.js";

const area = (code, fields = {}) => ({ ...newArea(code), ...fields });
const stateWith = (areas, name = "") => ({ face: "female", about: { name }, areas });

const full = area("forehead", {
  concerns: ["frown_lines"],
  concernsOther: "Marca antiga",
  side: "right",
  since: "6m_2y",
  intensity: 4,
  appearsWhen: "movement",
  procedure: "yes",
  procedureDetail: "Toxina há um ano",
  comment: "Me incomoda em fotos",
});

describe("formatAreas", () => {
  it("an empty area shows only the title and the area name", () => {
    expect(formatAreas([area("forehead")])).toMatchSnapshot();
  });

  it("a fully filled area", () => {
    expect(formatAreas([full])).toMatchSnapshot();
  });

  it("sorts by intensity and keeps marking order on ties", () => {
    const text = formatAreas([
      area("forehead", { intensity: 2 }),
      area("eyes", { intensity: 5 }),
      area("mouth", { intensity: 2 }),
    ]);
    expect(text).toMatchSnapshot();
  });

  it("the 'other' area includes its description", () => {
    expect(formatAreas([area("other", { description: "Cicatriz no queixo" })])).toMatchSnapshot();
  });

  it("shortens free text when max is small", () => {
    const long = area("forehead", { comment: "x".repeat(300) });
    const text = formatAreas([long], 20);
    expect(text).toContain("x".repeat(19) + "…");
    expect(text).not.toContain("x".repeat(20));
  });
});

describe("buildMessage", () => {
  it("omits the name line when there is no name", () => {
    expect(buildMessage(stateWith([area("forehead")]))).toMatchSnapshot();
  });

  it("with a name and several areas", () => {
    expect(buildMessage(stateWith([full, area("eyes", { intensity: 3 })], "Ana"))).toMatchSnapshot();
  });

  it("truncates the name at 60 characters", () => {
    const text = buildMessage(stateWith([area("forehead")], "N".repeat(100)));
    expect(text).toContain("N".repeat(59) + "…");
    expect(text).not.toContain("N".repeat(60));
  });

  it("respects the message limit by shortening free text", () => {
    const areas = ["forehead", "eyes", "mouth", "chin"].map((c) => area(c, { comment: "y".repeat(600) }));
    const text = buildMessage(stateWith(areas, "Ana"));
    expect(text.length).toBeLessThanOrEqual(professional.messageLimit);
    expect(text).toContain("…");
  });

  it("a short message is not shortened", () => {
    expect(buildMessage(stateWith([full]))).not.toContain("…");
  });
});

describe("whatsappLink", () => {
  it("builds the wa.me link with the encoded text", () => {
    const link = whatsappLink("olá & tchau\nlinha 2");
    expect(link).toBe(`https://wa.me/${professional.whatsapp}?text=${encodeURIComponent("olá & tchau\nlinha 2")}`);
  });
});
