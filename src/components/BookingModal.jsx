import { useLayoutEffect, useRef, useState } from "preact/hooks";
import { t } from "../content.js";
import { whatsappLink } from "../domain/summary.js";
import { Progress } from "./Progress.jsx";
import { useModal } from "./useModal.js";

const m = (key, vars) => t(`agenda.modal.${key}`, vars);

/**
 * "Book a time": the visitor picks only the city; the month is the one open in the agenda. The service days of
 * each city are not chosen here, just used to disable a city without any; the team agrees on the date over WhatsApp.
 * `daysByCity` is { cityCode: [days] } for the open month.
 */
export function BookingModal({ monthName, daysByCity, onClose }) {
  const [city, setCity] = useState(null);
  const dialogRef = useRef();
  const locations = t("agenda.locations");
  const ready = Boolean(city);

  useModal(dialogRef, onClose);
  // layout effect: the focus is in place before the next key press, so an early Tab cannot escape the dialog
  useLayoutEffect(() => dialogRef.current.focus({ preventScroll: true }), []);

  const send = (e) => {
    if (!ready) return e.preventDefault();
    setTimeout(onClose, 300); // let the WhatsApp link open first
  };

  return (
    <div class="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        class="modal modal-book"
        ref={dialogRef}
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button class="modal-close" id="modal-close" aria-label={m("close")} onClick={onClose}>
          ×
        </button>
        <div class="topbar">
          <Progress flow="agenda" step={2} />
        </div>
        <h2 id="modal-title">{m("title", { month: monthName })}</h2>
        <fieldset class="question">
          <legend>{m("city")}</legend>
          <div class="routes">
            {Object.entries(locations).map(([code, name]) => {
              const hasDays = (daysByCity[code] ?? []).length > 0;
              return (
                <button
                  key={code}
                  type="button"
                  class={`route location-${code}`}
                  aria-pressed={city === code}
                  disabled={!hasDays}
                  onClick={() => setCity(code)}
                >
                  <strong>
                    <i aria-hidden="true" />
                    {name}
                  </strong>
                  {!hasDays && <span>{m("noDaysInCity")}</span>}
                </button>
              );
            })}
          </div>
          <div class="info-card" role="note">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9.5" />
              <path d="M12 11v6M12 7.5v.01" />
            </svg>
            <p>{m("info")}</p>
          </div>
        </fieldset>
        <div class="modal-actions">
          <button class="btn secondary" id="modal-cancel" onClick={onClose}>
            {m("cancel")}
          </button>
          <a
            class="btn primary"
            id="modal-send"
            data-track="whatsapp_booking"
            data-track-city={city ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            href={
              ready ? whatsappLink(t("agenda.message.request", { city: locations[city], month: monthName })) : undefined
            }
            aria-disabled={!ready}
            onClick={send}
          >
            {m(ready ? "send" : "chooseFirst")}
          </a>
        </div>
      </div>
    </div>
  );
}
