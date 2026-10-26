# Site de Mayara Bacellar · harmonização facial

Site estático (Vite + JavaScript puro) em que o paciente marca no desenho do rosto
o que o incomoda, responde algumas perguntas e envia o resumo pelo WhatsApp.
Nada é salvo em servidor: as respostas ficam no navegador até o paciente enviar.

## Rodar

```sh
npm install
npm run dev      # servidor local (abre no celular pela rede com --host)
npm run build    # gera dist/ para qualquer hospedagem estática
```

## Onde está cada coisa

- `src/data/conteudo.json`: **todo texto do site** fica aqui, para editar sem mexer no código: áreas e opções,
  rótulos das respostas, FAQ, WhatsApp e, em `textos`, os títulos, explicações, botões e avisos de cada tela,
  além do formato do resumo. `{n}`, `{area}` etc. são trocados pelo valor certo. O código lê tudo com `t("tela.chave")`.
- `src/data/agenda.json`: **dias de atendimento** (Maringá e Siqueira Campos), por mês. É só pôr o número do dia
  na lista da cidade; dia que não aparece = não atende. As instruções estão no próprio arquivo (`_comoEditar`).
  As datas que estão lá agora são de exemplo.
- `src/tema.css`: **fontes e cores do site**, num lugar só. Trocar a cor da marca (`--accent`) já muda botões e áreas
  marcadas; os desenhos do rosto também usam essas cores (`--skin`, `--hair`, `--lip`, `--ink`).
- `src/rostos/*.svg`: as 4 ilustrações (feminino/masculino, frente/perfil). Cada área tocável é um
  `<path class="zona" data-area="codigo">`. Gere de novo com `npm run rostos` depois de mexer em
  `scripts/gerar-rostos.mjs`, ou troque por SVGs feitos por um ilustrador mantendo o mesmo `data-area`.
- `src/estado.js`: o formato dos dados do paciente (comentado no arquivo).
- `src/resumo.js`: monta a mensagem do WhatsApp (formato do doc de fluxo) e o link wa.me. Se passar de
  `profissional.limiteMensagem` caracteres (conteudo.json), os textos livres são encurtados.
- `src/telas/`: início (dois botões: agenda e mapa do rosto), agenda (mês atual + 3, com "Agendar horário" que abre o WhatsApp com cidade e dia), abertura (pergunta + escolha do rosto), mapa, próximo passo, detalhes por área, revisar e enviar, e a tela depois do envio.

## Links diretos

O site institucional pode abrir direto numa parte: `…/#agenda` (agenda) ou `…/#mapa` (começo do mapa do rosto).

## Situação

Prontas: etapas 3 (mapa do rosto), 4 (detalhes de cada área) e 8 (revisar e enviar pelo WhatsApp, com aviso de privacidade).
Faltam: boas-vindas, sobre você (por enquanto só o nome, pedido na revisão), objetivo, saúde e FAQ.
