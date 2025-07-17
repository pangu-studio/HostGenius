import { ipcMain, IpcMainInvokeEvent } from "electron";
import { SettingsStorage } from "@/services/settingsStorage";

export function registerSettingsListeners() {
  // 加载设置
  ipcMain.handle("settings:load", async (): Promise<any> => {
    return SettingsStorage.loadSettings();
  });

  // 保存设置
  ipcMain.handle(
    "settings:save",
    async (event: IpcMainInvokeEvent, settings: any): Promise<void> => {
      SettingsStorage.saveSettings(settings);
    },
  );
}
