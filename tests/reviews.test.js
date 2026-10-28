import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchReviews, parsePlace } from "../src/domain/reviews.js";

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
const answer = (body, ok = true) => vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 403, json: async () => body });

afterEach(() => vi.restoreAllMocks());

describe("parsePlace", () => {
  it("keeps reviews with text and enough stars, in Google's order", () => {
    const out = parsePlace(place, 4);
    expect(out).toMatchObject({ rating: 4.9, total: 37, link: "https://maps.google.com/?cid=1" });
    expect(out.reviews.map((r) => r.author)).toEqual(["Ana", "Carlos"]);
    expect(out.reviews[0]).toEqual({
      author: "Ana",
      authorLink: "https://g/ana",
      photo: "https://lh3.googleusercontent.com/a",
      stars: 5,
      text: "Atendimento maravilhoso!",
      when: "há 2 semanas",
    });
  });

  it("is null without a rating or without any review left", () => {
    expect(parsePlace({ ...place, rating: undefined })).toBeNull();
    expect(parsePlace(place, 6)).toBeNull();
    expect(parsePlace(null)).toBeNull();
  });
});

describe("fetchReviews", () => {
  it("does not call Google without a key or a place id", async () => {
    const fetchFn = answer(place);
    expect(await fetchReviews({ key: "", placeId: "x", fetchFn })).toBeNull();
    expect(await fetchReviews({ key: "k", placeId: "", fetchFn })).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("asks only for the fields it shows, in Portuguese, with the key in a header", async () => {
    const fetchFn = answer(place);
    const out = await fetchReviews({ key: "k", placeId: "ChIJ abc", minStars: 4, fetchFn });
    expect(out.reviews).toHaveLength(2);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://places.googleapis.com/v1/places/ChIJ%20abc?languageCode=pt-BR&regionCode=BR");
    expect(init.headers).toEqual({
      "X-Goog-Api-Key": "k",
      "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri",
    });
  });

  it("is null when Google refuses or the network fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await fetchReviews({ key: "k", placeId: "p", fetchFn: answer({}, false) })).toBeNull();
    expect(
      await fetchReviews({ key: "k", placeId: "p", fetchFn: vi.fn().mockRejectedValue(new Error("x")) }),
    ).toBeNull();
  });
});
