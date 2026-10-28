import { REVIEWS_GROUP_SIZE, REVIEWS_MAX_GROUPS } from "../config.js";

// Pure rules for the Google reviews, shared by the site and by scripts/fetch-reviews.mjs (which runs in Node).

/**
 * Turns a place as the Google Places API returns it into what the site shows: only reviews with text and at least
 * `minStars`. Null when there is no rating or no review left.
 */
export function parsePlace(place, minStars = 1) {
  const reviews = (place?.reviews ?? [])
    .map((r) => ({
      author: r.authorAttribution?.displayName ?? "",
      authorLink: r.authorAttribution?.uri ?? "",
      photo: r.authorAttribution?.photoUri ?? "",
      stars: r.rating ?? 0,
      text: (r.text?.text ?? r.originalText?.text ?? "").trim(),
    }))
    .filter((r) => r.text && r.stars >= minStars);
  if (!place?.rating || !reviews.length) return null;
  return { rating: place.rating, total: place.userRatingCount ?? 0, link: place.googleMapsUri ?? "", reviews };
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
