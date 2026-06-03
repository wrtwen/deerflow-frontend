import { query, queryOne, execute } from "./connection";

export interface SessionRow {
  id: string;           // UUID
  user_id: string;      // UUID
  thread_id: string | null;
  agent_name: string | null;
  title: string | null;
  summary: Record<string, unknown> | null;
  message_count: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export async function getSessionById(id: string): Promise<SessionRow | null> {
  return queryOne<SessionRow>("SELECT * FROM chat_sessions WHERE id = $1", [id]);
}

export async function getSessionByThreadId(
  threadId: string,
): Promise<SessionRow | null> {
  return queryOne<SessionRow>(
    "SELECT * FROM chat_sessions WHERE thread_id = $1",
    [threadId],
  );
}

/**
 * 获取用户最近 N 个会话（按更新时间降序）
 */
export async function listRecentSessions(
  userId: string,
  limit = 10,
): Promise<SessionRow[]> {
  return query<SessionRow>(
    `SELECT * FROM chat_sessions
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT $2`,
    [userId, limit],
  );
}

export async function listSessionsByUser(
  userId: string,
  limit = 50,
  offset = 0,
): Promise<SessionRow[]> {
  return query<SessionRow>(
    `SELECT * FROM chat_sessions
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
}

/**
 * 创建或忽略会话。
 * 利用 UNIQUE(user_id, thread_id) 约束，同一用户同一 thread 不重复创建。
 * 返回已存在或新创建的会话。
 */
export async function upsertSession(
  userId: string,
  threadId: string,
  agentName?: string,
  title?: string,
): Promise<SessionRow> {
  // 先查是否存在
  const existing = await getSessionByThreadId(threadId);
  if (existing) {
    // 更新 agent_name 和 title（如果提供）
    if (agentName || title) {
      await updateSession(existing.id, { agent_name: agentName, title });
    }
    return (await getSessionByThreadId(threadId))!;
  }

  // 不存在则创建
  const row = await queryOne<SessionRow>(
    `INSERT INTO chat_sessions (user_id, thread_id, agent_name, title)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, thread_id) WHERE thread_id IS NOT NULL
     DO NOTHING
     RETURNING *`,
    [userId, threadId, agentName ?? null, title ?? null],
  );

  // 如果冲突（并发场景），回退到查询
  return row ?? (await getSessionByThreadId(threadId))!;
}

export async function createSession(
  userId: string,
  threadId?: string,
  agentName?: string,
  title?: string,
): Promise<SessionRow> {
  const row = await queryOne<SessionRow>(
    `INSERT INTO chat_sessions (user_id, thread_id, agent_name, title)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, threadId ?? null, agentName ?? null, title ?? null],
  );
  return row!;
}

export async function updateSession(
  id: string,
  fields: {
    title?: string;
    summary?: Record<string, unknown>;
    thread_id?: string;
    agent_name?: string;
    is_archived?: boolean;
  },
): Promise<number> {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (fields.title !== undefined) {
    setClauses.push(`title = $${idx++}`);
    params.push(fields.title);
  }
  if (fields.summary !== undefined) {
    setClauses.push(`summary = $${idx++}`);
    params.push(JSON.stringify(fields.summary));
  }
  if (fields.thread_id !== undefined) {
    setClauses.push(`thread_id = $${idx++}`);
    params.push(fields.thread_id);
  }
  if (fields.agent_name !== undefined) {
    setClauses.push(`agent_name = $${idx++}`);
    params.push(fields.agent_name);
  }
  if (fields.is_archived !== undefined) {
    setClauses.push(`is_archived = $${idx++}`);
    params.push(fields.is_archived);
  }

  if (setClauses.length === 0) return 0;
  // updated_at 由触发器自动维护
  params.push(id);
  return execute(
    `UPDATE chat_sessions SET ${setClauses.join(", ")} WHERE id = $${idx}`,
    params,
  );
}

export async function deleteSession(id: string): Promise<number> {
  return execute("DELETE FROM chat_sessions WHERE id = $1", [id]);
}
