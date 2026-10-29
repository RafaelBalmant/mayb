import { describe, expect, it } from "vitest";
import { pagePath, readContent, wordCount } from "../scripts/seo/content.mjs";
import { renderNotFoundPage, renderServicePage } from "../scripts/seo/pages.mjs";
import { robots, sitemap } from "../scripts/seo/sitemap.mjs";
import { structuredData } from "../scripts/seo/structured-data.mjs";
import { directionsUrl } from "../src/domain/locations.js";

const content = readContent();
const assets = { styles: ["/assets/site.css"], script: "/assets/page.js" };
const graph = structuredData(content)["@graph"];
const byType = (type) => graph.filter((e) => e["@type"] === type);
const unitFor = (id) => graph.find((e) => e["@id"]?.endsWith(`#${id}`));
const jsonLdOf = (html) => JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);

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

  it.each(list.map((p) => [p.slug, p]))("%s: canonical, H1, credential, WhatsApp button and FAQ", (slug, page) => {
    const html = renderServicePage(withFixtures, page, assets);
    const location = content.locationsById[page.location];
    expect(html).toContain(`<link rel="canonical" href="${content.url}${slug}/" />`);
    expect(html).toContain(`<title>${page.title}</title>`);
    expect(html.match(/<h1>(.*?)<\/h1>/)[1]).toBe(page.h1);
    expect(html).toContain("Biomédica · CRBM 7137");
    expect(html).toContain(`data-track="whatsapp_contact" data-track-city="${location.id}" data-track-page="${slug}"`);
    expect(html).toContain(`href="${directionsUrl(location).replace(/&/g, "&amp;")}"`);
    expect(html).toContain('href="/"');
    for (const other of list.filter((p) => p !== page)) expect(html).toContain(`href="${pagePath(other)}"`);
    // FAQPage only for questions that are visible on the page
    const faq = jsonLdOf(html)["@graph"].find((e) => e["@type"] === "FAQPage");
    expect(faq.mainEntity.map((q) => q.name)).toEqual(page.faq.map((f) => f.question));
    for (const f of page.faq) expect(html).toContain(`<h3>${f.question.replace(/"/g, "&quot;")}</h3>`);
    expect(html).not.toContain('name="keywords"');
  });

  it("a page naming an unknown unit stops the build", () => {
    expect(() => renderServicePage(withFixtures, { ...fixtures[0], location: "curitiba" }, assets)).toThrow(/curitiba/);
  });

  it("the 404 page is not indexed and links back to the site (and to the service pages, when there are any)", () => {
    for (const data of [content, withFixtures]) {
      const html = renderNotFoundPage(data, assets);
      expect(html).toContain('<meta name="robots" content="noindex" />');
      expect(html).toContain('href="/"');
      expect(html).not.toContain("canonical");
      for (const page of data.pages.list) expect(html).toContain(`href="${pagePath(page)}"`);
    }
  });
});

describe("robots.txt and sitemap.xml", () => {
  it("point Google to the sitemap, which lists the start page and every service page", () => {
    expect(robots(content.url)).toContain(`Sitemap: ${content.url}sitemap.xml`);
    const urls = ["/", ...fixtures.map(pagePath)].map((p) => new URL(p, content.url).href);
    const xml = sitemap(urls, "2026-10-28");
    for (const url of urls) expect(xml).toContain(`<url><loc>${url}</loc><lastmod>2026-10-28</lastmod></url>`);
  });
});
