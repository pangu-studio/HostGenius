import React from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  NavigationMenu as NavigationMenuBase,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Home, Network, Settings, Info } from "lucide-react";

export default function NavigationMenu() {
  const { t } = useTranslation();
  return (
    <div className="border-border/40 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
      <div className="container flex h-14 items-center px-4">
        <NavigationMenuBase>
          <NavigationMenuList className="flex space-x-2">
            <NavigationMenuItem>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/" className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>首页</span>
                </Link>
              </Button>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/hosts" className="flex items-center space-x-2">
                  <Network className="h-4 w-4" />
                  <span>{t("hosts.title")}</span>
                </Link>
              </Button>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/second-page" className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>设置</span>
                </Link>
              </Button>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/about" className="flex items-center space-x-2">
                  <Info className="h-4 w-4" />
                  <span>关于</span>
                </Link>
              </Button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenuBase>
      </div>
    </div>
  );
}
