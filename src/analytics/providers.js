// Each provider loads one analytics tool and passes it page views, events and user properties (today only Google
// Analytics; another tool is one more function with load/screen/event, and optionally grant/user). Nothing touches the
// page until load(), which runs only after the visitor accepts the cookie notice (or, with Consent Mode, with
// everything denied).

const GA_ID = /^G-[A-Z0-9]{4,20}$/;

/** Consent Mode v2 defaults: nothing allowed until the visitor taps "OK". */
export const CONSENT_DENIED = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
};

/** Parameters of gtag("config"). debug_mode goes only when on: GA treats any value, even false, as on. */
export function configParams({ internal = false, debug = false } = {}) {
  return {
    send_page_view: false,
    ...(internal && { traffic_type: "internal" }),
    ...(debug && { debug_mode: true }),
  };
}

function addScript(src) {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.append(script);
}

/** Google Analytics 4. Page views are sent by hand (one per screen), because the site never changes its address. */
export function googleAnalytics(measurementId) {
  const gtag = (...args) => window.gtag(...args);
  return {
    load({ consentMode = false, granted = true, ...flags } = {}) {
      window.dataLayer = window.dataLayer || [];
      // gtag.js expects the `arguments` object itself, not an array
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
      // consent must be set before the config
      if (consentMode) {
        gtag("consent", "default", CONSENT_DENIED);
        if (granted) gtag("consent", "update", { analytics_storage: "granted" });
      }
      gtag("js", new Date());
      gtag("config", measurementId, configParams(flags));
      addScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
    },
    screen(name) {
      // a path per screen (/agenda, /cases…) keeps the reports readable; the query keeps utm_* for the source.
      // A name that already starts with "/" is a real page path (the static pages) and is used as it is.
      const path = name.startsWith("/") ? name : name === "start" ? "/" : `/${name}`;
      gtag("event", "page_view", {
        page_title: name,
        page_location: `${location.origin}${path}${location.search}`,
      });
    },
    event(name, params) {
      gtag("event", name, params);
    },
    grant() {
      gtag("consent", "update", { analytics_storage: "granted" });
    },
    user(properties) {
      gtag("set", "user_properties", properties);
    },
  };
}

/** The providers whose ID is set and well formed (a malformed ID is ignored instead of put into a script URL). */
export function providersFor({ googleAnalytics: gaId }) {
  return GA_ID.test(gaId) ? [googleAnalytics(gaId)] : [];
}
