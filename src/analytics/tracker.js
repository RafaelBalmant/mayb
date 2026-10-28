/**
 * Sends page views and events to every provider, but only after start() (the visitor accepted the cookies).
 * The screen open at that moment is sent right away, so the first page view is not lost.
 * A failing provider never breaks the site.
 */
export function createTracker(providers) {
  let started = false;
  let currentScreen = null;

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

  return {
    enabled: providers.length > 0,
    start() {
      if (started || providers.length === 0) return;
      for (const provider of providers) provider.load();
      started = true;
      if (currentScreen) each((p) => p.screen(currentScreen));
    },
    screen(name) {
      if (name === currentScreen) return;
      currentScreen = name;
      each((p) => p.screen(name));
    },
    event(name, params = {}) {
      each((p) => p.event(name, params));
    },
  };
}
