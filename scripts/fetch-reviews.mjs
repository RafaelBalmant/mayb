// Fetches the doctor's Google rating (average stars and total of reviews) once, at build time, and saves it to
// src/data/google-rating.generated.json (git-ignored). The site reads that file; visitors never call Google.
// The reviews shown on the site are not fetched: they live in content.json -> googleReviews.reviews.
// Usage: GOOGLE_MAPS_KEY=... npm run reviews   (locally the key can also live in .env)
// Never fails the build: without a key, or when Google fails, the previous file (if any) is kept as is.
import { readFileSync, writeFileSync } from "node:fs";
import { loadEnv } from "vite";
import { parseRating } from "../src/domain/reviews.js";
import { fetchPlace } from "./reviews/google-places.mjs";

const OUTPUT = new URL("../src/data/google-rating.generated.json", import.meta.url);
const content = JSON.parse(readFileSync(new URL("../src/data/content.json", import.meta.url), "utf8"));
const { placeId } = content.googleReviews ?? {};
const key = process.env.GOOGLE_MAPS_KEY || loadEnv("", process.cwd(), "").GOOGLE_MAPS_KEY;

async function main() {
  if (!key || !placeId) {
    console.log("reviews: no GOOGLE_MAPS_KEY or place id, keeping the current rating file (if any)");
    return;
  }
  try {
    const data = parseRating(await fetchPlace({ key, placeId }));
    if (!data) return console.log("reviews: Google returned no rating, keeping the current file");
    writeFileSync(OUTPUT, JSON.stringify({ ...data, fetchedAt: new Date().toISOString() }, null, 2) + "\n");
    console.log(`reviews: saved the rating (${data.rating}, ${data.total} reviews in total)`);
  } catch (error) {
    console.warn(`reviews: could not fetch them, keeping the current file. ${error.message}`);
  }
}

await main();
