import type { BrowserWindow } from "electron";
import { registerHostListeners } from "./host-listeners";
import { addWindowEventListeners } from "./window/window-listeners";
import { addThemeEventListeners } from "./theme/theme-listeners";
// import { registerSettingsListeners } from "./settings-listeners";
import { ipcMain } from "electron";

export default function registerListeners(mainWindow: BrowserWindow) {
  addWindowEventListeners(mainWindow);
  addThemeEventListeners();
  registerHostListeners();
  // registerSettingsListeners();

  // 注册环境信息监听器
  ipcMain.handle("app:get-platform", () => process.platform);
  ipcMain.handle(
    "app:is-development",
    () => process.env.NODE_ENV === "development",
  );
  ipcMain.handle(
    "app:get-version",
    () => process.env.npm_package_version || "1.0.0",
  );

  // 可以在这里注册其他模块的监听器
  // registerThemeListeners();
  // registerWindowListeners();
}
