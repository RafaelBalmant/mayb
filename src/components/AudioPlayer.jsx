import { useRef, useState } from "preact/hooks";
import { t } from "../content.js";

// The audio playing now: starting another one pauses it, so only one plays at a time.
let current = null;

const clock = (s) => {
  const total = Math.floor(Number.isFinite(s) ? s : 0);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

/** The doctor's audio about a case: play/pause, progress and time, and optionally the text of what she says. */
export function AudioPlayer({ src, text }) {
  const audioRef = useRef();
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio.paused) return audio.pause();
    if (current && current !== audio) current.pause();
    current = audio;
    audio.play().catch(() => setPlaying(false));
  };

  return (
    <div class="case-audio">
      <div class="audio">
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        />
        <button class="audio-play" aria-label={t(playing ? "cases.pause" : "cases.play")} onClick={toggle}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {playing ? <path d="M7 5h3v14H7zM14 5h3v14h-3z" /> : <path d="M8 5l11 7-11 7z" />}
          </svg>
        </button>
        <div class="audio-info">
          <span>{t("cases.audio")}</span>
          <div class="audio-bar" aria-hidden="true">
            <i style={{ width: `${duration ? (time / duration) * 100 : 0}%` }} />
          </div>
          <span class="audio-time">
            {clock(time)} / {clock(duration)}
          </span>
        </div>
      </div>
      {text && (
        <details class="audio-text">
          <summary>{t("cases.audioText")}</summary>
          <p>{text}</p>
        </details>
      )}
    </div>
  );
}
