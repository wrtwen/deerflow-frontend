/**
 * 业务用户 ID → PostgreSQL UUID 静态映射（PoC）
 *
 * 仅包含纯数据映射，不导入任何 DB 模块，可在客户端安全使用。
 * PG UUID 解析由 Server Action 在服务端完成。
 *
 * ═══════════════════════════════════════════════════════════
 *  SSO 上线后删除本文件，替换为实时用户查询。
 * ═══════════════════════════════════════════════════════════
 */

/** 业务 userId → PostgreSQL users.id (UUID) */
export const BIZ_USER_ID_TO_PG_UUID: Record<string, string> = {
  "u-001": "70935fab-1163-4115-9da1-0ee45f1e9e2a", // zhangsan
  "u-002": "1188c408-2e0a-4e25-85ab-d81f15aff085", // lisi
  "u-003": "cab931da-5ee1-4ee4-b6c5-6f08c5f34e56", // wangwu
};

/** 业务 userId → PostgreSQL username */
export const BIZ_USER_ID_TO_USERNAME: Record<string, string> = {
  "u-001": "zhangsan",
  "u-002": "lisi",
  "u-003": "wangwu",
};

/** 同步解析：业务 userId → PostgreSQL UUID */
export function resolvePgUserId(businessUserId: string): string | null {
  return BIZ_USER_ID_TO_PG_UUID[businessUserId] ?? null;
}

/** 同步解析：业务 userId → PostgreSQL username */
export function resolvePgUsername(businessUserId: string): string | null {
  return BIZ_USER_ID_TO_USERNAME[businessUserId] ?? null;
}
