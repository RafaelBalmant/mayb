// Vite plugin that prepares the site for Google. Everything comes from src/data/content.json.
// - Start page (index.html): title, description, link preview (Open Graph), structured data (schema.org) and a
//   ready-made text in #root for crawlers that do not run JavaScript.
// - Service pages (pages.list) and 404.html: static HTML, written into dist/ (see scripts/seo/pages.mjs). In dev
//   they are served by a middleware, so `npm run dev` and the E2E tests see them too.
// - robots.txt and sitemap.xml (the start page and every service page).
import { fileURLToPath } from "node:url";
import { pagePath, readContent } from "./seo/content.mjs";
import { absolute, esc, jsonLd } from "./seo/html.mjs";
import { renderNotFoundPage, renderServicePage } from "./seo/pages.mjs";
import { robots, sitemap } from "./seo/sitemap.mjs";
import { structuredData } from "./seo/structured-data.mjs";

/** Script of the static pages (cookie notice + analytics). */
const PAGE_ENTRY = fileURLToPath(new URL("../src/pages/page.jsx", import.meta.url));
const INDEX = fileURLToPath(new URL("../index.html", import.meta.url));

function startPageHead(content) {
  const { seo, professional, url, image } = content;
  return [
    `<meta name="description" content="${esc(seo.description)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta name="geo.region" content="BR-${esc(seo.state)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:site_name" content="${esc(`Dra. ${professional.name}`)}" />`,
    `<meta property="og:title" content="${esc(seo.content.title)}" />`,
    `<meta property="og:description" content="${esc(seo.description)}" />`,
    url && `<link rel="canonical" href="${esc(url)}" />`,
    url && `<meta property="og:url" content="${esc(url)}" />`,
    image && `<meta property="og:image" content="${esc(image)}" />`,
    image && `<meta property="og:image:width" content="${seo.imageSize.width}" />`,
    image && `<meta property="og:image:height" content="${seo.imageSize.height}" />`,
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    jsonLd(structuredData(content)),
  ]
    .filter(Boolean)
    .join("\n    ");
}

// Text that Google reads without running JavaScript; main.jsx replaces it with the start screen, which shows the
// same information (subtitle, about, services and addresses).
function startPageText({ professional, seo, texts, business }) {
  const c = seo.content;
  return `
      <div class="brand">${esc(texts.general.brand)}</div>
      <h1 class="big-question">${esc(c.title)}</h1>
      <p>Dra. ${esc(professional.name)} · ${esc(business.credential)}</p>
      ${c.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("\n      ")}
      <p><a href="https://wa.me/${esc(professional.whatsapp)}">${esc(c.whatsapp.replace("{phone}", professional.whatsappDisplay))}</a></p>
    `;
}

/** The CSS files a chunk needs, following its static imports (shared CSS may sit in a shared chunk). */
function cssOf(chunk, bundle, seen = new Set()) {
  if (seen.has(chunk.fileName)) return [];
  seen.add(chunk.fileName);
  const own = [...(chunk.viteMetadata?.importedCss ?? [])];
  const imported = chunk.imports.flatMap((f) => (bundle[f] ? cssOf(bundle[f], bundle, seen) : []));
  return [...new Set([...imported, ...own])];
}

/** { slug path → HTML } for every static page. */
function staticPages(content, assets) {
  const pages = Object.fromEntries(content.pages.list.map((p) => [pagePath(p), renderServicePage(content, p, assets)]));
  return { ...pages, "/404.html": renderNotFoundPage(content, assets) };
}

export function seo() {
  return {
    name: "seo",

    config() {
      return { build: { rollupOptions: { input: { main: INDEX, page: PAGE_ENTRY } } } };
    },

    transformIndexHtml(html, ctx) {
      if (ctx.path !== "/index.html") return html; // the static pages bring their own head
      const content = readContent();
      return html
        .replace(
          /<title>.*?<\/title>/,
          `<title>${esc(content.texts.general.pageTitle)}</title>\n    ${startPageHead(content)}`,
        )
        .replace(/(<div id="root">)(<\/div>)/, `$1${startPageText(content)}$2`);
    },

    configureServer(server) {
      const devAssets = { styles: [], script: "/src/pages/page.jsx" }; // in dev the script injects the CSS itself
      server.middlewares.use(async (req, res, next) => {
        const path = req.url.split("?")[0];
        const html = staticPages(readContent(), devAssets)[path.endsWith("/") ? path : `${path}/`];
        if (!html || path === "/") return next();
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(await server.transformIndexHtml(req.url, html));
      });
    },

    generateBundle(_options, bundle) {
      const content = readContent();
      const entry = Object.values(bundle).find((c) => c.type === "chunk" && c.facadeModuleId === PAGE_ENTRY);
      const assets = { styles: cssOf(entry, bundle).map((f) => `/${f}`), script: `/${entry.fileName}` };
      for (const [path, html] of Object.entries(staticPages(content, assets))) {
        const fileName = path.endsWith("/") ? `${path.slice(1)}index.html` : path.slice(1);
        this.emitFile({ type: "asset", fileName, source: html });
      }

      this.emitFile({ type: "asset", fileName: "robots.txt", source: robots(content.url) });
      if (!content.url) return;
      const urls = ["/", ...content.pages.list.map(pagePath)].map((p) => absolute(content.url, p));
      const today = new Date().toISOString().slice(0, 10);
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap(urls, today) });
    },
  };
}
