"use client";

import { BarChart3, Bot, Brain, ClipboardPen, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useFilteredAgents } from "@/core/agents";
import { useUser } from "@/core/user";

/** Agent name → 图标映射 */
const agentIconMap: Record<string, LucideIcon> = {
  "hazard-intel": Brain,
  "hazard-input": ClipboardPen,
  "hazard-stats": BarChart3,
};

const agentDisplayNameMap: Record<string, string> = {
  "hazard-intel": "隐患智能助手",
  "hazard-input": "隐患录入助手",
  "hazard-stats": "隐患统计分析助手",
};

export function AgentNavList() {
  const pathname = usePathname();
  const { user } = useUser();
  const { agents } = useFilteredAgents(user?.role);

  if (agents.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>智能体</SidebarGroupLabel>
      <SidebarMenu>
        {agents.map((agent) => {
          const Icon = agentIconMap[agent.name] ?? Bot;
          const displayName =
            agent.display_name ||
            agentDisplayNameMap[agent.name] ||
            agent.name;
          const href = `/workspace/agents/${agent.name}/chats/new`;
          const active = pathname.includes(`/agents/${agent.name}`);
          return (
            <SidebarMenuItem key={agent.name}>
              <SidebarMenuButton
                isActive={active}
                asChild
                tooltip={displayName}
              >
                <Link href={href}>
                  <Icon />
                  <span>{displayName}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
