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
  getChatHistoryAction,
  type ChatSessionSummary,
} from "@/core/threads/server-actions";
import {
  getDefaultUserId,
  getChatHistory as getLocalChatHistory,
} from "@/core/threads/history-storage";

export function WorkspaceNavChatList() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [recentChats, setRecentChats] = useState<ChatSessionSummary[]>([]);

  useEffect(() => {
    const userId = getDefaultUserId();
    getChatHistoryAction(userId)
      .then(setRecentChats)
      .catch((err) => {
        console.warn("[nav-chat-list] PostgreSQL unavailable, falling back to localStorage:", err);
        // fallback 到 localStorage
        const localChats = getLocalChatHistory(userId);
        const summaries: ChatSessionSummary[] = localChats.map((c) => {
          const lastMsg = c.messages.length > 0 ? c.messages[c.messages.length - 1] : undefined;
          return {
            sessionId: c.threadId,
            threadId: c.threadId,
            agentName: c.agentName,
            title: c.title || "新对话",
            messageCount: c.messages.length,
            lastMessage:
              lastMsg && typeof lastMsg.content === "string"
                ? lastMsg.content.slice(0, 100)
                : null,
            updatedAt: c.createdAt,
          };
        });
        setRecentChats(summaries);
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
