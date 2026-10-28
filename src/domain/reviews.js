import { REVIEWS_GROUP_SIZE, REVIEWS_MAX_GROUPS } from "../config.js";

// Pure rules for the Google reviews, shared by the site and by scripts/fetch-reviews.mjs (which runs in Node).
// The reviews themselves live in content.json; only the rating summary comes from Google, at build time.

/**
 * Reads the rating summary out of a place as the Google Places API returns it: average stars, how many reviews in
 * total and the profile link. Null when Google has no rating for the place.
 */
export function parseRating(place) {
  if (!place?.rating) return null;
  return { rating: place.rating, total: place.userRatingCount ?? 0, link: place.googleMapsUri ?? "" };
}

// Lower case and without accents, so "Sobrancelhas" matches "sobrancelha".
const plain = (text) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/**
 * The reviews worth showing (kept in content.json): only those with text, at least `minStars` and none of the
 * `hideIfMentions` words (topics the doctor no longer focuses on).
 */
export function showableReviews(reviews, { minStars = 1, hideIfMentions = [] } = {}) {
  const hidden = hideIfMentions.map(plain);
  return (reviews ?? [])
    .map((r) => ({ author: r.author ?? "", stars: r.stars ?? 0, text: (r.text ?? "").trim() }))
    .filter((r) => r.text && r.stars >= minStars && !hidden.some((word) => plain(r.text).includes(word)));
}

/**
 * Up to `max` groups of up to `size` reviews, each starting at a different review and wrapping around the list.
 * With many reviews the groups barely overlap; with few, they hold the same reviews in a different order, so every
 * visit still opens on a different one.
 */
export function reviewGroups(reviews, { size = REVIEWS_GROUP_SIZE, max = REVIEWS_MAX_GROUPS } = {}) {
  const n = reviews.length;
  const count = Math.min(max, n);
  const length = Math.min(size, n);
  return Array.from({ length: count }, (_, g) => {
    const start = Math.round((g * n) / count);
    return Array.from({ length }, (_, i) => reviews[(start + i) % n]);
  });
}

/**
 * Which group this visit shows: the one after the previous visit's (kept in `local`, e.g. localStorage), and the
 * same one again on reloads within the visit (kept in `session`). Storage that is blocked counts as a first visit.
 */
export function groupForVisit(count, { local, session, key }) {
  if (count < 2) return 0;
  try {
    const current = session?.getItem(key);
    if (current !== null && current !== undefined && Number(current) < count) return Number(current);
    const previous = Number(local?.getItem(key) ?? -1);
    const next = (previous + 1) % count;
    local?.setItem(key, String(next));
    session?.setItem(key, String(next));
    return next;
  } catch {
    return 0;
  }
}
