// Static HTML pages written at build time: one per service and city (content.json → pages.list) and the 404 page.
// They are readable without JavaScript and do not load the app; they link to it. A small script (src/pages/page.jsx)
// adds the cookie notice and the analytics.
import { WHATSAPP_BASE_URL } from "../../src/config.js";
import { directionsUrl, fullAddress } from "../../src/domain/locations.js";
import { pagePath } from "./content.mjs";
import { absolute, esc, fill, jsonLd } from "./html.mjs";
import { faqPage, structuredData } from "./structured-data.mjs";

const ICONS = `<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />
    <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png" />
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />`;

const whatsappLink = (number, text) => `${WHATSAPP_BASE_URL}${number}?text=${encodeURIComponent(text)}`;

function head({ title, description, canonical, image, robots, structured, assets }) {
  return `<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="robots" content="${robots}" />
    ${canonical ? `<link rel="canonical" href="${esc(canonical)}" />` : ""}
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    ${canonical ? `<meta property="og:url" content="${esc(canonical)}" />` : ""}
    ${image ? `<meta property="og:image" content="${esc(image)}" />` : ""}
    <meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />
    ${ICONS}
    ${assets.styles.map((href) => `<link rel="stylesheet" href="${esc(href)}" />`).join("\n    ")}
    ${structured ? jsonLd(structured) : ""}
  </head>`;
}

function document({ headHtml, main, assets }) {
  return `<!doctype html>
<html lang="pt-BR">
  ${headHtml}
  <body>
    ${main}
    <div id="page-analytics"></div>
    <script type="module" src="${esc(assets.script)}"></script>
  </body>
</html>
`;
}

/** Links to the other service pages and back to the start page (the app). */
function otherPages(content, current) {
  const { common, list } = content.pages;
  const others = list.filter((p) => p.slug !== current?.slug);
  if (others.length === 0) return "";
  const items = others.map((p) => `<li><a href="${pagePath(p)}">${esc(p.h1)}</a></li>`).join("\n          ");
  return `<nav class="page-links" aria-labelledby="other-pages">
        <h2 id="other-pages">${esc(common.other)}</h2>
        <ul>
          ${items}
          <li><a href="/">${esc(common.home)}</a></li>
        </ul>
      </nav>`;
}

function locationBlock(location, common) {
  const lines = [
    location.streetAddress && `<p><strong>${esc(common.address)}:</strong> ${esc(fullAddress(location))}</p>`,
    location.hoursText && `<p><strong>${esc(common.hours)}:</strong> ${esc(location.hoursText)}</p>`,
    `<p>${esc(common.agenda)} <a href="/#agenda">${esc(common.agendaLink)}</a></p>`,
    directionsUrl(location) &&
      `<p><a class="page-directions" href="${esc(directionsUrl(location))}" target="_blank" rel="noopener noreferrer">${esc(common.directions)}</a></p>`,
  ];
  return `<section class="page-location" aria-labelledby="where">
        <h2 id="where">${esc(fill(common.where, { city: location.city }))}</h2>
        ${lines.filter(Boolean).join("\n        ")}
      </section>`;
}

function whatsappButton(content, page, location) {
  const { common } = content.pages;
  const href = whatsappLink(content.professional.whatsapp, fill(common.whatsappMessage, { title: page.h1 }));
  return `<a class="btn primary page-cta" href="${esc(href)}" target="_blank" rel="noopener noreferrer"
        data-track="whatsapp_contact" data-track-city="${esc(location.id)}" data-track-page="${esc(page.slug)}">${esc(common.whatsapp)}</a>`;
}

function brandBar(content) {
  return `<header class="page-header"><a class="brand" href="/">${esc(content.texts.general.brand)}</a></header>`;
}

/** The HTML of one service page. `assets` = { styles: [href], script: src } of the page script. */
export function renderServicePage(content, page, assets) {
  const location = content.locationsById[page.location];
  if (!location) throw new Error(`pages: "${page.slug}" names an unknown location "${page.location}"`);
  const { common } = content.pages;
  const canonical = content.url ? absolute(content.url, pagePath(page)) : "";

  const sections = page.sections
    .map(
      (s) => `<section>
        <h2>${esc(s.heading)}</h2>
        ${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("\n        ")}
      </section>`,
    )
    .join("\n      ");
  const faq = page.faq.map((f) => `<h3>${esc(f.question)}</h3>\n        <p>${esc(f.answer)}</p>`).join("\n        ");

  const main = `<main class="app page" id="app">
      ${brandBar(content)}
      <h1>${esc(page.h1)}</h1>
      <p class="page-professional">Dra. ${esc(content.professional.name)} · ${esc(content.business.credential)}</p>
      ${page.intro.map((p) => `<p class="page-intro">${esc(p)}</p>`).join("\n      ")}
      ${whatsappButton(content, page, location)}
      ${sections}
      <section class="page-faq" aria-labelledby="faq">
        <h2 id="faq">${esc(common.faq)}</h2>
        ${faq}
      </section>
      ${locationBlock(location, common)}
      ${whatsappButton(content, page, location)}
      <p class="page-notice">${esc(common.notice)}</p>
      ${otherPages(content, page)}
    </main>`;

  const headHtml = head({
    title: page.title,
    description: page.description,
    canonical,
    image: content.image,
    robots: "index, follow",
    structured: structuredData(content, [faqPage(page.faq)]),
    assets,
  });
  return document({ headHtml, main, assets });
}

/** The page nginx answers (with status 404) for any address that does not exist. */
export function renderNotFoundPage(content, assets) {
  const nf = content.pages.notFound;
  const main = `<main class="app page" id="app">
      ${brandBar(content)}
      <h1>${esc(nf.h1)}</h1>
      <p class="page-intro">${esc(nf.text)}</p>
      <a class="btn primary" href="/">${esc(nf.home)}</a>
      ${otherPages(content, null)}
    </main>`;
  const headHtml = head({ title: nf.title, description: nf.text, robots: "noindex", assets });
  return document({ headHtml, main, assets });
}
