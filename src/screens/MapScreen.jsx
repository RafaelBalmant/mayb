import { useEffect, useRef, useState } from "preact/hooks";
import { AREA_BY_CODE, areas as ALL_AREAS, t } from "../content.js";
import { NOTICE_DURATION_MS, SHOW_PROFILE_VIEW } from "../config.js";
import { isMarked } from "../domain/areas.js";
import { Face } from "../components/Face.jsx";
import { Layout } from "../components/Layout.jsx";
import { OtherModal } from "../components/OtherModal.jsx";
import { Progress } from "../components/Progress.jsx";
import { useNavigation, useStore } from "../store/StoreProvider.jsx";

const nameOf = (code) => AREA_BY_CODE[code].name;
const nameInList = (a) =>
  a.code === "other" && a.description.trim() ? t("map.otherInList", { text: a.description.trim() }) : nameOf(a.code);

// Map screen: the face and, below it, the names of the parts (tapping a name also marks it), the controls and navigation.
export function MapScreen() {
  const { state, dispatch } = useStore();
  const { goTo } = useNavigation();
  const { areas, face, ui } = state;
  const view = SHOW_PROFILE_VIEW ? ui.view : "front";

  const [notice, setNotice] = useState({ text: "", on: false });
  const [modalOpen, setModalOpen] = useState(false);
  const [highlight, setHighlight] = useState(null); // area whose name is hovered or focused
  const timerRef = useRef();
  const otherButtonRef = useRef();
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const flash = (text) => {
    setNotice({ text, on: true });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setNotice((n) => ({ ...n, on: false })), NOTICE_DURATION_MS);
  };

  const tap = (code) => {
    const wasMarked = isMarked(areas, code);
    dispatch({ type: "TOGGLE_AREA", code });
    flash(t(wasMarked ? "map.noticeUnmarked" : "map.noticeMarked", { area: nameOf(code) }));
  };

  const closeModal = () => {
    setModalOpen(false);
    otherButtonRef.current?.focus({ preventScroll: true });
  };
  const saveOther = (text) => {
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
      <button class="btn primary" id="proceed" disabled={areas.length === 0} onClick={() => goTo("results")}>
        {t("map.continue")}
      </button>
    </>
  );

  const segmented = (label, options, current, onPick) => (
    <div class="segmented" role="group" aria-label={label}>
      {options.map((value) => (
        <button key={value} aria-pressed={current === value} onClick={() => onPick(value)}>
          {t(`map.${value}`)}
        </button>
      ))}
    </div>
  );

  const other = areas.find((a) => a.code === "other");

  return (
    <>
      <Layout className="app app-map" bar={bar}>
        <header class="topbar topbar-compact">
          <Progress flow="face" step={2} />
        </header>
        <div class="controls">
          {SHOW_PROFILE_VIEW &&
            segmented(t("map.view"), ["front", "profile"], ui.view, (v) => dispatch({ type: "SET_VIEW", view: v }))}
          {segmented(t("map.face"), ["female", "male"], face, (f) => dispatch({ type: "SET_FACE", face: f }))}
        </div>
        <p class="map-hint">{t("map.names")}</p>
        <div class="stage">
          <div class="map">
            <Face
              face={face}
              view={view}
              label={t("map.drawingDescription", { face: t(`map.${face}`), view: t(`map.${view}`) })}
              isMarked={(code) => isMarked(areas, code)}
              nameOf={nameOf}
              onToggle={tap}
              highlight={highlight}
            />
            <div class={notice.on ? "notice on" : "notice"} id="notice" role="status" aria-live="polite">
              {notice.text}
            </div>
          </div>
          <aside class="side" aria-label={t("map.names")}>
            <ul class="labels">
              {ALL_AREAS.map(({ code }) => {
                const marked = isMarked(areas, code);
                return (
                  <li key={code}>
                    <button
                      class="label"
                      ref={code === "other" ? otherButtonRef : undefined}
                      aria-pressed={marked}
                      onClick={() => (code === "other" ? setModalOpen(true) : tap(code))}
                      onMouseEnter={() => setHighlight(code)}
                      onFocus={() => setHighlight(code)}
                      onMouseLeave={() => setHighlight(null)}
                      onBlur={() => setHighlight(null)}
                    >
                      <span class="label-mark" aria-hidden="true">
                        {marked ? "✓" : "+"}
                      </span>
                      <span>{code === "other" && marked ? nameInList(other) : nameOf(code)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
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
