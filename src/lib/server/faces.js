// Reads the face illustrations (src/faces/*.svg, from scripts/generate-faces.mjs) at build time and hands the
// parsed drawings to the face-map page. Server only (Node's fs).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SHOW_PROFILE_VIEW } from "../../config.js";
import { parseFace } from "../../faces/index.js";

const FOLDER = join(process.cwd(), "src/faces");

/** { female: { front, profile? }, male: { … } }; the profile drawings only while the profile view is on. */
export function loadFaces({ withProfile = SHOW_PROFILE_VIEW, folder = FOLDER } = {}) {
  const views = withProfile ? ["front", "profile"] : ["front"];
  const read = (face, view) => parseFace(readFileSync(join(folder, `${face}-${view}.svg`), "utf8"));
  return Object.fromEntries(
    ["female", "male"].map((face) => [face, Object.fromEntries(views.map((view) => [view, read(face, view)]))]),
  );
}
