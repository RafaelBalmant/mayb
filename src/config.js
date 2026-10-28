// App constants that are not site text (the text lives in data/content.json).

/** sessionStorage key; bump the suffix when the saved shape stops being compatible. */
export const STORAGE_KEY = "site-mayara:v3";

/** Old key (code with Portuguese names); read once and converted. */
export const LEGACY_STORAGE_KEY = "site-mayara:v2";

/** Values of the discomfort scale. */
export const INTENSITY_SCALE = [1, 2, 3, 4, 5];

/** Maximum length of the name in the WhatsApp message. */
export const NAME_MAX_LENGTH = 60;

/**
 * Shrinking of free-text fields when the message exceeds the limit:
 * starts at `start` characters and shrinks by `step` until `min`.
 */
export const FREE_TEXT_SHRINK = { start: 200, step: 20, min: 20 };

/** Start of the WhatsApp chat link. */
export const WHATSAPP_BASE_URL = "https://wa.me/";

/** How long the map notice stays visible (ms). */
export const NOTICE_DURATION_MS = 1400;

/** Wait before going to the "sent" screen, so the WhatsApp link opens first (ms). */
export const SEND_REDIRECT_DELAY_MS = 300;

/**
 * Whether the face-map flow is open to everyone. While false, the start page only offers the agenda;
 * the map can still be tried with ?mapa=1 in the address (kept until the tab is closed; ?mapa=0 turns it off).
 */
export const MAP_ENABLED = false;

/** sessionStorage key that remembers ?mapa=1 for this tab. */
export const MAP_PREVIEW_KEY = "site-mayara:mapa";

/** Whether the map offers the profile view (the drawings stay in src/faces/ either way). */
export const SHOW_PROFILE_VIEW = false;

/** How many months the agenda selector shows, counting from the current one. */
export const AGENDA_MONTHS_SHOWN = 4;

/** A horizontal drag on the calendar changes the month: at least this many px, and clearly more sideways than vertical. */
export const SWIPE_MIN_DISTANCE = 50;
export const SWIPE_DIRECTION_RATIO = 1.5;

/** How many "coming soon" frames a part without photos shows (one before/after pair). */
export const PLACEHOLDER_PHOTOS = 2;
