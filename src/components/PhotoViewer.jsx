import { useLayoutEffect, useRef } from "preact/hooks";
import { t } from "../content.js";
import { useModal } from "./useModal.js";

/** A case photo full screen, with its before/after label and caption. Closes on ×, backdrop or Escape. */
export function PhotoViewer({ src, label, caption, origin, onClose }) {
  const dialogRef = useRef();
  useModal(dialogRef, onClose);
  useLayoutEffect(() => {
    dialogRef.current.focus({ preventScroll: true });
    return () => origin?.focus({ preventScroll: true }); // back to the thumbnail that opened it
  }, [origin]);

  return (
    <div class="modal-backdrop photo-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="photo-large" ref={dialogRef} tabindex="-1" role="dialog" aria-modal="true" aria-label={label}>
        <button class="modal-close" aria-label={t("results.close")} onClick={onClose}>
          ×
        </button>
        <span class="moment">{label}</span>
        <img src={src} alt={caption || ""} />
        {caption && <p>{caption}</p>}
      </div>
    </div>
  );
}
