/**
 * Sends page views, events and user properties to every provider, never before start().
 * - Without Consent Mode, start() runs only once the visitor accepted the cookies.
 * - With Consent Mode, start({ granted: false }) loads the tools with everything denied and grant() updates it.
 * User properties wait until consent is granted. The screen open at start is sent right away, so the first page
 * view is not lost. A failing provider never breaks the site.
 */
export function createTracker(providers) {
  let started = false;
  let granted = false;
  let currentScreen = null;
  let userProperties = {};

  const each = (call) => {
    if (!started) return;
    for (const provider of providers) {
      try {
        call(provider);
      } catch {
        // analytics must never get in the way of the visitor
      }
    }
  };
  const sendUserProperties = () => {
    if (granted && Object.keys(userProperties).length > 0) each((p) => p.user?.(userProperties));
  };

  return {
    enabled: providers.length > 0,
    /** options: { granted = true, consentMode, internal, debug } (see providers.js). */
    start(options = {}) {
      if (started || providers.length === 0) return;
      granted = options.granted ?? true;
      for (const provider of providers) provider.load({ ...options, granted });
      started = true;
      sendUserProperties();
      if (currentScreen) each((p) => p.screen(currentScreen));
    },
    grant() {
      if (!started || granted) return;
      granted = true;
      each((p) => p.grant?.());
      sendUserProperties();
    },
    screen(name) {
      if (name === currentScreen) return;
      currentScreen = name;
      each((p) => p.screen(name));
    },
    event(name, params = {}) {
      each((p) => p.event(name, params));
    },
    user(properties) {
      userProperties = { ...userProperties, ...properties };
      sendUserProperties();
    },
  };
}
