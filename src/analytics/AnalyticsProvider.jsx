import { createContext } from "preact";
import { useCallback, useContext, useEffect, useMemo, useState } from "preact/hooks";
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
 */
export function AnalyticsProvider({
  children,
  tracker = defaultTracker,
  storage = browserStorage(),
  consentMode = CONSENT_MODE,
}) {
  const [choice, setChoice] = useState(() => readConsent(storage));
  const [reopened, setReopened] = useState(false);
  // read once, before the first page view, so ?interno/?debug never show up in it
  const [flags] = useState(() => (tracker.enabled ? applyTrafficFlags(storage) : {}));

  useEffect(() => {
    const city = readPreferredCity(storage);
    if (tracker.enabled && city) tracker.user({ preferred_city: city }); // waits in the tracker for the consent
  }, [tracker, storage]);
  useEffect(() => {
    const granted = choice === CONSENT.granted;
    if (granted || consentMode) tracker.start({ ...flags, consentMode, granted });
    if (granted) tracker.grant();
  }, [choice, tracker, flags, consentMode]);
  useEffect(() => (tracker.enabled ? listenToClicks(document, tracker.event) : undefined), [tracker]);

  const choose = useCallback(
    (value) => {
      saveConsent(storage, value);
      setReopened(false);
      // tools already running cannot be unloaded: a fresh page starts without them
      if (choice === CONSENT.granted && value === CONSENT.denied) location.reload();
      else setChoice(value);
    },
    [choice, storage],
  );

  const rememberCity = useCallback(
    (city) => {
      if (!tracker.enabled) return;
      savePreferredCity(storage, city);
      tracker.user({ preferred_city: city });
    },
    [tracker, storage],
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
