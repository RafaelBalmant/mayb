// Small helpers to write HTML by hand at build time.

/** Escapes text for HTML content and attribute values. */
export const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** Fills {name} placeholders, leaving unknown ones as they are. */
export const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

/** A JSON-LD script tag ("<" escaped so the JSON can never close the tag). */
export const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

/** Absolute URL of a site path, or the path itself while the site has no address yet. */
export const absolute = (siteUrl, path) => (siteUrl ? new URL(path, siteUrl).href : path);
