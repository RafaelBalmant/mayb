"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ANALYTICS_IDS, CONSENT_MODE } from "../config.js";
import { listenToClicks } from "./clicks.js";
import { CONSENT, readConsent, saveConsent } from "./consent.js";
import { readPreferredCity, savePreferredCity } from "./preferred-city.js";
import { providersFor } from "./providers.js";
import { applyTrafficFlags } from "./traffic-flags.js";
import { createTracker } from "./tracker.js";

const defaultTracker = createTracker(providersFor(ANALYTICS_IDS));

const browserStorage = () => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

const AnalyticsContext = createContext({
  enabled: false,
  consentMode: false,
  showNotice: false,
  choose: () => {},
  reopen: () => {},
  trackScreen: () => {},
  rememberCity: () => {},
});

/**
 * Owns the cookie answer and the tracker. Nothing is loaded or sent until the visitor accepts (unless Consent Mode
 * is on, see config.js); with no analytics ID in the build (`enabled` false) the notice never shows and nothing
 * else happens. `tracker`, `storage` and `consentMode` can be injected (tests).
 * The pages are built ahead of time, so the browser's storage (the saved answer, the city, ?interno) is only read
 * right after the first render: the notice appears then, never in the HTML itself. An injected `storage` is read
 * at once.
 */
export function AnalyticsProvider({ children, tracker = defaultTracker, storage, consentMode = CONSENT_MODE }) {
  // undefined: not read yet; null: the visitor has not answered
  const [choice, setChoice] = useState(() => (storage ? readConsent(storage) : undefined));
  const [reopened, setReopened] = useState(false);
  // { storage, flags } once mounted; flags are read before the first page view, so ?interno/?debug never show in it
  const [browser, setBrowser] = useState(null);

  useEffect(() => {
    const store = storage ?? browserStorage();
    const flags = tracker.enabled ? applyTrafficFlags(store) : {};
    // Reading the browser after the first render is the point here (the HTML is the same for everyone), and the
    // flags must be read once, with their side effect of cleaning the address: hence state set in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBrowser({ storage: store, flags });
    setChoice((current) => (current === undefined ? readConsent(store) : current));
    const city = readPreferredCity(store);
    if (tracker.enabled && city) tracker.user({ preferred_city: city }); // waits in the tracker for the consent
  }, [tracker, storage]);
  useEffect(() => {
    if (!browser) return;
    const granted = choice === CONSENT.granted;
    if (granted || consentMode) tracker.start({ ...browser.flags, consentMode, granted });
    if (granted) tracker.grant();
  }, [choice, tracker, browser, consentMode]);
  useEffect(() => (tracker.enabled ? listenToClicks(document, tracker.event) : undefined), [tracker]);

  const choose = useCallback(
    (value) => {
      saveConsent(browser?.storage ?? storage, value);
      setReopened(false);
      // tools already running cannot be unloaded: a fresh page starts without them
      if (choice === CONSENT.granted && value === CONSENT.denied) location.reload();
      else setChoice(value);
    },
    [choice, browser, storage],
  );

  const rememberCity = useCallback(
    (city) => {
      if (!tracker.enabled) return;
      savePreferredCity(browser?.storage ?? storage, city);
      tracker.user({ preferred_city: city });
    },
    [tracker, browser, storage],
  );

  const value = useMemo(
    () => ({
      enabled: tracker.enabled,
      consentMode,
      showNotice: tracker.enabled && (reopened || choice === null),
      choose,
      reopen: () => setReopened(true),
      trackScreen: tracker.screen,
      rememberCity,
    }),
    [tracker, consentMode, reopened, choice, choose, rememberCity],
  );
  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

/**
 * { enabled, consentMode, showNotice, choose(CONSENT.x), reopen(), trackScreen(name), rememberCity(code) } of the
 * nearest AnalyticsProvider.
 */
export const useAnalytics = () => useContext(AnalyticsContext);
