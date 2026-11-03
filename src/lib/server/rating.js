// The Google rating saved at build time by scripts/fetch-reviews.mjs. The file is optional: without it (no key,
// local dev, tests) the reviews show without the rating summary. Server only (Node's fs).
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const RATING_FILE = join(process.cwd(), "src/data/google-rating.generated.json");

/** { rating, total, link } or null. */
export function loadRating(file = RATING_FILE) {
  try {
    const { rating, total, link } = JSON.parse(readFileSync(file, "utf8"));
    return rating ? { rating, total, link } : null;
  } catch {
    return null;
  }
}
