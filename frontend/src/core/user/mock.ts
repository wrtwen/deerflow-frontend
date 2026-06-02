import type { AppUser } from "./types";

/**
 * Mock 用户数据集（工厂安全隐患场景）。
 *
 * 切换方式：
 * 1. 设置环境变量 NEXT_PUBLIC_MOCK_USER_ID=zhangsan
 * 2. 或在 adapter.ts 中硬编码 mockUser
 * 3. 接入 SSO 后直接删除本文件
 */
export const MOCK_USERS: Record<string, AppUser> = {
  zhangsan: {
    userId: "u-001",
    userName: "张三",
    email: "zhangsan@factory.local",
    role: "worker",
  },
  lisi: {
    userId: "u-002",
    userName: "李四",
    email: "lisi@factory.local",
    role: "manager",
  },
  wangwu: {
    userId: "u-003",
    userName: "王五",
    email: "wangwu@factory.local",
    role: "ehs",
  },
  admin: {
    userId: "u-000",
    userName: "系统管理员",
    email: "admin@factory.local",
    role: "admin",
  },
};

/** 默认 Mock 用户 */
export function getMockUser(): AppUser {
  const envKey =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_MOCK_USER_ID;
  const key = envKey || "zhangsan";
  return MOCK_USERS[key] ?? MOCK_USERS["zhangsan"]!;
}

/** 按 role 筛选 Mock 用户 */
export function getMockUsersByRole(role: AppUser["role"]): AppUser[] {
  return Object.values(MOCK_USERS).filter((u) => u.role === role);
}
