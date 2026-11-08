import { AGENDA_ENABLED, MAP_ENABLED } from "../config.js";
import { absolute, pagePath, siteContent } from "../lib/seo/site.js";
import { PATHS } from "../navigation/routes.js";

// sitemap.xml: every public page Google should know (absolute addresses), with the build date. The face map is a
// form; the agenda and the cases page stay out while their switches are off. Written only when the site has an address.
export const dynamic = "force-static";

/** The paths listed in the sitemap. */
export const sitemapPaths = (content = siteContent(), mapEnabled = MAP_ENABLED, agendaEnabled = AGENDA_ENABLED) => [
  PATHS.start,
  ...(agendaEnabled ? [PATHS.agenda] : []),
  ...(mapEnabled ? [PATHS.cases] : []),
  ...content.pages.list.map(pagePath),
];

export default function sitemap() {
  const content = siteContent();
  if (!content.url) return [];
  const lastModified = new Date().toISOString().slice(0, 10);
  return sitemapPaths(content).map((path) => ({ url: absolute(path, content.url), lastModified }));
}
