import { BrowserWindow, ipcMain } from "electron";
import { registerHostListeners } from "./host-listeners";
import { registerSettingsListeners } from "./settings-listeners";
import { addThemeEventListeners } from "./theme/theme-listeners";
import { addWindowEventListeners } from "./window/window-listeners";

// 添加全局IPC监听器
function addGlobalListeners() {
  // 检查是否已经注册过 window:minimize 监听器
  if (ipcMain.listenerCount("window:minimize") === 0) {
    ipcMain.handle("window:minimize", () => {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        focusedWindow.minimize();
      }
    });

    ipcMain.handle("window:maximize", () => {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        if (focusedWindow.isMaximized()) {
          focusedWindow.unmaximize();
        } else {
          focusedWindow.maximize();
        }
      }
    });

    ipcMain.handle("window:close", () => {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        focusedWindow.close();
      }
    });
  }

  // 注册其他全局监听器
  addThemeEventListeners();
  registerHostListeners();
  registerSettingsListeners();
}

export default function registerListeners(window: BrowserWindow | null) {
  if (window) {
    // 注册窗口特定的监听器
    addWindowEventListeners(window);
  } else {
    // 注册全局监听器
    addGlobalListeners();
  }
}
