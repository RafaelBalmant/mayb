// As 4 ilustrações vêm de scripts/gerar-rostos.mjs.
// Cada área tocável é um <path class="zona" data-area="codigo">.
import femininoFrente from "./feminino-frente.svg?raw";
import femininoPerfil from "./feminino-perfil.svg?raw";
import masculinoFrente from "./masculino-frente.svg?raw";
import masculinoPerfil from "./masculino-perfil.svg?raw";

const svgs = {
  feminino: { frente: femininoFrente, perfil: femininoPerfil },
  masculino: { frente: masculinoFrente, perfil: masculinoPerfil },
};

/** Devolve o SVG do rosto como texto, pronto para innerHTML. */
export function svgRosto(rosto, vista) {
  return svgs[rosto][vista];
}
