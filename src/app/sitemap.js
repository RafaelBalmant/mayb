import { MAP_ENABLED } from "../config.js";
import { absolute, pagePath, siteContent } from "../lib/seo/site.js";
import { PATHS } from "../navigation/routes.js";

// sitemap.xml: every public page Google should know (absolute addresses), with the build date. The face map is a
// form, and the cases page stays out while the map switch is off. Written only when the site has an address.
export const dynamic = "force-static";

/** The paths listed in the sitemap. */
export const sitemapPaths = (content = siteContent(), mapEnabled = MAP_ENABLED) => [
  PATHS.start,
  PATHS.agenda,
  ...(mapEnabled ? [PATHS.cases] : []),
  ...content.pages.list.map(pagePath),
];

export default function sitemap() {
  const content = siteContent();
  if (!content.url) return [];
  const lastModified = new Date().toISOString().slice(0, 10);
  return sitemapPaths(content).map((path) => ({ url: absolute(path, content.url), lastModified }));
}
