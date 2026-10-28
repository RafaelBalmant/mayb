import { useEffect } from "preact/hooks";

const FOCUSABLE = "button:not([disabled]), textarea, input, [href], [tabindex]:not([tabindex='-1'])";

/**
 * Behavior shared by every modal: the page behind it blurs (body class), Escape closes it and Tab stays
 * inside the dialog. `dialogRef` points at the dialog element; `onClose` should be stable between renders.
 */
export function useModal(dialogRef, onClose) {
  useEffect(() => {
    document.body.classList.add("with-modal");
    return () => document.body.classList.remove("with-modal");
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !dialogRef.current) return;
      const items = [...dialogRef.current.querySelectorAll(FOCUSABLE)];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first) return e.preventDefault();
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dialogRef, onClose]);
}
