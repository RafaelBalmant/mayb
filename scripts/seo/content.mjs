// Reads the site content (src/data/content.json) for the build-time SEO steps.
import { readFileSync } from "node:fs";

const CONTENT = new URL("../../src/data/content.json", import.meta.url);

/** The parsed content plus the values every SEO step needs (site address, share image, page list). */
export function readContent() {
  const content = JSON.parse(readFileSync(CONTENT, "utf8"));
  const url = content.seo.url.trim();
  return {
    ...content,
    url,
    image: url && content.seo.image ? new URL(content.seo.image, url).href : "",
    locationsById: Object.fromEntries(content.business.locations.map((l) => [l.id, l])),
  };
}

/** Path of a service page ("/toxina-botulinica-maringa/"). */
export const pagePath = (page) => `/${page.slug}/`;

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
