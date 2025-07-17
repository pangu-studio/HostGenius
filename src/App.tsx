import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "react-i18next";
import "./localization/i18n";
import { i18nInstance } from "./localization/i18n";
import { router } from "./routes/router";
import { RouterProvider } from "@tanstack/react-router";
import { syncThemeWithLocal } from "./helpers/theme_helpers";
import { updateAppLanguage } from "./helpers/language_helpers";

function App() {
  const { i18n } = useTranslation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 等待i18n初始化完成
    const initializeApp = async () => {
      try {
        await i18nInstance;
        syncThemeWithLocal();
        await updateAppLanguage(i18n);
        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize app:", error);
        setIsReady(true); // 即使失败也要显示应用
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializeApp);
    } else {
      initializeApp();
    }

    return () => {
      document.removeEventListener("DOMContentLoaded", initializeApp);
    };
  }, [i18n]);

  if (!isReady) {
    return <div>Loading...</div>;
  }

  return <RouterProvider router={router} />;
}

const root = createRoot(document.getElementById("app")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
