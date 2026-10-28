import { useEffect, useRef } from "preact/hooks";
import { t } from "../content.js";
import { SEND_REDIRECT_DELAY_MS } from "../config.js";
import { hasAnswers } from "../domain/questions.js";
import { buildMessage, whatsappLink } from "../domain/summary.js";
import { Layout } from "../components/Layout.jsx";
import { Topbar } from "../components/Topbar.jsx";
import { useNavigation, useStore } from "../store/StoreProvider.jsx";

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
        class="btn secondary"
        id="back"
        onClick={() => (answered ? goTo("details", areas.length - 1) : goTo("next"))}
      >
        {t("general.back")}
      </button>
      <a
        class="btn primary"
        id="send"
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
      <div class="block tight">
        <h1>{t("review.title")}</h1>
        <p class="sub">{t("review.explanation")}</p>
      </div>
      <div class="question">
        <label for="name">
          {`${t("review.name")} `}
          <span class="hint">{t("review.nameHint")}</span>
        </label>
        <input
          type="text"
          id="name"
          autocomplete="given-name"
          placeholder={t("review.namePlaceholder")}
          value={about.name}
          onInput={(e) => dispatch({ type: "SET_NAME", name: e.currentTarget.value })}
        />
      </div>
      <section class="block">
        <h3>{t("review.preview")}</h3>
        <pre class="preview" id="preview">
          {message}
        </pre>
        <div class="edit-links">
          <button type="button" class="skip" id="edit-areas" onClick={() => goTo("map")}>
            {t("review.editAreas")}
          </button>
          <button type="button" class="skip" id="edit-details" onClick={() => goTo("details", 0)}>
            {t(answered ? "review.editDetails" : "review.addDetails")}
          </button>
        </div>
      </section>
      <p class="privacy">{t("review.privacy")}</p>
      <p class="sub note">{t("review.notice")}</p>
    </Layout>
  );
}
