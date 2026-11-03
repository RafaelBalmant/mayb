import { absolute, siteContent } from "../lib/seo/site.js";

// robots.txt: everything may be crawled (pages that should stay out of Google say so with noindex, which Google
// can only read if it may fetch them), plus where the sitemap is.
export const dynamic = "force-static";

export default function robots() {
  const { url } = siteContent();
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: url ? absolute("/sitemap.xml", url) : undefined,
  };
}
