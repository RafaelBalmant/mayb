import { useEffect, useRef } from "react";
import { t } from "../content.js";
import { SEND_REDIRECT_DELAY_MS } from "../config.js";
import { hasAnswers } from "../domain/questions.js";
import { buildMessage, whatsappLink } from "../domain/summary.js";
import { Layout } from "../components/Layout.jsx";
import { Topbar } from "../components/Topbar.jsx";
import { useNavigation } from "../navigation/useNavigation.js";
import { useStore } from "../store/StoreProvider.jsx";

// Review and send: the message exactly as it will arrive, the privacy notice and the WhatsApp button.
// Both paths after the map ("talk to the team" and "give more information") end here.
export function ReviewScreen() {
  const { state, dispatch } = useStore();
  const { goTo } = useNavigation();
  const { areas, about } = state;
  const answered = areas.some(hasAnswers);
  const message = buildMessage(state);

  const redirectRef = useRef();
  useEffect(() => () => clearTimeout(redirectRef.current), []);

  // the link opens WhatsApp; here we only show what happens next
  const send = () => {
    redirectRef.current = setTimeout(() => goTo("sent"), SEND_REDIRECT_DELAY_MS);
  };

  const bar = (
    <>
      <button
        className="btn secondary"
        id="back"
        onClick={() => (answered ? goTo("details", areas.length - 1) : goTo("next"))}
      >
        {t("general.back")}
      </button>
      <a
        className="btn primary"
        id="send"
        data-track="whatsapp_summary"
        target="_blank"
        rel="noopener noreferrer"
        href={whatsappLink(message)}
        onClick={send}
      >
        {t("review.send")}
      </a>
    </>
  );

  return (
    <Layout bar={bar}>
      <Topbar screen="review" />
      <div className="block tight">
        <h1>{t("review.title")}</h1>
        <p className="sub">{t("review.explanation")}</p>
      </div>
      <div className="question">
        <label htmlFor="name">
          {`${t("review.name")} `}
          <span className="hint">{t("review.nameHint")}</span>
        </label>
        <input
          type="text"
          id="name"
          autoComplete="given-name"
          placeholder={t("review.namePlaceholder")}
          value={about.name}
          onChange={(e) => dispatch({ type: "SET_NAME", name: e.currentTarget.value })}
        />
      </div>
      <section className="block">
        <h3>{t("review.preview")}</h3>
        <pre className="preview" id="preview">
          {message}
        </pre>
        <div className="edit-links">
          <button type="button" className="skip" id="edit-areas" onClick={() => goTo("map")}>
            {t("review.editAreas")}
          </button>
          <button type="button" className="skip" id="edit-details" onClick={() => goTo("details", 0)}>
            {t(answered ? "review.editDetails" : "review.addDetails")}
          </button>
        </div>
      </section>
      <p className="privacy">{t("review.privacy")}</p>
      <p className="sub note">{t("review.notice")}</p>
    </Layout>
  );
}
