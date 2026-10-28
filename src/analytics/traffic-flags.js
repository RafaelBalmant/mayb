// ?interno=1 marks this browser as the team's own until ?interno=0 (the GA data filter drops traffic_type=internal,
// since phone IPs change all the time); ?debug=1 sends this visit to GA's DebugView. Like ?mapa=1 they are public link
// names, and they are taken out of the address so they never reach a page_view.
import { INTERNAL_KEY } from "../config.js";

/** { internal, debug, cleanUrl } for `href`; cleanUrl is the address without the two flags, or null if it had none. */
export function readTrafficFlags(href, storage) {
  const url = new URL(href);
  const params = url.searchParams;
  const asked = params.get("interno");
  let internal = asked === "1";
  try {
    if (asked === "1") storage?.setItem(INTERNAL_KEY, "1");
    if (asked === "0") storage?.removeItem(INTERNAL_KEY);
    internal = storage?.getItem(INTERNAL_KEY) === "1";
  } catch {
    // blocked storage: the flag only lasts for this page
  }
  const debug = params.get("debug") === "1";
  const hadFlags = params.has("interno") || params.has("debug");
  params.delete("interno");
  params.delete("debug");
  return { internal, debug, cleanUrl: hadFlags ? `${url.pathname}${url.search}${url.hash}` : null };
}

/** Reads the flags of the current page and drops them from the address bar. */
export function applyTrafficFlags(storage) {
  if (typeof location === "undefined") return { internal: false, debug: false };
  const { cleanUrl, ...flags } = readTrafficFlags(location.href, storage);
  if (cleanUrl) history.replaceState(history.state, "", cleanUrl);
  return flags;
}
