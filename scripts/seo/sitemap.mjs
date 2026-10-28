// robots.txt and sitemap.xml.
import { esc } from "./html.mjs";

export function robots(siteUrl) {
  const lines = ["User-agent: *", "Allow: /"];
  if (siteUrl) lines.push("", `Sitemap: ${new URL("sitemap.xml", siteUrl).href}`);
  return lines.join("\n") + "\n";
}

/** One <url> per absolute address; lastmod is the build date (every deploy rebuilds every page). */
export function sitemap(urls, date) {
  const entries = urls.map((u) => `  <url><loc>${esc(u)}</loc><lastmod>${date}</lastmod></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}
