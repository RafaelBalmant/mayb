import { t } from "../content.js";
import { buildMessage, whatsappLink } from "../domain/summary.js";
import { Brand } from "../components/Brand.jsx";
import { Layout } from "../components/Layout.jsx";
import { Paragraphs } from "../components/Paragraphs.jsx";
import { useNavigation, useStore } from "../store/StoreProvider.jsx";

// After sending: what happens now and a way out in case WhatsApp did not open.
export function SentScreen() {
  const { state, dispatch } = useStore();
  const { goTo } = useNavigation();

  const bar = (
    <button class="btn secondary" id="back" onClick={() => goTo("review")}>
      {t("sent.back")}
    </button>
  );

  const erase = () => {
    dispatch({ type: "RESTART" });
    goTo("opening");
  };

  return (
    <Layout bar={bar}>
      <Brand />
      <h1 class="big-question">{t("sent.title")}</h1>
      <Paragraphs items={t("sent.explanation")} className="explain" />
      <section class="block">
        <h3>{t("sent.didNotOpen")}</h3>
        <a class="btn" id="again" href={whatsappLink(buildMessage(state))} target="_blank" rel="noopener noreferrer">
          {t("sent.openAgain")}
        </a>
      </section>
      <p class="sub note">{t("sent.privacy")}</p>
      <button type="button" class="skip" id="erase" onClick={erase}>
        {t("sent.erase")}
      </button>
    </Layout>
  );
}
