// Each provider loads one analytics tool and passes it page views and events (today only Google Analytics; another
// tool is one more function with load/screen/event). Nothing touches the page until load(), which runs only after the
// visitor accepts the cookie notice.

const GA_ID = /^G-[A-Z0-9]{4,20}$/;

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
    load() {
      window.dataLayer = window.dataLayer || [];
      // gtag.js expects the `arguments` object itself, not an array
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
      gtag("js", new Date());
      gtag("config", measurementId, { send_page_view: false });
      addScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
    },
    screen(name) {
      // a path per screen (/agenda, /cases…) keeps the reports readable; the query keeps utm_* for the source
      const path = name === "start" ? "/" : `/${name}`;
      gtag("event", "page_view", {
        page_title: name,
        page_location: `${location.origin}${path}${location.search}`,
      });
    },
    event(name, params) {
      gtag("event", name, params);
    },
  };
}

/** The providers whose ID is set and well formed (a malformed ID is ignored instead of put into a script URL). */
export function providersFor({ googleAnalytics: gaId }) {
  return GA_ID.test(gaId) ? [googleAnalytics(gaId)] : [];
}
