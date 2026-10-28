import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { REVIEWS_AUTOPLAY_MS, REVIEWS_GROUP_KEY, REVIEWS_RESUME_AFTER_MS } from "../config.js";
import { t, tn } from "../content.js";
import { groupForVisit, reviewGroups } from "../domain/reviews.js";
import { savedReviews } from "../domain/saved-reviews.js";

const storage = (name) => {
  try {
    return globalThis[name] ?? null;
  } catch {
    return null; // blocked by the browser
  }
};

// The reviews come from the file saved at build time (no request to Google). Each visit shows the next group;
// chosen once per page load, so coming back to the start page keeps the same cards.
let visitGroup;
function reviewsForThisVisit() {
  if (!savedReviews) return null;
  if (!visitGroup) {
    const groups = reviewGroups(savedReviews.reviews);
    const index = groupForVisit(groups.length, {
      local: storage("localStorage"),
      session: storage("sessionStorage"),
      key: REVIEWS_GROUP_KEY,
    });
    visitGroup = groups[index];
  }
  return { ...savedReviews, reviews: visitGroup };
}

const decimal = (n) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// Five stars filled up to the rating (4.8 -> the last one is 80% full). The fill comes from the CSS (--rating).
const Stars = ({ value }) => (
  <span class="stars" style={{ "--rating": value }} role="img" aria-label={t("reviews.stars", { n: decimal(value) })}>
    ★★★★★
  </span>
);

// "Read more" only shows when the text did not fit in the card's lines.
function Review({ review, index, total }) {
  const textRef = useRef(null);
  const [overflows, setOverflows] = useState(false);
  const [open, setOpen] = useState(false);
  useLayoutEffect(() => {
    const el = textRef.current;
    setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, []);

  return (
    <figure class={open ? "review open" : "review"} aria-label={t("reviews.position", { current: index + 1, total })}>
      <Stars value={review.stars} />
      <blockquote class="review-text" ref={textRef}>
        {review.text}
      </blockquote>
      {(overflows || open) && (
        <button class="review-more" type="button" onClick={() => setOpen(!open)}>
          {t(open ? "reviews.readLess" : "reviews.readMore")}
        </button>
      )}
      <figcaption class="review-author">
        {review.photo && <img src={review.photo} alt="" referrerpolicy="no-referrer" loading="lazy" />}
        <span>
          {review.authorLink ? (
            <a href={review.authorLink} target="_blank" rel="noopener noreferrer">
              {review.author}
            </a>
          ) : (
            review.author
          )}
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Rating and reviews from Google on the start page: a carousel that moves on by itself every REVIEWS_AUTOPLAY_MS.
 * Once the visitor taps or drags it, it only moves by hand; after REVIEWS_RESUME_AFTER_MS without a change it
 * goes back to moving by itself. Renders nothing when the build saved no reviews.
 */
export function GoogleReviews() {
  const [data] = useState(reviewsForThisVisit);
  const [current, setCurrent] = useState(0);
  const [manual, setManual] = useState(false); // the visitor took over; wait longer before moving on
  const [touches, setTouches] = useState(0); // every touch restarts the wait
  const trackRef = useRef(null);

  const count = data?.reviews.length ?? 0;
  const scrollTo = (i) => trackRef.current?.scrollTo({ left: i * trackRef.current.clientWidth, behavior: "smooth" });

  // One timer at a time, restarted whenever the card changes or the visitor touches the carousel.
  useEffect(() => {
    if (count < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(
      () => {
        const track = trackRef.current;
        if (!track) return;
        setManual(false);
        track.scrollTo({ left: ((current + 1) % count) * track.clientWidth, behavior: "smooth" });
      },
      manual ? REVIEWS_RESUME_AFTER_MS : REVIEWS_AUTOPLAY_MS,
    );
    return () => clearTimeout(timer);
  }, [count, current, manual, touches]);

  if (!data) return null;
  const takeOver = () => {
    setManual(true);
    setTouches((n) => n + 1);
  };
  const { rating, total, link, reviews } = data;

  return (
    <section
      class="reviews"
      aria-label={t("reviews.title")}
      onPointerDown={takeOver}
      onTouchStart={takeOver}
      onFocusIn={takeOver}
      onWheel={takeOver}
    >
      <h2 class="reviews-title">{t("reviews.title")}</h2>
      <div class="reviews-summary">
        <span class="reviews-rating" aria-label={t("reviews.rating", { rating: decimal(rating) })}>
          {decimal(rating)}
        </span>
        <Stars value={rating} />
        <span class="reviews-total">{tn("reviews.total", total)}</span>
      </div>
      <div
        class="reviews-track"
        role="region"
        aria-label={t("reviews.list")}
        tabIndex={0}
        ref={trackRef}
        onScroll={(e) => setCurrent(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
      >
        {reviews.map((r, i) => (
          <Review key={i} review={r} index={i} total={count} />
        ))}
      </div>
      {count > 1 && (
        <div class="reviews-dots">
          {reviews.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={t("reviews.goTo", { n: i + 1 })}
              aria-current={i === current ? "true" : undefined}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
      )}
      {link && (
        <a class="reviews-link" href={link} target="_blank" rel="noopener noreferrer">
          {t("reviews.seeAll")}
        </a>
      )}
      <p class="reviews-source">{t("reviews.source")}</p>
    </section>
  );
}
