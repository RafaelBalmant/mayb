import { afterEach, describe, expect, it, vi } from "vitest";
import { eventsFromClick } from "../src/analytics/clicks.js";
import { leadFor } from "../src/analytics/leads.js";
import { readPreferredCity, savePreferredCity } from "../src/analytics/preferred-city.js";
import { CONSENT_DENIED, configParams, googleAnalytics } from "../src/analytics/providers.js";
import { readTrafficFlags } from "../src/analytics/traffic-flags.js";
import { createTracker } from "../src/analytics/tracker.js";

const fakeProvider = () => ({ load: vi.fn(), screen: vi.fn(), event: vi.fn(), grant: vi.fn(), user: vi.fn() });
const memoryStorage = () => {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
};
const clickOn = (dataset) =>
  eventsFromClick({ closest: () => ({ dataset, disabled: false, getAttribute: () => null }) });

describe("generate_lead", () => {
  it("goes with each WhatsApp click, with its type and the city when there is one", () => {
    expect(clickOn({ track: "whatsapp_booking", trackCity: "maringa" })).toEqual([
      { name: "whatsapp_booking", params: { city: "maringa" } },
      { name: "generate_lead", params: { method: "whatsapp", lead_type: "booking", city: "maringa" } },
    ]);
    expect(clickOn({ track: "whatsapp_contact" })[1]).toEqual({
      name: "generate_lead",
      params: { method: "whatsapp", lead_type: "contact" },
    });
    expect(leadFor("whatsapp_summary").params).toEqual({ method: "whatsapp", lead_type: "summary" });
    expect(leadFor("whatsapp_contact", { city: "maringa", page: "toxina-botulinica-maringa" }).params).toEqual({
      method: "whatsapp",
      lead_type: "contact",
      city: "maringa",
      page: "toxina-botulinica-maringa",
    });
  });

  it("does not go with other clicks", () => {
    expect(clickOn({ track: "agenda_open" })).toEqual([{ name: "agenda_open", params: {} }]);
    expect(leadFor("booking_open")).toBeNull();
    expect(eventsFromClick(null)).toEqual([]);
  });
});

describe("tracker: user properties and consent", () => {
  it("sends preferred_city only after the visitor accepts, before the first page view", () => {
    const p = fakeProvider();
    const tracker = createTracker([p]);
    tracker.user({ preferred_city: "siqueira_campos" });
    tracker.screen("agenda");
    expect(p.user).not.toHaveBeenCalled();
    tracker.start();
    expect(p.user).toHaveBeenCalledWith({ preferred_city: "siqueira_campos" });
    expect(p.user.mock.invocationCallOrder[0]).toBeLessThan(p.screen.mock.invocationCallOrder[0]);
    tracker.user({ preferred_city: "maringa" });
    expect(p.user).toHaveBeenLastCalledWith({ preferred_city: "maringa" });
  });

  it("with Consent Mode, loads denied, sends page views, and holds user properties until grant()", () => {
    const p = fakeProvider();
    const tracker = createTracker([p]);
    tracker.user({ preferred_city: "maringa" });
    tracker.start({ consentMode: true, granted: false, internal: true });
    expect(p.load).toHaveBeenCalledWith({ consentMode: true, granted: false, internal: true });
    tracker.screen("start");
    expect(p.screen).toHaveBeenCalledWith("start");
    expect(p.user).not.toHaveBeenCalled();
    tracker.grant();
    tracker.grant();
    expect(p.grant).toHaveBeenCalledTimes(1);
    expect(p.user).toHaveBeenCalledWith({ preferred_city: "maringa" });
  });

  it("grant() before start() does nothing", () => {
    const p = fakeProvider();
    createTracker([p]).grant();
    expect(p.load).not.toHaveBeenCalled();
    expect(p.grant).not.toHaveBeenCalled();
  });
});

describe("preferred city storage", () => {
  it("saves and reads the city code, ignoring anything else", () => {
    const storage = memoryStorage();
    expect(readPreferredCity(storage)).toBeNull();
    savePreferredCity(storage, "siqueira_campos");
    expect(readPreferredCity(storage)).toBe("siqueira_campos");
    storage.setItem("site-mayara:city", "<script>");
    expect(readPreferredCity(storage)).toBeNull();
    expect(
      readPreferredCity({
        getItem: () => {
          throw new Error();
        },
      }),
    ).toBeNull();
  });
});

describe("?interno and ?debug", () => {
  it("?interno=1 marks the browser until ?interno=0, and both flags leave the address", () => {
    const storage = memoryStorage();
    expect(readTrafficFlags("https://x.com/?interno=1&utm_source=ig#agenda", storage)).toEqual({
      internal: true,
      debug: false,
      cleanUrl: "/?utm_source=ig#agenda",
    });
    expect(readTrafficFlags("https://x.com/", storage)).toEqual({ internal: true, debug: false, cleanUrl: null });
    expect(readTrafficFlags("https://x.com/?interno=0&mapa=1", storage)).toEqual({
      internal: false,
      debug: false,
      cleanUrl: "/?mapa=1",
    });
    expect(readTrafficFlags("https://x.com/", storage).internal).toBe(false);
  });

  it("?debug=1 only lasts for the page", () => {
    const storage = memoryStorage();
    expect(readTrafficFlags("https://x.com/?debug=1", storage)).toEqual({
      internal: false,
      debug: true,
      cleanUrl: "/",
    });
    expect(readTrafficFlags("https://x.com/", storage).debug).toBe(false);
  });

  it("turn into the config parameters, sent only when on", () => {
    expect(configParams()).toEqual({ send_page_view: false });
    expect(configParams({ internal: true, debug: true })).toEqual({
      send_page_view: false,
      traffic_type: "internal",
      debug_mode: true,
    });
  });
});

describe("Google Analytics provider", () => {
  afterEach(() => {
    delete globalThis.window;
    delete globalThis.document;
  });
  const setup = () => {
    globalThis.window = {};
    globalThis.document = { createElement: () => ({}), head: { append: vi.fn() } };
    return () => globalThis.window.dataLayer.map((args) => Array.from(args));
  };

  it("without Consent Mode, sends no consent commands and passes the flags to the config", () => {
    const calls = setup();
    googleAnalytics("G-TEST1234").load({ internal: true });
    expect(calls().map((c) => c[0])).toEqual(["js", "config"]);
    expect(calls()[1]).toEqual(["config", "G-TEST1234", { send_page_view: false, traffic_type: "internal" }]);
  });

  it("with Consent Mode, denies everything before the config and grants analytics on OK", () => {
    const calls = setup();
    const ga = googleAnalytics("G-TEST1234");
    ga.load({ consentMode: true, granted: false });
    expect(calls()[0]).toEqual(["consent", "default", CONSENT_DENIED]);
    expect(calls()[1][0]).toBe("js");
    ga.grant();
    ga.user({ preferred_city: "maringa" });
    expect(calls().slice(-2)).toEqual([
      ["consent", "update", { analytics_storage: "granted" }],
      ["set", "user_properties", { preferred_city: "maringa" }],
    ]);
  });
});
