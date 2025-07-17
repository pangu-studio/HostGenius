import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ThemeMode } from "@/types/theme-mode";
import { getCurrentTheme, setTheme } from "@/helpers/theme_helpers";
import { setAppLanguage } from "@/helpers/language_helpers";
import langs from "@/localization/langs";

interface UserSettings {
  theme: ThemeMode;
  language: string;
}

export function useSettings() {
  const { i18n, t } = useTranslation();
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("system");
  const [currentLanguage, setCurrentLanguage] = useState<string>("zh-CN");

  // 加载设置
  const loadSettings = useCallback(async (): Promise<UserSettings> => {
    try {
      return await window.electronAPI.loadSettings();
    } catch (error) {
      console.error("Failed to load settings:", error);
      return { theme: "system", language: "zh-CN" };
    }
  }, []);

  // 保存设置
  const saveSettings = useCallback(async (settings: UserSettings) => {
    try {
      await window.electronAPI.saveSettings(settings);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }, []);

  // 初始化当前设置
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        const settings = await loadSettings();
        const theme = await getCurrentTheme();
        setCurrentTheme(settings.theme || theme.local || theme.system);
        setCurrentLanguage(settings.language || i18n.language);
      } catch (error) {
        console.error("Failed to initialize settings:", error);
      }
    };

    initializeSettings();
  }, [loadSettings, i18n.language]);

  // 切换主题
  const changeTheme = useCallback(
    async (newTheme: ThemeMode) => {
      try {
        await setTheme(newTheme);
        setCurrentTheme(newTheme);

        const settings = await loadSettings();
        await saveSettings({ ...settings, theme: newTheme });
      } catch (error) {
        console.error("Failed to change theme:", error);
      }
    },
    [loadSettings, saveSettings],
  );

  // 切换语言
  const changeLanguage = useCallback(
    async (newLanguage: string) => {
      try {
        const settings = await loadSettings();
        await saveSettings({ ...settings, language: newLanguage });
        setAppLanguage(newLanguage, i18n);
        setCurrentLanguage(newLanguage);
      } catch (error) {
        console.error("Failed to change language:", error);
      }
    },
    [i18n, loadSettings, saveSettings],
  );

  // 获取可用主题选项
  const themeOptions = [
    { value: "light", label: t("settings.theme.light") },
    { value: "dark", label: t("settings.theme.dark") },
    { value: "system", label: t("settings.theme.system") },
  ] as const;

  // 获取可用语言选项
  const languageOptions = langs.map((lang) => ({
    value: lang.key,
    label: lang.nativeName,
    prefix: lang.prefix,
  }));

  // 获取当前主题显示名称
  const getCurrentThemeLabel = () => {
    const option = themeOptions.find((opt) => opt.value === currentTheme);
    return option?.label || currentTheme;
  };

  // 获取当前语言显示名称
  const getCurrentLanguageLabel = () => {
    const lang = langs.find((l) => l.key === currentLanguage);
    return lang ? `${lang.prefix} ${lang.nativeName}` : currentLanguage;
  };

  return {
    currentTheme,
    currentLanguage,
    themeOptions,
    languageOptions,
    changeTheme,
    changeLanguage,
    getCurrentThemeLabel,
    getCurrentLanguageLabel,
  };
}
