import { describe, expect, it, vi } from "vitest";
import { groupForVisit, parsePlace, reviewGroups } from "../src/domain/reviews.js";
import { fetchPlace } from "../scripts/reviews/google-places.mjs";

const place = {
  rating: 4.9,
  userRatingCount: 37,
  googleMapsUri: "https://maps.google.com/?cid=1",
  reviews: [
    {
      rating: 5,
      text: { text: " Atendimento maravilhoso! " },
      relativePublishTimeDescription: "há 2 semanas",
      authorAttribution: { displayName: "Ana", uri: "https://g/ana", photoUri: "https://lh3.googleusercontent.com/a" },
    },
    { rating: 3, text: { text: "ok" }, authorAttribution: { displayName: "Bia" } },
    { rating: 5, authorAttribution: { displayName: "Sem texto" } },
    { rating: 4, originalText: { text: "Muito atenciosa." }, authorAttribution: { displayName: "Carlos" } },
  ],
};

const memoryStorage = (initial = {}) => {
  const data = { ...initial };
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => void (data[k] = String(v)) };
};
const KEY = "reviews-group";

describe("parsePlace", () => {
  it("keeps reviews with text and enough stars, in Google's order", () => {
    const out = parsePlace(place, 4);
    expect(out).toMatchObject({ rating: 4.9, total: 37, link: "https://maps.google.com/?cid=1" });
    expect(out.reviews).toEqual([
      {
        author: "Ana",
        authorLink: "https://g/ana",
        photo: "https://lh3.googleusercontent.com/a",
        stars: 5,
        text: "Atendimento maravilhoso!",
      },
      { author: "Carlos", authorLink: "", photo: "", stars: 4, text: "Muito atenciosa." },
    ]);
  });

  it("is null without a rating or without any review left", () => {
    expect(parsePlace({ ...place, rating: undefined })).toBeNull();
    expect(parsePlace(place, 6)).toBeNull();
    expect(parsePlace(null)).toBeNull();
  });
});

describe("reviewGroups", () => {
  const list = (n) => Array.from({ length: n }, (_, i) => i);

  it("with many reviews, makes separate groups", () => {
    expect(reviewGroups(list(15), { size: 5, max: 3 })).toEqual([
      [0, 1, 2, 3, 4],
      [5, 6, 7, 8, 9],
      [10, 11, 12, 13, 14],
    ]);
  });

  it("with only Google's 5, every group has them all but starts on a different one", () => {
    const groups = reviewGroups(list(5), { size: 5, max: 3 });
    expect(groups).toEqual([
      [0, 1, 2, 3, 4],
      [2, 3, 4, 0, 1],
      [3, 4, 0, 1, 2],
    ]);
  });

  it("never makes more groups than reviews, nor groups larger than the list", () => {
    expect(reviewGroups(list(2), { size: 5, max: 3 })).toEqual([
      [0, 1],
      [1, 0],
    ]);
    expect(reviewGroups(list(1), { size: 5, max: 3 })).toEqual([[0]]);
    expect(reviewGroups([], { size: 5, max: 3 })).toEqual([]);
  });
});

describe("groupForVisit", () => {
  it("each new visit shows the next group, wrapping around", () => {
    const local = memoryStorage();
    const visits = Array.from({ length: 4 }, () => groupForVisit(3, { local, session: memoryStorage(), key: KEY }));
    expect(visits).toEqual([0, 1, 2, 0]);
  });

  it("a reload within the same visit keeps the group", () => {
    const local = memoryStorage({ [KEY]: "0" });
    const session = memoryStorage();
    expect(groupForVisit(3, { local, session, key: KEY })).toBe(1);
    expect(groupForVisit(3, { local, session, key: KEY })).toBe(1);
  });

  it("works without storage and with a stale saved group", () => {
    expect(groupForVisit(3, { local: null, session: null, key: KEY })).toBe(0);
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
    };
    expect(groupForVisit(3, { local: blocked, session: blocked, key: KEY })).toBe(0);
    expect(groupForVisit(2, { local: memoryStorage(), session: memoryStorage({ [KEY]: "5" }), key: KEY })).toBe(0);
  });
});

describe("fetchPlace (Google Places source)", () => {
  it("asks only for the fields the site shows, in Portuguese, with the key in a header", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => place });
    expect(await fetchPlace({ key: "k", placeId: "ChIJ abc", fetchFn })).toBe(place);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://places.googleapis.com/v1/places/ChIJ%20abc?languageCode=pt-BR&regionCode=BR");
    expect(init.headers).toEqual({
      "X-Goog-Api-Key": "k",
      "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri",
    });
  });

  it("throws when Google refuses, so the build keeps the previous reviews", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => "denied" });
    await expect(fetchPlace({ key: "k", placeId: "p", fetchFn })).rejects.toThrow("HTTP 403");
  });
});
