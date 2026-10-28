import { expect, test } from "@playwright/test";

// Os seletores usam o texto visível (conteúdo do site, em português) e papéis ARIA,
// para continuarem valendo quando ids e nomes do código mudarem.

test.beforeEach(async ({ page }) => {
  // o link do WhatsApp abre em outra aba; não precisamos sair para a internet
  await page.context().route("https://wa.me/**", route => route.fulfill({ body: "ok", contentType: "text/html" }));
  await page.goto("/");
});

const escolherRosto = async page => {
  await page.getByRole("button", { name: "Feminino" }).click();
  await page.getByRole("button", { name: "Começar" }).click();
};

test("começa pela abertura e só libera o botão depois de escolher o rosto", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Me conta o que anda te incomodando?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Escolha um rosto para começar" })).toBeDisabled();
  await escolherRosto(page);
  await expect(page.getByText("Toque no rosto para marcar.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuar" })).toBeDisabled();
});

test("marcar e desmarcar áreas pelo rosto e pela lista", async ({ page }) => {
  await escolherRosto(page);
  await page.getByRole("button", { name: "Testa", exact: true }).click();
  await expect(page.getByText("Você marcou (1)")).toBeVisible();
  await page.getByRole("button", { name: "Pele em geral" }).click();
  await expect(page.getByText("Você marcou (2)")).toBeVisible();
  await page.getByRole("button", { name: "Remover Testa" }).click();
  await expect(page.getByText("Você marcou (1)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuar" })).toBeEnabled();
});

test("modal 'Outra parte': só salva com texto, edita e remove", async ({ page }) => {
  await escolherRosto(page);
  await page.getByRole("button", { name: "Outra parte" }).click();
  const modal = page.getByRole("dialog");
  await expect(modal.getByRole("button", { name: "Salvar" })).toBeDisabled();
  await modal.getByRole("textbox").fill("Marquinha perto da orelha");
  await modal.getByRole("button", { name: "Salvar" }).click();
  await expect(modal).toBeHidden();
  await expect(page.getByText("Outra parte: Marquinha perto da orelha")).toBeVisible();

  await page.getByRole("button", { name: /^Editar Outra parte/ }).click();
  await expect(page.getByRole("dialog").getByRole("textbox")).toHaveValue("Marquinha perto da orelha");
  await page.getByRole("button", { name: "Excluir esta parte" }).click();
  await expect(page.getByText("Toque no rosto para marcar.")).toBeVisible();
});

test("Escape fecha o modal sem salvar", async ({ page }) => {
  await escolherRosto(page);
  await page.getByRole("button", { name: "Outra parte" }).click();
  await page.getByRole("dialog").getByRole("textbox").fill("algo");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText("Toque no rosto para marcar.")).toBeVisible();
});

test("fluxo completo com detalhes até o envio", async ({ page }) => {
  await escolherRosto(page);
  await page.getByRole("button", { name: "Testa", exact: true }).click();
  // a zona dos olhos tem o centro entre os dois olhos; ativamos pelo teclado (também cobre a acessibilidade)
  await page.getByRole("button", { name: "Olhos e sobrancelhas", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByRole("heading", { name: "Anotado! E agora?" })).toBeVisible();
  await expect(page.getByText("Você marcou 2 partes")).toBeVisible();
  await page.getByRole("button", { name: /Desejo passar mais informações/ }).click();

  // área 1: Testa
  await expect(page.getByText("Área 1 de 2")).toBeVisible();
  await page.getByRole("button", { name: "Linhas ao franzir" }).click();
  await page.getByRole("button", { name: "Outro", exact: true }).click();
  await page.getByPlaceholder("Conte com suas palavras").fill("Marca antiga");
  await page.getByRole("button", { name: "Direito" }).click();
  await page.getByRole("button", { name: "4", exact: true }).click();
  await page.getByRole("button", { name: "Próxima área" }).click();

  // área 2: Olhos, pulada
  await expect(page.getByText("Área 2 de 2")).toBeVisible();
  await page.getByRole("button", { name: "Pular esta área" }).click();

  // revisar
  await expect(page.getByRole("heading", { name: "Confira antes de enviar" })).toBeVisible();
  await page.getByPlaceholder("Seu nome").fill("Ana");
  const previa = page.locator("pre");
  await expect(previa).toContainText("*Nome:* Ana");
  await expect(previa).toContainText("linhas ao franzir, Marca antiga");
  await expect(previa).toContainText("Incômodo: 4 de 5");

  // sem aceite não envia
  const enviar = page.getByRole("link", { name: "Enviar pelo WhatsApp" });
  await enviar.click({ force: true }); // aria-disabled, mas o site trata o clique e mostra o aviso
  await expect(page.getByText("Marque a caixa acima para poder enviar.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Confira antes de enviar" })).toBeVisible();

  // com aceite, o link leva a mensagem pronta e a tela muda
  await page.getByRole("checkbox").check();
  const href = await enviar.getAttribute("href");
  expect(href).toMatch(/^https:\/\/wa\.me\/5543988540963\?text=/);
  expect(decodeURIComponent(href.split("?text=")[1])).toBe(await previa.innerText());
  await enviar.click();
  await expect(page.getByRole("heading", { name: "Agora é com a Dra. Mayara" })).toBeVisible();

  // recomeçar apaga tudo
  await page.getByRole("button", { name: "Apagar minhas respostas e recomeçar" }).click();
  await expect(page.getByRole("heading", { name: "Me conta o que anda te incomodando?" })).toBeVisible();
});

test("caminho direto: falar com a Dra. sem detalhes", async ({ page }) => {
  await escolherRosto(page);
  await page.getByRole("button", { name: "Testa", exact: true }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: /Desejo falar com a Dra. Mayara/ }).click();
  await expect(page.getByRole("button", { name: "Contar mais sobre cada parte" })).toBeVisible();
});

test("o estado sobrevive a recarregar a página", async ({ page }) => {
  await escolherRosto(page);
  await page.getByRole("button", { name: "Testa", exact: true }).click();
  await page.reload();
  await expect(page.getByText("Você marcou (1)")).toBeVisible();
});
