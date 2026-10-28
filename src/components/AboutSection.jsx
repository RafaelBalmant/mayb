import { business, pages, t } from "../content.js";
import { directionsUrl, fullAddress } from "../domain/locations.js";

/**
 * End of the start page: who Dra. Mayara is, the service pages and the address of each unit. It stays on screen
 * after the app loads, so Google finds the specialty, the cities and the links to the service pages here too.
 */
export function AboutSection() {
  return (
    <section class="about" aria-labelledby="about-heading">
      <h2 id="about-heading">{t("start.about.heading")}</h2>
      {t("start.about.paragraphs").map((p) => (
        <p key={p}>{p}</p>
      ))}
      <h3>{t("start.about.services")}</h3>
      <ul class="about-services">
        {pages.list.map((page) => (
          <li key={page.slug}>
            <a href={`/${page.slug}/`}>{page.h1}</a>
          </li>
        ))}
      </ul>
      <h3>{t("start.about.addresses")}</h3>
      <ul class="about-addresses">
        {business.locations.map((location) => (
          <li key={location.id}>
            <strong>{location.city}</strong>
            <span>{fullAddress(location)}</span>
            {location.hoursText && <span>{location.hoursText}</span>}
            {directionsUrl(location) && (
              <a href={directionsUrl(location)} target="_blank" rel="noopener noreferrer">
                {t("start.about.directions")}
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
