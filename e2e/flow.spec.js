import { expect, test } from "@playwright/test";

// Selectors use the visible text (site content, in Portuguese) and ARIA roles,
// so they keep working when ids and code names change.

test.beforeEach(async ({ page }) => {
  // the WhatsApp link opens in another tab; we do not need to reach the internet
  await page.context().route("https://wa.me/**", (route) => route.fulfill({ body: "ok", contentType: "text/html" }));
  await page.goto("/");
});

const chooseFace = async (page) => {
  await page.getByRole("button", { name: "Feminino" }).click();
  await page.getByRole("button", { name: "Começar" }).click();
};

test("starts on the opening and only enables the button after choosing a face", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Me conta o que anda te incomodando?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Escolha um rosto para começar" })).toBeDisabled();
  await chooseFace(page);
  await expect(page.getByText("Toque no rosto para marcar.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuar" })).toBeDisabled();
});

test("marks and unmarks areas from the face and from the list", async ({ page }) => {
  await chooseFace(page);
  await page.getByRole("button", { name: "Testa", exact: true }).click();
  await expect(page.getByText("Você marcou (1)")).toBeVisible();
  await page.getByRole("button", { name: "Pele em geral" }).click();
  await expect(page.getByText("Você marcou (2)")).toBeVisible();
  await page.getByRole("button", { name: "Remover Testa" }).click();
  await expect(page.getByText("Você marcou (1)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuar" })).toBeEnabled();
});

test("'Other part' modal: only saves with text, edits and removes", async ({ page }) => {
  await chooseFace(page);
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

test("Escape closes the modal without saving", async ({ page }) => {
  await chooseFace(page);
  await page.getByRole("button", { name: "Outra parte" }).click();
  await page.getByRole("dialog").getByRole("textbox").fill("algo");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText("Toque no rosto para marcar.")).toBeVisible();
});

test("full flow with details through to sending", async ({ page }) => {
  await chooseFace(page);
  await page.getByRole("button", { name: "Testa", exact: true }).click();
  // the eyes zone has its center between the two eyes; we activate it by keyboard (also covers accessibility)
  await page.getByRole("button", { name: "Olhos e sobrancelhas", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByRole("heading", { name: "Anotado! E agora?" })).toBeVisible();
  await expect(page.getByText("Você marcou 2 partes")).toBeVisible();
  await page.getByRole("button", { name: /Desejo passar mais informações/ }).click();

  // area 1: forehead
  await expect(page.getByText("Área 1 de 2")).toBeVisible();
  await page.getByRole("button", { name: "Linhas ao franzir" }).click();
  await page.getByRole("button", { name: "Outro", exact: true }).click();
  await page.getByPlaceholder("Conte com suas palavras").fill("Marca antiga");
  await page.getByRole("button", { name: "Direito" }).click();
  await page.getByRole("button", { name: "4", exact: true }).click();
  await page.getByRole("button", { name: "Próxima área" }).click();

  // area 2: eyes, skipped
  await expect(page.getByText("Área 2 de 2")).toBeVisible();
  await page.getByRole("button", { name: "Pular esta área" }).click();

  // review
  await expect(page.getByRole("heading", { name: "Confira antes de enviar" })).toBeVisible();
  await page.getByPlaceholder("Seu nome").fill("Ana");
  const previa = page.locator("pre");
  await expect(previa).toContainText("*Nome:* Ana");
  await expect(previa).toContainText("linhas ao franzir, Marca antiga");
  await expect(previa).toContainText("Incômodo: 4 de 5");

  // without consent it does not send
  const enviar = page.getByRole("link", { name: "Enviar pelo WhatsApp" });
  await enviar.click({ force: true }); // aria-disabled, but the site handles the click and shows the notice
  await expect(page.getByText("Marque a caixa acima para poder enviar.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Confira antes de enviar" })).toBeVisible();

  // with consent, the link carries the ready message and the screen changes
  await page.getByRole("checkbox").check();
  const href = await enviar.getAttribute("href");
  expect(href).toMatch(/^https:\/\/wa\.me\/5543988540963\?text=/);
  expect(decodeURIComponent(href.split("?text=")[1])).toBe(await previa.innerText());
  await enviar.click();
  await expect(page.getByRole("heading", { name: "Agora é com a Dra. Mayara" })).toBeVisible();

  // restarting erases everything
  await page.getByRole("button", { name: "Apagar minhas respostas e recomeçar" }).click();
  await expect(page.getByRole("heading", { name: "Me conta o que anda te incomodando?" })).toBeVisible();
});

test("direct path: talk to the doctor without details", async ({ page }) => {
  await chooseFace(page);
  await page.getByRole("button", { name: "Testa", exact: true }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: /Desejo falar com a Dra. Mayara/ }).click();
  await expect(page.getByRole("button", { name: "Contar mais sobre cada parte" })).toBeVisible();
});

test("state survives a page reload", async ({ page }) => {
  await chooseFace(page);
  await page.getByRole("button", { name: "Testa", exact: true }).click();
  await page.reload();
  await expect(page.getByText("Você marcou (1)")).toBeVisible();
});
