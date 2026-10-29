import { renderToString } from "preact-render-to-string";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App.jsx";
import { professional } from "../src/content.js";
import { SCREEN_IDS } from "../src/domain/flow.js";
import { newArea } from "../src/domain/questions.js";
import { initialState } from "../src/store/reducer.js";
import { StoreProvider } from "../src/store/StoreProvider.jsx";

const stateOn = (screen, patch = {}, ui = {}, mapEnabled = true) => ({
  ...initialState({ mapEnabled }),
  face: "female",
  areas: [
    { ...newArea("forehead"), concerns: ["frown_lines"], side: "right", intensity: 4 },
    { ...newArea("nose") },
    { ...newArea("other"), description: "perto da orelha" },
  ],
  ...patch,
  ui: { ...initialState().ui, screen, ...ui },
});
const html = (state, index) =>
  renderToString(
    <StoreProvider initialState={{ ...state, ui: { ...state.ui, index: index ?? state.ui.index } }}>
      <App />
    </StoreProvider>,
  );

afterEach(() => vi.useRealTimers());

describe("every screen renders inside the shared layout", () => {
  it.each(SCREEN_IDS)("%s", (id) => {
    const out = html(stateOn(id));
    expect(out).toContain('id="app"');
    expect(out).toContain('id="bar-in"');
  });
});

describe("with the map off (the default)", () => {
  it.each(["opening", "map", "results", "next", "details", "review", "sent", "cases"])(
    "%s shows the start page",
    (id) => {
      const out = html(stateOn(id, {}, {}, false));
      expect(out).toContain("Verificar agenda");
      expect(out).not.toContain("Me conta o que te incomoda no rosto");
    },
  );

  it("the start page does not offer the map flow nor the cases page", () => {
    expect(html(stateOn("start", {}, {}, false))).not.toContain('id="go-map"');
    expect(html(stateOn("start", {}, {}, false))).not.toContain('id="go-cases"');
  });
});

describe("start", () => {
  it("shows the name, the agenda and contact buttons, the cities and Instagram, without the action bar", () => {
    const out = html(stateOn("start"));
    expect(out).toContain("Dra. Mayara");
    expect(out).toContain("Verificar agenda");
    expect(out).toContain(`https://wa.me/${professional.whatsapp}?text=`);
    expect(out).toContain(`href="${professional.googleReview}"`);
    expect(out).toContain("Compartilhe sua experiência");
    expect(out).toContain("Harmonização facial em Maringá e Siqueira Campos");
    expect(out).toContain(professional.instagram);
    expect(out).toMatch(/id="bar"[^>]*hidden/);
  });

  it("offers the map flow only when it is on", () => {
    expect(html(stateOn("start"))).toContain('id="go-map"');
  });
});

describe("agenda", () => {
  const nov = () => vi.setSystemTime(new Date(2026, 10, 10)); // Nov 10 2026, a Tuesday

  it("shows the month tabs, the calendar of the chosen month and the booking button", () => {
    nov();
    const out = html(stateOn("agenda"));
    expect(out).toContain("Novembro de 2026");
    expect(out).toContain("Agendar horário em novembro");
    for (const tab of ["Nov", "Dez", "Jan"]) expect(out).toContain(`>${tab}</button>`);
  });

  it("labels each day with the city, and marks past days", () => {
    nov();
    const out = html(stateOn("agenda"));
    expect(out).toContain('aria-label="11 de novembro: Siqueira Campos"');
    expect(out).toContain('aria-label="5 de novembro: Maringá"');
    expect(out).toContain('aria-label="1 de novembro: Não atende"');
    expect(out).toMatch(/class="day location-maringa past"[^>]*>\s*5</);
  });

  it("goes to the month stored in the state", () => {
    nov();
    const out = html(stateOn("agenda", {}, { agendaMonth: 1 }));
    expect(out).toContain("Dezembro de 2026");
    expect(out).toContain("Agendar horário em dezembro");
  });

  it("is reachable without the map", () => {
    nov();
    expect(html(stateOn("agenda", {}, {}, false))).toContain("Novembro de 2026");
  });
});

describe("opening", () => {
  it("the start button is disabled until a face is chosen, and there is a back button", () => {
    expect(html({ ...stateOn("opening"), face: null })).toMatch(/id="start"[^>]*disabled/);
    expect(html(stateOn("opening"))).not.toMatch(/id="start"[^>]*disabled/);
    expect(html(stateOn("opening"))).toContain('id="back"');
  });
});

describe("map", () => {
  it("zones are buttons and reflect what is marked; every area has a name button", () => {
    const out = html(stateOn("map"));
    expect(out).toContain('aria-label="Testa"');
    expect(out).toMatch(/class="zone selected"[^>]*data-area="forehead"/);
    for (const name of ["Testa", "Olhos e sobrancelhas", "Pele em geral", "Outra parte: perto da orelha"]) {
      expect(out).toContain(name);
    }
    expect(out).toContain("Toque no rosto ou no nome da parte");
  });

  it("does not offer the profile view while it is off", () => {
    expect(html(stateOn("map"))).not.toContain(">Perfil</button>");
  });

  it("continue is disabled without marked areas", () => {
    expect(html(stateOn("map", { areas: [] }))).toMatch(/id="proceed"[^>]*disabled/);
  });
});

describe("results", () => {
  it("shows one card per marked part that has a photo entry ('other' has none)", () => {
    const out = html(stateOn("results"));
    expect(out).toContain("Quer ver resultados de quem tinha as mesmas queixas?");
    expect(out).toContain('data-code="forehead"');
    expect(out).toContain('data-code="nose"');
    expect(out).not.toContain('data-code="other"');
  });

  it("the opened card expands, the others stay hidden, and the button says skip until one is opened", () => {
    const out = html(stateOn("results", {}, { openCase: "forehead" }));
    expect(out).toMatch(/id="photos-forehead"[^>]*>/);
    expect(out).toMatch(/id="photos-nose"[^>]*hidden/);
    expect(out).not.toMatch(/id="photos-forehead"[^>]*hidden/);
    expect(html(stateOn("results"))).toContain(">Pular</button>");
    expect(html(stateOn("results", {}, { viewedCases: true }))).toContain(">Continuar</button>");
  });

  it("without any photo entry for the marked parts it says so", () => {
    const out = html(stateOn("results", { areas: [{ ...newArea("other") }] }));
    expect(out).toContain("Ainda não temos fotos das partes que você marcou");
  });
});

describe("cases page", () => {
  it("is offered on the start page with the map on, and needs no face or marked part", () => {
    expect(html(stateOn("start"))).toContain('id="go-cases"');
    const out = html(stateOn("cases", { face: null, areas: [] }));
    expect(out).toContain("Resultados reais");
    expect(out).toContain('id="back"');
    expect(out).toContain('id="go-agenda"');
    expect(out).not.toContain('class="progress"');
  });

  it("while the example cases are on, it offers 'all' and the parts that have one", () => {
    const out = html(stateOn("cases"));
    expect(out).toContain('id="cases-all"');
    expect(out).toContain("Boca e lábios");
    expect(out).toContain("Toque numa parte acima para ver os casos.");
  });
});

describe("details", () => {
  it("shows the area's own options and only asks 'when it appears' for areas with movement", () => {
    const forehead = html(stateOn("details"), 0);
    expect(forehead).toContain("Linhas ao franzir");
    expect(forehead).toContain("Quando aparece mais?");
    const nose = html(stateOn("details"), 1);
    expect(nose).toContain("Calombo");
    expect(nose).not.toContain("Quando aparece mais?");
  });

  it("the 'other' area asks for a description instead of options", () => {
    const out = html(stateOn("details"), 2);
    expect(out).toContain("Qual parte é e o que te incomoda?");
    expect(out).toContain('id="description"');
    expect(out).not.toContain('id="other-btn"');
  });

  it("the procedure detail field only appears after answering 'yes'", () => {
    const withYes = stateOn("details", { areas: [{ ...newArea("forehead"), procedure: "yes" }] });
    expect(html(withYes, 0)).toContain('id="procedureDetail-txt"');
    expect(html(stateOn("details"), 0)).not.toContain('id="procedureDetail-txt"');
  });
});

describe("review", () => {
  it("the link carries the message and there is a privacy notice instead of a consent checkbox", () => {
    const out = html(stateOn("review"));
    expect(out).toContain(`https://wa.me/${professional.whatsapp}?text=`);
    expect(out).toContain("Suas informações não são registradas neste site");
    expect(out).not.toContain('type="checkbox"');
    expect(out).not.toContain("aria-disabled");
  });
});

describe("fallbacks", () => {
  it("falls back to the map when a screen needs areas and none is marked", () => {
    expect(html(stateOn("review", { areas: [] }))).toContain("Toque no rosto ou no nome da parte");
  });
});
