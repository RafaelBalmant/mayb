import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import robots from "../src/app/robots.js";
import sitemap, { sitemapPaths } from "../src/app/sitemap.js";
import { JsonLd } from "../src/components/JsonLd.jsx";
import { directionsUrl } from "../src/domain/locations.js";
import { pageMetadata, rootMetadata, routeMetadata } from "../src/lib/seo/metadata.js";
import { pagePath, siteContent, wordCount } from "../src/lib/seo/site.js";
import { breadcrumbs, faqPage, pageStructuredData, structuredData } from "../src/lib/seo/structured-data.js";
import { inlineScriptHashes, withScriptPolicy } from "../scripts/postbuild.mjs";
import { NotFoundPage, ServicePage } from "../src/screens/ServicePage.jsx";

const content = siteContent();
const graph = structuredData(content)["@graph"];
const byType = (type) => graph.filter((e) => e["@type"] === type);
const unitFor = (id) => graph.find((e) => e["@id"]?.endsWith(`#${id}`));
const jsonLdOf = (html) => JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
const render = (element) => renderToStaticMarkup(element);

describe("structured data (schema.org)", () => {
  it("names each unit exactly like the Google Business Profile, with no ratings or reviews", () => {
    const units = byType(content.business.type);
    expect(units).toHaveLength(content.business.locations.length);
    for (const unit of units) expect(unit.name).toBe(content.business.name);
    expect(JSON.stringify(graph)).not.toMatch(/aggregateRating|"review"/);
  });

  it("has the full Maringá address, coordinates, map and opening hours", () => {
    const maringa = unitFor("maringa");
    expect(maringa.address).toEqual({
      "@type": "PostalAddress",
      streetAddress: "Travessa Japurá, 175, Sala 301 – Madison Centro Empresarial, Zona 08",
      addressLocality: "Maringá",
      addressRegion: "PR",
      postalCode: "87050-630",
      addressCountry: "BR",
    });
    expect(maringa.geo).toEqual({ "@type": "GeoCoordinates", latitude: -23.4378515, longitude: -51.9101809 });
    expect(maringa.hasMap).toBe("https://maps.google.com/?cid=17404585891656778517");
    expect(maringa.sameAs).toContain(maringa.hasMap);
    expect(maringa.openingHoursSpecification).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "18:00",
      },
    ]);
  });

  it("leaves out the Siqueira Campos fields that are still empty instead of sending them blank", () => {
    const siqueira = unitFor("siqueira_campos");
    expect(siqueira.address.streetAddress).toBe("Rua Benjamin Constant, 2058");
    for (const [key, value] of Object.entries(siqueira.address)) expect(value, key).not.toBe("");
    expect(siqueira).not.toHaveProperty("geo");
    expect(siqueira).not.toHaveProperty("hasMap");
  });

  it("describes Dra. Mayara as a biomedical professional with her CRBM, working at every unit", () => {
    const [person] = byType("Person");
    expect(person.jobTitle).toBe("Biomédica esteta");
    expect(person.identifier).toEqual({ "@type": "PropertyValue", propertyID: "CRBM", value: "7137" });
    expect(person.sameAs).toEqual(expect.arrayContaining([expect.stringMatching(/instagram\.com/)]));
    expect(person.sameAs).toEqual(expect.arrayContaining([expect.stringMatching(/facebook\.com/)]));
    expect(person.worksFor).toHaveLength(content.business.locations.length);
  });
});

// Two made-up pages to check the HTML the build writes (the real list in content.json is filled in later).
const fixturePage = (slug, location, service, city) => ({
  slug,
  location,
  service,
  h1: `${service} em ${city}`,
  title: `${service} em ${city} | Teste`,
  description: `Descrição de teste de ${service} em ${city}.`,
  intro: ["Parágrafo de introdução."],
  sections: [{ heading: "O que é", paragraphs: ["Texto da seção."] }],
  faq: [{ question: 'Pergunta com "aspas"?', answer: "Resposta." }],
});
const fixtures = [
  fixturePage("servico-a-maringa", "maringa", "Serviço A", "Maringá"),
  fixturePage("servico-b-siqueira-campos", "siqueira_campos", "Serviço B", "Siqueira Campos"),
];
const withFixtures = { ...content, pages: { ...content.pages, list: fixtures } };

describe("service pages: rules for the texts in content.json (pages.list)", () => {
  const { list } = content.pages;

  it("have unique slugs, titles and descriptions, and a known unit", () => {
    for (const key of ["slug", "title", "description", "h1"]) {
      expect(new Set(list.map((p) => p[key])).size, key).toBe(list.length);
    }
    for (const page of list) {
      expect(page.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(content.locationsById[page.location], page.slug).toBeDefined();
    }
  });

  it("name the service and the city in the title, the description and the H1", () => {
    for (const page of list) {
      const city = content.locationsById[page.location].city;
      for (const key of ["title", "description", "h1"]) expect(page[key], `${page.slug} ${key}`).toContain(city);
      expect(page.h1, page.slug).toContain(page.service);
    }
  });

  it("have between 400 and 700 words", () => {
    for (const page of list) {
      const words = wordCount(page);
      expect(words, page.slug).toBeGreaterThanOrEqual(400);
      expect(words, page.slug).toBeLessThanOrEqual(700);
    }
  });

  it("avoid claims that health advertising rules forbid", () => {
    const forbidden = /garantid|\b(o|a|os|as) melhor(es)?\b|sem dor|indolor|100 ?%|definitiv|milagr|antes e depois/i;
    for (const page of list) expect(JSON.stringify(page), page.slug).not.toMatch(forbidden);
  });
});

describe("service pages: the HTML written at build time", () => {
  const list = fixtures;

  it.each(list.map((p) => [p.slug, p]))("%s: H1, credential, WhatsApp button, links and FAQ", (slug, page) => {
    const html = render(<ServicePage content={withFixtures} page={page} />);
    const location = content.locationsById[page.location];
    expect(html.match(/<h1>(.*?)<\/h1>/)[1]).toBe(page.h1);
    expect(html).toContain("Biomédica · CRBM 7137");
    expect(html).toContain(`data-track="whatsapp_contact" data-track-city="${location.id}" data-track-page="${slug}"`);
    expect(html).toContain(`href="${directionsUrl(location).replace(/&/g, "&amp;")}"`);
    expect(html).toContain('href="/"');
    expect(html).not.toContain('href="/agenda/"'); // the agenda is off
    for (const other of list.filter((p) => p !== page)) expect(html).toContain(`href="${pagePath(other)}"`);
    for (const f of page.faq) expect(html).toContain(`<h3>${f.question.replace(/"/g, "&quot;")}</h3>`);
  });

  it.each(list.map((p) => [p.slug, p]))("%s: own title, description and canonical link, no keywords", (slug, page) => {
    const meta = pageMetadata({ title: page.title, description: page.description, path: pagePath(page) });
    expect(meta.title).toBe(page.title);
    expect(meta.description).toBe(page.description);
    expect(meta.alternates.canonical).toBe(`/${slug}/`);
    expect(new URL(meta.alternates.canonical, rootMetadata().metadataBase).href).toBe(`${content.url}${slug}/`);
    expect(meta.robots).toEqual({ index: true, follow: true });
    expect(meta).not.toHaveProperty("keywords");
  });

  it("FAQPage only for the questions that are visible on the page, plus the breadcrumb trail", () => {
    const page = fixtures[0];
    const trail = [
      { name: "Início", path: "/" },
      { name: page.h1, path: pagePath(page) },
    ];
    const html = render(<JsonLd data={pageStructuredData([faqPage(page.faq), breadcrumbs(trail, content)])} />);
    const [faq, crumbs] = jsonLdOf(html)["@graph"];
    expect(faq.mainEntity.map((q) => q.name)).toEqual(page.faq.map((f) => f.question));
    expect(crumbs.itemListElement.map((i) => [i.position, i.item])).toEqual([
      [1, content.url],
      [2, `${content.url}${page.slug}/`],
    ]);
  });

  it("a page naming an unknown unit stops the build", () => {
    expect(() =>
      render(<ServicePage content={withFixtures} page={{ ...fixtures[0], location: "curitiba" }} />),
    ).toThrow(/curitiba/);
  });

  it("the 404 page links back to the site (and to the service pages, when there are any)", () => {
    for (const data of [content, withFixtures]) {
      const html = render(<NotFoundPage content={data} />);
      expect(html).toContain('href="/"');
      for (const page of data.pages.list) expect(html).toContain(`href="${pagePath(page)}"`);
    }
  });
});

describe("metadata of each page", () => {
  it("the agenda has its own title, description and canonical link", () => {
    const meta = routeMetadata("agenda", "/agenda/");
    expect(meta.title).toBe(content.seo.routes.agenda.title);
    expect(meta.title).not.toBe(content.texts.general.pageTitle);
    expect(meta.alternates.canonical).toBe("/agenda/");
    expect(meta.openGraph.images[0].url).toBe(`${content.url}share.jpg`);
    expect(meta.twitter.card).toBe("summary_large_image");
  });

  it("the face map (and any page out of Google) is noindex and has no canonical link", () => {
    const meta = routeMetadata("map", "/mapa/", false);
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.alternates).toBeUndefined();
  });

  it("titles and descriptions are not repeated between pages", () => {
    const pages = [
      { title: content.texts.general.pageTitle, description: content.seo.description },
      ...Object.values(content.seo.routes).filter((r) => r.title),
    ];
    expect(new Set(pages.map((p) => p.title)).size).toBe(pages.length);
    expect(new Set(pages.map((p) => p.description)).size).toBe(pages.length);
  });
});

describe("robots.txt and sitemap.xml", () => {
  it("robots allows everything and points Google to the sitemap", () => {
    expect(robots()).toEqual({ rules: { userAgent: "*", allow: "/" }, sitemap: `${content.url}sitemap.xml` });
  });

  it("the sitemap lists the start page and every service page, with absolute addresses", () => {
    expect(sitemapPaths(withFixtures, false)).toEqual(["/", ...fixtures.map(pagePath)]);
    expect(sitemapPaths(withFixtures, false, true)).toEqual(["/", "/agenda/", ...fixtures.map(pagePath)]);
    expect(sitemapPaths(content, true)).toContain("/casos/");
    for (const entry of sitemap()) expect(entry.url).toMatch(/^https:\/\//);
    expect(sitemap().map((e) => e.url)).not.toContain(`${content.url}mapa/`);
  });
});

describe("script policy (scripts/postbuild.mjs)", () => {
  const page = `<!DOCTYPE html><html><head><meta charSet="utf-8"/><script src="/_next/a.js" async=""></script></head><body><script type="application/ld+json">{"a":1}</script><script>self.x=1</script><script>self.y=2</script></body></html>`;

  it("hashes only the inline scripts that run", () => {
    expect(inlineScriptHashes(page)).toEqual([
      "'sha256-OeQ5f9lOMes7jOc0cGCXX08CnAERweUkLpVXXpflaLg='",
      "'sha256-GX+S9neY9N6OCh0PD2Ss4JrEAFf5BO9duQi2uoeNkok='",
    ]);
  });

  it("puts the policy right after the charset, before any script, once", () => {
    const out = withScriptPolicy(page);
    expect(out.indexOf('http-equiv="Content-Security-Policy"')).toBeLessThan(out.indexOf("<script"));
    expect(out).toContain("script-src 'self' 'sha256-");
    expect(withScriptPolicy(out)).toBe(out);
  });
});
