import { GOOGLE_PLACES_URL, REVIEWS_TIMEOUT_MS } from "../config.js";

/**
 * The doctor's rating and reviews on Google, fetched by the browser from the Places API (New).
 * Resolves to { rating, total, link, reviews: [{ author, authorLink, photo, stars, text, when }] }, or null when
 * there is no key or place id, Google takes longer than REVIEWS_TIMEOUT_MS, answers with an error, or has no
 * review worth showing. The start page hides the block on null.
 */
export async function fetchReviews({ key, placeId, minStars = 1, fetchFn = globalThis.fetch } = {}) {
  if (!key || !placeId) return null;
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), REVIEWS_TIMEOUT_MS);
  try {
    const res = await fetchFn(`${GOOGLE_PLACES_URL}${encodeURIComponent(placeId)}?languageCode=pt-BR&regionCode=BR`, {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri" },
      signal: abort.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parsePlace(await res.json(), minStars);
  } catch (error) {
    console.warn("Google reviews unavailable:", error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Keeps the reviews with text and at least `minStars`; null when nothing is left. */
export function parsePlace(place, minStars = 1) {
  const reviews = (place?.reviews ?? [])
    .map((r) => ({
      author: r.authorAttribution?.displayName ?? "",
      authorLink: r.authorAttribution?.uri ?? "",
      photo: r.authorAttribution?.photoUri ?? "",
      stars: r.rating ?? 0,
      text: (r.text?.text ?? r.originalText?.text ?? "").trim(),
      when: r.relativePublishTimeDescription ?? "",
    }))
    .filter((r) => r.text && r.stars >= minStars);
  if (!place?.rating || !reviews.length) return null;
  return { rating: place.rating, total: place.userRatingCount ?? 0, link: place.googleMapsUri ?? "", reviews };
}
