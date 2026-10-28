import { useEffect, useState } from "preact/hooks";
import { professional, t } from "../content.js";
import { whatsappLink } from "../domain/summary.js";
import { useAnalytics } from "../analytics/AnalyticsProvider.jsx";
import { AboutSection } from "../components/AboutSection.jsx";
import { GoogleReviews } from "../components/GoogleReviews.jsx";
import { Layout } from "../components/Layout.jsx";
import { useNavigation, useStore } from "../store/StoreProvider.jsx";

// The photo lives in public/ (file name in content.json -> professional.photo). `npm run images` writes lighter AVIF
// and WebP copies next to it (photo-600.avif …); the browser picks the smallest it supports, the JPEG is the fallback.
const photoUrl = (file) => import.meta.env.BASE_URL + file;
const PHOTO_WIDTHS = [600, 1200];
const photoSrcset = (format) =>
  PHOTO_WIDTHS.map((w) => `${photoUrl(professional.photo.replace(/\.\w+$/, `-${w}.${format}`))} ${w}w`).join(", ");
// as wide as the screen on phones, 480px (the text column) on wider screens
const PHOTO_SIZES = "(min-width: 512px) 480px, 100vw";

// The tagline fades in slowly only the first time the start page appears (coming back from the agenda does not repeat it).
let taglineShown = false;

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle class="dot" cx="17.3" cy="6.7" r="1.1" />
  </svg>
);

// Start page: photo on top (same width as the text), the name in big letters over the photo's lower edge, and the paths.
export function StartScreen() {
  const { state } = useStore();
  const { goTo } = useNavigation();
  const analytics = useAnalytics();
  const [photoFailed, setPhotoFailed] = useState(false); // until the file exists, only the plain background shows
  const [animateTagline] = useState(() => !taglineShown);
  useEffect(() => {
    taglineShown = true;
  }, []);

  return (
    <Layout className="app app-start" hideBar>
      <header class="profile">
        <div class="profile-photo">
          {!photoFailed && (
            <picture>
              <source type="image/avif" srcset={photoSrcset("avif")} sizes={PHOTO_SIZES} />
              <source type="image/webp" srcset={photoSrcset("webp")} sizes={PHOTO_SIZES} />
              <img
                src={photoUrl(professional.photo)}
                alt={t("start.photoAlt")}
                width={professional.photoSize.width}
                height={professional.photoSize.height}
                fetchpriority="high"
                onError={() => setPhotoFailed(true)}
              />
            </picture>
          )}
        </div>
        <div class="profile-text">
          <h1 class="profile-name">
            {t("start.name").map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p class="profile-subtitle">{t("start.subtitle")}</p>
          <p class="profile-credential">{t("start.credential")}</p>
          <p class={animateTagline ? "profile-tagline appear" : "profile-tagline"}>{t("start.tagline")}</p>
        </div>
      </header>
      <div class="start-buttons">
        <button class="btn primary" id="go-agenda" data-track="agenda_open" onClick={() => goTo("agenda")}>
          {t("start.agenda")}
        </button>
        <a
          class="btn"
          data-track="whatsapp_contact"
          href={whatsappLink(t("start.contactMessage"))}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("start.contact")}
        </a>
        <a
          class="btn"
          data-track="google_review_open"
          href={professional.googleReview}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("start.review")}
        </a>
        {state.features.map && (
          <button class="btn" id="go-cases" data-track="cases_open" onClick={() => goTo("cases")}>
            {t("start.cases")}
          </button>
        )}
        {state.features.map && (
          <button class="btn" id="go-map" data-track="map_open" onClick={() => goTo("opening")}>
            {t("start.map")}
          </button>
        )}
      </div>
      <GoogleReviews />
      <AboutSection />
      <p class="profile-locations">{t("start.locations")}</p>
      <a
        class="profile-instagram"
        data-track="instagram_open"
        href={professional.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("start.instagram")}
      >
        <InstagramIcon />
      </a>
      {analytics.enabled && (
        <button type="button" class="cookie-link" id="cookies-open" onClick={analytics.reopen}>
          {t("start.cookies")}
        </button>
      )}
    </Layout>
  );
}
