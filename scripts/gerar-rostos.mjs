// Gera as 4 ilustrações em src/rostos/*.svg.
// Cada área tocável é UM <path class="zona" data-area="codigo">; áreas dos dois lados
// do rosto (ex.: olhos) usam um path com dois subpaths.
// As zonas são recortadas (clipPath) pelo contorno da pele, então sempre "encaixam" no rosto:
// a borda de cada zona que encosta no contorno segue o desenho, sem sobrar para fora.
// Rodar: npm run rostos   (só é preciso ao mexer nos desenhos ou nas zonas)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const destino = fileURLToPath(new URL("../src/rostos/", import.meta.url));
const n = v => +v.toFixed(2);

// Elipse (com rotação opcional, em graus) como subpath.
function elipse(cx, cy, rx, ry, rot = 0) {
  const t = (rot * Math.PI) / 180, dx = rx * Math.cos(t), dy = rx * Math.sin(t);
  const [x1, y1, x2, y2] = [cx - dx, cy - dy, cx + dx, cy + dy].map(n);
  return `M${x1} ${y1}A${rx} ${ry} ${rot} 1 0 ${x2} ${y2}A${rx} ${ry} ${rot} 1 0 ${x1} ${y1}Z`;
}
// Espelha um path no eixo central do rosto de frente (x = 150). Só aceita comandos absolutos M/L/C/Q/Z.
const espelhar = d => d.replace(/(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)/g, (_, x, y) => `${n(300 - x)} ${y}`);
const par = (cx, cy, rx, ry, rot = 0) => elipse(cx, cy, rx, ry, rot) + elipse(300 - cx, cy, rx, ry, -rot);
const dois = d => d + " " + espelhar(d);

const zona = (codigo, d) => `<path class="zona" data-area="${codigo}" d="${d}"/>`;
const zonaLinha = (codigo, d) => `<path class="zona zona-linha" data-area="${codigo}" d="${d}"/>`;

/* ---------- Frente (eixo central em x = 150) ---------- */
function frente(f) {
  // Proporção real: largura ≈ 2/3 da altura da cabeça; olhos na metade; nariz e boca nos terços de baixo.
  const rosto = f
    ? "M150 54 C201 54 231 88 232 140 C233 180 227 212 213 238 C199 264 176 288 150 291 C124 288 101 264 87 238 C73 212 67 180 68 140 C69 88 99 54 150 54 Z"
    : "M150 52 C204 52 236 88 237 140 C238 184 235 220 226 246 C214 274 184 293 150 295 C116 293 86 274 74 246 C65 220 62 184 63 140 C64 88 96 52 150 52 Z";
  const pescoco = f
    ? "M122 250 L121 318 C119 336 104 346 72 356 C52 362 40 372 34 390 L266 390 C260 372 248 362 228 356 C196 346 181 336 179 318 L178 250 Z"
    : "M112 250 L112 316 C110 334 94 344 62 354 C42 360 30 372 24 390 L276 390 C270 372 258 360 238 354 C206 344 190 334 188 316 L188 250 Z";
  const orelha = f
    ? "M72 150 C58 142 50 154 53 172 C56 190 63 204 77 206"
    : "M67 150 C52 141 44 154 47 173 C50 192 58 206 72 208";
  const sobrancelha = f ? "M96 139 Q114 128 136 136" : "M94 140 Q114 132 137 138";
  const olho = "M98 162 Q115 150 132 162 Q115 171 98 162 Z";
  const boca = f
    ? `<path class="boca" d="M125 247 Q137 238 150 243 Q163 238 175 247 Q150 251 125 247 Z"/><path class="boca" d="M125 247 Q150 265 175 247 Q150 251 125 247 Z"/>`
    : `<path class="boca" d="M128 250 Q139 244 150 247 Q161 244 172 250 Q150 252 128 250 Z"/><path class="boca" d="M128 250 Q150 260 172 250 Q150 252 128 250 Z"/>`;
  const arte = [
    // cabelo de trás (longo, no feminino)
    f && `<path class="cabelo" d="M150 36 C86 36 52 88 54 160 C56 228 48 286 34 338 C60 352 92 352 116 340 C110 300 104 270 92 240 L208 240 C196 270 190 300 184 340 C208 352 240 352 266 338 C252 286 244 228 246 160 C248 88 214 36 150 36 Z"/>`,
    `<path class="pele" d="${pescoco}"/>`,
    `<path class="pele" d="${orelha} Z"/>`,
    `<path class="pele" d="${espelhar(orelha)} Z"/>`,
    `<path class="pele" d="${rosto}"/>`,
    `<path class="traco leve" d="${f ? "M66 172 C62 166 60 160 63 156" : "M60 172 C56 166 54 160 57 156"}"/>`,
    `<path class="traco leve" d="${espelhar(f ? "M66 172 C62 166 60 160 63 156" : "M60 172 C56 166 54 160 57 156")}"/>`,
    // cabelo da frente
    f
      ? `<path class="cabelo" d="M150 50 C100 48 70 82 66 138 C64 160 66 178 70 192 C72 150 86 112 118 92 C140 80 176 78 204 92 C220 102 230 118 234 140 C236 86 204 50 150 50 Z"/>`
      : `<path class="cabelo" d="M63 146 C58 84 96 38 150 38 C204 38 242 84 237 146 C232 118 226 104 214 96 C196 86 170 90 150 86 C128 90 104 86 86 96 C74 104 68 118 63 146 Z"/>`,
  ];
  // traços do rosto: ficam por cima das zonas (sem receber toque), para continuarem visíveis quando a zona é marcada
  const detalhes = [
    `<path class="traco" stroke-width="${f ? 3 : 5}" d="${sobrancelha}"/>`,
    `<path class="traco" stroke-width="${f ? 3 : 5}" d="${espelhar(sobrancelha)}"/>`,
    `<path class="olho" d="${olho}"/><circle class="iris" cx="115" cy="161" r="5"/>`,
    `<path class="olho" d="${espelhar(olho)}"/><circle class="iris" cx="185" cy="161" r="5"/>`,
    f && `<path class="traco" stroke-width="1.6" d="M98 162 L93 157 M132 162 L136 158 M168 162 L164 158 M202 162 L207 157"/>`,
    `<path class="traco leve" d="M143 168 C142 186 139 198 137 206"/>`,
    `<path class="traco" d="M136 211 Q131 220 141 221 Q146 225 150 223 Q154 225 159 221 Q169 220 164 211"/>`,
    boca,
    `<path class="traco leve" d="${f ? "M140 276 Q150 280 160 276" : "M136 280 Q150 285 164 280"}"/>`,
  ];
  const zonas = [
    zona("testa", f
      ? "M82 136 C88 114 104 100 122 95 C148 88 180 88 204 97 C218 104 226 118 229 136 C200 125 176 125 150 129 C124 125 100 125 82 136 Z"
      : "M70 136 C74 114 82 102 92 97 C120 88 180 88 208 97 C218 102 226 114 230 136 C200 125 176 125 150 129 C124 125 100 125 70 136 Z"),
    zona("olhos", par(115, 163, 27, 18)),
    zona("nariz", "M150 150 C157 150 159 170 162 188 C164 198 172 206 171 214 C170 226 130 226 129 214 C128 206 136 198 138 188 C141 170 143 150 150 150 Z"),
    zona("bochechas", dois(f
      ? "M70 186 C82 184 116 184 127 196 C134 206 128 228 116 236 C100 244 84 236 70 222 Z"
      : "M64 186 C80 184 116 184 127 196 C134 206 128 228 116 236 C100 246 80 238 64 224 Z")),
    zona("boca", elipse(150, 249, 33, f ? 18 : 15)),
    zona("queixo", elipse(150, f ? 284 : 288, f ? 28 : 34, 15)),
    zonaLinha("mandibula", dois(f ? "M75 220 C84 244 100 264 122 280" : "M68 226 C76 252 96 272 118 284")),
    zona("pescoco", f ? "M122 296 L178 296 L179 340 C160 348 140 348 121 340 Z" : "M112 300 L188 300 L188 338 C164 348 136 348 112 338 Z"),
  ];
  return { arte, detalhes, zonas, contorno: rosto + " " + pescoco, recorte: "28 30 244 334" };
}

/* ---------- Perfil (olhando para a esquerda) ---------- */
function perfil(f) {
  const cabeca = [
    "M165 46",
    "C128 46 104 68 100 102",          // testa
    f ? "C98 120 98 132 97 142" : "C98 118 96 132 94 142", // sobrancelha
    "C97 148 101 152 100 158",         // raiz do nariz
    f ? "C93 174 82 189 74 199" : "C92 174 79 190 70 201", // dorso do nariz
    f ? "C70 205 73 211 81 212" : "C66 207 70 213 79 214", // ponta
    "C87 213 92 213 96 216",           // columela
    "C94 222 90 226 91 231",           // lábio de cima
    "C93 235 97 237 99 238",           // canto da boca
    "C96 241 92 244 93 249",           // lábio de baixo
    "C94 254 100 256 102 260",         // dobra do queixo
    f ? "C98 266 96 274 97 281" : "C97 266 93 276 94 284", // queixo
    f ? "C99 290 108 295 120 296" : "C95 293 106 298 122 298", // embaixo do queixo
    "C138 297 152 300 158 308",        // até o pescoço
    "C162 330 164 360 164 390",        // frente do pescoço
    "L244 390",
    "C238 350 236 322 240 300",        // nuca
    "C246 272 258 240 260 200",
    "C262 120 232 48 165 46 Z",
  ].join(" ");
  const orelha = "M196 168 C196 152 214 150 218 168 C222 186 216 210 204 214 C198 216 196 208 196 200 Z";
  const arte = [
    f && `<path class="cabelo" d="M190 52 C252 58 278 120 276 200 C274 262 282 326 292 370 C270 382 246 382 230 372 C234 330 240 296 246 262 Z"/>`,
    `<path class="pele" d="${cabeca}"/>`,
    f
      ? `<path class="cabelo" d="M106 78 C118 50 150 38 186 42 C236 48 266 100 262 172 C260 210 254 236 246 256 C236 230 228 200 224 178 C220 160 210 148 198 148 C190 148 186 140 182 126 C172 104 150 90 130 84 C120 81 112 79 106 78 Z"/>`
      : `<path class="cabelo" d="M104 82 C112 54 146 40 186 42 C234 46 264 96 260 170 C258 204 254 230 248 246 C240 226 232 196 226 178 C220 160 210 148 198 148 C190 148 186 140 182 126 C170 104 140 88 104 82 Z"/>`,
    `<path class="pele" d="${orelha}"/>`,
    `<path class="traco leve" d="M204 176 C210 172 214 182 210 194 C208 200 204 200 204 196"/>`,
    `<path class="traco leve" d="M202 232 C206 254 200 270 184 280 C166 290 142 296 124 296"/>`,
  ];
  const detalhes = [
    `<path class="traco" stroke-width="${f ? 3 : 4.5}" d="M101 142 Q114 136 130 139"/>`,
    `<path class="olho" d="M104 160 Q113 153 122 159 Q114 165 104 160 Z"/><circle class="iris" cx="107" cy="159.5" r="2.8"/>`,
    f && `<path class="traco" stroke-width="1.6" d="M104 160 L99 156"/>`,
    `<path class="traco" d="M84 207 Q90 210 95 206"/>`,
    `<path class="boca" d="M95 224 C91 227 90 229 91 231 C93 235 97 237 99 238 C100 233 99 228 95 224 Z"/><path class="boca" d="M99 238 C96 241 92 244 93 249 C95 252 99 252 101 249 C102 245 101 241 99 238 Z"/>`,
  ];
  const zonas = [
    zona("testa", elipse(124, 116, 28, 24)),
    zona("olhos", elipse(116, 161, 20, 14)),
    zona("nariz", "M104 146 L58 200 L80 224 L100 218 L106 168 Z"),
    zona("bochechas", elipse(148, 200, 30, 26)),
    zona("boca", elipse(98, 237, 16, 17)),
    zona("queixo", elipse(106, 280, 20, 18)),
    zonaLinha("mandibula", "M202 232 C206 254 200 270 184 280 C166 290 146 294 130 295"),
    zona("pescoco", elipse(202, 340, 38, 32)),
  ];
  return { arte, detalhes, zonas, contorno: cabeca, recorte: "44 30 252 334" };
}

for (const sexo of ["feminino", "masculino"]) {
  for (const vista of ["frente", "perfil"]) {
    const f = sexo === "feminino";
    const { arte, detalhes, zonas, contorno, recorte } = vista === "frente" ? frente(f) : perfil(f);
    const id = `pele-${sexo}-${vista}`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${recorte}">
  <defs><clipPath id="${id}"><path d="${contorno}"/></clipPath></defs>
  <g class="arte">
    ${arte.filter(Boolean).join("\n    ")}
  </g>
  <g class="zonas" clip-path="url(#${id})">
    ${zonas.join("\n    ")}
  </g>
  <g class="arte detalhes">
    ${detalhes.filter(Boolean).join("\n    ")}
  </g>
</svg>
`;
    writeFileSync(`${destino}${sexo}-${vista}.svg`, svg);
  }
}
console.log("4 ilustrações geradas em src/rostos/");
