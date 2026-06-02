"use client";

import { useContext } from "react";

import { UserContext } from "./UserProvider";

/**
 * useUser — 业务层用户 hook。
 *
 * 替代直接调用 useAuth() 获取 User 的方式。
 *
 * 用法：
 *   const { user, isReady, isLoading } = useUser();
 *   if (!isReady) return <Loading />;
 *   console.log(user.userName, user.role);
 *
 * 与 useAuth() 的区别：
 *   useAuth()  → { id, email, system_role }   （认证关注点）
 *   useUser()  → { userId, userName, role }   （业务关注点）
 */
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a <UserProvider>");
  }
  return context;
}
