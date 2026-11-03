// The site data every SEO step needs, read from content.json: the official address, the share image, the units and
// the service pages. Shared by the pages' metadata, the structured data, the sitemap and robots.txt.
import content from "../../data/content.json";

/** Official address of the site, with https and a final slash (content.json → seo.url), or "" while there is none. */
export const SITE_URL = content.seo.url.trim();

/** Absolute URL of a site path, or the path itself while the site has no address yet. */
export const absolute = (path, siteUrl = SITE_URL) => (siteUrl ? new URL(path, siteUrl).href : path);

/** The parsed content plus the values the SEO steps need (site address, share image, units by id). */
export function siteContent(data = content) {
  const url = data.seo.url.trim();
  return {
    ...data,
    url,
    image: url && data.seo.image ? new URL(data.seo.image, url).href : "",
    locationsById: Object.fromEntries(data.business.locations.map((l) => [l.id, l])),
  };
}

/** Path of a service page ("/toxina-botulinica-maringa/"). */
export const pagePath = (page) => `/${page.slug}/`;

/** The service page with this slug, or undefined. */
export const servicePage = (slug, data = content) => data.pages.list.find((p) => p.slug === slug);

/** Counts the words a visitor reads on a service page (title, intro, sections and FAQ). */
export function wordCount(page) {
  const texts = [
    page.h1,
    ...page.intro,
    ...page.sections.flatMap((s) => [s.heading, ...s.paragraphs]),
    ...page.faq.flatMap((f) => [f.question, f.answer]),
  ];
  return texts.join(" ").split(/\s+/).filter(Boolean).length;
}
