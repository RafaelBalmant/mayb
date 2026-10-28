// Generates the 4 illustrations in src/faces/*.svg.
// Each tappable area is ONE <path class="zone" data-area="code">; areas on both sides
// of the face (e.g. under-eye circles) use one path with two subpaths.
// Run: npm run faces   (only needed when changing the drawings or the zones)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const destination = fileURLToPath(new URL("../src/faces/", import.meta.url));
const n = v => +v.toFixed(2);

// Ellipse (with optional rotation, in degrees) as a subpath.
function ellipse(cx, cy, rx, ry, rot = 0) {
  const t = (rot * Math.PI) / 180, dx = rx * Math.cos(t), dy = rx * Math.sin(t);
  const [x1, y1, x2, y2] = [cx - dx, cy - dy, cx + dx, cy + dy].map(n);
  return `M${x1} ${y1}A${rx} ${ry} ${rot} 1 0 ${x2} ${y2}A${rx} ${ry} ${rot} 1 0 ${x1} ${y1}Z`;
}
// Same ellipse mirrored on the central axis (x = 160).
const pair = (cx, cy, rx, ry, rot = 0) => ellipse(cx, cy, rx, ry, rot) + ellipse(320 - cx, cy, rx, ry, -rot);

const zone = (code, d) => `<path class="zone" data-area="${code}" d="${d}"/>`;
const zoneLine = (code, d) => `<path class="zone zone-linha" data-area="${code}" d="${d}"/>`;

/* ---------- Front ---------- */
function frontArt(f) {
  const face = f
    ? "M160 58 C215 58 240 100 238 165 C236 220 225 260 205 290 C190 312 175 328 160 330 C145 328 130 312 115 290 C95 260 84 220 82 165 C80 100 105 58 160 58 Z"
    : "M160 58 C218 58 242 100 240 165 C239 225 236 262 222 290 C205 315 182 330 160 332 C138 330 115 315 98 290 C84 262 81 225 80 165 C78 100 102 58 160 58 Z";
  const neck = f
    ? "M132 300 L130 360 C128 382 108 396 60 412 L60 520 L260 520 L260 412 C212 396 192 382 190 360 L188 300 Z"
    : "M124 300 L122 360 C120 382 100 396 50 410 L50 520 L270 520 L270 410 C220 396 200 382 198 360 L196 300 Z";
  const sb = f ? "M104 156 Q124 143 147 153" : "M101 157 Q124 149 148 155";
  const sw = f ? 3 : 5;
  return [
    f && `<path class="hair" d="M160 40 C92 40 60 95 64 175 C68 250 58 320 44 384 L112 394 C110 360 112 340 118 318 L202 318 C208 340 210 360 208 394 L276 384 C262 320 252 250 256 175 C260 95 228 40 160 40 Z"/>`,
    `<path class="skin" d="${neck}"/>`,
    `<ellipse class="skin" cx="${f ? 84 : 82}" cy="188" rx="10" ry="22"/>`,
    `<ellipse class="skin" cx="${f ? 236 : 238}" cy="188" rx="10" ry="22"/>`,
    `<path class="skin" d="${face}"/>`,
    f
      ? `<path class="hair" d="M160 56 C118 54 90 80 82 136 C100 102 132 82 176 76 C204 72 224 90 238 124 C234 80 206 56 160 56 Z"/>`
      : `<path class="hair" d="M80 150 C74 90 105 44 160 44 C215 44 246 90 240 150 C236 120 228 100 214 92 C190 80 130 80 106 92 C92 100 84 120 80 150 Z"/>`,
    `<path class="stroke" stroke-width="${sw}" d="${sb}"/>`,
    `<path class="stroke" stroke-width="${sw}" transform="translate(320 0) scale(-1 1)" d="${sb}"/>`,
    `<path class="eye" d="M105 179 Q125 166 145 179 Q125 189 105 179 Z"/><circle class="iris" cx="125" cy="178.5" r="5.5"/>`,
    `<path class="eye" d="M175 179 Q195 166 215 179 Q195 189 175 179 Z"/><circle class="iris" cx="195" cy="178.5" r="5.5"/>`,
    `<path class="stroke light" d="M153 196 C152 214 149 228 147 236"/>`,
    `<path class="stroke" d="M146 236 Q141 245 150 247 Q155 251 160 249 Q165 251 170 247 Q179 245 174 236"/>`,
    f
      ? `<path class="mouth" d="M134 279 Q146 267 160 273 Q174 267 186 279 Q160 284 134 279 Z"/><path class="mouth" d="M134 279 Q160 301 186 279 Q160 284 134 279 Z"/>`
      : `<path class="mouth" d="M136 280 Q148 273 160 277 Q172 273 184 280 Q160 283 136 280 Z"/><path class="mouth" d="M136 280 Q160 293 184 280 Q160 283 136 280 Z"/>`,
  ].filter(Boolean).join("\n    ");
}

const frontZones = () => [
  zone("forehead", ellipse(160, 114, 70, 34)),
  zone("eyes", pair(122, 175, 34, 23)),
  zone("cheeks", pair(111, 232, 24, 30, 10)),
  zone("nose", ellipse(160, 222, 17, 33)),
  zone("mouth", ellipse(160, 280, 34, 19)),
  zone("chin", ellipse(160, 316, 26, 13)),
  zoneLine("jawline", "M90 246 C98 284 122 312 140 324 M230 246 C222 284 198 312 180 324"),
  zone("neck", ellipse(160, 364, 40, 30)),
];

/* ---------- Profile (looking left) ---------- */
function profileArt(f) {
  const chin = f ? "C104 292 100 298 100 306 C100 316 106 324 116 326" : "C102 292 96 298 96 307 C96 319 103 327 118 328";
  const head = `M175 55 C135 55 112 78 108 118 C106 135 104 148 101 158 C100 164 104 168 106 172 C98 188 86 206 78 222 C76 228 82 232 96 232 C99 234 101 236 102 238 C100 244 97 248 98 252 C100 256 104 260 104 262 C100 266 97 270 98 274 C100 280 106 284 108 287 ${chin} C130 330 142 333 150 336 C155 340 158 350 160 362 L166 520 L232 520 C234 380 230 330 234 300 C238 270 250 240 256 200 C262 150 255 100 230 75 C215 60 195 55 175 55 Z`;
  return [
    f && `<path class="hair" d="M112 92 C130 40 240 30 266 110 C282 170 270 240 284 312 C290 352 290 384 284 404 L222 404 C222 352 226 302 232 272 L140 200 Z"/>`,
    `<path class="skin" d="${head}"/>`,
    f
      ? `<path class="hair" d="M106 114 C110 70 150 48 190 50 C236 52 262 90 262 142 C250 112 226 94 190 92 C160 90 130 94 106 114 Z"/>`
      : `<path class="hair" d="M104 118 C106 70 150 46 192 48 C238 50 266 90 262 160 C256 176 250 180 246 170 C244 130 228 100 196 94 C160 88 128 96 104 118 Z"/>`,
    `<path class="skin" d="M196 186 C196 172 214 170 216 190 C218 208 212 222 202 222 C198 222 196 214 196 206 Z"/>`,
    `<path class="stroke light" d="M204 236 C208 266 204 290 192 300 C168 316 140 324 118 326"/>`,
    `<path class="stroke" stroke-width="${f ? 3 : 4.5}" d="M104 166 Q118 158 134 162"/>`,
    `<path class="eye" d="M110 182 Q120 175 129 182 Q120 187 110 182 Z"/><circle class="iris" cx="114" cy="181.5" r="3"/>`,
    `<path class="stroke" d="M88 228 Q94 231 99 226"/>`,
    `<path class="mouth" d="M99 251 C103 255 105 259 104 262 L113 263 Q108 254 99 251 Z"/><path class="mouth" d="M104 262 C100 266 97 270 98 274 Q108 272 113 263 Z"/>`,
  ].filter(Boolean).join("\n    ");
}

const profileZones = () => [
  zone("forehead", ellipse(134, 114, 26, 34)),
  zone("eyes", ellipse(128, 177, 22, 18)),
  zone("cheeks", ellipse(152, 232, 26, 24)),
  zone("nose", "M108 168L68 224L100 244L118 204Z"),
  zone("mouth", ellipse(106, 264, 13, 18)),
  zone("chin", ellipse(110, 306, 16, 18)),
  zoneLine("jawline", "M204 238 C208 266 204 290 192 300 C172 314 152 320 134 324"),
  zone("neck", ellipse(182, 364, 42, 38)),
];

// Crop of each view: only the face, so it appears large on screen.
const crop = { front: "70 40 180 360", profile: "60 40 230 360" };

for (const gender of ["female", "male"]) {
  for (const view of ["front", "profile"]) {
    const f = gender === "female";
    const art = view === "front" ? frontArt(f) : profileArt(f);
    const zones = (view === "front" ? frontZones() : profileZones()).join("\n    ");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${crop[view]}">
  <g class="art">
    ${art}
  </g>
  <g class="zones">
    ${zones}
  </g>
</svg>
`;
    writeFileSync(`${destination}${gender}-${view}.svg`, svg);
  }
}
console.log("4 illustrations generated in src/faces/");
