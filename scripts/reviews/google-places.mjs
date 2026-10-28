// Review source: Google Places API (New). Google returns at most 5 reviews ("most relevant") per place.
// Another source (e.g. the Business Profile API, which lists every review of a profile the owner manages) only
// needs to export the same function: fetchPlace({ key, placeId }) -> a place shaped like the Places API answer.

const PLACES_URL = "https://places.googleapis.com/v1/places/";
const TIMEOUT_MS = 15000;

export async function fetchPlace({ key, placeId, fetchFn = globalThis.fetch }) {
  const res = await fetchFn(`${PLACES_URL}${encodeURIComponent(placeId)}?languageCode=pt-BR&regionCode=BR`, {
    headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Places API answered HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}
