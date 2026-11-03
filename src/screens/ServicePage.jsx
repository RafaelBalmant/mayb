import Link from "next/link";
import { Fragment } from "react";
import { WHATSAPP_BASE_URL } from "../config.js";
import { directionsUrl, fullAddress } from "../domain/locations.js";
import { PATHS } from "../navigation/routes.js";
import { pagePath } from "../lib/seo/site.js";

// Service and city pages (/toxina-botulinica-maringa/ …, content.json → pages.list) and the 404 page: plain HTML
// built ahead of time (Server Components), readable without JavaScript.

const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
const whatsappLink = (number, text) => `${WHATSAPP_BASE_URL}${number}?text=${encodeURIComponent(text)}`;

function PageHeader({ content }) {
  return (
    <header className="page-header">
      <Link className="brand" href={PATHS.start}>
        {content.texts.general.brand}
      </Link>
    </header>
  );
}

/** Links to the other service pages and back to the start page. */
export function OtherPages({ content, current }) {
  const { common, list } = content.pages;
  const others = list.filter((p) => p.slug !== current?.slug);
  if (others.length === 0) return null;
  return (
    <nav className="page-links" aria-labelledby="other-pages">
      <h2 id="other-pages">{common.other}</h2>
      <ul>
        {others.map((p) => (
          <li key={p.slug}>
            <Link href={pagePath(p)}>{p.h1}</Link>
          </li>
        ))}
        <li>
          <Link href={PATHS.start}>{common.home}</Link>
        </li>
      </ul>
    </nav>
  );
}

function LocationBlock({ location, common }) {
  const directions = directionsUrl(location);
  return (
    <section className="page-location" aria-labelledby="where">
      <h2 id="where">{fill(common.where, { city: location.city })}</h2>
      {location.streetAddress && (
        <p>
          <strong>{common.address}:</strong> {fullAddress(location)}
        </p>
      )}
      {location.hoursText && (
        <p>
          <strong>{common.hours}:</strong> {location.hoursText}
        </p>
      )}
      <p>
        {common.agenda} <Link href={PATHS.agenda}>{common.agendaLink}</Link>
      </p>
      {directions && (
        <p>
          <a className="page-directions" href={directions} target="_blank" rel="noopener noreferrer">
            {common.directions}
          </a>
        </p>
      )}
    </section>
  );
}

function WhatsappButton({ content, page, location }) {
  const { common } = content.pages;
  const href = whatsappLink(content.professional.whatsapp, fill(common.whatsappMessage, { title: page.h1 }));
  return (
    <a
      className="btn primary page-cta"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-track="whatsapp_contact"
      data-track-city={location.id}
      data-track-page={page.slug}
    >
      {common.whatsapp}
    </a>
  );
}

/** One service page. `content` is siteContent() (lib/seo/site.js). */
export function ServicePage({ content, page }) {
  const location = content.locationsById[page.location];
  if (!location) throw new Error(`pages: "${page.slug}" names an unknown location "${page.location}"`);
  const { common } = content.pages;
  return (
    <main className="app page" id="app">
      <PageHeader content={content} />
      <h1>{page.h1}</h1>
      <p className="page-professional">
        Dra. {content.professional.name} · {content.business.credential}
      </p>
      {page.intro.map((p) => (
        <p className="page-intro" key={p}>
          {p}
        </p>
      ))}
      <WhatsappButton content={content} page={page} location={location} />
      {page.sections.map((s) => (
        <section key={s.heading}>
          <h2>{s.heading}</h2>
          {s.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>
      ))}
      <section className="page-faq" aria-labelledby="faq">
        <h2 id="faq">{common.faq}</h2>
        {page.faq.map((f) => (
          <Fragment key={f.question}>
            <h3>{f.question}</h3>
            <p>{f.answer}</p>
          </Fragment>
        ))}
      </section>
      <LocationBlock location={location} common={common} />
      <WhatsappButton content={content} page={page} location={location} />
      <p className="page-notice">{common.notice}</p>
      <OtherPages content={content} current={page} />
    </main>
  );
}

/** The page answered (with status 404) for any address that does not exist. */
export function NotFoundPage({ content }) {
  const nf = content.pages.notFound;
  return (
    <main className="app page" id="app">
      <PageHeader content={content} />
      <h1>{nf.h1}</h1>
      <p className="page-intro">{nf.text}</p>
      <Link className="btn primary" href={PATHS.start}>
        {nf.home}
      </Link>
      <OtherPages content={content} current={null} />
    </main>
  );
}
