import { useEffect, useRef, useState } from "preact/hooks";
import { AREA_BY_CODE, t } from "../content.js";
import { NOTICE_DURATION_MS } from "../config.js";
import { isMarked } from "../domain/areas.js";
import { Face } from "../components/Face.jsx";
import { Layout } from "../components/Layout.jsx";
import { OtherModal } from "../components/OtherModal.jsx";
import { useNavigation, useStore } from "../store/StoreProvider.jsx";

const nameOf = code => AREA_BY_CODE[code].name;
const nameInList = a =>
  a.code === "other" && a.description.trim() ? t("map.otherInList", { text: a.description.trim() }) : nameOf(a.code);

// Map screen: just the face, the list of what was marked beside it, the controls and navigation.
export function MapScreen() {
  const { state, dispatch } = useStore();
  const { goTo } = useNavigation();
  const { areas, face, ui } = state;
  const count = areas.length;

  const [notice, setNotice] = useState({ text: "", on: false });
  const [modalOpen, setModalOpen] = useState(false);
  const timerRef = useRef();
  const otherButtonRef = useRef();
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const flash = text => {
    setNotice({ text, on: true });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setNotice(n => ({ ...n, on: false })), NOTICE_DURATION_MS);
  };

  const tap = code => {
    const wasMarked = isMarked(areas, code);
    dispatch({ type: "TOGGLE_AREA", code });
    flash(t(wasMarked ? "map.noticeUnmarked" : "map.noticeMarked", { area: nameOf(code) }));
  };

  const closeModal = () => {
    setModalOpen(false);
    otherButtonRef.current?.focus({ preventScroll: true });
  };
  const saveOther = text => {
    dispatch({ type: "SAVE_OTHER", text });
    flash(t("map.noticeMarked", { area: nameOf("other") }));
    closeModal();
  };
  const removeOther = () => {
    dispatch({ type: "TOGGLE_AREA", code: "other" });
    flash(t("map.noticeUnmarked", { area: nameOf("other") }));
    closeModal();
  };

  const bar = (
    <>
      <button class="btn secondary" id="back" onClick={() => goTo("opening")}>
        {t("general.back")}
      </button>
      <button class="btn primary" id="proceed" disabled={count === 0} onClick={() => goTo("next")}>
        {t("map.continue")}
      </button>
    </>
  );

  const segmented = (label, options, current, onPick) => (
    <div class="segmented" role="group" aria-label={label}>
      {options.map(value => (
        <button key={value} aria-pressed={current === value} onClick={() => onPick(value)}>
          {t(`map.${value}`)}
        </button>
      ))}
    </div>
  );

  const extra = code => (
    <button
      class="extra"
      ref={code === "other" ? otherButtonRef : undefined}
      aria-pressed={isMarked(areas, code)}
      onClick={() => (code === "other" ? setModalOpen(true) : tap(code))}
    >
      {`${isMarked(areas, code) ? "✓" : "+"} ${nameOf(code)}`}
    </button>
  );

  const other = areas.find(a => a.code === "other");

  return (
    <>
      <Layout className="app app-map" bar={bar}>
        <div class="controls">
          {segmented(t("map.view"), ["front", "profile"], ui.view, view => dispatch({ type: "SET_VIEW", view }))}
          {segmented(t("map.face"), ["female", "male"], face, f => dispatch({ type: "SET_FACE", face: f }))}
        </div>
        <div class="stage">
          <div class="map">
            <Face
              face={face}
              view={ui.view}
              label={t("map.drawingDescription", { face: t(`map.${face}`), view: t(`map.${ui.view}`) })}
              isMarked={code => isMarked(areas, code)}
              nameOf={nameOf}
              onToggle={tap}
            />
            <div class={notice.on ? "notice on" : "notice"} id="notice" role="status" aria-live="polite">
              {notice.text}
            </div>
          </div>
          <aside class="side">
            <h3>{count ? t("map.markedCount", { n: count }) : t("map.marked")}</h3>
            {count ? (
              <ol class="marked">
                {areas.map(a => (
                  <li key={a.code}>
                    {a.code === "other" ? (
                      <button aria-label={t("map.edit", { area: nameInList(a) })} onClick={() => setModalOpen(true)}>
                        <span>{nameInList(a)}</span>
                        <span class="x" aria-hidden="true">
                          ✎
                        </span>
                      </button>
                    ) : (
                      <button aria-label={t("map.remove", { area: nameOf(a.code) })} onClick={() => tap(a.code)}>
                        <span>{nameInList(a)}</span>
                        <span class="x" aria-hidden="true">
                          ×
                        </span>
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p class="empty">{t("map.empty")}</p>
            )}
            <div class="extras">
              {extra("skin")}
              {extra("other")}
            </div>
          </aside>
        </div>
      </Layout>
      {modalOpen && (
        <OtherModal
          initialText={other?.description ?? ""}
          canRemove={Boolean(other)}
          onSave={saveOther}
          onRemove={removeOther}
          onClose={closeModal}
        />
      )}
    </>
  );
}
