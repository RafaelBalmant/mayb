# Site de Mayara Bacellar · harmonização facial

Site estático (Next.js, App Router, exportado como HTML) da Dra. Mayara Bacellar. A página inicial mostra a doutora, a **agenda** de atendimento
(Maringá e Siqueira Campos, com "Agendar horário" pelo WhatsApp) e o contato. O **mapa do rosto**, em que o paciente
marca o que o incomoda, vê fotos de casos reais, responde algumas perguntas e envia o resumo pelo WhatsApp, está pronto,
mas desligado para os visitantes (veja "Links diretos").
Nada é salvo em servidor: as respostas ficam no navegador até o paciente enviar.

## Rodar

```sh
npm install
npm run dev          # servidor local do Next (abre no celular pela rede)
npm run build        # gera out/ (HTML estático) e grava a CSP de cada página (scripts/postbuild.mjs)
npm run preview      # serve out/ como o nginx do container (mesmos cabeçalhos, gzip e 404)
npm run lint         # ESLint
npm run format       # Prettier (format:check só confere)
npm test             # testes unitários e de telas renderizadas (Vitest, sem navegador)
npm run test:e2e     # fluxo completo no navegador (Playwright; E2E_BASE_URL aponta para um site já no ar)
npm run faces        # regera os SVGs do rosto
```

## Convenção de idioma

- **Código em inglês**: arquivos, pastas, funções, variáveis, classes CSS, chaves do JSON, comentários e commits.
- **Conteúdo do site em português**: só os _valores_ de texto em `src/data/content.json` (o que o paciente lê).

## Como editar sem mexer no código

| Quero mudar…                                                  | Edite                                                                   |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Qualquer texto, título, botão, aviso ou o formato da mensagem | `src/data/content.json` → `texts`                                       |
| Áreas do rosto, suas opções de "o que incomoda" e o WhatsApp  | `src/data/content.json` → `areas`, `professional`                       |
| Rótulos das respostas (lado, desde quando…)                   | `src/data/content.json` → `labels`                                      |
| As perguntas de cada área (ordem, tipo, quais áreas mostram)  | `src/data/questions.json`                                               |
| Em que etapa cada tela fica na barra de progresso             | `src/data/flow.json`                                                    |
| Cores e fontes                                                | `src/styles/theme.css` (fontes: `src/styles/fonts.js`, via `next/font`) |
| Tempos, limites, escala de 1 a 5                              | `src/config.js`                                                         |
| Título e descrição de cada página no Google                   | `src/data/content.json` → `seo.routes`                                  |

`{n}`, `{area}` etc. nos textos são trocados pelo valor certo. `npm test` confere que toda chave de texto usada no
código existe no JSON, que os ids são únicos e que as perguntas apontam para campos e rótulos que existem.

## Estrutura

```
src/
  app/                  rotas do Next (App Router): layout, /, /agenda/, /casos/, /mapa/, /[slug]/ (páginas de
                        serviço), 404, sitemap.js e robots.js
  screens/              uma tela por arquivo; FaceFlow.jsx troca as telas do mapa do rosto dentro de /mapa/
  components/           Layout, Topbar, Face (SVG), OtherModal, perguntas por tipo, provedores do lado do navegador…
  navigation/           endereços das páginas (routes.js), ponte para o roteador do Next, goTo
  store/                reducer puro, StoreProvider (Context + useReducer), storage (sessionStorage)
  domain/               regras sem DOM: perguntas, fluxo, resumo/mensagem do WhatsApp, áreas, agenda, casos
  lib/seo/              metadata, dados estruturados (JSON-LD) e endereços absolutos
  lib/server/           leituras feitas só no build (fotos dos casos, nota do Google, desenhos do rosto)
  faces/                as 4 ilustrações (female/male, front/profile) e o leitor delas
  styles/               theme.css (cores e fontes), style.css, fonts.js
  data/                 content.json, questions.json, flow.json, cases.json, agenda.json
public/                 foto, ícones, fotos dos casos (cases/, case-examples/)
scripts/                postbuild.mjs (CSP), serve-static.mjs (preview/E2E), reviews, imagens, rostos
tests/                  Vitest: reducer, storage, fluxo, perguntas, mensagem, telas, SEO, consistência do JSON
e2e/                    Playwright: o fluxo completo (desktop e celular), endereços e HTML sem JavaScript
```

- **Server Components por padrão**: o HTML de cada página sai pronto no build. Só levam `"use client"` as partes
  que precisam do navegador (estado do mapa, agenda com a data de hoje, carrossel, aviso de cookies, Analytics).
- Para **adicionar uma tela do mapa**: crie o componente, registre em `screens/index.js` e em `data/flow.json`.
- Para **adicionar um tipo de pergunta**: um componente em `components/questions.jsx` e uma entrada em `QUESTION_COMPONENTS`.
- `src/store/legacy-storage.js` converte respostas salvas pela versão antiga (nomes em português) para o formato atual.
- `src/faces/*.svg`: cada área tocável é um `<path class="zone" data-area="code">`. Gere de novo com `npm run faces`
  depois de mexer em `scripts/generate-faces.mjs`, ou troque por SVGs de um ilustrador mantendo o mesmo `data-area`.

### Como cada página é gerada

Todas são **estáticas (SSG)**, geradas no `npm run build` (`output: "export"` em `next.config.mjs`). Não há SSR nem
ISR: nada muda por visitante, e a imagem Docker é refeita todo dia (nota do Google atualizada).

| Endereço       | Conteúdo                                                  | No Google                     |
| -------------- | --------------------------------------------------------- | ----------------------------- |
| `/`            | início, avaliações, contato                               | indexada                      |
| `/agenda/`     | calendário (o "hoje" é recalculado no navegador)          | indexada                      |
| `/casos/`      | casos reais (segue o interruptor do mapa)                 | indexada só com o mapa ligado |
| `/mapa/`       | mapa do rosto (o fluxo todo, no navegador)                | `noindex` (é um formulário)   |
| `/<slug>/`     | páginas de serviço e cidade (`pages.list`, vazia por ora) | indexadas                     |
| qualquer outro | `404.html` com status 404                                 | —                             |

## Links diretos e mapa do rosto

O site institucional pode abrir direto numa parte: `…/agenda/`, `…/mapa/` (começo do mapa do rosto) ou `…/casos/`.
Os endereços antigos `…/#agenda`, `…/#mapa` e `…/#casos` continuam funcionando: a página inicial leva para o novo.
Por enquanto o mapa do rosto está desligado (`MAP_ENABLED = false` em `src/config.js`): a página inicial mostra só a
agenda e o contato, e `/mapa/` e `/casos/` voltam para o início. Para testar o mapa sem ligar para todos, abra o site
com `?mapa=1` no endereço (ex.: `…/?mapa=1`). Vale até fechar a aba; `?mapa=0` desliga. Os nomes `agenda`, `mapa`,
`casos` e `?mapa=` são públicos e por isso ficam em português.

## Google Analytics (visitas e cliques)

O site manda as visitas e os cliques para o Google Analytics 4, **só depois que o visitante aceita** o aviso de
cookies (textos em `content.json` → `texts.cookies`; a escolha fica no navegador e pode ser revista pelo link
"Privacidade e cookies" no fim da página inicial). Nada que o paciente escreve ou marca no rosto vai para o Google.

- **ID da métrica**: variável `GA_MEASUREMENT_ID` do repositório no GitHub (Settings → Secrets and variables →
  Actions → aba _Variables_), passada ao build como `NEXT_PUBLIC_GA_MEASUREMENT_ID`. Sem ela, não há aviso nem Analytics
  (é o caso de `npm run dev` e dos testes unitários; o E2E de analytics sobe um servidor próprio com um ID de teste).
  Para testar local, preencha em `.env` (veja `.env.example`).
- **Código**: `src/analytics/` (aviso e consentimento, tracker, GA4, cliques, leads, cidade, `?interno`/`?debug`).
- **Modo de consentimento v2**: desligado (`CONSENT_MODE = false` em `src/config.js`). Ligado, o Google carrega em
  toda visita com tudo negado (conta a visita sem cookies) e o "OK" libera `analytics_storage`; o aviso passa a usar
  `texts.cookies.textConsentMode`. Só ligar depois que a clínica aprovar.

### Eventos do Analytics

**Páginas**: cada tela vira um `page_view` com o mesmo nome de antes da troca para Next.js (`/`, `/agenda`,
`/cases`, `/map`…), para os relatórios continuarem comparáveis; as páginas de serviço vão com o próprio endereço. Os `utm_*`
do endereço são mantidos.

**Cliques**: qualquer botão ou link com `data-track="nome_do_evento"` manda esse evento; cada
`data-track-<param>="valor"` vai junto como parâmetro (ex.: `data-track-city="maringa"` → `city`).

| Evento                | Botão                                          | Parâmetros |
| --------------------- | ---------------------------------------------- | ---------- |
| `agenda_open`         | Verificar agenda (início e casos reais)        |            |
| `booking_open`        | Agendar horário (na agenda)                    |            |
| `whatsapp_booking`    | Enviar o pedido de horário pelo WhatsApp       | `city`     |
| `whatsapp_contact`    | Entrar em contato                              |            |
| `whatsapp_summary`    | Enviar o resumo do mapa do rosto pelo WhatsApp |            |
| `google_review_open`  | Compartilhe sua experiência                    |            |
| `google_reviews_open` | Ver todas as avaliações                        |            |
| `cases_open`          | Ver resultados reais                           |            |
| `map_open`            | Me conta o que te incomoda no rosto            |            |
| `instagram_open`      | Ícone do Instagram                             |            |

**Lead**: cada `whatsapp_*` também manda `generate_lead` (evento recomendado do GA4) com `method: "whatsapp"`,
`lead_type` (`contact`, `booking` ou `summary`) e os parâmetros do próprio clique, como `city` quando há cidade
(`maringa` ou `siqueira_campos`). No GA,
só `generate_lead` é evento principal, para não contar o mesmo contato duas vezes.

**Propriedade de usuário**: ao escolher a cidade no pedido de horário, o site grava `preferred_city` (`maringa` ou
`siqueira_campos`) e guarda a escolha no navegador (`site-mayara:city`) para mandar de novo nas próximas visitas.
A cidade que o GA calcula pelo IP é imprecisa (o 4G de Siqueira Campos aparece como Londrina ou Curitiba).

**Tráfego interno e testes** (os parâmetros saem do endereço logo depois de lidos):

- `?interno=1` marca este navegador como da equipe (`site-mayara:internal`): o GA recebe `traffic_type: internal`
  e o filtro de dados exclui essas visitas. `?interno=0` desmarca. Abra uma vez em cada celular/computador da equipe.
- `?debug=1` manda a visita para o DebugView do GA (Administrador → DebugView), só naquela página.

## Casos reais (antes e depois)

Cada caso tem uma pasta em `public/cases/<pasta>/` com `antes.jpg` e `depois.jpg` (outros ângulos: `antes-2.jpg` e
`depois-2.jpg`…; vale também .png ou .webp; formato do Stories do Instagram, 9:16, 1080 × 1920 px) e, se quiser, um áudio da Dra. explicando o caso (`audio.mp3`). Os dados
de cada caso ficam na lista `cases` de `src/data/cases.json`: pasta, título, partes do rosto e, opcionais,
procedimentos, tempo depois, descrição, áudio, texto do áudio e `visible`. As instruções estão no próprio arquivo.
O site acha as fotos sozinho no build, e o teste avisa se faltar uma foto ou o áudio.

Os casos aparecem na página "Ver resultados reais" (botão na página inicial, ou `…/casos/`) e na etapa de
resultados do mapa do rosto. A página segue o mesmo interruptor do mapa (`?mapa=1`).

## Avaliações do Google

A página inicial mostra a nota e avaliações do perfil da Dra. Mayara no Google num carrossel
(`src/components/GoogleReviews.jsx`). O site **não consulta o Google**: tudo é estático.

- **As avaliações** ficam em `content.json` → `googleReviews.reviews` (nome, estrelas e texto, copiados do perfil). O
  Google só entrega 5 pela API, por isso a lista é mantida à mão: para incluir uma nova, acrescente na lista.
  `minStars`, `minWords` (hoje 6) e `hideIfMentions` (hoje `sobrancelha`, já que o foco é harmonização facial)
  escondem as que não devem aparecer. Das que sobram, entram as mais longas primeiro (até 15, em 3 grupos de 5).
- **A nota média e o total** vêm do Google no build: `npm run reviews` (`scripts/fetch-reviews.mjs`, fonte em
  `scripts/reviews/google-places.mjs`) grava `src/data/google-rating.generated.json` (fora do git). Sem ele, as
  avaliações aparecem sem a nota.
- O `Dockerfile` roda `npm run reviews` antes do build, e o `docker.yml` gera a imagem a cada push na `main` e
  **uma vez por dia** (dá para rodar na mão em Actions → Docker CI → Run workflow).
- **Chave de API**: `GOOGLE_MAPS_KEY`, secret do repositório no GitHub (localmente, no `.env`; veja `.env.example`).
  Ela só é usada no build e nunca vai para o site. Entra no Docker como _secret_ (`--mount=type=secret`), não como
  `ARG`, para não ficar gravada na imagem nem no registro do build que o GitHub guarda. Para gerar a imagem na sua
  máquina com a nota: `docker build --secret id=google_maps_key,env=GOOGLE_MAPS_KEY .`
- **Place ID**: `content.json` → `googleReviews.placeId` (não é segredo).
- Cada visita mostra um grupo diferente (até `REVIEWS_MAX_GROUPS` grupos de `REVIEWS_GROUP_SIZE` avaliações, em
  `src/config.js`); recarregar a página na mesma visita mantém o grupo.

## Google (SEO)

Tudo sai pronto no `npm run build`, a partir do `content.json`, pela Metadata API do Next (`src/lib/seo/`).
Nada disso roda no navegador do visitante. Ter metadata não garante indexação: isso depende do Google (veja o fim
desta seção).

- **Título, descrição e prévia do link** de cada página: `seo.routes` (início, agenda, casos, mapa) e cada item de
  `pages.list`. Cada página indexável tem link canônico próprio, Open Graph e cartão do X (imagem `public/share.jpg`,
  1200×630). `/mapa/` e a 404 levam `noindex`.
- **HTML completo sem JavaScript**: o início (nome, CRBM, avaliações, contato), a agenda e as páginas de serviço chegam
  com o texto no HTML. O teste E2E "HTML for search engines" confere isso com o JavaScript desligado.
- **Páginas de serviço e cidade** (`pages.list`, **vazia por enquanto**: o conteúdo vai ser alimentado depois). Cada
  item vira `out/<slug>/index.html` (ex.: `/toxina-botulinica-maringa/`) com H1 com o serviço e a cidade, perguntas
  frequentes (também como FAQPage), endereço, "Como chegar", WhatsApp e links para as outras páginas. O formato de cada
  item está em `pages._howToEdit`. Cada página nova entra nos links e no sitemap sozinha. Os testes conferem o HTML com
  páginas de exemplo e, nos textos reais, de 400 a 700 palavras e algumas palavras proibidas pelas regras de
  publicidade em saúde (resultado garantido, superlativos, antes e depois).
- **Dados estruturados** (schema.org, `src/lib/seo/structured-data.js`): a Dra. Mayara (`Person`, biomédica esteta,
  CRBM 7137), uma `HealthAndBeautyBusiness` por unidade (`business.locations`), com o mesmo nome do Perfil da Empresa
  no Google, endereço, coordenadas, horário e o link do perfil, mais `WebSite`, `BreadcrumbList` nas páginas internas e
  `FAQPage` nas de serviço. Não há nota nem avaliações: o Google não mostra avaliações que a empresa publica sobre si
  mesma. Dá para conferir no [Teste de pesquisa aprimorada](https://search.google.com/test/rich-results).
- **robots.txt e sitemap.xml**: `src/app/robots.js` e `src/app/sitemap.js`. O sitemap lista o início, a agenda, os
  casos (só com o mapa ligado) e as páginas de serviço.
- **404 de verdade**: o nginx do container só responde o que o build escreveu. Qualquer outro endereço recebe
  `404.html` com status 404. O Traefik, na frente, só repassa a resposta. (No `npm run dev` um endereço desconhecido
  mostra um erro do Next em vez da 404: é limitação do modo de desenvolvimento com `output: "export"`.)
- **Endereço oficial**: `seo.url` (`https://dramayarabacellar.com/`). O `nginx.conf` manda `mayarabacellar.com` e o
  `www` para ele com 301 (isso só vale se o Traefik mandar esses domínios para este container).
- **Foto do início**: `npm run images` (`scripts/generate-images.mjs`, com `sharp`) gera as cópias leves em AVIF e WebP
  (`public/profile/photo-600.avif` …) e a `public/share.jpg`. A tela inicial usa `<picture>` com `srcset`,
  `width`/`height` (sem pulo de layout) e `fetchpriority="high"`. Não usamos `next/image`: num site exportado ele não
  otimiza imagens, e as cópias já são geradas pelo script.
- **Fontes**: `next/font` baixa Playfair Display e Jost no build e serve do próprio site (o build precisa de internet
  para chegar ao Google Fonts). Só a Jost é pré-carregada, para não competir com a foto.

Lighthouse (celular, build local com gzip, mediana de 3, 03/11/2026):

| Página     | Desempenho | Acessibilidade | Boas práticas | SEO | FCP   | LCP       | TBT       | JS (gzip) |
| ---------- | ---------- | -------------- | ------------- | --- | ----- | --------- | --------- | --------- |
| `/` antes  | 99         | 100            | 100           | 100 | 1,5 s | 2,0 s     | 0–50 ms   | 38 KB     |
| `/` agora  | 94         | 100            | 100           | 100 | 1,4 s | 3,1 s     | 80–100 ms | 176 KB    |
| `/agenda/` | 93–97      | 89             | 100           | 100 | —     | 2,6–3,1 s | —         | —         |

A troca do Preact pelo React (exigido pelo Next) e o runtime do Next somam ~140 KB de JS, que no teste com rede lenta
simulada atrasam a foto. A acessibilidade 89 da agenda vem da grade do calendário (`role="grid"` sem linhas), que já
existia antes.

Fora do código: verificar o site no [Google Search Console](https://search.google.com/search-console), enviar
`https://dramayarabacellar.com/sitemap.xml`, vincular o Search Console ao GA4, pedir a indexação de cada página de
serviço e usar essas páginas (com UTM) nos links das postagens do Perfil da Empresa no Google.

## Entrega

`Dockerfile`: build com Node 22 (`next build` gera `out/`), servido por nginx. Recebe o ID do Analytics como
`ARG NEXT_PUBLIC_GA_MEASUREMENT_ID` (o `docker.yml` passa a mesma variável `GA_MEASUREMENT_ID` do repositório) e a chave
do Google como _secret_. `nginx.conf`: gzip, cache de um ano para `/_next/static/` (têm hash no nome), cache de um dia
para as fotos, HTML sempre revalidado e `Content-Security-Policy`. Como o Next coloca scripts no próprio HTML, cada
página leva também uma CSP em `<meta>` com o hash exato de cada um desses scripts (`scripts/postbuild.mjs`); o
navegador aplica as duas, então só roda script do próprio site, do Google Analytics ou com hash conhecido. A cada push
na `main`, o workflow `.github/workflows/docker.yml` publica a imagem no Docker Hub; `ci.yml` roda lint, formatação,
testes e o E2E nos PRs. Nada muda no Traefik nem no Cloudflare.

## Ícone do site

O ícone da aba do navegador e do resultado do Google é um recorte quadrado do rosto em `public/profile/photo.jpg`:
`public/favicon.ico` (16, 32 e 48 px), `public/favicon-48.png`, `favicon-96.png`, `favicon-192.png` e
`public/apple-touch-icon.png` (180 px, atalho no iPhone). Se a foto mudar, gere os arquivos de novo com os mesmos nomes.

## Situação

Prontas: início, agenda, e o fluxo do mapa do rosto (escolher o rosto, marcar, ver resultados, contar mais, revisar e enviar
pelo WhatsApp, com aviso de privacidade). Faltam: sobre você (por enquanto só o nome, pedido na revisão), objetivo, saúde e FAQ.
