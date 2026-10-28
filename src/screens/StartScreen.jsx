import { useEffect, useState } from "preact/hooks";
import { professional, t } from "../content.js";
import { whatsappLink } from "../domain/summary.js";
import { GoogleReviews } from "../components/GoogleReviews.jsx";
import { Layout } from "../components/Layout.jsx";
import { useNavigation, useStore } from "../store/StoreProvider.jsx";

// The photo lives in public/ (file name in content.json -> professional.photo).
const photoUrl = (file) => import.meta.env.BASE_URL + file;

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
            <img src={photoUrl(professional.photo)} alt={t("start.photoAlt")} onError={() => setPhotoFailed(true)} />
          )}
        </div>
        <div class="profile-text">
          <h1 class="profile-name">
            {t("start.name").map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p class={animateTagline ? "profile-tagline appear" : "profile-tagline"}>{t("start.tagline")}</p>
        </div>
      </header>
      <div class="start-buttons">
        <button class="btn primary" id="go-agenda" onClick={() => goTo("agenda")}>
          {t("start.agenda")}
        </button>
        <a class="btn" href={whatsappLink(t("start.contactMessage"))} target="_blank" rel="noopener noreferrer">
          {t("start.contact")}
        </a>
        <a class="btn" href={professional.googleReview} target="_blank" rel="noopener noreferrer">
          {t("start.review")}
        </a>
        {state.features.map && (
          <button class="btn" id="go-cases" onClick={() => goTo("cases")}>
            {t("start.cases")}
          </button>
        )}
        {state.features.map && (
          <button class="btn" id="go-map" onClick={() => goTo("opening")}>
            {t("start.map")}
          </button>
        )}
      </div>
      <GoogleReviews />
      <p class="profile-locations">{t("start.locations")}</p>
      <a
        class="profile-instagram"
        href={professional.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("start.instagram")}
      >
        <InstagramIcon />
      </a>
    </Layout>
  );
}
