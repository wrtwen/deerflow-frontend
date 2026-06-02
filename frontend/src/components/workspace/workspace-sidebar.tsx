"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarRail,
} from "@/components/ui/sidebar";

import { WorkspaceNavChatList } from "./workspace-nav-chat-list";
import { AgentNavList } from "./workspace-nav-agent-list";

export function WorkspaceSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props}>
      <SidebarContent>
        <WorkspaceNavChatList />
        <AgentNavList />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
