import React from "react";
import ToggleTheme from "@/components/ToggleTheme";
import { useTranslation } from "react-i18next";
import LangToggle from "@/components/LangToggle";
import Footer from "@/components/template/Footer";
import InitialIcons from "@/components/template/InitialIcons";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <InitialIcons />
        <div className="text-center">
          <h1 className="font-mono text-4xl font-bold">{t("appName")}</h1>
          <p
            className="text-muted-foreground mt-2 text-lg"
            data-testid="pageTitle"
          >
            {t("titleHomePage")}
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <LangToggle />
          <ToggleTheme />
        </div>
      </div>
      <Footer />
    </div>
  );
}
