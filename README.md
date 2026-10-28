# Site de Mayara Bacellar · harmonização facial

Site estático (Vite + JavaScript puro) em que o paciente marca no desenho do rosto
o que o incomoda, responde algumas perguntas e envia o resumo pelo WhatsApp.
Nada é salvo em servidor: as respostas ficam no navegador até o paciente enviar.

## Rodar

```sh
npm install
npm run dev        # servidor local (abre no celular pela rede com --host)
npm run build      # gera dist/ para qualquer hospedagem estática
npm run lint       # ESLint
npm test           # testes unitários (Vitest)
npm run test:e2e   # fluxo completo no navegador (Playwright)
npm run faces      # regera os SVGs do rosto
```

## Convenção de idioma

- **Código em inglês**: arquivos, pastas, funções, variáveis, classes CSS, chaves do JSON, comentários e commits.
- **Conteúdo do site em português**: só os _valores_ de texto em `src/data/content.json` (o que o paciente lê).

## Onde está cada coisa

- `src/data/content.json`: **todo texto do site** fica aqui, para editar sem mexer no código: áreas e opções,
  rótulos das respostas (`labels`), FAQ, WhatsApp e, em `texts`, os títulos, explicações, botões e avisos de cada tela,
  além do formato do resumo. `{n}`, `{area}` etc. são trocados pelo valor certo. O código lê tudo com `t("tela.chave")`.
- `src/theme.css`: **fontes e cores do site**, num lugar só. Trocar a cor da marca (`--accent`) já muda botões e áreas
  marcadas; os desenhos do rosto também usam essas cores (`--skin`, `--hair`, `--lip`, `--ink`).
- `src/faces/*.svg`: as 4 ilustrações (female/male, front/profile). Cada área tocável é um
  `<path class="zone" data-area="code">`. Gere de novo com `npm run faces` depois de mexer em
  `scripts/generate-faces.mjs`, ou troque por SVGs feitos por um ilustrador mantendo o mesmo `data-area`.
- `src/state.js`: o formato dos dados do paciente (comentado no arquivo). `src/legacy-storage.js` converte dados
  salvos pela versão antiga (nomes em português) para o formato atual.
- `src/summary.js`: monta a mensagem do WhatsApp (formato do doc de fluxo) e o link wa.me. Se passar de
  `professional.messageLimit` caracteres (content.json), os textos livres são encurtados.
- `src/config.js`: constantes que não são texto (tempos, limites, escala, chave do storage).
- `src/screens/`: opening (pergunta + escolha do rosto), map, next (próximo passo), details (por área), review
  (revisar e enviar) e sent (depois do envio).
- `tests/` e `e2e/`: testes unitários da lógica e do fluxo completo.

## Situação

Prontas: etapas 3 (mapa do rosto), 4 (detalhes de cada área) e 8 (revisar e enviar pelo WhatsApp, com aceite LGPD).
Faltam: boas-vindas, sobre você (por enquanto só o nome, pedido na revisão), objetivo, saúde e FAQ.
