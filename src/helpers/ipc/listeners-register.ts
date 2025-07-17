import { BrowserWindow, ipcMain } from "electron";
import { registerHostListeners } from "./host-listeners";
import { registerSettingsListeners } from "./settings-listeners";
import { addThemeEventListeners } from "./theme/theme-listeners";

// 添加窗口事件监听器
function addWindowEventListeners(window: BrowserWindow) {
  // 只有在传入有效窗口时才注册窗口特定的监听器
  if (!window) return;

  // 这里可以添加窗口特定的监听器
  // 例如：窗口大小变化、焦点变化等
}

// 添加全局IPC监听器
function addGlobalListeners() {
  // 检查是否已经注册过 window:minimize 监听器
  if (ipcMain.listenerCount("window:minimize") === 0) {
    ipcMain.on("window:minimize", () => {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        focusedWindow.minimize();
      }
    });
  }

  // 注册其他全局监听器
  addThemeEventListeners();
  registerHostListeners();
  registerSettingsListeners();
  // registerAppListeners();
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
