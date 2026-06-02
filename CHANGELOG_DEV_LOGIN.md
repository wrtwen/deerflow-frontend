# CHANGELOG — dev-login + 角色权限过滤

> Tag: `dev-login-stable-20260602`  
> Branch: `dev/custom-factory`  
> Commit: `c095281b`  
> Date: 2026-06-02

---

## 1. 修改目的

为 DeerFlow 定制「工厂安全隐患录入助手」版本，实现以下目标：

- **开发阶段认证绕过**：通过 `/dev-login` 页面切换 Mock 用户，无需后端真实登录
- **角色权限过滤**：基于 `roleAgentMap` 按角色（worker/manager/ehs/admin）过滤可见 Agent
- **SSO 架构预留**：UserProvider / AppUser / adapter 层为未来 SSO 接入提供单一替换点
- **前端与后端联合 Mock**：`DEER_FLOW_AUTH_DISABLED=1` 同时绕过前后端认证

---

## 2. 新增文件列表

| 文件 | 说明 |
|------|------|
| `frontend/src/app/dev-login/page.tsx` | 开发模式登录页，4 个 Mock 用户卡片 |
| `frontend/src/app/workspace/workspace-shell.tsx` | 工作区外壳组件，包裹 UserProvider + SidebarProvider |
| `frontend/src/core/user/UserProvider.tsx` | 业务用户 Provider，消费 AuthProvider 映射 AppUser |
| `frontend/src/core/user/useUser.ts` | `useUser()` hook，消费 UserContext |
| `frontend/src/core/user/types.ts` | AppUser / AppRole 类型定义 |
| `frontend/src/core/user/mock.ts` | 4 个 Mock 用户（张三/李四/王五/admin） |
| `frontend/src/core/user/adapter.ts` | User → AppUser 适配器（SSO 替换点） |
| `frontend/src/core/user/dev-login.ts` | localStorage 读写工具函数 |
| `frontend/src/core/user/index.ts` | user 模块统一导出 |
| `frontend/src/core/agents/permissions.ts` | roleAgentMap 权限配置（单一数据源） |
| `frontend/src/core/threads/history-storage.ts` | localStorage 聊天历史 PoC（按 userId 隔离） |
| `frontend/src/components/workspace/workspace-nav-agent-list.tsx` | 侧边栏动态 Agent 列表（受权限过滤） |

---

## 3. 修改文件列表

### 后端

| 文件 | 修改内容 |
|------|----------|
| `backend/app/gateway/auth_middleware.py` | 新增 `DEER_FLOW_AUTH_DISABLED` 绕过：注入 `_MockUser(id="e2e-user")`，跳过所有认证检查 |
| `docker/docker-compose-dev.yaml` | gateway 服务新增 `DEER_FLOW_AUTH_DISABLED` 环境变量 |

### 前端 — 核心模块

| 文件 | 修改内容 |
|------|----------|
| `frontend/src/env.js` | 新增 `DEER_FLOW_AUTH_DISABLED` 等 3 个环境变量到 server schema + runtimeEnv |
| `frontend/src/core/api/fetcher.ts` | 新增 `isDevMode()` 检测，401 时跳过 `window.location.href` 硬跳转 |
| `frontend/src/core/auth/AuthProvider.tsx` | 新增 `isMockMode` ref，mock 模式下 `refreshUser()` / `logout()` 跳过后端调用 |
| `frontend/src/core/agents/hooks.ts` | 新增 `useFilteredAgents(role)` 按角色过滤 Agent |
| `frontend/src/core/agents/index.ts` | 导出 permissions 模块 |
| `frontend/src/core/threads/hooks.ts` | `onFinish` 中写入 localStorage 历史记录 |
| `frontend/src/core/threads/index.ts` | 导出 history-storage 模块 |

### 前端 — 页面组件

| 文件 | 修改内容 |
|------|----------|
| `frontend/src/components/workspace/workspace-header.tsx` | 重写：显示用户信息 + 角色 badge + 切换按钮；hydration 安全（延迟检测 dev 模式） |
| `frontend/src/components/workspace/workspace-sidebar.tsx` | 新增 AgentNavList 渲染 |
| `frontend/src/components/workspace/agents/agent-gallery.tsx` | 切换为 `useFilteredAgents(user?.role)` |
| `frontend/src/components/workspace/agents/agent-card.tsx` | 使用 display_name 和对应图标 |
| `frontend/src/components/workspace/agent-welcome.tsx` | 使用 display_name 和对应图标 |
| `frontend/src/components/workspace/workspace-content.tsx` | 使用 WorkspaceShell 包裹内容 |
| `frontend/src/components/workspace/workspace-nav-chat-list.tsx` | 优化侧边栏导航文案 |
| `frontend/src/components/workspace/workspace-nav-menu.tsx` | 移除废弃代码 |
| `frontend/src/components/workspace/input-box.tsx` | 优化输入框 |
| `frontend/src/components/workspace/settings/settings-dialog.tsx` | 移除账号栏目，简化为仅外观设置 |
| `frontend/src/components/workspace/settings/appearance-settings-page.tsx` | 优化设置页面 |
| `frontend/src/app/workspace/workspace-content.tsx` | WorkspaceShell 集成 |
| `frontend/src/app/workspace/agents/[agent_name]/chats/[thread_id]/page.tsx` | 移除新对话按钮 |

### 前端 — i18n

| 文件 | 修改内容 |
|------|----------|
| `frontend/src/core/i18n/locales/zh-CN.ts` | 智能体页面文案优化 |
| `frontend/src/core/i18n/locales/en-US.ts` | 英文翻译同步 |

---

## 4. 关键架构变化

### 4.1 认证链路（三层 Mock）

```
浏览器 localStorage             SSR getServerSideUser()        后端 AuthMiddleware
┌──────────────────┐          ┌──────────────────────┐        ┌──────────────────────┐
│ dev-current-user  │          │ DEER_FLOW_AUTH_      │        │ DEER_FLOW_AUTH_      │
│ (dev-login 写入)   │          │ DISABLED=1           │        │ DISABLED=1           │
│        │          │          │   → e2e-user ✅       │        │   → _MockUser ✅     │
│        ▼          │          │                      │        │                      │
│ UserProvider      │◄─────────│ AuthProvider          │        │ set_current_user()   │
│ getDevLoginUser() │          │ initialUser=e2e-user  │        │ (ContextVar)         │
│ → 张三/李四/...   │          │                      │        │                      │
└──────────────────┘          └──────────────────────┘        └──────────────────────┘
```

### 4.2 角色权限过滤链

```
roleAgentMap (单一数据源)
  ├── worker:  [hazard-input]
  ├── manager: [hazard-input, hazard-intel]
  ├── ehs:     [hazard-input, hazard-intel, hazard-stats]
  └── admin:   [hazard-input, hazard-intel, hazard-stats]
       │
       ▼
useFilteredAgents(role)
  → useAgents() → GET /api/agents
  → 按 roleAgentMap 过滤
       │
       ├── AgentGallery（画廊页）
       └── AgentNavList（侧边栏）
```

### 4.3 SSO 替换点

`frontend/src/core/user/adapter.ts` 中的 `mapRole()` 和 `userToAppUser()` 是唯一需要修改的函数。SSO 上线后：

1. `mapRole()` → 改为从 IdP claims 提取角色（如 `groups`、`realm_access`）
2. `userToAppUser()` → 改为从 IdP 用户信息映射
3. 删除 `dev-login.ts` 和 `mock.ts`
4. 删除 `/dev-login` 路由
5. 取消 `DEER_FLOW_AUTH_DISABLED=1`

---

## 5. 已验证通过的功能

| 功能 | 状态 |
|------|------|
| `/dev-login` 页面展示 4 个 Mock 用户 | ✅ |
| 点击用户卡片进入 `/workspace/agents` | ✅ |
| Header 显示当前用户名 + 角色 badge | ✅ |
| 开发模式「切换用户」按钮 | ✅ |
| `worker` 角色仅见 1 个 Agent（hazard-input） | ✅ |
| `manager` 角色可见 2 个 Agent | ✅ |
| `ehs`/`admin` 可见全部 3 个 Agent | ✅ |
| SSR 认证绕过（DEER_FLOW_AUTH_DISABLED） | ✅ |
| 后端 API 认证绕过（同一环境变量） | ✅ |
| 无 401 硬跳转重定向循环 | ✅ |
| 无 SSR hydration mismatch 错误 | ✅ |
| Agent 列表从后端成功加载 | ✅ |
| localStorage 持久化 dev-login 用户 | ✅ |

---

## 6. 部署到生产环境时需要同步的内容

### 6.1 必须删除的功能

| 内容 | 操作 |
|------|------|
| `frontend/src/app/dev-login/` | 删除整个目录 |
| `frontend/src/core/user/dev-login.ts` | 删除 |
| `frontend/src/core/user/mock.ts` | 删除 |
| `.env` 中 `DEER_FLOW_AUTH_DISABLED=1` | 移除 |
| `docker-compose-dev.yaml` 中 `DEER_FLOW_AUTH_DISABLED` | 移除 |
| `frontend/src/components/workspace/workspace-header.tsx` 中切换按钮 | 移除 `devMode` 相关代码 |

### 6.2 必须修改的配置

| 内容 | 操作 |
|------|------|
| `frontend/src/core/user/adapter.ts` | 接入 SSO IdP claims 映射 |
| `roleAgentMap`（`permissions.ts`） | 确认与 SSO 角色体系对齐 |
| Agent config.yaml | 按实际用户 scope 部署 |

### 6.3 必须保留的架构

| 内容 | 说明 |
|------|------|
| `UserProvider` / `useUser()` | 生产核心组件，只需 SSO adapter 替换 |
| `useFilteredAgents()` | 权限过滤逻辑不变 |
| `roleAgentMap` | 权限配置表继续使用 |
| `auth_middleware.py` 代码结构 | 移除 `_MockUser` 分支即可，主逻辑不变 |
| `fetcher.ts` 的 `isDevMode()` | 移除即可，核心 fetch 逻辑不变 |

---

## 7. 回滚方式

### 方式 A：Tag 回滚

```bash
# 回退到此稳定点
git checkout dev-login-stable-20260602

# 或重置当前分支
git reset --hard dev-login-stable-20260602
```

### 方式 B：还原到父提交

```bash
git revert c095281b
```

### 方式 C：逐层关闭

```bash
# 1. 移除环境变量
unset DEER_FLOW_AUTH_DISABLED  # 或在 .env / docker-compose 中注释

# 2. 重启服务
docker compose -p deer-flow-dev -f docker/docker-compose-dev.yaml up -d gateway

# 3. 移除前端路由（可选）
rm -rf frontend/src/app/dev-login
```
