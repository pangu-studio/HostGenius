import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ThemeMode } from "@/types/theme-mode";

interface UserSettings {
  theme: ThemeMode;
  language: string;
}

const SETTINGS_KEY = "hostgenius-settings";

const defaultSettings: UserSettings = {
  theme: "system",
  language: "zh-CN",
};

const loadSettings = (): UserSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...defaultSettings,
        ...parsed,
      };
    }
  } catch (error) {
    console.warn("Failed to load settings from localStorage:", error);
  }
  return defaultSettings;
};

const applyTheme = (theme: ThemeMode) => {
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
};

interface SettingsProviderProps {
  children: React.ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { i18n } = useTranslation();

  useEffect(() => {
    // 在应用启动时立即加载并应用设置
    const settings = loadSettings();

    // 应用主题设置
    applyTheme(settings.theme);

    // 应用语言设置
    if (settings.language !== i18n.language) {
      i18n.changeLanguage(settings.language);
    }

    // 监听系统主题变化
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (settings.theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () =>
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [i18n]);

  return <>{children}</>;
}
