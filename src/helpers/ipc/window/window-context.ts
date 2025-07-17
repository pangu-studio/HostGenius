import { contextBridge, ipcRenderer } from "electron";
import {
  WINDOW_CLOSE_CHANNEL,
  WINDOW_MAXIMIZE_CHANNEL,
  WINDOW_MINIMIZE_CHANNEL,
} from "./window-channels";

export function exposeWindowContext() {
  const { contextBridge, ipcRenderer } = window.require("electron");
  contextBridge.exposeInMainWorld("electronWindow", {
    minimize: () => ipcRenderer.invoke(WINDOW_MINIMIZE_CHANNEL),
    maximize: () => ipcRenderer.invoke(WINDOW_MAXIMIZE_CHANNEL),
    close: () => ipcRenderer.invoke(WINDOW_CLOSE_CHANNEL),
  });
}
