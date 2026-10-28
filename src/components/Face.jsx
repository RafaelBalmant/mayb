import { getFace } from "../faces/index.js";

/**
 * The face illustration. Without `onToggle` it is a plain picture (no tappable zones);
 * with it, every zone is a button reachable by keyboard and screen reader.
 */
export function Face({ face, view, label, isMarked, nameOf, onToggle }) {
  const { viewBox, art, zones } = getFace(face, view);
  const interactive = Boolean(onToggle);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      {...(interactive ? { role: "group", "aria-label": label } : { "aria-hidden": "true" })}
    >
      <g class="art" dangerouslySetInnerHTML={{ __html: art }} />
      {interactive && (
        <g class="zones">
          {zones.map((z) => {
            const marked = isMarked(z.code);
            return (
              <path
                key={z.code}
                class={marked ? `${z.className} selected` : z.className}
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
      )}
    </svg>
  );
}
