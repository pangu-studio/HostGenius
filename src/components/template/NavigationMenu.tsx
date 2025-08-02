import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Network,
  Settings,
  ChevronLeft,
  ChevronRight,
  Monitor,
} from "lucide-react";
import { cn } from "@/utils/tailwind";

export default function NavigationMenu() {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [appVersion, setAppVersion] = useState<string>("1.0.0");
  const [isDevelopment, setIsDevelopment] = useState<boolean>(false);

  const navigationItems = [
    {
      to: "/",
      icon: Monitor,
      label: t("titleHomePage"),
      key: "home",
    },
    {
      to: "/hosts",
      icon: Network,
      label: t("hosts.title"),
      key: "hosts",
    },
    {
      to: "/settings",
      icon: Settings,
      label: t("settings.title"),
      key: "settings",
    },
  ];

  React.useEffect(() => {
    const getAppVersion = async () => {
      try {
        const version = await window.electronAPI?.getVersion?.();
        const devMode = await window.electronAPI?.isDevelopment?.();
        if (version) {
          setAppVersion(version);
        }
        if (devMode !== undefined) {
          setIsDevelopment(devMode);
        }
      } catch (error) {
        console.error("Failed to get app version:", error);
      }
    };

    getAppVersion();
  }, []);

  return (
    <div
      className={cn(
        "bg-background border-border/40 flex h-full flex-col border-r transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* 顶部标题和折叠按钮 */}
      <div className="border-border/40 flex h-14 items-center border-b px-4">
        {!isCollapsed && (
          <div className="flex-1">
            <h2 className="text-lg font-semibold" id="logo" data-testid="logo">
              Host Genius
            </h2>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hover:bg-accent"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 导航菜单 */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                to={item.to}
                className={cn(
                  "hover:bg-accent hover:text-accent-foreground flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "[&.active]:bg-accent [&.active]:text-accent-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    !isCollapsed && "mr-3",
                  )}
                />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      {/* 底部信息 */}
      {!isCollapsed && (
        <>
          <Separator />
          <div className="text-muted-foreground font-tomorrow p-4 text-xs uppercase">
            <p>
              版本 {appVersion}
              {isDevelopment && (
                <span className="ml-1 rounded bg-orange-100 px-1 py-0.5 text-xs text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  TEST
                </span>
              )}
            </p>
            <p>© 2025 Pangu Studio</p>
          </div>
        </>
      )}
    </div>
  );
}
