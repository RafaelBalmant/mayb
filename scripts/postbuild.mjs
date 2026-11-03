// Runs after `next build` on the exported site (out/):
// 1. Deletes the placeholder service page built while content.json → pages.list is empty (see app/[slug]/page.js).
// 2. Content-Security-Policy for scripts. Next.js writes small inline scripts into every page (the data React needs to
//    take over the HTML). Instead of allowing any inline script, each page gets a <meta> CSP listing the SHA-256 of
//    its own inline scripts. nginx sends the rest of the policy as a header (see nginx.conf); the browser applies both.
// Usage: node scripts/postbuild.mjs out
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PLACEHOLDER_SLUG } from "../src/navigation/routes.js";

/** Outside scripts the pages may load (Google Analytics, only after the cookie notice). */
export const SCRIPT_HOSTS = ["https://*.googletagmanager.com"];

const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/g;

/** The SHA-256 sources of the inline scripts that run (JSON-LD and other data blocks never run, so they are left out). */
export function inlineScriptHashes(html) {
  const hashes = [];
  for (const [, attributes, body] of html.matchAll(INLINE_SCRIPT)) {
    const type = attributes.match(/\stype="([^"]*)"/)?.[1];
    if (type && !/^(text|application)\/javascript$|^module$/.test(type)) continue;
    hashes.push(`'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`);
  }
  return [...new Set(hashes)];
}

/** The page with its script policy as the first thing after <meta charset>, before any script. */
export function withScriptPolicy(html) {
  if (html.includes('http-equiv="Content-Security-Policy"')) return html; // already done (postbuild run twice)
  const policy = ["script-src 'self'", ...inlineScriptHashes(html), ...SCRIPT_HOSTS].join(" ");
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}"/>`;
  const charset = html.match(/<meta charSet="utf-8"\/>|<meta charset="utf-8"\s*\/?>/i);
  if (!charset) throw new Error("postbuild: page without <meta charset>, cannot place the CSP");
  return html.replace(charset[0], `${charset[0]}${meta}`);
}

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith(".html") ? [path] : [];
  });
}

function main(out) {
  rmSync(join(out, PLACEHOLDER_SLUG), { recursive: true, force: true });
  const pages = htmlFiles(out);
  for (const file of pages) writeFileSync(file, withScriptPolicy(readFileSync(file, "utf8")));
  console.log(`postbuild: script policy written into ${pages.length} pages`);
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv[2] ?? "out");
