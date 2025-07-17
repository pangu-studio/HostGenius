import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
// import { syncThemeWithLocal } from "./helpers/theme_helpers";
import { useTranslation } from "react-i18next";
import "./localization/i18n";
// import { updateAppLanguage } from "./helpers/language_helpers";
import { router } from "./routes/router";
import { RouterProvider } from "@tanstack/react-router";
// import { SettingsProvider } from "@/components/SettingsProvider";

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // // 确保 DOM 加载完成后再初始化主题和语言
    // const initializeApp = () => {
    //   syncThemeWithLocal();
    //   updateAppLanguage(i18n);
    // };
    // if (document.readyState === "loading") {
    //   document.addEventListener("DOMContentLoaded", initializeApp);
    // } else {
    //   initializeApp();
    // }
    // return () => {
    //   document.removeEventListener("DOMContentLoaded", initializeApp);
    // };
  }, [i18n]);

  return (
    // <SettingsProvider>
    <RouterProvider router={router} />
    // </SettingsProvider>
  );
}

const root = createRoot(document.getElementById("app")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
