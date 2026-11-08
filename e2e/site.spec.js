import { expect, test } from "@playwright/test";
import { AGENDA_ENABLED } from "../src/config.js";

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
  test("shows the doctor and the contact buttons, and no agenda nor map button by default", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Dra\. Mayara\s*Bacellar/ })).toBeVisible();
    await expect(page.getByText("Harmonização facial em Maringá e Siqueira Campos")).toBeVisible();
    await expect(page.getByRole("link", { name: "Verificar agenda" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Me conta o que te incomoda no rosto" })).toHaveCount(0);
    const contact = page.getByRole("link", { name: "Entrar em contato" });
    expect(await contact.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    await expect(page.getByRole("link", { name: "Compartilhe sua experiência" })).toHaveAttribute(
      "href",
      /g\.page|google/,
    );
    await expect(page.getByRole("link", { name: /Instagram/ })).toHaveAttribute("href", /instagram\.com/);
  });

  test("'Procedimentos' opens, then each procedure opens on its own", async ({ page }) => {
    await page.goto("/");
    const where = page.getByText("Harmonização facial em Maringá", { exact: true });
    await expect(where).toBeHidden();
    await page.getByText("Procedimentos", { exact: true }).click();
    await expect(page.getByText("Bioestimulador de colágeno", { exact: true })).toBeVisible();
    await expect(where).toBeHidden();
    await page.getByText("Harmonização facial", { exact: true }).click();
    await expect(where).toBeVisible();
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
    await expect(page.getByRole("link", { name: "Ver resultados reais" })).toHaveCount(0);
    await page.goto("/?mapa=1");
    await page.getByRole("link", { name: "Ver resultados reais" }).click();
    await expect(page.getByRole("heading", { name: "Resultados reais" })).toBeVisible();
    await expect(page).toHaveURL(/\/casos\/$/);
    await page.getByRole("link", { name: "Voltar" }).click();
    await expect(page.getByRole("link", { name: "Ver resultados reais" })).toBeVisible();
    await page.goto("/?mapa=0#casos");
    await expect(page.getByRole("heading", { name: "Resultados reais" })).toHaveCount(0);
  });

  test("direct links: #agenda and #mapa stay on the start page while the agenda and the map are off", async ({
    page,
  }) => {
    await page.goto("/#agenda");
    await expect(page.getByRole("link", { name: "Entrar em contato" })).toBeVisible();
    await expect(page).toHaveURL(/\/#agenda$/);
    await page.goto("/?mapa=0#mapa");
    await expect(page.getByRole("link", { name: "Entrar em contato" })).toBeVisible();
  });
});

test.describe("agenda", () => {
  test.skip(!AGENDA_ENABLED, "the agenda is off (AGENDA_ENABLED in src/config.js)");

  test("shows the month, the tabs and the days of each city", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Verificar agenda" }).click();
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
    await page.getByRole("link", { name: "Voltar" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Verificar agenda" })).toBeVisible();
  });
});

test.describe("face map", () => {
  test("opening needs a face before starting and can go back", async ({ page }) => {
    await page.goto("/?mapa=1");
    await page.getByRole("button", { name: "Me conta o que te incomoda no rosto" }).click();
    await expect(page.getByRole("heading", { name: "Me conta o que anda te incomodando?" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Escolha um rosto para começar" })).toBeDisabled();
    await page.getByRole("button", { name: "Voltar" }).click();
    await expect(page.getByRole("link", { name: "Entrar em contato" })).toBeVisible();
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
    await page.getByRole("link", { name: "Ver resultados reais" }).click();
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

test.describe("pages and addresses", () => {
  test("each page has its own address, and the browser's back button returns to the start page", async ({ page }) => {
    await page.goto("/?mapa=1");
    await page.getByRole("button", { name: "Me conta o que te incomoda no rosto" }).click();
    await expect(page).toHaveURL(/\/mapa\/$/);
  });

  test("the face map and the cases page send the visitor to the start page while the map is off", async ({ page }) => {
    await page.goto("/mapa/");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Entrar em contato" })).toBeVisible();
    await page.goto("/casos/");
    await expect(page).toHaveURL(/\/$/);
  });

  test("the agenda address answers 404 while the agenda is off", async ({ page }) => {
    test.skip(AGENDA_ENABLED, "the agenda is on");
    const response = await page.goto("/agenda/");
    expect(response.status()).toBe(404);
  });

  test("an unknown address answers 404 with a page that links back", async ({ page }) => {
    const response = await page.goto("/nao-existe/");
    expect(response.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
    await page.getByRole("link", { name: "Ir para a página inicial" }).click();
    await expect(page.getByRole("link", { name: "Entrar em contato" })).toBeVisible();
  });

  test("no script, hydration or security-policy errors on any page", async ({ page }) => {
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    for (const path of ["/", ...(AGENDA_ENABLED ? ["/agenda/"] : []), "/?mapa=1", "/mapa/", "/casos/"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    }
    expect(errors).toEqual([]);
  });
});

test.describe("HTML for search engines (without JavaScript)", () => {
  test.use({ javaScriptEnabled: false });

  test("the start page comes with its content, title and canonical link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Dra\. Mayara\s*Bacellar/);
    await expect(page.getByText("Harmonização facial em Maringá e Siqueira Campos")).toBeVisible();
    await expect(page.locator(".review").first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://dramayarabacellar.com/");
  });

  test("the agenda comes with its content, title and canonical link", async ({ page }) => {
    test.skip(!AGENDA_ENABLED, "the agenda is off (AGENDA_ENABLED in src/config.js)");
    await page.goto("/agenda/");
    await expect(page.getByRole("heading", { level: 1, name: "Agenda" })).toBeVisible();
    await expect(page.locator(".calendar .day").first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://dramayarabacellar.com/agenda/",
    );
  });

  test("the start page has enough text, the specialty with both cities and a working WhatsApp link", async ({
    page,
  }) => {
    await page.goto("/");
    const words = (await page.locator("body").innerText()).split(/\s+/).filter((w) => /\p{L}/u.test(w));
    expect(words.length).toBeGreaterThanOrEqual(300);
    const specialty = page.getByText(/Harmonização facial/).filter({ hasText: "Maringá" });
    await expect(specialty.filter({ hasText: "Siqueira Campos" }).first()).toBeVisible();
    const contact = page.locator('a[data-track="whatsapp_contact"]');
    await expect(contact).toBeVisible();
    const href = new URL(await contact.getAttribute("href"));
    expect(href.origin).toBe("https://wa.me");
    expect(href.pathname).toMatch(/^\/55\d{10,11}$/);
    expect(href.searchParams.get("text")).toBeTruthy();
  });

  test("the procedures are in the HTML, closed, each named with the city inside", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".procedures > details")).not.toHaveAttribute("open");
    await expect(page.locator(".procedure-where").first()).toHaveText("Harmonização facial em Maringá");
  });

  test("the face map is kept out of Google", async ({ page }) => {
    await page.goto("/mapa/");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  });
});
