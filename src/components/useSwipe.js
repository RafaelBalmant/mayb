import { useLayoutEffect } from "preact/hooks";
import { SWIPE_DIRECTION_RATIO, SWIPE_MIN_DISTANCE } from "../config.js";

/**
 * Calls onSwipe(-1) for a clear drag to the left and onSwipe(1) for a drag to the right on the element.
 * The gesture does not turn into a tap, and the callback runs after the touch ends: changing the content in
 * the middle of a touch made Safari swallow the next tap.
 */
export function useSwipe(ref, onSwipe) {
  // layout effect: the listeners exist as soon as the calendar does, not after the next paint
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start = null;
    const onStart = (e) => {
      const touch = e.touches[0];
      start = e.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
    };
    const onEnd = (e) => {
      if (!start) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      start = null;
      if (Math.abs(dx) > SWIPE_MIN_DISTANCE && Math.abs(dx) > Math.abs(dy) * SWIPE_DIRECTION_RATIO) {
        if (e.cancelable) e.preventDefault();
        setTimeout(() => onSwipe(dx < 0 ? -1 : 1));
      }
    };
    const onCancel = () => {
      start = null;
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: false });
    el.addEventListener("touchcancel", onCancel, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onCancel);
    };
  }, [ref, onSwipe]);
}
