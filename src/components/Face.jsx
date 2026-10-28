import { getFace } from "../faces/index.js";

/**
 * The face illustration. Without `onToggle` it is a plain picture (no tappable zones);
 * with it, every zone is a button reachable by keyboard and screen reader.
 * `highlight` is an area code to light up (e.g. while its name is hovered).
 */
export function Face({ face, view, label, isMarked, nameOf, onToggle, highlight }) {
  const { viewBox, defs, groups } = getFace(face, view);
  const interactive = Boolean(onToggle);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      {...(interactive ? { role: "group", "aria-label": label } : { "aria-hidden": "true" })}
    >
      <defs dangerouslySetInnerHTML={{ __html: defs }} />
      {groups.map((group, i) => {
        if (group.type === "art")
          return <g key={i} class={group.className} dangerouslySetInnerHTML={{ __html: group.html }} />;
        if (!interactive) return null;
        return (
          <g key={i} class="zones" clip-path={group.clipPath}>
            {group.zones.map((z) => {
              const marked = isMarked(z.code);
              const classes = [z.className, marked && "selected", highlight === z.code && "highlight"].filter(Boolean);
              return (
                <path
                  key={z.code}
                  class={classes.join(" ")}
                  data-area={z.code}
                  d={z.d}
                  tabindex="0" // lowercase: SVG attribute names are case-sensitive
                  role="button"
                  aria-pressed={marked}
                  aria-label={nameOf(z.code)}
                  onClick={() => onToggle(z.code)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onToggle(z.code);
                    }
                  }}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
