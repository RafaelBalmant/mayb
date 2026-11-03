// What the site's pages read at build time (src/lib/server/), gathered for the prototype page. Bundled for Node and
// run by build.mjs.
import { loadAllCases } from "../../src/lib/server/cases.js";
import { loadFaces } from "../../src/lib/server/faces.js";
import { loadRating } from "../../src/lib/server/rating.js";

export const data = { faces: loadFaces(), cases: loadAllCases(), rating: loadRating() };
