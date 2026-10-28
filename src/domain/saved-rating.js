// The Google rating fetched at build time by scripts/fetch-reviews.mjs. The file is optional: without it (no key,
// local dev, tests) the glob is empty and the reviews show without the rating summary.
const FILES = import.meta.glob("../data/google-rating.generated.json", { eager: true, import: "default" });

/** { rating, total, link } or null. */
export const savedRating = Object.values(FILES)[0] ?? null;
