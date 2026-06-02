/**
 * 开发模式用户切换（PoC）。
 *
 * ═══════════════════════════════════════════════════════════
 *  SSO 上线后整体删除本文件。
 * ═══════════════════════════════════════════════════════════
 */

import type { AppUser } from "./types";

const DEV_USER_KEY = "deerflow.dev-current-user";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** 将开发用户写入 localStorage */
export function setDevLoginUser(user: AppUser): void {
  if (!isBrowser()) return;
  localStorage.setItem(DEV_USER_KEY, JSON.stringify(user));
}

/** 从 localStorage 读取开发用户，不存在返回 null */
export function getDevLoginUser(): AppUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(DEV_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

/** 清除开发登录用户 */
export function clearDevLoginUser(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(DEV_USER_KEY);
}

/** 检查是否处于开发登录模式 */
export function isDevLoginMode(): boolean {
  return getDevLoginUser() !== null;
}
