"use client";

import { InfoIcon } from "lucide-react";
import { useEffect, useState } from "react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useI18n } from "@/core/i18n/hooks";

import { SettingsDialog } from "./settings";

export function WorkspaceNavMenu() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
      <SidebarMenu className="w-full">
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={() => setSettingsOpen(true)}
          >
            <InfoIcon className="text-muted-foreground size-4" />
            <span>外观</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
