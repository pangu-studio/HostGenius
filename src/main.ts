import { test } from "vitest";
import { app, BrowserWindow, ipcMain } from "electron";
import registerListeners from "./helpers/ipc/listeners-register";
import path from "path";
import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";

const inDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.BUILD_TYPE === "test";

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

// 只在生产发布时启用自动更新
// if (inDevelopment || !isRelease) {
//   console.log("开发模式：跳过自动更新检查");
// } else {
updateElectronApp({
  updateSource: {
    type: UpdateSourceType.StaticStorage,
    baseUrl: `https://pangu-updater.oss-cn-hongkong.aliyuncs.com/host-genius/${process.platform}/${process.arch}`,
  },
});
// }

// 设置应用名称，覆盖默认 "Electron"
app.setName("Host Genius");
let mainWindow: BrowserWindow | null;
let globalListenersRegistered = false; // 全局监听器注册标志

// 注册全局IPC监听器（只注册一次）
function setupGlobalListeners() {
  if (globalListenersRegistered) {
    return;
  }

  // 注册所有IPC监听器（包括 window:minimize）
  registerListeners(null); // 传入 null 表示全局注册
  globalListenersRegistered = true;
}

function createWindow() {
  const preload = path.join(__dirname, "preload.js");

  // 根据平台设置不同的标题栏样式
  const titleBarStyle =
    process.platform === "darwin" ? "hiddenInset" : "hidden";

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Host Genius",
    webPreferences: {
      devTools: inDevelopment,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,
      preload: preload,
    },
    titleBarStyle: titleBarStyle,
    show: false,
  });

  // 确保窗口标题
  mainWindow.setTitle("Host Genius");

  // 只注册窗口特定的监听器
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // 窗口准备好后显示
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  // 窗口关闭时处理
  mainWindow.on("closed", () => {
    mainWindow = null;
    // 在非 macOS 平台上，清理全局监听器
    if (process.platform !== "darwin") {
      ipcMain.removeAllListeners();
      globalListenersRegistered = false;
    }
  });

  return mainWindow;
}

async function installExtensions() {
  try {
    const result = await installExtension(REACT_DEVELOPER_TOOLS);
    console.log(`Extensions installed successfully: ${result.name}`);
  } catch {
    console.error("Failed to install extensions");
  }
}

app.whenReady().then(() => {
  // 首先注册全局监听器
  setupGlobalListeners();

  // 然后创建窗口
  createWindow();

  if (inDevelopment) {
    installExtensions();
  }
});

// macOS specific
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
    // 全局监听器已经注册，不需要重新注册
  }
});

app.on("before-quit", () => {
  // 应用退出前清理所有监听器
  ipcMain.removeAllListeners();
  globalListenersRegistered = false;
});
// osX only ends
// osX only ends
// osX only ends
// osX only ends
