import { query, queryOne, execute, getClient } from "./connection";

export interface MessageRow {
  id: string;           // UUID
  session_id: string;   // UUID
  user_id: string | null; // UUID
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  token_count: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/** 批量写入使用的消息输入 */
export interface MessageInput {
  user_id?: string | null;
  role: MessageRow["role"];
  content: string;
  metadata?: Record<string, unknown>;
}

export async function getMessageById(id: string): Promise<MessageRow | null> {
  return queryOne<MessageRow>("SELECT * FROM chat_messages WHERE id = $1", [id]);
}

/**
 * 分页获取会话消息（按时间正序）
 */
export async function listMessagesBySession(
  sessionId: string,
  limit = 50,
  offset = 0,
): Promise<MessageRow[]> {
  return query<MessageRow>(
    `SELECT * FROM chat_messages
     WHERE session_id = $1
     ORDER BY created_at ASC
     LIMIT $2 OFFSET $3`,
    [sessionId, limit, offset],
  );
}

/**
 * 获取会话最近 N 条消息（按时间降序，用于历史列表）
 */
export async function listRecentMessages(
  sessionId: string,
  limit = 10,
): Promise<MessageRow[]> {
  return query<MessageRow>(
    `SELECT * FROM chat_messages
     WHERE session_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [sessionId, limit],
  );
}

/**
 * 获取会话消息总数
 */
export async function countMessages(sessionId: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    "SELECT COUNT(*) as count FROM chat_messages WHERE session_id = $1",
    [sessionId],
  );
  return Number(row?.count ?? 0);
}

/**
 * 全文搜索消息内容
 */
export async function searchMessages(
  searchQuery: string,
  sessionId?: string,
  limit = 20,
  offset = 0,
): Promise<MessageRow[]> {
  const params: unknown[] = [];
  const conditions: string[] = [];

  const words = searchQuery.split(/\s+/).filter(Boolean);
  const likeClauses = words.map((_w, i) => {
    params.push(`%${words[i]}%`);
    return `content ILIKE $${params.length}`;
  });
  conditions.push(`(${likeClauses.join(" AND ")})`);

  if (sessionId !== undefined) {
    conditions.push(`session_id = $${params.length + 1}`);
    params.push(sessionId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return query<MessageRow>(
    `SELECT * FROM chat_messages ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );
}

/**
 * 批量插入消息（单个事务）。
 * message_count 由数据库触发器自动维护。
 */
export async function batchInsertMessages(
  sessionId: string,
  messages: MessageInput[],
): Promise<MessageRow[]> {
  if (messages.length === 0) return [];

  const client = await getClient();
  try {
    await client.query("BEGIN");

    const results: MessageRow[] = [];
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i]!;
      const result = await client.query(
        `INSERT INTO chat_messages (session_id, user_id, role, content, metadata)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          sessionId,
          m.user_id ?? null,
          m.role,
          m.content,
          m.metadata ? JSON.stringify(m.metadata) : null,
        ],
      );
      results.push(result.rows[0] as MessageRow);
    }

    await client.query("COMMIT");
    return results;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function createMessage(
  sessionId: string,
  role: MessageRow["role"],
  content: string,
  userId?: string | null,
  metadata?: Record<string, unknown>,
): Promise<MessageRow> {
  const row = await queryOne<MessageRow>(
    `INSERT INTO chat_messages (session_id, user_id, role, content, metadata)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [sessionId, userId ?? null, role, content, metadata ? JSON.stringify(metadata) : null],
  );
  return row!;
}

export async function deleteMessage(id: string): Promise<number> {
  return execute("DELETE FROM chat_messages WHERE id = $1", [id]);
}

export async function deleteMessagesBySession(sessionId: string): Promise<number> {
  return execute("DELETE FROM chat_messages WHERE session_id = $1", [sessionId]);
}
