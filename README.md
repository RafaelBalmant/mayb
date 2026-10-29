# Site de Mayara Bacellar · harmonização facial

Site estático (Vite + Preact) da Dra. Mayara Bacellar. A página inicial mostra a doutora, a **agenda** de atendimento
(Maringá e Siqueira Campos, com "Agendar horário" pelo WhatsApp) e o contato. O **mapa do rosto**, em que o paciente
marca o que o incomoda, vê fotos de casos reais, responde algumas perguntas e envia o resumo pelo WhatsApp, está pronto,
mas desligado para os visitantes (veja "Links diretos").
Nada é salvo em servidor: as respostas ficam no navegador até o paciente enviar.

## Rodar

```sh
npm install
npm run dev          # servidor local (abre no celular pela rede com --host)
npm run build        # gera dist/ para qualquer hospedagem estática
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

| Quero mudar…                                                  | Edite                                                                      |
| ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Qualquer texto, título, botão, aviso ou o formato da mensagem | `src/data/content.json` → `texts`                                          |
| Áreas do rosto, suas opções de "o que incomoda" e o WhatsApp  | `src/data/content.json` → `areas`, `professional`                          |
| Rótulos das respostas (lado, desde quando…)                   | `src/data/content.json` → `labels`                                         |
| As perguntas de cada área (ordem, tipo, quais áreas mostram)  | `src/data/questions.json`                                                  |
| Em que etapa cada tela fica na barra de progresso             | `src/data/flow.json`                                                       |
| Cores e fontes                                                | `src/theme.css` (fontes: pacotes `@fontsource/*` importados no `main.jsx`) |
| Tempos, limites, escala de 1 a 5                              | `src/config.js`                                                            |

`{n}`, `{area}` etc. nos textos são trocados pelo valor certo. `npm test` confere que toda chave de texto usada no
código existe no JSON, que os ids são únicos e que as perguntas apontam para campos e rótulos que existem.

## Estrutura

```
src/
  main.jsx, App.jsx     entrada e escolha da tela (resolveScreen)
  screens/              uma tela por arquivo; index.js liga o id de data/flow.json ao componente
  components/           Layout, Topbar, Face (SVG), OtherModal, perguntas por tipo…
  store/                reducer puro, StoreProvider (Context + useReducer), storage (sessionStorage)
  domain/               regras sem DOM: perguntas, fluxo, resumo/mensagem do WhatsApp, áreas
  faces/                as 4 ilustrações (female/male, front/profile) e o leitor delas
  data/                 content.json, questions.json, flow.json
tests/                  Vitest: reducer, storage, fluxo, perguntas, mensagem, telas, consistência do JSON
e2e/                    Playwright: o fluxo completo (desktop e celular)
```

- Para **adicionar uma tela**: crie o componente, registre em `screens/index.js` e em `data/flow.json`.
- Para **adicionar um tipo de pergunta**: um componente em `components/questions.jsx` e uma entrada em `QUESTION_COMPONENTS`.
- `src/domain/`: também `agenda.js` (meses e dias de atendimento), `cases.js` (casos reais) e `features.js`
  (mapa ligado/desligado e links diretos), todos sem DOM e testados.
- `src/store/legacy-storage.js` converte respostas salvas pela versão antiga (nomes em português) para o formato atual.
- `src/faces/*.svg`: cada área tocável é um `<path class="zone" data-area="code">`. Gere de novo com `npm run faces`
  depois de mexer em `scripts/generate-faces.mjs`, ou troque por SVGs de um ilustrador mantendo o mesmo `data-area`.

## Links diretos e mapa do rosto

O site institucional pode abrir direto numa parte: `…/#agenda` (agenda), `…/#mapa` (começo do mapa do rosto) ou
`…/#casos` (casos reais).
Por enquanto o mapa do rosto está desligado (`MAP_ENABLED = false` em `src/config.js`): a página inicial mostra só a
agenda e o contato. Para testar o mapa sem ligar para todos, abra o site com `?mapa=1` no endereço (ex.: `…/?mapa=1`).
Vale até fechar a aba; `?mapa=0` desliga. Os nomes `#agenda`, `#mapa` e `?mapa=` são públicos e por isso ficam em português.

## Google Analytics (visitas e cliques)

O site manda as visitas e os cliques para o Google Analytics 4, **só depois que o visitante aceita** o aviso de
cookies (textos em `content.json` → `texts.cookies`; a escolha fica no navegador e pode ser revista pelo link
"Privacidade e cookies" no fim da página inicial). Nada que o paciente escreve ou marca no rosto vai para o Google.

- **ID da métrica**: variável `GA_MEASUREMENT_ID` do repositório no GitHub (Settings → Secrets and variables →
  Actions → aba _Variables_), passada ao build como `VITE_GA_MEASUREMENT_ID`. Sem ela, não há aviso nem Analytics
  (é o caso de `npm run dev` e dos testes unitários; o E2E de analytics sobe um servidor próprio com um ID de teste).
  Para testar local, preencha em `.env` (veja `.env.example`).
- **Código**: `src/analytics/` (aviso e consentimento, tracker, GA4, cliques, leads, cidade, `?interno`/`?debug`).
- **Modo de consentimento v2**: desligado (`CONSENT_MODE = false` em `src/config.js`). Ligado, o Google carrega em
  toda visita com tudo negado (conta a visita sem cookies) e o "OK" libera `analytics_storage`; o aviso passa a usar
  `texts.cookies.textConsentMode`. Só ligar depois que a clínica aprovar.

### Eventos do Analytics

**Páginas**: cada tela vira um `page_view` com o caminho da tela (`/`, `/agenda`, `/cases`, `/map`…). Os `utm_*`
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

Cada caso tem uma pasta em `src/cases/<pasta>/` com `antes.jpg` e `depois.jpg` (outros ângulos: `antes-2.jpg` e
`depois-2.jpg`…; vale também .png ou .webp; formato do Stories do Instagram, 9:16, 1080 × 1920 px) e, se quiser, um áudio da Dra. explicando o caso (`audio.mp3`). Os dados
de cada caso ficam na lista `cases` de `src/data/cases.json`: pasta, título, partes do rosto e, opcionais,
procedimentos, tempo depois, descrição, áudio, texto do áudio e `visible`. As instruções estão no próprio arquivo.
O site acha as fotos sozinho no build, e o teste avisa se faltar uma foto ou o áudio.

Os casos aparecem na página "Ver resultados reais" (botão na página inicial, ou `…/#casos`) e na etapa de
resultados do mapa do rosto. A página segue o mesmo interruptor do mapa (`?mapa=1`).

## Avaliações do Google

A página inicial mostra a nota e avaliações do perfil da Dra. Mayara no Google num carrossel
(`src/components/GoogleReviews.jsx`). O site **não consulta o Google**: tudo é estático.

- **As avaliações** ficam em `content.json` → `googleReviews.reviews` (nome, estrelas e texto, copiados do perfil). O
  Google só entrega 5 pela API, por isso a lista é mantida à mão: para incluir uma nova, acrescente na lista.
  `minStars` e `hideIfMentions` (hoje `sobrancelha`, já que o foco é harmonização facial) escondem as que não devem
  aparecer.
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

Tudo é feito no `npm run build` pelo plugin `scripts/seo.mjs` (as partes ficam em `scripts/seo/`), a partir do
`content.json`. Nada disso roda no navegador do visitante.

- **Página inicial**: título (`texts.general.pageTitle`), descrição, prévia do link (Open Graph, imagem
  `public/share.jpg` de 1200×630), dados estruturados e um texto pronto em `#root` para quem não roda JavaScript. Depois
  que o app carrega, a tela inicial mantém a especialidade e as cidades no subtítulo, com o CRBM, logo abaixo do nome
  (`texts.start.credential`).
- **Páginas de serviço e cidade** (`pages.list`, **vazia por enquanto**: o conteúdo vai ser alimentado depois). Cada
  item vira um HTML estático (`dist/<slug>/index.html`, ex.: `/toxina-botulinica-maringa/`) com título, descrição e link
  canônico próprios, H1 com o serviço e a cidade, perguntas frequentes (também como FAQPage para o Google), endereço,
  "Como chegar", botão de WhatsApp e links para as outras páginas e para o início. O formato de cada item está em
  `pages._howToEdit`. Elas não carregam o app: só um script pequeno (`src/pages/page.jsx`) com o mesmo aviso de cookies
  e o mesmo Analytics (a visita vai com o caminho da página; o clique no WhatsApp manda `whatsapp_contact` e
  `generate_lead` com `city` e `page`). No `npm run dev` elas também abrem, servidas pelo próprio plugin. Cada página
  nova entra no site, nos links, no sitemap e no nginx sozinha. Os testes conferem o HTML com páginas de exemplo e, nos
  textos reais, de 400 a 700 palavras e algumas palavras proibidas pelas regras de publicidade em saúde (resultado
  garantido, superlativos, antes e depois).
- **Dados estruturados** (schema.org): a Dra. Mayara (`Person`, biomédica esteta, CRBM 7137) e uma
  `HealthAndBeautyBusiness` por unidade (`business.locations`), com o mesmo nome do Perfil da Empresa no Google
  (`business.name`), endereço, coordenadas, horário e o link do perfil. Campo vazio fica de fora. Não há nota nem
  avaliações: o Google não mostra avaliações que a empresa publica sobre si mesma. Dá para conferir no
  [Teste de pesquisa aprimorada](https://search.google.com/test/rich-results).
- **robots.txt e sitemap.xml**: o sitemap lista o início e todas as páginas de serviço, com a data do build.
- **404 de verdade**: o nginx do container só responde o que o build escreveu (o início, as páginas de serviço e os
  arquivos). Qualquer outro endereço recebe `404.html` com status 404 (antes, todo endereço devolvia o início com 200,
  um "soft 404" para o Google). O Traefik, na frente, só repassa a resposta.
- **Endereço oficial**: `seo.url` (`https://dramayarabacellar.com/`). O `nginx.conf` manda `mayarabacellar.com` e o
  `www` para ele com 301 (isso só vale se o Traefik mandar esses domínios para este container).
- **Foto do início**: `npm run images` (`scripts/generate-images.mjs`, com `sharp`) gera as cópias leves em AVIF e WebP
  (`public/profile/photo-600.avif` …) e a `public/share.jpg`. Rode de novo depois de trocar a foto. A tela inicial usa
  `<picture>` com `srcset`, `width`/`height` (sem pulo de layout) e `fetchpriority="high"`.

Lighthouse (celular, build local servido pelo `nginx.conf` do repo, 28/10/2026):

| Página                             | Desempenho | Acessibilidade | Boas práticas | SEO | LCP   | CLS   | TBT    |
| ---------------------------------- | ---------- | -------------- | ------------- | --- | ----- | ----- | ------ |
| `/`                                | 96         | 100            | 100           | 100 | 2,2 s | 0     | 180 ms |
| página de serviço (texto de teste) | 98         | 100            | 100           | 100 | 1,7 s | 0,074 | 0 ms   |

Fora do código: verificar o site no [Google Search Console](https://search.google.com/search-console), enviar
`https://dramayarabacellar.com/sitemap.xml`, vincular o Search Console ao GA4, pedir a indexação de cada página de
serviço e usar essas páginas (com UTM) nos links das postagens do Perfil da Empresa no Google.

## Entrega

`Dockerfile` (build com Node, servido por nginx) e `nginx.conf`: gzip, cache longo para `/assets` (têm hash no nome),
cache de um dia para as fotos, `index.html` sempre revalidado, `robots.txt`/`sitemap.xml` que dão 404 quando não existem
e `Content-Security-Policy` restrita ao próprio site (fontes, scripts e imagens são todos locais). A cada push na `main`, o workflow
`.github/workflows/docker.yml` publica a imagem no Docker Hub; `ci.yml` roda lint, formatação, testes e o E2E nos PRs.

## Ícone do site

O ícone da aba do navegador e do resultado do Google é um recorte quadrado do rosto em `public/profile/photo.jpg`:
`public/favicon.ico` (16, 32 e 48 px), `public/favicon-48.png`, `favicon-96.png`, `favicon-192.png` e
`public/apple-touch-icon.png` (180 px, atalho no iPhone). Se a foto mudar, gere os arquivos de novo com os mesmos nomes.

## Situação

Prontas: início, agenda, e o fluxo do mapa do rosto (escolher o rosto, marcar, ver resultados, contar mais, revisar e enviar
pelo WhatsApp, com aviso de privacidade). Faltam: sobre você (por enquanto só o nome, pedido na revisão), objetivo, saúde e FAQ.
