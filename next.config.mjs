// Next.js settings. The site is exported as plain static files (out/), served by the nginx of the Docker image:
// no Node server runs in production. See README "Entrega".

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "export",
  // every page is a folder with an index.html (/agenda/, /toxina-botulinica-maringa/), as nginx and the old links expect
  trailingSlash: true,
  // a second build (the analytics E2E test) can write somewhere else without touching the main one
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
