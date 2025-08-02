import {
  test,
  expect,
  _electron as electron,
  ElectronApplication,
  Page,
} from "@playwright/test";
import path from "path";
import fs from "fs";

/*
 * Using Playwright with Electron:
 * https://www.electronjs.org/pt/docs/latest/tutorial/automated-testing#using-playwright
 */

let electronApp: ElectronApplication;

test.beforeAll(async () => {
  process.env.CI = "e2e";

  // 使用本地构建的应用路径
  let executablePath: string;

  if (process.platform === "win32") {
    // Windows 平台
    executablePath = path.join(
      process.cwd(),
      "out",
      "Host Genius-win32-x64",
      "Host Genius.exe",
    );
  } else if (process.platform === "darwin") {
    // macOS 平台
    const arch = process.arch === "arm64" ? "arm64" : "x64";
    executablePath = path.join(
      process.cwd(),
      "out",
      `Host Genius-darwin-${arch}`,
      "Host Genius.app",
      "Contents",
      "MacOS",
      "Host Genius",
    );
  } else {
    // Linux 平台
    executablePath = path.join(
      process.cwd(),
      "out",
      "Host Genius-linux-x64",
      "Host Genius",
    );
  }

  // 检查构建文件是否存在
  if (!fs.existsSync(executablePath)) {
    throw new Error(
      `构建的应用程序不存在: ${executablePath}。请先运行 'npm run make' 构建应用。`,
    );
  }

  electronApp = await electron.launch({
    executablePath,
    args: process.env.CI ? [] : ["--enable-logging"],
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
