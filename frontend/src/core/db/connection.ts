import type { PoolClient as PoolClientType } from "pg";

// 使用动态 require 绕过 Turbopack 对 pnpm symlink 的 CJS/ESM 模块解析缓存问题
const pg = require("pg") as { Pool: new (...args: unknown[]) => { query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number | null }>; connect: () => Promise<PoolClientType> } };

interface PoolInstance {
  query(text: string, params?: unknown[]): Promise<{ rows: unknown[]; rowCount: number | null }>;
  connect(): Promise<PoolClientType>;
}

let _pool: PoolInstance | null = null;

function getPool(): PoolInstance {
  if (!_pool) {
    _pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }) as unknown as PoolInstance;
  }
  return _pool;
}

export type { PoolClientType as PoolClient };

export async function getClient(): Promise<PoolClientType> {
  return getPool().connect();
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const result = await getPool().query(text, params);
  return (result.rows[0] as T) ?? null;
}

export async function execute(
  text: string,
  params?: unknown[],
): Promise<number> {
  const result = await getPool().query(text, params);
  return result.rowCount ?? 0;
}

export async function healthCheck(): Promise<boolean> {
  try {
    await getPool().query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
