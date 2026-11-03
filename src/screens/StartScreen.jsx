import Link from "next/link";
import { professional, t } from "../content.js";
import { whatsappLink } from "../domain/summary.js";
import { PATHS } from "../navigation/routes.js";
import { GoogleReviews } from "../components/GoogleReviews.jsx";
import { Layout } from "../components/Layout.jsx";
import { CookiesLink } from "../components/start/CookiesLink.jsx";
import { MapLinks } from "../components/start/MapLinks.jsx";
import { Procedures } from "../components/start/Procedures.jsx";
import { Tagline } from "../components/start/Tagline.jsx";

// The photo lives in public/ (file name in content.json -> professional.photo). `npm run images` writes lighter AVIF
// and WebP copies next to it (photo-600.avif …); the browser picks the smallest it supports, the JPEG is the fallback.
const photoUrl = (file) => `/${file}`;
const PHOTO_WIDTHS = [600, 1200];
const photoSrcset = (format) =>
  PHOTO_WIDTHS.map((w) => `${photoUrl(professional.photo.replace(/\.\w+$/, `-${w}.${format}`))} ${w}w`).join(", ");
// as wide as the screen on phones, 480px (the text column) on wider screens
const PHOTO_SIZES = "(min-width: 512px) 480px, 100vw";

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle className="dot" cx="17.3" cy="6.7" r="1.1" />
  </svg>
);

/**
 * Start page: photo on top (same width as the text), the name in big letters over the photo's lower edge, and the
 * paths. Built ahead of time as plain HTML (a Server Component); only the reviews carousel, the tagline animation,
 * the map buttons (behind ?mapa=1) and the cookie link run in the browser.
 * `rating`: the Google rating saved at build time, or null. `pages`: the service pages (content.json -> pages.list).
 */
export function StartScreen({ rating, pages = [] }) {
  return (
    <Layout className="app app-start" hideBar>
      <header className="profile">
        <div className="profile-photo">
          <picture>
            <source type="image/avif" srcSet={photoSrcset("avif")} sizes={PHOTO_SIZES} />
            <source type="image/webp" srcSet={photoSrcset("webp")} sizes={PHOTO_SIZES} />
            <img
              src={photoUrl(professional.photo)}
              alt={t("start.photoAlt")}
              width={professional.photoSize.width}
              height={professional.photoSize.height}
              fetchPriority="high"
            />
          </picture>
        </div>
        <div className="profile-text">
          <h1 className="profile-name">
            {t("start.name").map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p className="profile-credential">{t("start.credential")}</p>
          <Tagline text={t("start.tagline")} />
        </div>
      </header>
      <nav className="start-buttons" aria-label={t("start.paths")}>
        <Link className="btn primary" id="go-agenda" data-track="agenda_open" href={PATHS.agenda}>
          {t("start.agenda")}
        </Link>
        <a
          className="btn"
          data-track="whatsapp_contact"
          href={whatsappLink(t("start.contactMessage"))}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("start.contact")}
        </a>
        <a
          className="btn"
          data-track="google_review_open"
          href={professional.googleReview}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("start.review")}
        </a>
        <MapLinks />
      </nav>
      <GoogleReviews rating={rating} />
      <Procedures pages={pages} />
      <footer className="start-footer">
        <p className="profile-locations">{t("start.locations")}</p>
        <a
          className="profile-instagram"
          data-track="instagram_open"
          href={professional.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("start.instagram")}
        >
          <InstagramIcon />
        </a>
        <CookiesLink />
      </footer>
    </Layout>
  );
}
