// Bundles the build (dist/) into a single HTML file, to publish the prototype as a test page.
// Usage: npm run build && node scripts/artifact.mjs <output-file>
import { readFileSync, writeFileSync } from "node:fs";

const dist = new URL("../dist/", import.meta.url);
const html = readFileSync(new URL("index.html", dist), "utf8");
const css = readFileSync(new URL(html.match(/href="\.\/(assets\/[^"]+\.css)"/)[1], dist), "utf8");
const js = readFileSync(new URL(html.match(/src="\.\/(assets\/[^"]+\.js)"/)[1], dist), "utf8");
const corpo = html.match(/<body>([\s\S]*?)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>/g, "").trim();

writeFileSync(process.argv[2], `<title>Mapa do Rosto · Mayara Bacellar</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>${css}</style>
${corpo}
<script type="module">${js.replace(/<\/script/g, "<\\/script")}</script>
`);
