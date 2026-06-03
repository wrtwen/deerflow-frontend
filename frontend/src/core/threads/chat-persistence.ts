/**
 * ChatPersistenceService — PostgreSQL 聊天历史持久化
 *
 * 替代 history-storage.ts 的 localStorage PoC 实现。
 * 写入 PostgreSQL，读取优先 PostgreSQL，localStorage 作为快速缓存 fallback。
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

import {
  saveChat as saveChatLocal,
  getChatHistory as getChatHistoryLocal,
  isStorageAvailable,
  type LocalChatRecord,
} from "./history-storage";

// ── 类型 ──────────────────────────────────────────────────

export interface ChatSessionSummary {
  sessionId: string;
  threadId: string;
  agentName: string;
  title: string;
  messageCount: number;
  lastMessage: string | null;
  updatedAt: string;
}

// ── Session ───────────────────────────────────────────────

/** 懒创建或获取会话，并发安全 */
export async function ensureSession(
  userId: string,
  threadId: string,
  agentName?: string,
  title?: string,
): Promise<SessionRow> {
  return upsertSession(userId, threadId, agentName, title);
}

/** 获取用户最近 N 个会话摘要 */
export async function getRecentSessions(
  userId: string,
  limit = 10,
): Promise<ChatSessionSummary[]> {
  const sessions = await listRecentSessions(userId, limit);
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

// ── Messages ──────────────────────────────────────────────

/** 批量保存消息到 PostgreSQL */
export async function saveMessages(
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

    const content =
      typeof m.content === "string"
        ? m.content
        : Array.isArray(m.content)
          ? m.content
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .filter((c: any) => typeof c === "object" && c !== null && "text" in c)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((c: any) => c.text as string)
              .join("\n")
          : JSON.stringify(m.content);

    return {
      user_id: userId,
      role,
      content,
      metadata: { type: m.type },
    };
  });

  return batchInsertMessages(sessionId, inputs);
}

/** 获取会话的所有消息 */
export async function getSessionMessages(
  sessionId: string,
  limit = 50,
): Promise<MessageRow[]> {
  return listMessagesBySession(sessionId, limit);
}

// ── 完整保存 ──────────────────────────────────────────────

/**
 * 保存完整对话记录（session + messages）。
 * 同时保留 localStorage 作为快速缓存 fallback。
 */
export async function saveChatComplete(
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
    console.error("[chat-persistence] Failed to save messages to PostgreSQL:", err);
  }

  // 4. 保留 localStorage 缓存（快速 fallback）
  if (isStorageAvailable()) {
    saveChatLocal(userId, record);
  }
}

/**
 * 获取用户聊天历史列表。
 * 优先从 PostgreSQL 读取；失败时 fallback 到 localStorage。
 */
export async function getChatHistory(
  userId: string,
): Promise<ChatSessionSummary[]> {
  try {
    return await getRecentSessions(userId);
  } catch (err) {
    console.warn(
      "[chat-persistence] PostgreSQL unavailable, falling back to localStorage",
      err,
    );
    const localChats = getChatHistoryLocal(userId);
    return localChats.map((c) => {
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
  }
}

/** 按 threadId 获取会话消息 */
export async function getChatMessagesByThreadId(
  threadId: string,
): Promise<MessageRow[]> {
  const session = await getSessionByThreadId(threadId);
  if (!session) return [];
  return getSessionMessages(session.id);
}
