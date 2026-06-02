"use client";

import {
  SettingsIcon,
  UserCog,
  HardHat,
  Shield,
  UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useUser, isDevLoginMode } from "@/core/user";

const roleConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  admin:   { label: "管理员", icon: UserCog },
  manager: { label: "主管",   icon: UserCog },
  ehs:     { label: "安全专员", icon: Shield },
  worker:  { label: "工人",   icon: HardHat },
};

export function WorkspaceHeader({
  className,
  onOpenSettings,
}: {
  className?: string;
  onOpenSettings?: () => void;
}) {
  const { user } = useUser();
  const router = useRouter();
  // 延迟检测：服务端渲染时 localStorage 不可用，统一返回 false 避免 hydration 不匹配；
  // 客户端挂载后再通过 useEffect 更新实际值。
  const [devMode, setDevMode] = useState(false);
  useEffect(() => {
    setDevMode(isDevLoginMode());
  }, []);
  const config = user ? roleConfig[user.role] : null;
  const Icon = config?.icon ?? UserIcon;

  return (
    <header
      className={cn(
        "flex h-12 shrink-0 items-center justify-between border-b px-3",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger className="size-8 [&>svg]:size-5" />
        <div className="text-primary cursor-default font-serif text-sm font-semibold">
          AI智能隐患录入助手
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* 用户信息（仅开发模式显示切换按钮） */}
        {user && (
          <div className="flex items-center gap-1.5">
            {devMode && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => router.push("/dev-login")}
                title="切换用户"
              >
                切换
              </Button>
            )}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="size-3.5" />
              <span className="font-medium">{user.userName}</span>
              {config && (
                <span className="rounded bg-muted px-1 py-0.5 text-[10px]">
                  {config.label}
                </span>
              )}
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onOpenSettings}
          aria-label="设置"
        >
          <SettingsIcon className="size-4" />
        </Button>
      </div>
    </header>
  );
}
