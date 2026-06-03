import { query, queryOne, execute } from "./connection";

export interface UserRow {
  id: number;
  username: string;
  email: string | null;
  role: string | null;
  created_at: string;
}

export async function getUserById(id: number): Promise<UserRow | null> {
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
): Promise<UserRow> {
  const row = await queryOne<UserRow>(
    `INSERT INTO users (username, email, role)
     VALUES ($1, $2, $3) RETURNING *`,
    [username, email ?? null, role ?? null],
  );
  return row!;
}

export async function upsertUser(
  username: string,
  email?: string,
  role?: string,
): Promise<UserRow> {
  const row = await queryOne<UserRow>(
    `INSERT INTO users (username, email, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (username) DO UPDATE SET email = $2, role = $3
     RETURNING *`,
    [username, email ?? null, role ?? null],
  );
  return row!;
}

export async function updateUser(
  id: number,
  fields: { email?: string; role?: string },
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

  if (setClauses.length === 0) return 0;
  params.push(id);
  return execute(
    `UPDATE users SET ${setClauses.join(", ")} WHERE id = $${idx}`,
    params,
  );
}

export async function deleteUser(id: number): Promise<number> {
  return execute("DELETE FROM users WHERE id = $1", [id]);
}
