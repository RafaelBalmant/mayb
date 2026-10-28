// Click tracking by markup: an element with data-track="event_name" sends that event when clicked, and every
// data-track-<param>="value" goes with it as a parameter (data-track-city="maringa" → { city: "maringa" }).
// Only fixed values belong there: never what the visitor typed or chose about their face.
import { leadFor } from "./leads.js";

const toSnakeCase = (key) => key.replace(/^./, (c) => c.toLowerCase()).replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/** The event a click on `target` sends, or null (no data-track, or the element is disabled). */
export function eventFromClick(target) {
  const element = target?.closest?.("[data-track]");
  if (!element || element.disabled || element.getAttribute("aria-disabled") === "true") return null;
  const params = {};
  for (const [key, value] of Object.entries(element.dataset)) {
    if (key !== "track" && key.startsWith("track")) params[toSnakeCase(key.slice("track".length))] = value;
  }
  return { name: element.dataset.track, params };
}

/** Every event a click on `target` sends: its own and, for a WhatsApp click, the generate_lead that goes with it. */
export function eventsFromClick(target) {
  const event = eventFromClick(target);
  if (!event) return [];
  const lead = leadFor(event.name, event.params);
  return lead ? [event, lead] : [event];
}

/** Listens to clicks under `root` and calls onEvent(name, params); returns the function that stops listening. */
export function listenToClicks(root, onEvent) {
  // capture phase: runs before the button's own handler, which may change the screen
  const handle = (e) => {
    for (const event of eventsFromClick(e.target)) onEvent(event.name, event.params);
  };
  root.addEventListener("click", handle, true);
  return () => root.removeEventListener("click", handle, true);
}
