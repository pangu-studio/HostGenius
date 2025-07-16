import React from "react";
import DragWindowRegion from "@/components/DragWindowRegion";
import NavigationMenu from "@/components/template/NavigationMenu";
import { Toaster } from "@/components/ui/sonner";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DragWindowRegion title="" />
      <NavigationMenu />
      <main className="h-screen p-2 pb-20">{children}</main>
      <Toaster />
    </>
  );
}
