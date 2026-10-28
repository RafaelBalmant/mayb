import { describe, expect, it, vi } from "vitest";
import { eventFromClick } from "../src/analytics/clicks.js";
import { CONSENT, readConsent, saveConsent } from "../src/analytics/consent.js";
import { providersFor } from "../src/analytics/providers.js";
import { createTracker } from "../src/analytics/tracker.js";

const fakeProvider = () => ({ load: vi.fn(), screen: vi.fn(), event: vi.fn() });
const memoryStorage = () => {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)) };
};

describe("tracker", () => {
  it("sends nothing and loads nothing before start", () => {
    const p = fakeProvider();
    const tracker = createTracker([p]);
    tracker.screen("start");
    tracker.event("agenda_open");
    expect(p.load).not.toHaveBeenCalled();
    expect(p.screen).not.toHaveBeenCalled();
    expect(p.event).not.toHaveBeenCalled();
  });

  it("on start loads the tools and sends the screen already open", () => {
    const p = fakeProvider();
    const tracker = createTracker([p]);
    tracker.screen("agenda");
    tracker.start();
    tracker.start();
    expect(p.load).toHaveBeenCalledTimes(1);
    expect(p.screen).toHaveBeenCalledWith("agenda");
    tracker.event("whatsapp_booking", { city: "maringa" });
    expect(p.event).toHaveBeenCalledWith("whatsapp_booking", { city: "maringa" });
  });

  it("does not repeat the same screen and survives a failing provider", () => {
    const broken = {
      ...fakeProvider(),
      event: () => {
        throw new Error("blocked");
      },
    };
    const p = fakeProvider();
    const tracker = createTracker([broken, p]);
    tracker.start();
    tracker.screen("start");
    tracker.screen("start");
    expect(p.screen).toHaveBeenCalledTimes(1);
    expect(() => tracker.event("x")).not.toThrow();
    expect(p.event).toHaveBeenCalledWith("x", {});
  });

  it("is disabled without providers", () => {
    expect(createTracker([]).enabled).toBe(false);
  });
});

describe("providers", () => {
  it("uses only a well-formed Google Analytics ID", () => {
    expect(providersFor({ googleAnalytics: "G-7BK1Z9CEVP" })).toHaveLength(1);
    for (const id of ["", "UA-123", 'G-1"><script>', undefined])
      expect(providersFor({ googleAnalytics: id })).toEqual([]);
  });
});

describe("consent", () => {
  it("saves and reads the answer, ignoring unknown values and a blocked storage", () => {
    const storage = memoryStorage();
    expect(readConsent(storage)).toBeNull();
    saveConsent(storage, CONSENT.granted);
    expect(readConsent(storage)).toBe(CONSENT.granted);
    storage.setItem("site-mayara:cookies", "maybe");
    expect(readConsent(storage)).toBeNull();
    const blocked = {
      getItem: () => {
        throw new Error();
      },
      setItem: () => {
        throw new Error();
      },
    };
    expect(readConsent(blocked)).toBeNull();
    expect(() => saveConsent(blocked, CONSENT.denied)).not.toThrow();
  });
});

describe("click tracking", () => {
  const element = (dataset, extra = {}) => ({ dataset, disabled: false, getAttribute: () => null, ...extra });
  const clickOn = (el) => eventFromClick({ closest: () => el });

  it("reads the event name and its data-track-* parameters", () => {
    expect(
      clickOn(element({ track: "whatsapp_booking", trackCity: "maringa", trackStartPage: "1", other: "x" })),
    ).toEqual({
      name: "whatsapp_booking",
      params: { city: "maringa", start_page: "1" },
    });
  });

  it("ignores clicks outside tracked elements and on disabled ones", () => {
    expect(clickOn(null)).toBeNull();
    expect(eventFromClick(null)).toBeNull();
    expect(clickOn(element({ track: "booking_open" }, { disabled: true }))).toBeNull();
    expect(clickOn(element({ track: "whatsapp_booking" }, { getAttribute: () => "true" }))).toBeNull();
  });
});
