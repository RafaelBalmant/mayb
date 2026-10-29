import { expect, test } from "@playwright/test";

// Selectors use the visible text (site content, in Portuguese) and ARIA roles,
// so they keep working when ids and code names change.
// The map flow is off for visitors; ?mapa=1 turns it on for the tab (see domain/features.js).

test.beforeEach(async ({ page }) => {
  // the WhatsApp links open in another tab; we do not need to reach the internet
  await page.context().route("https://wa.me/**", (route) => route.fulfill({ body: "ok", contentType: "text/html" }));
  // the agenda depends on today's date: fix it so the tests do not expire (Tuesday, Nov 10 2026)
  await page.clock.install({ time: new Date(2026, 10, 10, 10, 0, 0) });
});

const label = (page, name) => page.locator("aside").getByRole("button", { name });

async function openMapFlow(page) {
  await page.goto("/?mapa=1");
  await page.getByRole("button", { name: "Me conta o que te incomoda no rosto" }).click();
  await page.getByRole("button", { name: "Feminino" }).click();
  await page.getByRole("button", { name: "Começar" }).click();
}

test.describe("start page", () => {
  test("shows the doctor, the agenda and contact buttons and no map button by default", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Dra\. Mayara\s*Bacellar/ })).toBeVisible();
    await expect(page.getByText("Harmonização facial em Maringá e Siqueira Campos")).toBeVisible();
    await expect(page.getByRole("button", { name: "Verificar agenda" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Me conta o que te incomoda no rosto" })).toHaveCount(0);
    const contact = page.getByRole("link", { name: "Entrar em contato" });
    expect(await contact.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    await expect(page.getByRole("link", { name: "Compartilhe sua experiência" })).toHaveAttribute(
      "href",
      /g\.page|google/,
    );
    await expect(page.getByRole("link", { name: /Instagram/ })).toHaveAttribute("href", /instagram\.com/);
  });

  test("the action bar is hidden on the start page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#bar")).toBeHidden();
  });

  test("?mapa=1 adds the map button and it stays on for the rest of the tab", async ({ page }) => {
    await page.goto("/?mapa=1");
    await expect(page.getByRole("button", { name: "Me conta o que te incomoda no rosto" })).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Me conta o que te incomoda no rosto" })).toBeVisible();
    await page.goto("/?mapa=0");
    await expect(page.getByRole("button", { name: "Me conta o que te incomoda no rosto" })).toHaveCount(0);
  });

  test("?mapa=1 also adds the real cases page, with back to the start page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Ver resultados reais" })).toHaveCount(0);
    await page.goto("/?mapa=1");
    await page.getByRole("button", { name: "Ver resultados reais" }).click();
    await expect(page.getByRole("heading", { name: "Resultados reais" })).toBeVisible();
    await page.getByRole("button", { name: "Voltar" }).click();
    await expect(page.getByRole("button", { name: "Ver resultados reais" })).toBeVisible();
    await page.goto("/?mapa=0#casos");
    await expect(page.getByRole("heading", { name: "Resultados reais" })).toHaveCount(0);
  });

  test("direct links: #agenda opens the agenda; #mapa stays on the start page while the map is off", async ({
    page,
  }) => {
    await page.goto("/#agenda");
    await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();
    await page.goto("/?mapa=0#mapa");
    await expect(page.getByRole("button", { name: "Verificar agenda" })).toBeVisible();
  });
});

test.describe("agenda", () => {
  test("shows the month, the tabs and the days of each city", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Verificar agenda" }).click();
    await expect(page.getByRole("heading", { name: "Novembro de 2026" })).toBeVisible();
    await expect(page.getByLabel("11 de novembro: Siqueira Campos", { exact: true })).toBeVisible();
    await expect(page.getByLabel("5 de novembro: Maringá", { exact: true })).toBeVisible();
    await expect(page.getByLabel("1 de novembro: Não atende", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Dez", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Dezembro de 2026" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Agendar horário em dezembro" })).toBeVisible();
  });

  test("dragging the calendar sideways changes the month", async ({ page }) => {
    await page.goto("/#agenda");
    await expect(page.getByRole("heading", { name: "Novembro de 2026" })).toBeVisible();
    const swipe = (fromX, toX) =>
      page.locator(".calendar").evaluate(
        (el, [a, b]) => {
          const point = (x) => new Touch({ identifier: 1, target: el, clientX: x, clientY: 300 });
          const fire = (type, x) =>
            el.dispatchEvent(
              new TouchEvent(type, {
                bubbles: true,
                cancelable: true,
                touches: type === "touchend" ? [] : [point(x)],
                changedTouches: [point(x)],
              }),
            );
          fire("touchstart", a);
          fire("touchend", b);
        },
        [fromX, toX],
      );
    await swipe(300, 100); // to the left: next month
    await expect(page.getByRole("heading", { name: "Dezembro de 2026" })).toBeVisible();
    await swipe(100, 300); // to the right: back
    await expect(page.getByRole("heading", { name: "Novembro de 2026" })).toBeVisible();
    await swipe(120, 100); // too short: nothing happens
    await page.waitForTimeout(100);
    await expect(page.getByRole("heading", { name: "Novembro de 2026" })).toBeVisible();
  });

  test("booking: needs a city, disables a city without days and sends the month and city on WhatsApp", async ({
    page,
  }) => {
    await page.goto("/#agenda");
    await page.getByRole("button", { name: "Dez", exact: true }).click(); // Maringá has no days in December
    await page.getByRole("button", { name: "Agendar horário em dezembro" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("button", { name: /Maringá/ })).toBeDisabled();
    await expect(dialog.getByText("Sem atendimento neste mês")).toBeVisible();
    // without a city the "link" has no href, so it is not a link yet
    const send = dialog.locator("#modal-send");
    await expect(send).toHaveText("Escolha a cidade");
    await expect(send).toHaveAttribute("aria-disabled", "true");
    await expect(send).not.toHaveAttribute("href", /.+/);
    await dialog.getByRole("button", { name: /Siqueira Campos/ }).click();
    const ready = dialog.getByRole("link", { name: "Enviar pelo WhatsApp" });
    const href = await ready.getAttribute("href");
    expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    expect(decodeURIComponent(href.split("?text=")[1])).toContain("Siqueira Campos, no mês de dezembro");
  });

  test("the booking modal closes with Escape and keeps Tab inside", async ({ page }) => {
    await page.goto("/#agenda");
    await page.getByRole("button", { name: /^Agendar horário em novembro/ }).click();
    await expect(page.getByRole("dialog")).toBeFocused();
    for (let i = 0; i < 8; i++) await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement.closest('[role="dialog"]') !== null)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("back returns to the start page", async ({ page }) => {
    await page.goto("/#agenda");
    await page.getByRole("button", { name: "Voltar" }).click();
    await expect(page.getByRole("button", { name: "Verificar agenda" })).toBeVisible();
  });
});

test.describe("face map", () => {
  test("opening needs a face before starting and can go back", async ({ page }) => {
    await page.goto("/?mapa=1");
    await page.getByRole("button", { name: "Me conta o que te incomoda no rosto" }).click();
    await expect(page.getByRole("heading", { name: "Me conta o que anda te incomodando?" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Escolha um rosto para começar" })).toBeDisabled();
    await page.getByRole("button", { name: "Voltar" }).click();
    await expect(page.getByRole("button", { name: "Verificar agenda" })).toBeVisible();
  });

  test("marks and unmarks areas from the names, shows the highlight on hover", async ({ page }) => {
    await openMapFlow(page);
    await expect(page.getByRole("button", { name: "Continuar" })).toBeDisabled();
    await label(page, "Testa").click();
    await expect(label(page, "Testa")).toHaveAttribute("aria-pressed", "true");
    await label(page, "Pele em geral").click();
    await label(page, "Testa").click();
    await expect(label(page, "Testa")).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("button", { name: "Continuar" })).toBeEnabled();
    await label(page, "Nariz").hover();
    await expect(page.locator(".zone.highlight")).toHaveCount(1);
    await page.mouse.move(0, 0);
    await expect(page.locator(".zone.highlight")).toHaveCount(0);
  });

  test("zones are keyboard buttons too", async ({ page }) => {
    await openMapFlow(page);
    await page.locator('.zone[data-area="eyes"]').focus();
    await page.keyboard.press("Enter");
    await expect(label(page, "Olhos e sobrancelhas")).toHaveAttribute("aria-pressed", "true");
  });

  test("'Other part' modal: only saves with text, edits and removes", async ({ page }) => {
    await openMapFlow(page);
    await label(page, "Outra parte").click();
    const modal = page.getByRole("dialog");
    await expect(modal.getByRole("button", { name: "Salvar" })).toBeDisabled();
    await modal.getByRole("textbox").fill("Marquinha perto da orelha");
    await modal.getByRole("button", { name: "Salvar" }).click();
    await expect(modal).toBeHidden();
    await expect(label(page, /Outra parte: Marquinha perto da orelha/)).toHaveAttribute("aria-pressed", "true");

    await label(page, /Outra parte/).click();
    await expect(page.getByRole("dialog").getByRole("textbox")).toHaveValue("Marquinha perto da orelha");
    await page.getByRole("button", { name: "Excluir esta parte" }).click();
    await expect(label(page, "Outra parte")).toHaveAttribute("aria-pressed", "false");
  });

  test("Escape closes the modal without saving", async ({ page }) => {
    await openMapFlow(page);
    await label(page, "Outra parte").click();
    await page.getByRole("dialog").getByRole("textbox").fill("algo");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(label(page, "Outra parte")).toHaveAttribute("aria-pressed", "false");
  });

  test("results: cards per marked part, cases or 'coming soon', skip becomes continue", async ({ page }) => {
    await openMapFlow(page);
    await label(page, "Testa").click();
    await label(page, "Bochechas").click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(
      page.getByRole("heading", { name: "Quer ver resultados de quem tinha as mesmas queixas?" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Pular" })).toBeVisible();
    const forehead = page.getByRole("button", { name: /^Testa/ });
    await expect(forehead).toHaveAttribute("aria-expanded", "false");
    await forehead.click();
    await expect(forehead).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#photos-forehead .case").first()).toBeVisible(); // example cases while they are on
    await expect(page.getByRole("button", { name: "Continuar" })).toBeVisible();
    const cheeks = page.getByRole("button", { name: /^Bochechas/ });
    await cheeks.click(); // opening another closes the first
    await expect(forehead).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#photos-cheeks").getByText("Fotos em breve").first()).toBeVisible();
  });

  test("cases page: pick parts, see before above after, open a photo full screen and close it", async ({ page }) => {
    await page.goto("/?mapa=1");
    await page.getByRole("button", { name: "Ver resultados reais" }).click();
    await page.getByRole("button", { name: /^Nariz/ }).click();
    const section = page.locator('.case-group[data-code="nose"]');
    await expect(section.getByRole("heading", { name: "Nariz", exact: true })).toBeVisible();
    await expect(section.getByText("Exemplo").first()).toBeVisible();
    await section
      .getByRole("button", { name: /^Ampliar foto de Antes/ })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Fechar" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await page.getByRole("button", { name: "Todos" }).click();
    await expect(page.locator(".case-jump")).toBeVisible();
  });

  test("full flow with details through to sending, without any consent checkbox", async ({ page }) => {
    await openMapFlow(page);
    await label(page, "Testa").click();
    await page.locator('.zone[data-area="eyes"]').focus(); // the eyes zone has its center between the eyes
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Pular" }).click();

    await expect(page.getByRole("heading", { name: "Anotado! E agora?" })).toBeVisible();
    await expect(page.getByText("Você marcou 2 partes")).toBeVisible();
    await page.getByRole("button", { name: /Desejo passar mais informações/ }).click();

    await expect(page.getByText("Área 1 de 2")).toBeVisible();
    await page.getByRole("button", { name: "Linhas ao franzir" }).click();
    await page.getByRole("button", { name: "Outro", exact: true }).click();
    await page.getByPlaceholder("Conte com suas palavras").fill("Marca antiga");
    await page.getByRole("button", { name: "Direito" }).click();
    await page.getByRole("button", { name: "4", exact: true }).click();
    await page.getByRole("button", { name: "Próxima área" }).click();
    await expect(page.getByText("Área 2 de 2")).toBeVisible();
    await page.getByRole("button", { name: "Pular esta área" }).click();

    await expect(page.getByRole("heading", { name: "Confira antes de enviar" })).toBeVisible();
    await page.getByPlaceholder("Seu nome").fill("Ana");
    const preview = page.locator("pre");
    await expect(preview).toContainText("*Nome:* Ana");
    await expect(preview).toContainText("linhas ao franzir, Marca antiga");
    await expect(preview).toContainText("Incômodo: 4 de 5");
    await expect(page.getByText(/Suas informações não são registradas neste site/)).toBeVisible();
    await expect(page.getByRole("checkbox")).toHaveCount(0);

    const send = page.getByRole("link", { name: "Enviar pelo WhatsApp" });
    const href = await send.getAttribute("href");
    expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    expect(decodeURIComponent(href.split("?text=")[1])).toBe(await preview.innerText());
    await send.click();
    await expect(page.getByRole("heading", { name: "Agora é com a equipe da Dra. Mayara" })).toBeVisible();

    await page.getByRole("button", { name: "Apagar minhas respostas e recomeçar" }).click();
    await expect(page.getByRole("heading", { name: "Me conta o que anda te incomodando?" })).toBeVisible();
  });

  test("direct path: talk to the team without details", async ({ page }) => {
    await openMapFlow(page);
    await label(page, "Testa").click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Pular" }).click();
    await page.getByRole("button", { name: /Desejo falar com a equipe/ }).click();
    await expect(page.getByRole("button", { name: "Contar mais sobre cada parte" })).toBeVisible();
  });

  test("the progress bar follows the flow", async ({ page }) => {
    await openMapFlow(page);
    await expect(page.getByText("Etapa 2 de 5 · Marcar no rosto")).toBeVisible();
    await label(page, "Testa").click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByText("Etapa 3 de 5 · Ver resultados")).toBeVisible();
  });

  test("state survives a page reload", async ({ page }) => {
    await openMapFlow(page);
    await label(page, "Testa").click();
    await page.reload();
    await expect(label(page, "Testa")).toHaveAttribute("aria-pressed", "true");
  });
});
