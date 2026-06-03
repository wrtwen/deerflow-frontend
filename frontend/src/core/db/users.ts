import { query, queryOne, execute } from "./connection";

export interface UserRow {
  id: string;          // UUID
  username: string;
  email: string | null;
  display_name: string | null;
  role: string | null;
  oauth_provider: string | null;
  oauth_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getUserById(id: string): Promise<UserRow | null> {
  return queryOne<UserRow>("SELECT * FROM users WHERE id = $1", [id]);
}

export async function getUserByUsername(
  username: string,
): Promise<UserRow | null> {
  return queryOne<UserRow>("SELECT * FROM users WHERE username = $1", [
    username,
  ]);
}

export async function listUsers(): Promise<UserRow[]> {
  return query<UserRow>("SELECT * FROM users ORDER BY created_at DESC");
}

export async function createUser(
  username: string,
  email?: string,
  role?: string,
  displayName?: string,
): Promise<UserRow> {
  const row = await queryOne<UserRow>(
    `INSERT INTO users (username, email, role, display_name)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [username, email ?? null, role ?? null, displayName ?? null],
  );
  return row!;
}

export async function upsertUser(
  username: string,
  email?: string,
  role?: string,
  displayName?: string,
): Promise<UserRow> {
  const row = await queryOne<UserRow>(
    `INSERT INTO users (username, email, role, display_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (username) DO UPDATE
       SET email = $2, role = $3, display_name = $4
     RETURNING *`,
    [username, email ?? null, role ?? null, displayName ?? null],
  );
  return row!;
}

export async function updateUser(
  id: string,
  fields: { email?: string; role?: string; display_name?: string },
): Promise<number> {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (fields.email !== undefined) {
    setClauses.push(`email = $${idx++}`);
    params.push(fields.email);
  }
  if (fields.role !== undefined) {
    setClauses.push(`role = $${idx++}`);
    params.push(fields.role);
  }
  if (fields.display_name !== undefined) {
    setClauses.push(`display_name = $${idx++}`);
    params.push(fields.display_name);
  }

  if (setClauses.length === 0) return 0;
  params.push(id);
  return execute(
    `UPDATE users SET ${setClauses.join(", ")} WHERE id = $${idx}`,
    params,
  );
}

export async function deleteUser(id: string): Promise<number> {
  return execute("DELETE FROM users WHERE id = $1", [id]);
}
