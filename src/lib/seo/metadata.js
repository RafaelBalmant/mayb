// The <head> of every page (Next.js Metadata API), from content.json: title, description, canonical link, link
// preview (Open Graph and Twitter/X) and robots. Every page has its own title and description.
import content from "../../data/content.json";
import { siteContent } from "./site.js";

const site = siteContent(content);
const { seo, professional } = site;

// Icons cut from public/profile/photo.jpg (see README "Ícone do site").
const ICONS = {
  icon: [
    { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
    { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
    { url: "/favicon-96.png", type: "image/png", sizes: "96x96" },
    { url: "/favicon-192.png", type: "image/png", sizes: "192x192" },
  ],
  apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
};

const shareImage = site.image ? [{ url: site.image, ...seo.imageSize }] : undefined;

/** Indexed (and followed) or kept out of Google. */
const robotsFor = (index) => (index ? { index: true, follow: true } : { index: false, follow: true });

/** The settings every page starts from (root layout). */
export function rootMetadata() {
  return {
    metadataBase: site.url ? new URL(site.url) : undefined,
    title: content.texts.general.pageTitle,
    description: seo.description,
    icons: ICONS,
    robots: robotsFor(true),
    other: { "geo.region": `BR-${seo.state}` },
  };
}

/**
 * Metadata of one page. `path` is its address ("/agenda/"); with `index` false the page stays out of Google and has
 * no canonical link. `ogTitle` is the link-preview title when it differs from the page title.
 */
export function pageMetadata({ title, description, path, index = true, ogTitle = title }) {
  const canonical = index && site.url ? path : undefined;
  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    robots: robotsFor(index),
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: `Dra. ${professional.name}`,
      title: ogTitle,
      description,
      url: canonical,
      images: shareImage,
    },
    twitter: {
      card: shareImage ? "summary_large_image" : "summary",
      title: ogTitle,
      description,
      images: shareImage?.map((i) => i.url),
    },
  };
}

/** Metadata of a page listed in content.json → seo.routes (agenda, cases, map). */
export const routeMetadata = (route, path, index = true) =>
  pageMetadata({ title: seo.routes[route].title, description: seo.routes[route].description, path, index });
