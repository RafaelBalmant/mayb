# Site de Mayara Bacellar · harmonização facial

Site estático (Vite + Preact) em que o paciente marca no desenho do rosto
o que o incomoda, responde algumas perguntas e envia o resumo pelo WhatsApp.
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
- `src/store/legacy-storage.js` converte respostas salvas pela versão antiga (nomes em português) para o formato atual.
- `src/faces/*.svg`: cada área tocável é um `<path class="zone" data-area="code">`. Gere de novo com `npm run faces`
  depois de mexer em `scripts/generate-faces.mjs`, ou troque por SVGs de um ilustrador mantendo o mesmo `data-area`.

## Entrega

`Dockerfile` (build com Node, servido por nginx) e `nginx.conf`: gzip, cache longo para `/assets` (têm hash no nome),
`index.html` sempre revalidado e `Content-Security-Policy` restrita ao próprio site (fontes e scripts são locais).

## Situação

Prontas: etapas 3 (mapa do rosto), 4 (detalhes de cada área) e 8 (revisar e enviar pelo WhatsApp, com aceite LGPD).
Faltam: boas-vindas, sobre você (por enquanto só o nome, pedido na revisão), objetivo, saúde e FAQ.
