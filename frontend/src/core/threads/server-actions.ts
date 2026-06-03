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
import { resolvePgUserId } from "@/core/user/user-id-map";
import type { LocalChatRecord } from "./history-storage";

// ── 类型 ──────────────────────────────────────────

export interface ChatSessionSummary {
  sessionId: string;
  threadId: string;
  agentName: string;
  title: string;
  messageCount: number;
  lastMessage: string | null;
  updatedAt: string;
}

// ── 内部工具 ──────────────────────────────────────

function formatError(err: unknown): string {
  if (err instanceof Error) {
    return `${err.name}: ${err.message}\n${err.stack ?? ""}`;
  }
  return String(err);
}

// ── Session ───────────────────────────────────────

async function ensureSession(
  pgUserId: string,
  threadId: string,
  agentName?: string,
  title?: string,
): Promise<SessionRow> {
  return upsertSession(pgUserId, threadId, agentName, title);
}

// ── Messages ──────────────────────────────────────

async function saveMessages(
  sessionId: string,
  messages: Message[],
  pgUserId?: string | null,
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
      user_id: pgUserId,
      role,
      content,
      metadata: { type: m.type },
    };
  });

  return batchInsertMessages(sessionId, inputs);
}

// ── 完整保存 ──────────────────────────────────────

/**
 * 保存完整对话记录到 PostgreSQL。
 *
 * @param businessUserId - 业务用户 ID（如 "u-001", "u-002"）
 *                         由 Server Action 在服务端解析为 PostgreSQL UUID
 * @param record - 聊天记录
 * @throws 若无法解析 PG UUID 或 DB 写入失败
 */
export async function saveChatCompleteAction(
  businessUserId: string,
  record: LocalChatRecord,
): Promise<void> {
  // 1. 解析 PG UUID
  const pgUserId = resolvePgUserId(businessUserId);
  if (!pgUserId) {
    const msg = `[server-actions] Cannot resolve PostgreSQL UUID for business user: "${businessUserId}". Check BIZ_USER_ID_TO_PG_UUID mapping.`;
    console.error(msg);
    throw new Error(msg);
  }

  const { threadId, agentName, title, messages } = record;

  // 2. 确保 session 存在
  let session: SessionRow;
  try {
    session = await ensureSession(pgUserId, threadId, agentName, title);
  } catch (err) {
    console.error(
      `[server-actions] upsertSession FAILED: pgUserId=${pgUserId} threadId=${threadId}`,
      formatError(err),
    );
    throw err;
  }

  // 3. 更新标题
  if (title && title !== session.title) {
    try {
      await updateSession(session.id, { title });
    } catch (err) {
      console.error(
        `[server-actions] updateSession title FAILED: sessionId=${session.id}`,
        formatError(err),
      );
    }
  }

  // 4. 批量写入消息
  try {
    const saved = await saveMessages(session.id, messages, pgUserId);
    console.log(
      `[server-actions] saveChatComplete SUCCESS: ` +
        `user=${businessUserId} pgUserId=${pgUserId} session=${session.id} msgs=${saved.length}`,
    );
  } catch (err) {
    console.error(
      `[server-actions] saveMessages FAILED: sessionId=${session.id} msgCount=${messages.length}`,
      formatError(err),
    );
    throw err;
  }
}

// ── 读取 ──────────────────────────────────────────

/**
 * 获取用户聊天历史列表（仅 PostgreSQL）。
 * 客户端应自行处理 localStorage fallback。
 *
 * @param businessUserId - 业务用户 ID
 */
export async function getChatHistoryAction(
  businessUserId: string,
): Promise<ChatSessionSummary[]> {
  const pgUserId = resolvePgUserId(businessUserId);
  if (!pgUserId) {
    console.error(
      `[server-actions] Cannot resolve PG UUID for getChatHistory: "${businessUserId}"`,
    );
    return [];
  }

  const sessions = await listRecentSessions(pgUserId, 10);
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
