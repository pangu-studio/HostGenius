import { app, ipcMain } from "electron";
const inDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.BUILD_TYPE === "test";

export function registerAppListeners() {
  ipcMain.handle("get-app-version", () => {
    return app.getVersion();
  });

  // 添加开发环境检查
  ipcMain.handle("app:is-development", () => {
    return inDevelopment;
  });

  // 添加平台信息
  ipcMain.handle("app:get-platform", () => {
    return process.platform;
  });

  // 添加完整版本信息
  ipcMain.handle("app:get-version", () => {
    const baseVersion = app.getVersion();
    if (inDevelopment) {
      return `${baseVersion}-dev`;
    }
    if (isTest) {
      return `${baseVersion}-test`;
    }
    return baseVersion;
  });
}
