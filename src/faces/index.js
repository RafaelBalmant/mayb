// The 4 illustrations come from scripts/generate-faces.mjs.
// Each tappable area is one <path class="zone" data-area="code">.
import femaleFront from "./female-front.svg?raw";
import femaleProfile from "./female-profile.svg?raw";
import maleFront from "./male-front.svg?raw";
import maleProfile from "./male-profile.svg?raw";

/** Splits a face SVG into its viewBox, the decorative art markup and the tappable zones. */
export function parseFace(raw) {
  return {
    viewBox: raw.match(/viewBox="([^"]+)"/)[1],
    art: raw.match(/<g class="art">([\s\S]*?)<\/g>\s*<g class="zones">/)[1].trim(),
    zones: [...raw.matchAll(/<path class="([^"]*)" data-area="(\w+)" d="([^"]*)"\/>/g)].map(
      ([, className, code, d]) => ({ className, code, d }),
    ),
  };
}

const faces = {
  female: { front: parseFace(femaleFront), profile: parseFace(femaleProfile) },
  male: { front: parseFace(maleFront), profile: parseFace(maleProfile) },
};

/** Parsed illustration for a face ("female" | "male") and a view ("front" | "profile"). */
export const getFace = (face, view) => faces[face][view];
