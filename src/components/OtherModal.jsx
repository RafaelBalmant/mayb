import { useLayoutEffect, useRef, useState } from "preact/hooks";
import { t } from "../content.js";
import { useModal } from "./useModal.js";

const m = (key) => t(`map.otherModal.${key}`);

/**
 * "Other part" modal: fills the screen over a blurred backdrop.
 * Escape and a tap on the backdrop close it; Tab stays inside the dialog.
 */
export function OtherModal({ initialText, canRemove, onSave, onRemove, onClose }) {
  const [text, setText] = useState(initialText);
  const dialogRef = useRef();
  const fieldRef = useRef();

  useModal(dialogRef, onClose);

  useLayoutEffect(() => {
    fieldRef.current.focus();
    fieldRef.current.setSelectionRange(fieldRef.current.value.length, fieldRef.current.value.length);
  }, []);

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
