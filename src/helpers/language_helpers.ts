import type { i18n } from "i18next";

export function setAppLanguage(lang: string, i18n: i18n) {
  // 移除localStorage操作，现在由useSettings统一管理
  i18n.changeLanguage(lang);
  document.documentElement.lang = lang;
}

export async function updateAppLanguage(i18n: i18n) {
  try {
    // 如果electron API可用，从设置文件获取
    if (window.electronAPI?.loadSettings) {
      const settings = await window.electronAPI.loadSettings();
      const savedLang = settings.language;
      if (savedLang) {
        i18n.changeLanguage(savedLang);
        document.documentElement.lang = savedLang;
      }
      return;
    }

    // 降级到localStorage
    const localLang = localStorage.getItem("lang");
    if (localLang) {
      i18n.changeLanguage(localLang);
      document.documentElement.lang = localLang;
    }
  } catch (error) {
    console.warn("Failed to update app language:", error);
  }
}
