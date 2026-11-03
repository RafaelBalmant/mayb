import { notFound } from "next/navigation";
import { JsonLd } from "../../components/JsonLd.jsx";
import { TrackScreen } from "../../components/TrackScreen.jsx";
import { pageMetadata } from "../../lib/seo/metadata.js";
import { pagePath, servicePage, siteContent } from "../../lib/seo/site.js";
import { breadcrumbs, faqPage, pageStructuredData } from "../../lib/seo/structured-data.js";
import { PATHS, PLACEHOLDER_SLUG } from "../../navigation/routes.js";
import { ServicePage } from "../../screens/ServicePage.jsx";

// Service and city pages (content.json → pages.list), built at build time (SSG): one folder per slug.
// Any other slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  const slugs = siteContent().pages.list.map((page) => page.slug);
  // A static export needs at least one page per route: while the list is empty, a placeholder is built (as a 404)
  // and scripts/postbuild.mjs deletes it from out/.
  return (slugs.length ? slugs : [PLACEHOLDER_SLUG]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const page = servicePage((await params).slug);
  return page ? pageMetadata({ title: page.title, description: page.description, path: pagePath(page) }) : {};
}

export default async function Page({ params }) {
  const content = siteContent();
  const page = servicePage((await params).slug);
  if (!page) notFound();
  const trail = [
    { name: content.seo.routes.home.name, path: PATHS.start },
    { name: page.h1, path: pagePath(page) },
  ];
  return (
    <>
      <JsonLd data={pageStructuredData([faqPage(page.faq), breadcrumbs(trail, content)])} />
      <ServicePage content={content} page={page} />
      <TrackScreen />
    </>
  );
}
