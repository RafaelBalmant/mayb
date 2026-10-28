// The 4 illustrations come from scripts/generate-faces.mjs.
// Each tappable area is one <path class="zone" data-area="code">.
import femaleFront from "./female-front.svg?raw";
import femaleProfile from "./female-profile.svg?raw";
import maleFront from "./male-front.svg?raw";
import maleProfile from "./male-profile.svg?raw";

const svgs = {
  female: { front: femaleFront, profile: femaleProfile },
  male: { front: maleFront, profile: maleProfile },
};

/** Returns the face SVG as text, ready for innerHTML. */
export function faceSvg(face, view) {
  return svgs[face][view];
}
