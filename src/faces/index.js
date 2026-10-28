// The 4 illustrations come from scripts/generate-faces.mjs.
// An illustration is a list of groups drawn in order: art groups (decoration) and zone groups, where each
// tappable area is one <path class="zone" data-area="code">. Zone groups are clipped by the skin outline
// through a clipPath declared in <defs>.
import femaleFront from "./female-front.svg?raw";
import femaleProfile from "./female-profile.svg?raw";
import maleFront from "./male-front.svg?raw";
import maleProfile from "./male-profile.svg?raw";

const ZONE = /<path class="([^"]*)" data-area="(\w+)" d="([^"]*)"\/>/g;

/**
 * Splits a face SVG into its viewBox, the <defs> markup and its groups in drawing order:
 *   { type: "art", className, html }  or  { type: "zones", clipPath, zones: [{ className, code, d }] }
 */
export function parseFace(raw) {
  const groups = [...raw.matchAll(/<g class="([^"]*)"(?: clip-path="([^"]*)")?>([\s\S]*?)<\/g>/g)].map(
    ([, className, clipPath, inner]) =>
      className.split(" ").includes("zones")
        ? {
            type: "zones",
            clipPath,
            zones: [...inner.matchAll(ZONE)].map(([, c, code, d]) => ({ className: c, code, d })),
          }
        : { type: "art", className, html: inner.trim() },
  );
  return {
    viewBox: raw.match(/viewBox="([^"]+)"/)[1],
    defs: raw.match(/<defs>([\s\S]*?)<\/defs>/)?.[1] ?? "",
    groups,
  };
}

const faces = {
  female: { front: parseFace(femaleFront), profile: parseFace(femaleProfile) },
  male: { front: parseFace(maleFront), profile: parseFace(maleProfile) },
};

/** Parsed illustration for a face ("female" | "male") and a view ("front" | "profile"). */
export const getFace = (face, view) => faces[face][view];

/** Every zone of an illustration, in drawing order. */
export const zonesOf = (parsed) => parsed.groups.filter((g) => g.type === "zones").flatMap((g) => g.zones);
