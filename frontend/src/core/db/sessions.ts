import { query, queryOne, execute } from "./connection";

export interface SessionRow {
  id: number;
  user_id: number;
  thread_id: string | null;
  agent_name: string | null;
  summary: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export async function getSessionById(id: number): Promise<SessionRow | null> {
  return queryOne<SessionRow>("SELECT * FROM sessions WHERE id = $1", [id]);
}

export async function getSessionByThreadId(
  threadId: string,
): Promise<SessionRow | null> {
  return queryOne<SessionRow>(
    "SELECT * FROM sessions WHERE thread_id = $1",
    [threadId],
  );
}

export async function listSessionsByUser(
  userId: number,
  limit = 50,
  offset = 0,
): Promise<SessionRow[]> {
  return query<SessionRow>(
    `SELECT * FROM sessions
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
}

export async function createSession(
  userId: number,
  threadId?: string,
  agentName?: string,
  summary?: Record<string, unknown>,
): Promise<SessionRow> {
  const row = await queryOne<SessionRow>(
    `INSERT INTO sessions (user_id, thread_id, agent_name, summary)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, threadId ?? null, agentName ?? null, summary ? JSON.stringify(summary) : null],
  );
  return row!;
}

export async function updateSession(
  id: number,
  fields: {
    summary?: Record<string, unknown>;
    thread_id?: string;
    agent_name?: string;
  },
): Promise<number> {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

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

  if (setClauses.length === 0) return 0;
  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
  params.push(id);
  return execute(
    `UPDATE sessions SET ${setClauses.join(", ")} WHERE id = $${idx}`,
    params,
  );
}

export async function deleteSession(id: number): Promise<number> {
  // messages + message_images cascade automatically via ON DELETE CASCADE
  return execute("DELETE FROM sessions WHERE id = $1", [id]);
}
