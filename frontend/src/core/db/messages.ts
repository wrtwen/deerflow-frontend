import { query, queryOne, execute } from "./connection";

export interface MessageRow {
  id: number;
  session_id: number;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export async function getMessageById(id: number): Promise<MessageRow | null> {
  return queryOne<MessageRow>("SELECT * FROM messages WHERE id = $1", [id]);
}

/**
 * 分页获取会话消息（按时间正序）
 */
export async function listMessagesBySession(
  sessionId: number,
  limit = 50,
  offset = 0,
): Promise<MessageRow[]> {
  return query<MessageRow>(
    `SELECT * FROM messages
     WHERE session_id = $1
     ORDER BY created_at ASC
     LIMIT $2 OFFSET $3`,
    [sessionId, limit, offset],
  );
}

/**
 * 获取会话消息总数
 */
export async function countMessages(sessionId: number): Promise<number> {
  const row = await queryOne<{ count: string }>(
    "SELECT COUNT(*) as count FROM messages WHERE session_id = $1",
    [sessionId],
  );
  return Number(row?.count ?? 0);
}

/**
 * 全文搜索消息内容。
 *
 * 使用 ILIKE + pg_trgm 索引同时支持中英文搜索。
 * pg_trgm GIN 索引对 ILIKE '%keyword%' 有效加速。
 */
export async function searchMessages(
  searchQuery: string,
  sessionId?: number,
  limit = 20,
  offset = 0,
): Promise<MessageRow[]> {
  const params: unknown[] = [];
  const conditions: string[] = [];

  // 为每个搜索词创建 ILIKE 条件（支持中文分词）
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
    `SELECT * FROM messages ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );
}

export async function createMessage(
  sessionId: number,
  role: MessageRow["role"],
  content: string,
  metadata?: Record<string, unknown>,
): Promise<MessageRow> {
  const row = await queryOne<MessageRow>(
    `INSERT INTO messages (session_id, role, content, metadata)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [sessionId, role, content, metadata ? JSON.stringify(metadata) : null],
  );
  return row!;
}

export async function deleteMessage(id: number): Promise<number> {
  // message_images cascade via ON DELETE CASCADE
  return execute("DELETE FROM messages WHERE id = $1", [id]);
}

export async function deleteMessagesBySession(sessionId: number): Promise<number> {
  return execute("DELETE FROM messages WHERE session_id = $1", [sessionId]);
}
