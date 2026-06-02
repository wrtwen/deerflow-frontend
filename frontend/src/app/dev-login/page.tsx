"use client";

import { useRouter } from "next/navigation";
import {
  Shield,
  UserCog,
  HardHat,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  setDevLoginUser,
  MOCK_USERS,
  type AppUser,
} from "@/core/user";

const userList: AppUser[] = [
  MOCK_USERS["zhangsan"]!,
  MOCK_USERS["lisi"]!,
  MOCK_USERS["wangwu"]!,
  MOCK_USERS["admin"]!,
];

const roleBadge: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  worker:  { label: "工人",    icon: HardHat },
  manager: { label: "主管",    icon: UserCog },
  ehs:     { label: "安全专员", icon: Shield },
  admin:   { label: "管理员",  icon: UserCog },
};

const roleAgentPreview: Record<string, string> = {
  worker:  "仅可见：隐患录入助手",
  manager: "可见：隐患录入助手、隐患智能助手",
  ehs:     "可见：全部 3 个智能体",
  admin:   "可见：全部 3 个智能体",
};

export default function DevLoginPage() {
  const router = useRouter();

  const handleSelect = (user: AppUser) => {
    setDevLoginUser(user);
    router.push("/workspace/agents");
  };

  const handleClear = () => {
    localStorage.removeItem("deerflow.dev-current-user");
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-12 rounded-xl bg-primary/10">
            <Shield className="size-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            开发模式 · 用户切换
          </h1>
          <p className="text-muted-foreground text-sm">
            选择一个 Mock 用户以验证角色权限过滤
          </p>
        </div>

        {/* User Cards */}
        <div className="space-y-2">
          {userList.map((user) => {
            const badge = roleBadge[user.role];
            if (!badge) return null;
            const Icon = badge.icon;
            return (
              <button
                key={user.userId}
                onClick={() => handleSelect(user)}
                className="flex w-full items-center gap-4 rounded-lg border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {user.userName}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs mt-0.5 truncate">
                    {roleAgentPreview[user.role] ?? ""}
                  </p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-xs">
            当前用户存在 localStorage 中，刷新后保持登录状态
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground text-xs"
          >
            清除登录状态
          </Button>
        </div>
      </div>
    </div>
  );
}
