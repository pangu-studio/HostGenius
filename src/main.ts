import { app, BrowserWindow } from "electron";
import registerListeners from "./helpers/ipc/listeners-register";
import path from "path";
import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
// import { SettingsStorage } from "./services/settingsStorage";

const inDevelopment = process.env.NODE_ENV === "development";

// 设置应用名称，覆盖默认 "Electron"
app.setName("Host Genius");

function createWindow() {
  const preload = path.join(__dirname, "preload.js");
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Host Genius", // 设置窗口标题
    webPreferences: {
      devTools: inDevelopment,
      contextIsolation: true,
      nodeIntegration: true, // 确保为 true
      nodeIntegrationInSubFrames: false,
      preload: preload,
    },
    titleBarStyle: "hidden",
    show: false, // 先不显示，等ready后再show
  });

  // 确保窗口标题
  mainWindow.setTitle("Host Genius");

  registerListeners(mainWindow);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // 窗口准备好后显示
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
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
  }
});
// osX only ends
// osX only ends
