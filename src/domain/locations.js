// The units where Dra. Mayara works (content.json → business.locations), shared by the app and the static pages.

/** The unit's Google Business Profile, or a Google Maps search for its address while it has none. */
export function directionsUrl(location) {
  if (location.map) return location.map;
  if (!location.streetAddress) return "";
  const query = `${location.streetAddress}, ${location.city} - ${location.state}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** One line with the full address: street, neighborhood, "City – PR", postal code (empty parts left out). */
export const fullAddress = (location) =>
  [location.streetAddress, location.neighborhood, `${location.city} – ${location.state}`, location.postalCode]
    .filter(Boolean)
    .join(", ");
