// Vite plugin that prepares the site for Google: title, description, link preview (Open Graph),
// structured data (schema.org), ready-made text in the HTML, robots.txt and sitemap.xml.
// Everything comes from src/data/content.json (sections "professional", "seo" and texts.general).
import { readFileSync } from "node:fs";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function read() {
  const { professional, seo, texts } = JSON.parse(
    readFileSync(new URL("../src/data/content.json", import.meta.url), "utf8"),
  );
  const url = seo.url.trim();
  const image = url && seo.image ? new URL(seo.image, url).href : "";
  return { professional, seo, title: texts.general.pageTitle, brand: texts.general.brand, url, image };
}

function structuredData({ professional, seo, url, image }) {
  const phone = `+${professional.whatsapp}`;
  const cities = seo.cities.map((name) => ({
    "@type": "City",
    name,
    containedInPlace: { "@type": "State", name: seo.state, containedInPlace: { "@type": "Country", name: "BR" } },
  }));
  return {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: `Dra. ${professional.name} · ${professional.specialty}`,
    description: seo.description,
    ...(url && { url }),
    ...(image && { image }),
    telephone: phone,
    medicalSpecialty: professional.specialty,
    areaServed: cities,
    location: seo.cities.map((name) => ({
      "@type": "Place",
      name,
      address: { "@type": "PostalAddress", addressLocality: name, addressRegion: seo.state, addressCountry: "BR" },
    })),
    contactPoint: { "@type": "ContactPoint", telephone: phone, contactType: "Agendamento", availableLanguage: "pt-BR" },
    employee: { "@type": "Person", name: professional.name, honorificPrefix: "Dra.", jobTitle: professional.specialty },
  };
}

export function seo() {
  return {
    name: "seo",

    transformIndexHtml(html) {
      const data = read();
      const { professional, seo, title, brand, url, image } = data;
      const meta = [
        `<meta name="description" content="${esc(seo.description)}" />`,
        `<meta name="keywords" content="${esc(seo.keywords.join(", "))}" />`,
        `<meta name="robots" content="index, follow" />`,
        `<meta name="geo.region" content="BR-${esc(seo.state)}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:locale" content="pt_BR" />`,
        `<meta property="og:site_name" content="${esc(title)}" />`,
        `<meta property="og:title" content="${esc(seo.content.title)}" />`,
        `<meta property="og:description" content="${esc(seo.description)}" />`,
        url && `<link rel="canonical" href="${esc(url)}" />`,
        url && `<meta property="og:url" content="${esc(url)}" />`,
        image && `<meta property="og:image" content="${esc(image)}" />`,
        `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
        `<script type="application/ld+json">${JSON.stringify(structuredData(data)).replace(/</g, "\\u003c")}</script>`,
      ]
        .filter(Boolean)
        .join("\n    ");

      // Text that Google reads without running JavaScript; main.jsx clears it as soon as the site loads.
      const c = seo.content;
      const staticText = `
      <div class="brand">${esc(brand)}</div>
      <h1 class="big-question">${esc(c.title)}</h1>
      ${c.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("\n      ")}
      <p><a href="https://wa.me/${esc(professional.whatsapp)}">${esc(c.whatsapp.replace("{phone}", professional.whatsappDisplay))}</a></p>
    `;

      return html
        .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>\n    ${meta}`)
        .replace(/(<div id="root">)(<\/div>)/, `$1${staticText}$2`);
    },

    generateBundle() {
      const { url } = read();
      const lines = ["User-agent: *", "Allow: /"];
      if (url) lines.push("", `Sitemap: ${new URL("sitemap.xml", url).href}`);
      this.emitFile({ type: "asset", fileName: "robots.txt", source: lines.join("\n") + "\n" });
      if (!url) return;
      const today = new Date().toISOString().slice(0, 10);
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${esc(url)}</loc><lastmod>${today}</lastmod></url>
</urlset>
`,
      });
    },
  };
}
