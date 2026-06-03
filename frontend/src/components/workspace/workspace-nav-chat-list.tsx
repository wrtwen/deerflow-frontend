"use client";

import { MessageSquareIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useI18n } from "@/core/i18n/hooks";
import {
  getChatHistory,
  type ChatSessionSummary,
} from "@/core/threads/chat-persistence";
import { getDefaultUserId } from "@/core/threads/history-storage";

export function WorkspaceNavChatList() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [recentChats, setRecentChats] = useState<ChatSessionSummary[]>([]);

  useEffect(() => {
    const userId = getDefaultUserId();
    getChatHistory(userId)
      .then(setRecentChats)
      .catch(() => {
        // fallback 到 localStorage 已由 getChatHistory 内部处理
      });
  }, []);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t.sidebar.agents}</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={pathname === "/workspace/agents"}
            asChild
          >
            <Link href="/workspace/agents">
              <MessageSquareIcon />
              <span>全部智能体</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* 最近会话列表 */}
        {recentChats.slice(0, 10).map((chat) => (
          <SidebarMenuItem key={chat.threadId}>
            <SidebarMenuButton
              isActive={pathname === `/workspace/agents/hazard-input/chats/${chat.threadId}`}
              asChild
            >
              <Link
                href={`/workspace/agents/hazard-input/chats/${chat.threadId}`}
              >
                <span className="truncate text-xs">
                  {chat.title || "新对话"}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
