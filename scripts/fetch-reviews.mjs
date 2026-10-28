// Fetches the doctor's Google rating and reviews once, at build time, and saves them to
// src/data/reviews.generated.json (git-ignored). The site reads that file; visitors never call Google.
// Usage: GOOGLE_MAPS_KEY=... npm run reviews   (locally the key can also live in .env)
// Never fails the build: without a key, or when Google fails, the previous file (if any) is kept as is.
import { readFileSync, writeFileSync } from "node:fs";
import { loadEnv } from "vite";
import { parsePlace } from "../src/domain/reviews.js";
import { fetchPlace } from "./reviews/google-places.mjs";

const OUTPUT = new URL("../src/data/reviews.generated.json", import.meta.url);
const content = JSON.parse(readFileSync(new URL("../src/data/content.json", import.meta.url), "utf8"));
const { placeId, minStars } = content.googleReviews ?? {};
const key = process.env.GOOGLE_MAPS_KEY || loadEnv("", process.cwd(), "").GOOGLE_MAPS_KEY;

async function main() {
  if (!key || !placeId) {
    console.log("reviews: no GOOGLE_MAPS_KEY or place id, keeping the current reviews file (if any)");
    return;
  }
  try {
    const data = parsePlace(await fetchPlace({ key, placeId }), minStars);
    if (!data) return console.log("reviews: Google returned no review worth showing, keeping the current file");
    writeFileSync(OUTPUT, JSON.stringify({ ...data, fetchedAt: new Date().toISOString() }, null, 2) + "\n");
    console.log(`reviews: saved ${data.reviews.length} reviews (rating ${data.rating}, ${data.total} in total)`);
  } catch (error) {
    console.warn(`reviews: could not fetch them, keeping the current file. ${error.message}`);
  }
}

await main();
