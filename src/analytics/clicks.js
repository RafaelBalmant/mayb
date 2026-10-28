// Click tracking by markup: an element with data-track="event_name" sends that event when clicked, and every
// data-track-<param>="value" goes with it as a parameter (data-track-city="maringa" → { city: "maringa" }).
// Only fixed values belong there: never what the visitor typed or chose about their face.

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

/** Listens to clicks under `root` and calls onEvent(name, params); returns the function that stops listening. */
export function listenToClicks(root, onEvent) {
  // capture phase: runs before the button's own handler, which may change the screen
  const handle = (e) => {
    const event = eventFromClick(e.target);
    if (event) onEvent(event.name, event.params);
  };
  root.addEventListener("click", handle, true);
  return () => root.removeEventListener("click", handle, true);
}
