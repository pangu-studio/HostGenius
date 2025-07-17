import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ThemeMode } from "@/types/theme-mode";
import { getCurrentTheme, setTheme } from "@/helpers/theme_helpers";
import { setAppLanguage } from "@/helpers/language_helpers";
import langs from "@/localization/langs";

export function useSettings() {
  const { i18n, t } = useTranslation();
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("system");
  const [currentLanguage, setCurrentLanguage] = useState<string>("en");

  // 初始化当前设置
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        const theme = await getCurrentTheme();
        setCurrentTheme(theme.local || theme.system);
        setCurrentLanguage(i18n.language);
      } catch (error) {
        console.error("Failed to initialize settings:", error);
      }
    };

    initializeSettings();
  }, [i18n.language]);

  // 切换主题
  const changeTheme = useCallback(async (newTheme: ThemeMode) => {
    try {
      await setTheme(newTheme);
      setCurrentTheme(newTheme);
    } catch (error) {
      console.error("Failed to change theme:", error);
    }
  }, []);

  // 切换语言
  const changeLanguage = useCallback(
    (newLanguage: string) => {
      try {
        setAppLanguage(newLanguage, i18n);
        setCurrentLanguage(newLanguage);
      } catch (error) {
        console.error("Failed to change language:", error);
      }
    },
    [i18n],
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
