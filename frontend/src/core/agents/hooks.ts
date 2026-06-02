import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAgent,
  deleteAgent,
  getAgent,
  listAgents,
  updateAgent,
} from "./api";
import type { CreateAgentRequest, UpdateAgentRequest } from "./types";
import type { Role } from "./permissions";
import { getPermittedAgents } from "./permissions";

/** 默认角色 — Mock 阶段为 worker；SSO 后替换为 useUser().role */
const DEFAULT_ROLE: Role = "worker";

export function useAgents() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["agents"],
    queryFn: () => listAgents(),
  });
  return { agents: data ?? [], isLoading, error };
}

/**
 * 带角色权限过滤的 Agent 列表 hook。
 *
 * @param role - 当前用户角色。Mock 阶段传硬编码角色，SSO 后改为 `useUser().user?.role`。
 *               不传则使用 DEFAULT_ROLE（"worker"）。
 *
 * 示例：
 *   // Mock 阶段
 *   const { agents } = useFilteredAgents("ehs");
 *
 *   // SSO 阶段
 *   const { user } = useUser();
 *   const { agents } = useFilteredAgents(user?.role);
 */
export function useFilteredAgents(role?: Role) {
  const { agents, isLoading, error } = useAgents();
  const permitted = getPermittedAgents(role ?? DEFAULT_ROLE);

  return {
    agents: agents.filter((a) => permitted.has(a.name)),
    isLoading,
    error,
  };
}

export function useAgent(name: string | null | undefined) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["agents", name],
    queryFn: () => getAgent(name!),
    enabled: !!name,
  });
  return { agent: data ?? null, isLoading, error };
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateAgentRequest) => createAgent(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      request,
    }: {
      name: string;
      request: UpdateAgentRequest;
    }) => updateAgent(name, request),
    onSuccess: (_data, { name }) => {
      void queryClient.invalidateQueries({ queryKey: ["agents"] });
      void queryClient.invalidateQueries({ queryKey: ["agents", name] });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteAgent(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}
