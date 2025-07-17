import { ipcMain, type BrowserWindow } from "electron";
import {
  WINDOW_CLOSE_CHANNEL,
  WINDOW_MAXIMIZE_CHANNEL,
  WINDOW_MINIMIZE_CHANNEL,
} from "./window-channels";

export function addWindowEventListeners(mainWindow: BrowserWindow) {
  ipcMain.handle(WINDOW_MINIMIZE_CHANNEL, () => {
    mainWindow.minimize();
  });

  ipcMain.handle(WINDOW_MAXIMIZE_CHANNEL, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle(WINDOW_CLOSE_CHANNEL, () => {
    mainWindow.close();
  });
}
