import type { User } from "@/core/auth/types";

import type { AppUser, AppRole } from "./types";
import { getMockUser } from "./mock";

/**
 * User → AppUser 适配器。
 *
 * ═══════════════════════════════════════════════════════════
 *  这里是 SSO 接入的唯一替换点。
 *  接入 SSO 后，只需修改 mapRole / userToAppUser 即可，
 *  AppUser 类型和所有消费方无需任何变动。
 * ═══════════════════════════════════════════════════════════
 */

/**
 * 将 system_role 映射为业务角色。
 * SSO 场景：替换为从 IdP claims 中提取 role（如 groups、realm_access）。
 */
function mapRole(systemRole: string | undefined): AppRole {
  switch (systemRole) {
    case "admin":
      return "admin";
    case "manager":
      return "manager";
    case "ehs":
      return "ehs";
    case "user":
      return "worker";
    default:
      return "worker";
  }
}

/**
 * 从 User.email 提取用户名。
 * SSO 场景：替换为 IdP 的 preferred_username / name / given_name。
 */
function deriveUserName(user: User): string {
  // 优先用 email 前缀作为用户名
  const atIndex = user.email.indexOf("@");
  if (atIndex > 0) {
    return user.email.slice(0, atIndex);
  }
  return user.email;
}

/**
 * 将后端 User 转为业务 AppUser。
 *
 * @param user - 来自 AuthProvider 的已验证用户
 * @returns 富化的 AppUser（含 userName、业务角色）
 */
export function userToAppUser(user: User): AppUser {
  return {
    userId: user.id,
    userName: deriveUserName(user),
    email: user.email,
    role: mapRole(user.system_role),
  };
}

/**
 * 获取当前用户（Mock 模式）。
 * 当 DEER_FLOW_AUTH_DISABLED=1 时使用，绕过后端认证。
 *
 * SSO 场景：此函数会被删除，统一走 userToAppUser。
 */
export function getDevelopmentUser(): AppUser {
  // 尝试从 AuthProvider 已有的 mock user 映射
  return getMockUser();
}
