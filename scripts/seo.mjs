// Plugin do Vite que prepara o site para o Google: título, descrição, prévia de link (Open Graph),
// dados estruturados (schema.org), um texto já pronto no HTML, robots.txt e sitemap.xml.
// Tudo sai de src/data/conteudo.json (seções "profissional", "seo" e textos.geral).
import { readFileSync } from "node:fs";

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function ler() {
  const { profissional, seo, textos } = JSON.parse(readFileSync(new URL("../src/data/conteudo.json", import.meta.url), "utf8"));
  const url = seo.url.trim();
  const imagem = url && seo.imagem ? new URL(seo.imagem, url).href : "";
  return { profissional, seo, titulo: textos.geral.tituloPagina, marca: textos.geral.marca, url, imagem };
}

function dadosEstruturados({ profissional, seo, url, imagem }) {
  const telefone = `+${profissional.whatsapp}`;
  const cidades = seo.cidades.map(nome => ({
    "@type": "City",
    name: nome,
    containedInPlace: { "@type": "State", name: seo.estado, containedInPlace: { "@type": "Country", name: "BR" } },
  }));
  return {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: `Dra. ${profissional.nome} · ${profissional.especialidade}`,
    description: seo.descricao,
    ...(url && { url }),
    ...(imagem && { image: imagem }),
    telephone: telefone,
    medicalSpecialty: profissional.especialidade,
    areaServed: cidades,
    location: seo.cidades.map(nome => ({
      "@type": "Place",
      name: nome,
      address: { "@type": "PostalAddress", addressLocality: nome, addressRegion: seo.estado, addressCountry: "BR" },
    })),
    contactPoint: { "@type": "ContactPoint", telephone: telefone, contactType: "Agendamento", availableLanguage: "pt-BR" },
    employee: { "@type": "Person", name: profissional.nome, honorificPrefix: "Dra.", jobTitle: profissional.especialidade },
  };
}

export function seo() {
  return {
    name: "seo",

    transformIndexHtml(html) {
      const dados = ler();
      const { profissional, seo, titulo, marca, url, imagem } = dados;
      const meta = [
        `<meta name="description" content="${esc(seo.descricao)}" />`,
        `<meta name="keywords" content="${esc(seo.palavrasChave.join(", "))}" />`,
        `<meta name="robots" content="index, follow" />`,
        `<meta name="geo.region" content="BR-${esc(seo.estado)}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:locale" content="pt_BR" />`,
        `<meta property="og:site_name" content="${esc(titulo)}" />`,
        `<meta property="og:title" content="${esc(seo.conteudo.titulo)}" />`,
        `<meta property="og:description" content="${esc(seo.descricao)}" />`,
        url && `<link rel="canonical" href="${esc(url)}" />`,
        url && `<meta property="og:url" content="${esc(url)}" />`,
        imagem && `<meta property="og:image" content="${esc(imagem)}" />`,
        `<meta name="twitter:card" content="${imagem ? "summary_large_image" : "summary"}" />`,
        `<script type="application/ld+json">${JSON.stringify(dadosEstruturados(dados)).replace(/</g, "\\u003c")}</script>`,
      ].filter(Boolean).join("\n    ");

      // Texto que o Google lê sem rodar o JavaScript; a primeira tela substitui assim que o site carrega.
      const c = seo.conteudo;
      const estatico = `
      <div class="marca">${esc(marca)}</div>
      <h1 class="pergunta-grande">${esc(c.titulo)}</h1>
      ${c.paragrafos.map(p => `<p>${esc(p)}</p>`).join("\n      ")}
      <p><a href="https://wa.me/${esc(profissional.whatsapp)}">${esc(c.whatsapp.replace("{telefone}", profissional.whatsappExibicao))}</a></p>
    `;

      return html
        .replace(/<title>.*?<\/title>/, `<title>${esc(titulo)}</title>\n    ${meta}`)
        .replace(/(<div class="app" id="app">)(<\/div>)/, `$1${estatico}$2`);
    },

    generateBundle() {
      const { url } = ler();
      const linhas = ["User-agent: *", "Allow: /"];
      if (url) linhas.push("", `Sitemap: ${new URL("sitemap.xml", url).href}`);
      this.emitFile({ type: "asset", fileName: "robots.txt", source: linhas.join("\n") + "\n" });
      if (!url) return;
      const hoje = new Date().toISOString().slice(0, 10);
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${esc(url)}</loc><lastmod>${hoje}</lastmod></url>
</urlset>
`,
      });
    },
  };
}
