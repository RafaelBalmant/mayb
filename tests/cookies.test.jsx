import { renderToString } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { AnalyticsProvider } from "../src/analytics/AnalyticsProvider.jsx";
import { createTracker } from "../src/analytics/tracker.js";
import { CookieNotice } from "../src/components/CookieNotice.jsx";
import { StartScreen } from "../src/screens/StartScreen.jsx";
import { initialState } from "../src/store/reducer.js";
import { StoreProvider } from "../src/store/StoreProvider.jsx";

const on = createTracker([{ load() {}, screen() {}, event() {} }]);
const off = createTracker([]);
const storageWith = (value) => ({ getItem: () => value, setItem() {} });
const render = (tracker, saved, children = <CookieNotice />) =>
  renderToString(
    <AnalyticsProvider tracker={tracker} storage={storageWith(saved)}>
      {children}
    </AnalyticsProvider>,
  );

describe("cookie notice", () => {
  it("asks a visitor who has not answered yet", () => {
    const out = render(on, null);
    expect(out).toContain('id="cookie-notice"');
    expect(out).toContain("Usamos cookies para melhorar sua experiência.");
    expect(out).toContain('id="cookies-accept"');
    expect(out).toContain('id="cookies-decline"');
  });

  it("stays hidden once answered, and when the build has no analytics", () => {
    expect(render(on, "granted")).toBe("");
    expect(render(on, "denied")).toBe("");
    expect(render(off, null)).toBe("");
  });

  it("the start page offers to review the choice only when analytics is on", () => {
    const start = (tracker) =>
      render(
        tracker,
        "granted",
        <StoreProvider initialState={initialState({ mapEnabled: false })}>
          <StartScreen />
        </StoreProvider>,
      );
    expect(start(on)).toContain('id="cookies-open"');
    expect(start(off)).not.toContain('id="cookies-open"');
  });
});
