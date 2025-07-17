import { ThemeMode } from "@/types/theme-mode";
import fs from "fs-extra";
import path from "path";
import os from "os";

export interface UserSettings {
  theme: ThemeMode;
  language: string;
}

const defaultSettings: UserSettings = {
  theme: "system",
  language: "zh-CN",
};

export class SettingsStorage {
  private static settingsPath: string;
  private static mediaQueryListener: ((e: MediaQueryListEvent) => void) | null =
    null;
  private static currentSettings: UserSettings | null = null;

  private static getSettingsPath(): string {
    if (!this.settingsPath) {
      const homeDir = os.homedir();
      const dataDir = path.join(homeDir, ".HostGenius");
      fs.ensureDirSync(dataDir);
      this.settingsPath = path.join(dataDir, "settings.json");
    }
    return this.settingsPath;
  }

  static loadSettings(): UserSettings {
    try {
      const settingsPath = this.getSettingsPath();
      if (fs.existsSync(settingsPath)) {
        const stored = fs.readFileSync(settingsPath, "utf-8");
        const parsed = JSON.parse(stored);
        return {
          ...defaultSettings,
          ...parsed,
        };
      }
    } catch (error) {
      console.warn("Failed to load settings from file:", error);
    }
    return defaultSettings;
  }

  static saveSettings(settings: UserSettings): void {
    this.currentSettings = settings;
    try {
      const settingsPath = this.getSettingsPath();
      fs.writeFileSync(
        settingsPath,
        JSON.stringify(settings, null, 2),
        "utf-8",
      );
    } catch (error) {
      console.error("Failed to save settings to file:", error);
    }
  }

  static applyTheme(theme: ThemeMode): void {
    // 只在渲染进程中执行
    if (typeof window === "undefined") return;

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }

  static initializeSettings(): UserSettings {
    const settings = this.loadSettings();
    this.currentSettings = settings;

    // 立即应用主题设置（仅在渲染进程中）
    if (typeof window !== "undefined") {
      this.applyTheme(settings.theme);

      // 清理之前的监听器
      if (this.mediaQueryListener) {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        mediaQuery.removeEventListener("change", this.mediaQueryListener);
      }

      // 创建新的监听器
      this.mediaQueryListener = () => {
        const currentSettings = this.currentSettings || this.loadSettings();
        if (currentSettings.theme === "system") {
          this.applyTheme("system");
        }
      };

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", this.mediaQueryListener);
    }

    return settings;
  }

  static updateSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ): void {
    const currentSettings = this.loadSettings();
    const updatedSettings = {
      ...currentSettings,
      [key]: value,
    };
    this.saveSettings(updatedSettings);
  }
}
