// The reviews fetched at build time by scripts/fetch-reviews.mjs. The file is optional: without it (no key, local
// dev, tests) the glob is empty and the start page simply has no reviews block.
const FILES = import.meta.glob("../data/reviews.generated.json", { eager: true, import: "default" });

/** { rating, total, link, reviews: [{ author, authorLink, photo, stars, text }] } or null. */
export const savedReviews = Object.values(FILES)[0] ?? null;
