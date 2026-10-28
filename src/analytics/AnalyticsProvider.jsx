import { createContext } from "preact";
import { useCallback, useContext, useEffect, useMemo, useState } from "preact/hooks";
import { ANALYTICS_IDS } from "../config.js";
import { listenToClicks } from "./clicks.js";
import { CONSENT, readConsent, saveConsent } from "./consent.js";
import { providersFor } from "./providers.js";
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
  showNotice: false,
  choose: () => {},
  reopen: () => {},
  trackScreen: () => {},
});

/**
 * Owns the cookie answer and the tracker. Nothing is loaded or sent until the visitor accepts; with no analytics
 * ID in the build (`enabled` false) the notice never shows. `tracker` and `storage` can be injected (tests).
 */
export function AnalyticsProvider({ children, tracker = defaultTracker, storage = browserStorage() }) {
  const [choice, setChoice] = useState(() => readConsent(storage));
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    if (choice === CONSENT.granted) tracker.start();
  }, [choice, tracker]);
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

  const value = useMemo(
    () => ({
      enabled: tracker.enabled,
      showNotice: tracker.enabled && (reopened || choice === null),
      choose,
      reopen: () => setReopened(true),
      trackScreen: tracker.screen,
    }),
    [tracker, reopened, choice, choose],
  );
  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

/** { enabled, showNotice, choose(CONSENT.x), reopen(), trackScreen(name) } of the nearest AnalyticsProvider. */
export const useAnalytics = () => useContext(AnalyticsContext);
