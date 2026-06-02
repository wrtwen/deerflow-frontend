/**
 * Agent 角色权限映射。
 *
 * ═══════════════════════════════════════════════════════════
 *  基于 roleAgentMap 配置，每个角色对应一组可访问的 Agent name。
 *  这是权限判断的单一数据源。
 * ═══════════════════════════════════════════════════════════
 *
 * 角色说明：
 *   worker  — 一线工人，只能使用隐患录入
 *   manager — 部门主管，可用录入 + 智能查询
 *   ehs     — 安全专员（EHS），可访问全部
 *   admin   — 系统管理员，可访问全部
 */

export type Role = "admin" | "manager" | "ehs" | "worker";

/**
 * 角色 → 可见 Agent name 列表
 *
 * 修改权限只需改此映射，所有消费方自动生效。
 */
export const roleAgentMap: Record<Role, string[]> = {
  admin:   ["hazard-intel", "hazard-input", "hazard-stats"],
  manager: ["hazard-intel", "hazard-input"],
  ehs:     ["hazard-intel", "hazard-input", "hazard-stats"],
  worker:  ["hazard-input"],
};

/**
 * 获取某个角色允许的 Agent name 集合（O(1) 查找）。
 */
export function getPermittedAgents(role: Role): ReadonlySet<string> {
  return new Set(roleAgentMap[role] ?? []);
}

/**
 * 判断某角色是否能访问指定 Agent。
 */
export function canAccessAgent(role: Role, agentName: string): boolean {
  return getPermittedAgents(role).has(agentName);
}
