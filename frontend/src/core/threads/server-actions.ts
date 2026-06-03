"use server";

/**
 * Server Actions — 客户端组件调用 PostgreSQL 的安全边界
 *
 * Next.js Server Actions 在服务端执行，客户端导入时不会将 pg 等 Node.js 模块打包进浏览器 bundle。
 * 所有标记 "use server" 的 async 函数都会被 Next.js 编译为 RPC 端点。
 */

import type { Message } from "@langchain/langgraph-sdk";

import {
  upsertSession,
  listRecentSessions,
  getSessionByThreadId,
  updateSession,
  type SessionRow,
} from "@/core/db/sessions";
import {
  batchInsertMessages,
  listMessagesBySession,
  type MessageInput,
  type MessageRow,
} from "@/core/db/messages";
import type { LocalChatRecord } from "./history-storage";

// ── 类型（与 chat-persistence.ts 相同）──────────────

export interface ChatSessionSummary {
  sessionId: string;
  threadId: string;
  agentName: string;
  title: string;
  messageCount: number;
  lastMessage: string | null;
  updatedAt: string;
}

// ── Session ────────────────────────────────────────

async function ensureSession(
  userId: string,
  threadId: string,
  agentName?: string,
  title?: string,
): Promise<SessionRow> {
  return upsertSession(userId, threadId, agentName, title);
}

// ── Messages ───────────────────────────────────────

async function saveMessages(
  sessionId: string,
  messages: Message[],
  userId?: string | null,
): Promise<MessageRow[]> {
  const inputs: MessageInput[] = messages.map((m) => {
    const role: MessageInput["role"] =
      m.type === "human"
        ? "user"
        : m.type === "ai"
          ? "assistant"
          : m.type === "system"
            ? "system"
            : "tool";

    let content = "";
    if (typeof m.content === "string") {
      content = m.content;
    } else if (Array.isArray(m.content)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content = (m.content as any[])
        .filter((c: any) => typeof c === "object" && c !== null && "text" in c)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((c: any) => c.text as string)
        .join("\n");
    } else {
      content = JSON.stringify(m.content);
    }

    return {
      user_id: userId,
      role,
      content,
      metadata: { type: m.type },
    };
  });

  return batchInsertMessages(sessionId, inputs);
}

// ── 完整保存 ───────────────────────────────────────

/**
 * 保存完整对话记录（session + messages）到 PostgreSQL。
 * 客户端通过 Server Action RPC 调用，在服务端执行数据库操作。
 */
export async function saveChatCompleteAction(
  userId: string,
  record: LocalChatRecord,
): Promise<void> {
  const { threadId, agentName, title, messages } = record;

  // 1. 确保 session 存在
  const session = await ensureSession(userId, threadId, agentName, title);

  // 2. 更新标题（LangGraph 生成后可能有变化）
  if (title && title !== session.title) {
    try {
      await updateSession(session.id, { title });
    } catch {
      // 标题更新非关键路径
    }
  }

  // 3. 批量写入消息
  try {
    await saveMessages(session.id, messages, userId);
  } catch (err) {
    console.error("[server-actions] Failed to save messages:", err);
  }
}

// ── 读取 ───────────────────────────────────────────

/**
 * 获取用户聊天历史列表（仅 PostgreSQL）。
 * 客户端应自行处理 localStorage fallback。
 */
export async function getChatHistoryAction(
  userId: string,
): Promise<ChatSessionSummary[]> {
  const sessions = await listRecentSessions(userId, 10);
  return sessions.map((s) => ({
    sessionId: s.id,
    threadId: s.thread_id ?? "",
    agentName: s.agent_name ?? "",
    title: s.title ?? "新对话",
    messageCount: s.message_count,
    lastMessage: null,
    updatedAt: s.updated_at,
  }));
}

/** 按 threadId 获取会话消息 */
export async function getChatMessagesByThreadIdAction(
  threadId: string,
): Promise<MessageRow[]> {
  const session = await getSessionByThreadId(threadId);
  if (!session) return [];
  return listMessagesBySession(session.id);
}
