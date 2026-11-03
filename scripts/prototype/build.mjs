// Builds the prototype page: the whole site (start, agenda, cases and the face map) in one self-contained HTML file,
// to publish as a test page where only one file and data: images can load. Not part of the site's build.
// The screens are the site's own; only Next.js is swapped for small stand-ins (shims/): #name links instead of
// paths, and Google Fonts instead of next/font. Photos and case files are embedded as data: URIs.
// Usage: node scripts/prototype/build.mjs <output-file>
import { build } from "esbuild";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const PUBLIC = here("../../public/");
const TYPES = { ".avif": "image/avif", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png" };
Object.assign(TYPES, { ".svg": "image/svg+xml", ".mp3": "audio/mpeg" });

/** "cases/x/antes.jpg" (under public/) → data: URI. */
const dataUri = (path) => `data:${TYPES[extname(path)]};base64,${readFileSync(join(PUBLIC, path)).toString("base64")}`;

/** The build-time data of the pages (scripts/prototype/data.js), run in Node. */
async function loadPageData() {
  const folder = mkdtempSync(join(tmpdir(), "prototype-"));
  const file = join(folder, "data.mjs");
  try {
    await build({
      entryPoints: [here("data.js")],
      bundle: true,
      platform: "node",
      format: "esm",
      packages: "external",
      outfile: file,
      logLevel: "warning",
    });
    return (await import(pathToFileURL(file).href)).data;
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}

/** Every "/cases/…" or "/case-examples/…" string in `value`, replaced by the file's data: URI. */
const embedFiles = (value) =>
  typeof value === "string" && /^\/(cases|case-examples)\//.test(value)
    ? dataUri(value.slice(1))
    : Array.isArray(value)
      ? value.map(embedFiles)
      : value && typeof value === "object"
        ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, embedFiles(item)]))
        : value;

/** { "profile/photo-600.avif": "data:…" } for the start page photo and its lighter copies. */
const photos = () =>
  Object.fromEntries(
    readdirSync(join(PUBLIC, "profile"))
      .filter((name) => TYPES[extname(name)])
      .map((name) => [`profile/${name}`, dataUri(`profile/${name}`)]),
  );

const PHOTO_URL = "const photoUrl = (file) => `/${file}`;";

/** Resolves the stand-ins and the "prototype:data" module, and points the start page photo at the embedded copies. */
const prototypePlugin = (data) => ({
  name: "prototype",
  setup(on) {
    const shims = { "next/link": "shims/link.jsx", "next/navigation": "shims/navigation.js" };
    shims["next/font/google"] = "shims/font.js";
    on.onResolve({ filter: /^next\// }, ({ path }) => ({ path: here(shims[path] ?? path) }));
    on.onResolve({ filter: /^prototype:data$/ }, () => ({ path: "data", namespace: "prototype" }));
    on.onLoad({ filter: /.*/, namespace: "prototype" }, () => ({
      contents: `export const data = ${JSON.stringify(data)};\nexport const photos = ${JSON.stringify(photos())};`,
      loader: "js",
    }));
    on.onLoad({ filter: /StartScreen\.jsx$/ }, ({ path }) => {
      const source = readFileSync(path, "utf8");
      if (!source.includes(PHOTO_URL)) throw new Error(`StartScreen.jsx no longer has: ${PHOTO_URL}`);
      return {
        contents: `import { photos } from "prototype:data";\n${source.replace(PHOTO_URL, "const photoUrl = (file) => photos[file];")}`,
        loader: "jsx",
      };
    });
  },
});

async function main(output) {
  if (!output) throw new Error("Usage: node scripts/prototype/build.mjs <output-file>");
  const data = embedFiles(await loadPageData());
  const result = await build({
    entryPoints: [here("entry.jsx")],
    bundle: true,
    minify: true,
    format: "iife",
    platform: "browser",
    target: "es2020",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"', "process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID": '""' },
    plugins: [prototypePlugin(data)],
    write: false,
    logLevel: "warning",
  });
  const script = result.outputFiles[0].text.replace(/<\/script/g, "<\\/script");
  const css = ["theme.css", "style.css"].map((name) => readFileSync(here(`../../src/styles/${name}`), "utf8"));
  const title = JSON.parse(readFileSync(here("../../src/data/content.json"), "utf8")).texts.general.pageTitle;
  const fonts =
    "https://fonts.googleapis.com/css2?family=Jost:wght@300..700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap";
  writeFileSync(
    output,
    `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="claude:viewport-fit-sides" content="cover">
<title>${title}</title>
<link rel="stylesheet" href="${fonts}">
<style>:root{--font-playfair:"Playfair Display";--font-jost:"Jost"}
${css.join("\n")}</style>
</head>
<body>
<div id="root"></div>
<script>${script}</script>
</body>
</html>
`,
  );
  console.log(`prototype: ${output} (${Math.round(readFileSync(output).length / 1024)} KB)`);
}

await main(process.argv[2]);
