"use client";

import React, {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/core/auth/AuthProvider";

import type { AppUser } from "./types";
import { userToAppUser, getDevelopmentUser } from "./adapter";
import { getDevLoginUser } from "./dev-login";

/**
 * AppUserContext — 业务层用户上下文。
 *
 * 与 AuthProvider 的关系：
 *   AuthProvider  → 持有 User { id, email, system_role }（认证信息）
 *   UserProvider  → 持有 AppUser { userId, userName, email, role }（业务信息）
 *
 * UserProvider 包裹在 AuthProvider 内部，
 * 通过 useAuth() 消费已验证的 User，再映射为 AppUser。
 */

interface UserContextValue {
  user: AppUser | null;
  isReady: boolean;
  isLoading: boolean;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

/**
 * 业务用户 Provider。
 *
 * 必须置于 <AuthProvider> 内部使用。
 *
 * 数据流：
 *   getServerSideUser() → AuthProvider(initialUser) → useAuth().user
 *     → userToAppUser() → UserContext → useUser()
 */
export function UserProvider({ children }: UserProviderProps) {
  const auth = useAuth();

  // 服务端安全的基础值：localStorage 不可用，用默认 mock 用户。
  // 客户端挂载后通过 useEffect 加载实际 dev-login 用户。
  const baseUser = useMemo((): AppUser | null => {
    if (auth.isLoading || !auth.isAuthenticated || !auth.user) {
      return null;
    }
    if (auth.user.id === "e2e-user") {
      return getDevelopmentUser();
    }
    return userToAppUser(auth.user);
  }, [auth.user, auth.isAuthenticated, auth.isLoading]);

  const [isReady, setIsReady] = useState(false);

  // 挂载后从 localStorage 读取 dev-login 用户（避免 hydration 不匹配）
  useEffect(() => {
    setIsReady(true);
  }, []);

  const value: UserContextValue = useMemo(() => {
    if (auth.isLoading) {
      return { user: null, isReady: false, isLoading: true };
    }
    if (!auth.isAuthenticated || !auth.user) {
      return { user: null, isReady: true, isLoading: false };
    }
    // 挂载后优先读取 dev-login 用户
    if (isReady && auth.user.id === "e2e-user") {
      const devUser = getDevLoginUser();
      return {
        user: devUser ?? baseUser,
        isReady: true,
        isLoading: false,
      };
    }
    return {
      user: baseUser,
      isReady,
      isLoading: false,
    };
  }, [auth.user, auth.isAuthenticated, auth.isLoading, baseUser, isReady]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export { UserContext };
