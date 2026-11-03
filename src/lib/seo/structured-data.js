// schema.org data for Google: the doctor (Person), one business per unit (same name as the Google Business Profile)
// and, on the service pages, the visible FAQ. No ratings or reviews: Google ignores reviews a business publishes
// about itself and may treat them as spam.
import { absolute } from "./html.mjs";

const COUNTRY = "BR";

/** "CRBM 7137" → { propertyID: "CRBM", value: "7137" }. */
function registrationId(registration) {
  const [propertyID, ...rest] = registration.split(" ");
  return { "@type": "PropertyValue", propertyID, value: rest.join(" ") };
}

const personId = (url) => absolute(url, "/#mayara-bacellar");
const unitId = (url, location) => absolute(url, `/#${location.id}`);

/** Leaves out empty values, so a field still to be filled in content.json never goes to Google half-done. */
const compact = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== "" && v != null && !(Array.isArray(v) && v.length === 0)),
  );

export function person({ professional, business, url }) {
  return compact({
    "@type": "Person",
    "@id": personId(url),
    name: professional.name,
    honorificPrefix: "Dra.",
    jobTitle: business.jobTitle,
    identifier: registrationId(business.registration),
    image: absolute(url, `/${professional.photo}`),
    sameAs: business.sameAs,
    worksFor: business.locations.map((l) => ({ "@id": unitId(url, l) })),
  });
}

export function unit(location, { professional, business, url, image }) {
  const street = [location.streetAddress, location.neighborhood].filter(Boolean).join(", ");
  return compact({
    "@type": business.type,
    "@id": unitId(url, location),
    name: business.name,
    url: url || undefined,
    image,
    telephone: `+${professional.whatsapp}`,
    sameAs: [...business.sameAs, location.map].filter(Boolean),
    address: compact({
      "@type": "PostalAddress",
      streetAddress: street,
      addressLocality: location.city,
      addressRegion: location.state,
      postalCode: location.postalCode,
      addressCountry: COUNTRY,
    }),
    geo: location.geo && { "@type": "GeoCoordinates", ...location.geo },
    hasMap: location.map,
    openingHoursSpecification: location.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    areaServed: { "@type": "City", name: location.city },
    employee: { "@id": personId(url) },
  });
}

/** FAQPage, only for questions that are visible on the page. */
export const faqPage = (faq) => ({
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
});

/** The full JSON-LD document: the doctor and every unit, plus any page-specific entities. */
export function structuredData(content, extra = []) {
  return {
    "@context": "https://schema.org",
    "@graph": [person(content), ...content.business.locations.map((l) => unit(l, content)), ...extra],
  };
}
