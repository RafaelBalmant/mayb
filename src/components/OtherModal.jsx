import { useEffect, useRef, useState } from "preact/hooks";
import { t } from "../content.js";

const FOCUSABLE = "button:not([disabled]), textarea, input, [href], [tabindex]:not([tabindex='-1'])";
const m = (key) => t(`map.otherModal.${key}`);

/**
 * "Other part" modal: fills the screen over a blurred backdrop.
 * Escape and a tap on the backdrop close it; Tab stays inside the dialog.
 */
export function OtherModal({ initialText, canRemove, onSave, onRemove, onClose }) {
  const [text, setText] = useState(initialText);
  const dialogRef = useRef();
  const fieldRef = useRef();

  useEffect(() => {
    document.body.classList.add("with-modal");
    fieldRef.current.focus();
    fieldRef.current.setSelectionRange(fieldRef.current.value.length, fieldRef.current.value.length);
    return () => document.body.classList.remove("with-modal");
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab") return;
      const items = [...dialogRef.current.querySelectorAll(FOCUSABLE)];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div class="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button class="modal-close" id="modal-close" aria-label={m("close")} onClick={onClose}>
          ×
        </button>
        <h2 id="modal-title">{m("title")}</h2>
        <p class="sub">{m("explanation")}</p>
        <textarea
          id="modal-text"
          ref={fieldRef}
          rows={4}
          placeholder={m("placeholder")}
          value={text}
          onInput={(e) => setText(e.currentTarget.value)}
        />
        <div class="modal-actions">
          <button class="btn secondary" id="modal-cancel" onClick={onClose}>
            {m("cancel")}
          </button>
          <button class="btn primary" id="modal-save" disabled={!text.trim()} onClick={() => onSave(text.trim())}>
            {m("save")}
          </button>
        </div>
        {canRemove && (
          <button class="btn delete" id="modal-remove" onClick={onRemove}>
            {m("remove")}
          </button>
        )}
      </div>
    </div>
  );
}
