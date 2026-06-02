"use client";

import { useState } from "react";
import { Toaster } from "sonner";

import { SidebarProvider } from "@/components/ui/sidebar";
import { CommandPalette } from "@/components/workspace/command-palette";
import { SettingsDialog } from "@/components/workspace/settings";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { UserProvider } from "@/core/user";

export function WorkspaceShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <UserProvider>
      <SidebarProvider>
        <WorkspaceSidebar />
        <div className="flex h-screen w-full flex-col">
          <WorkspaceHeader onOpenSettings={() => setSettingsOpen(true)} />
          <div className="flex-1 overflow-auto">{children}</div>
          <SettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
          />
          <CommandPalette />
          <Toaster position="top-center" />
        </div>
      </SidebarProvider>
    </UserProvider>
  );
}
