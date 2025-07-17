import React from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Settings as SettingsIcon,
  Palette,
  Globe,
  Info,
  Monitor,
  Sun,
  Moon,
  Check,
  Save,
} from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { ThemeMode } from "@/types/theme-mode";

export default function SettingsPage() {
  const { t } = useTranslation();
  const {
    currentTheme,
    currentLanguage,
    themeOptions,
    languageOptions,
    changeTheme,
    changeLanguage,
    getCurrentThemeLabel,
    getCurrentLanguageLabel,
  } = useSettings();

  const getThemeIcon = (theme: ThemeMode) => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "system":
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* 固定的顶部标题栏 */}
      <div className="bg-background/80 supports-[backdrop-filter]:bg-background/60 border-border/40 sticky top-0 z-40 border-b backdrop-blur">
        <div className="-mt-px flex h-14 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">{t("settings.title")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("settings.description")}
            </p>
          </div>
          <div className="text-muted-foreground flex items-center space-x-2 text-sm">
            <Save className="h-4 w-4" />
            <span>{t("settings.autoSaved")}</span>
          </div>
        </div>
      </div>

      {/* 可滚动的内容区域 */}
      <div className="flex-1 overflow-auto p-6 pb-20">
        <div className="max-w-2xl space-y-6">
          {/* 通用设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SettingsIcon className="h-5 w-5" />
                <span>{t("settings.general.title")}</span>
              </CardTitle>
              <CardDescription>
                {t("settings.general.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 主题设置 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center space-x-2">
                      <Palette className="h-4 w-4" />
                      <span>{t("settings.theme.title")}</span>
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      {t("settings.theme.description")}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {t("settings.theme.currentTheme", {
                      theme: getCurrentThemeLabel(),
                    })}
                  </Badge>
                </div>

                <RadioGroup
                  value={currentTheme}
                  onValueChange={(value) => changeTheme(value as ThemeMode)}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                >
                  {themeOptions.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem
                        value={option.value}
                        id={`theme-${option.value}`}
                      />
                      <Label
                        htmlFor={`theme-${option.value}`}
                        className="hover:bg-accent flex flex-1 cursor-pointer items-center space-x-2 rounded-md border p-3"
                      >
                        {getThemeIcon(option.value as ThemeMode)}
                        <span className="flex-1">{option.label}</span>
                        {currentTheme === option.value && (
                          <Check className="text-primary h-4 w-4" />
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Separator />

              {/* 语言设置 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span>{t("settings.language.title")}</span>
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      {t("settings.language.description")}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {t("settings.language.currentLanguage", {
                      language: getCurrentLanguageLabel(),
                    })}
                  </Badge>
                </div>

                <RadioGroup
                  value={currentLanguage}
                  onValueChange={changeLanguage}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  {languageOptions.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem
                        value={option.value}
                        id={`lang-${option.value}`}
                      />
                      <Label
                        htmlFor={`lang-${option.value}`}
                        className="hover:bg-accent flex flex-1 cursor-pointer items-center space-x-2 rounded-md border p-3"
                      >
                        <span className="text-lg">{option.prefix}</span>
                        <span className="flex-1">{option.label}</span>
                        {currentLanguage === option.value && (
                          <Check className="text-primary h-4 w-4" />
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* 数据管理 */}
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.dataManagement.title")}</CardTitle>
              <CardDescription>
                {t("settings.dataManagement.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  onClick={() => window.electronAPI?.openDataDirectory?.()}
                >
                  {t("settings.dataManagement.openDataDirectory")}
                </Button>
                <Button variant="outline" disabled>
                  {t("settings.dataManagement.clearCache")}{" "}
                  {t("settings.dataManagement.comingSoon")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 关于信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>{t("settings.about.title")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="font-medium">{t("appName")}</span>
                  {/* <span className="text-muted-foreground ml-2">
                    Host Genius
                  </span> */}
                </div>
                <div>
                  <span className="font-medium">
                    {t("settings.about.version")}:
                  </span>
                  <span className="text-muted-foreground ml-2">1.0.0</span>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-muted-foreground text-sm">
                  {t("settings.about.description")}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary">Electron</Badge>
                <Badge variant="secondary">React</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="secondary">Tailwind CSS</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
