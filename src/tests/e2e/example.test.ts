import {
  test,
  expect,
  _electron as electron,
  ElectronApplication,
  Page,
} from "@playwright/test";
import { findLatestBuild, parseElectronApp } from "electron-playwright-helpers";

/*
 * Using Playwright with Electron:
 * https://www.electronjs.org/pt/docs/latest/tutorial/automated-testing#using-playwright
 */

let electronApp: ElectronApplication;

test.beforeAll(async () => {
  const latestBuild = findLatestBuild();
  const appInfo = parseElectronApp(latestBuild);
  process.env.CI = "e2e";

  electronApp = await electron.launch({
    args: [appInfo.main],
  });
  electronApp.on("window", async (page) => {
    const filename = page.url()?.split("/").pop();
    console.log(`Window opened: ${filename}`);

    page.on("pageerror", (error) => {
      console.error(error);
    });
    page.on("console", (msg) => {
      console.log(msg.text());
    });
  });
});

test("renders the first page", async () => {
  const page: Page = await electronApp.firstWindow();
  const title = await page.waitForSelector("h2");
  const text = await title.textContent();
  expect(text).toBe("Host Genius");
});

test("renders page name", async () => {
  const page: Page = await electronApp.firstWindow();
  await page.waitForSelector("h2");
  const btn_count = await page.locator("button").count();
  console.log(
    `Paragraph count: ${await page.locator("p").nth(0).textContent()}`,
  );

  console.log(`Button count: ${btn_count}`);
  expect(btn_count).toBeGreaterThan(0);
});
