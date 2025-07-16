import type { BrowserWindow } from "electron";
import { registerHostListeners } from "./host-listeners";
import { addWindowEventListeners } from "./window/window-listeners";
import { addThemeEventListeners } from "./theme/theme-listeners";

export default function registerListeners(mainWindow: BrowserWindow) {
  addWindowEventListeners(mainWindow);
  addThemeEventListeners();
  // 注册Host相关的IPC监听器
  registerHostListeners();

  // 可以在这里注册其他模块的监听器
  // registerThemeListeners();
  // registerWindowListeners();
}
