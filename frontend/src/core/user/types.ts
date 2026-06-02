/**
 * AppUser — 业务层用户模型，向后兼容现有 User 类型。
 *
 * 设计意图：
 * - userId   ← User.id（已存在）
 * - userName ← 新增字段，SSO 场景由 IdP claims 填充
 * - email    ← User.email（已存在）
 * - role     ← 扩展现有 system_role，增加工厂业务角色
 *
 * SSO 替换：仅需修改 adapter.ts 中的映射逻辑，类型无需变更。
 */

export type AppRole = "admin" | "manager" | "ehs" | "worker";

export interface AppUser {
  userId: string;
  userName: string;
  email: string;
  role: AppRole;
}

/** 上下文类型 */
export interface AppUserContext {
  user: AppUser | null;
  isReady: boolean;
  isLoading: boolean;
}
