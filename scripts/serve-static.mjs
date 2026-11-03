// Serves the exported site (out/) the way the nginx of the Docker image does, for the E2E tests and Lighthouse:
// a file, or a folder's index.html (a folder without its final slash is redirected to it), and anything else gets
// 404.html with status 404. Sends the same security headers as nginx.conf (read from it).
// Usage: node scripts/serve-static.mjs <folder> <port>
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { createGzip } from "node:zlib";

const [root = "out", port = "4173"] = process.argv.slice(2);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
};

/** The `add_header` lines of nginx.conf: [[name, value]]. */
const HEADERS = [
  ...readFileSync(new URL("../nginx.conf", import.meta.url), "utf8").matchAll(/add_header ([\w-]+) "([^"]*)" always;/g),
].map(([, name, value]) => [name, value]);

/** Text files are gzipped, as nginx does (gzip_types). */
const COMPRESSED = new Set([".html", ".txt", ".js", ".css", ".json", ".xml", ".svg"]);

function send(req, res, status, file) {
  const gzip = COMPRESSED.has(extname(file)) && /\bgzip\b/.test(req.headers["accept-encoding"] ?? "");
  res.writeHead(status, {
    "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
    ...(gzip && { "Content-Encoding": "gzip" }),
    ...Object.fromEntries(HEADERS),
  });
  const stream = createReadStream(file);
  (gzip ? stream.pipe(createGzip()) : stream).pipe(res);
}

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const file = join(root, normalize(path));
  if (!file.startsWith(normalize(root))) return send(req, res, 404, join(root, "404.html"));
  if (existsSync(file) && statSync(file).isFile()) return send(req, res, 200, file);
  if (existsSync(join(file, "index.html"))) {
    if (!path.endsWith("/")) {
      res.writeHead(301, { Location: `${path}/${new URL(req.url, "http://localhost").search}` });
      return res.end();
    }
    return send(req, res, 200, join(file, "index.html"));
  }
  send(req, res, 404, join(root, "404.html"));
}).listen(Number(port), () => console.log(`serving ${root} on http://localhost:${port}`));
