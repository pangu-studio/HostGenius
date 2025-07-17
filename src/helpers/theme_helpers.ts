import { ThemeMode } from "@/types/theme-mode";

export interface ThemePreferences {
  system: ThemeMode;
  local: ThemeMode | null;
}

export async function getCurrentTheme(): Promise<ThemePreferences> {
  const currentTheme = await window.themeMode.current();

  try {
    // 优先从electron设置获取
    if (window.electronAPI?.loadSettings) {
      const settings = await window.electronAPI.loadSettings();
      return {
        system: currentTheme,
        local: settings.theme || null,
      };
    }

    // 降级到localStorage
    const localTheme = localStorage.getItem("theme") as ThemeMode | null;
    return {
      system: currentTheme,
      local: localTheme,
    };
  } catch (error) {
    console.warn("Failed to get theme from settings:", error);
    const localTheme = localStorage.getItem("theme") as ThemeMode | null;
    return {
      system: currentTheme,
      local: localTheme,
    };
  }
}

export async function setTheme(newTheme: ThemeMode) {
  switch (newTheme) {
    case "dark":
      await window.themeMode.dark();
      updateDocumentTheme(true);
      break;
    case "light":
      await window.themeMode.light();
      updateDocumentTheme(false);
      break;
    case "system": {
      const isDarkMode = await window.themeMode.system();
      updateDocumentTheme(isDarkMode);
      break;
    }
  }

  try {
    // 优先保存到electron设置
    if (window.electronAPI?.loadSettings && window.electronAPI?.saveSettings) {
      const settings = await window.electronAPI.loadSettings();
      await window.electronAPI.saveSettings({ ...settings, theme: newTheme });
    } else {
      // 降级到localStorage
      localStorage.setItem("theme", newTheme);
    }
  } catch (error) {
    console.warn("Failed to save theme to settings:", error);
    localStorage.setItem("theme", newTheme);
  }
}

export async function toggleTheme() {
  const isDarkMode = await window.themeMode.toggle();
  const newTheme = isDarkMode ? "dark" : "light";

  updateDocumentTheme(isDarkMode);
  localStorage.setItem("theme", newTheme);
}

export async function syncThemeWithLocal() {
  const { local } = await getCurrentTheme();
  if (!local) {
    setTheme("system");
    return;
  }

  await setTheme(local);
}

function updateDocumentTheme(isDarkMode: boolean) {
  if (!isDarkMode) {
    document.documentElement.classList.remove("dark");
  } else {
    document.documentElement.classList.add("dark");
  }
}
