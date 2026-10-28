import { expect, test } from "@playwright/test";

// Runs against a dev server built with a test measurement ID (see playwright.config.js). gtag.js is answered with an
// empty script, so the dataLayer keeps every command the site queued, which is what Google would receive.

test.beforeEach(async ({ page }) => {
  await page
    .context()
    .route("https://www.googletagmanager.com/**", (route) =>
      route.fulfill({ body: "", contentType: "text/javascript" }),
    );
  await page.context().route("https://wa.me/**", (route) => route.fulfill({ body: "ok", contentType: "text/html" }));
  await page.clock.install({ time: new Date(2026, 10, 10, 10, 0, 0) }); // Tuesday, Nov 10 2026
});

const commands = (page) => page.evaluate(() => (window.dataLayer ?? []).map((args) => Array.from(args)));
const events = async (page, name) => (await commands(page)).filter((c) => c[0] === "event" && c[1] === name);

async function bookInMaringa(page) {
  await page.getByRole("button", { name: "Verificar agenda" }).click();
  await page.getByRole("button", { name: "Agendar horário em novembro" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /Maringá/ }).click();
  await dialog.getByRole("link", { name: "Enviar pelo WhatsApp" }).click();
}

test("nothing is loaded or sent before the visitor accepts the cookies", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Usamos cookies para melhorar sua experiência.")).toBeVisible();
  expect(await page.evaluate(() => window.dataLayer)).toBeUndefined();
  await page.getByRole("button", { name: "Recusar cookies" }).click();
  await bookInMaringa(page);
  expect(await page.evaluate(() => window.dataLayer)).toBeUndefined();
});

test("a WhatsApp booking in Maringá sends whatsapp_booking, generate_lead and preferred_city", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await bookInMaringa(page);

  await expect
    .poll(() => events(page, "whatsapp_booking"))
    .toEqual([["event", "whatsapp_booking", { city: "maringa" }]]);
  expect(await events(page, "generate_lead")).toEqual([
    ["event", "generate_lead", { method: "whatsapp", lead_type: "booking", city: "maringa" }],
  ]);
  expect(await commands(page)).toContainEqual(["set", "user_properties", { preferred_city: "maringa" }]);

  // next visit: the city goes again as soon as the tracker starts, before any click
  await page.reload();
  await expect.poll(() => commands(page)).toContainEqual(["set", "user_properties", { preferred_city: "maringa" }]);
});

test("?interno=1 and ?debug=1 go to the config and leave the address", async ({ page }) => {
  await page.goto("/?interno=1&debug=1&utm_source=instagram");
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await expect(page).toHaveURL(/\/\?utm_source=instagram$/);
  const config = (await commands(page)).find((c) => c[0] === "config");
  expect(config[2]).toEqual({ send_page_view: false, traffic_type: "internal", debug_mode: true });
  const [pageView] = await events(page, "page_view");
  expect(pageView[2].page_location).toMatch(/\/\?utm_source=instagram$/);

  // the internal mark stays on the next visit; debug does not
  await page.goto("/");
  const next = (await commands(page)).find((c) => c[0] === "config");
  expect(next[2]).toEqual({ send_page_view: false, traffic_type: "internal" });
});
