/**
 * 对话历史 localStorage 持久化（PoC）。
 *
 * ═══════════════════════════════════════════════════════════
 *  SSO 上线后：
 *   - getUserId() 改为从 useUser()/cookie 读取
 *   - 可整体替换为后端 API（接口签名不变）
 * ═══════════════════════════════════════════════════════════
 */

import type { Message } from "@langchain/langgraph-sdk";

// ── 类型 ──────────────────────────────────────────────────

export interface LocalChatRecord {
  threadId: string;
  agentName: string;
  title: string;
  messages: Message[];
  createdAt: string; // ISO 8601
}

interface ChatHistoryDoc {
  userId: string;
  chats: LocalChatRecord[];
}

// ── 常量 ──────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = "deerflow.chat-history.";
const MAX_CHATS = 10;

/** PoC 阶段默认 userId；SSO 后改为 user.userId */
let _defaultUserId = "u-001";

// ── 工具函数 ──────────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function readDoc(userId: string): ChatHistoryDoc {
  if (!isBrowser()) return { userId, chats: [] };
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { userId, chats: [] };
    return JSON.parse(raw) as ChatHistoryDoc;
  } catch {
    return { userId, chats: [] };
  }
}

function writeDoc(doc: ChatHistoryDoc): void {
  if (!isBrowser()) return;
  localStorage.setItem(storageKey(doc.userId), JSON.stringify(doc));
}

// ── 公开 API ──────────────────────────────────────────────

/** 设置默认 userId（PoC 阶段由外部注入） */
export function setDefaultUserId(userId: string): void {
  _defaultUserId = userId;
}

export function getDefaultUserId(): string {
  return _defaultUserId;
}

/**
 * 保存一条对话记录。
 * 超过 MAX_CHATS 条时自动移除最旧的。
 */
export function saveChat(userId: string, record: LocalChatRecord): void {
  const doc = readDoc(userId);

  // 去重：同 threadId 覆盖旧记录
  const idx = doc.chats.findIndex((c) => c.threadId === record.threadId);
  if (idx >= 0) {
    doc.chats[idx] = record;
  } else {
    doc.chats.push(record);
  }

  // 超过上限则截断最旧的
  if (doc.chats.length > MAX_CHATS) {
    doc.chats = doc.chats.slice(-MAX_CHATS);
  }

  // 按时间降序排列
  doc.chats.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  writeDoc(doc);
}

/** 获取某用户全部对话历史（按时间降序） */
export function getChatHistory(userId: string): LocalChatRecord[] {
  return readDoc(userId).chats;
}

/** 获取单条对话记录 */
export function getChat(
  userId: string,
  threadId: string,
): LocalChatRecord | undefined {
  return readDoc(userId).chats.find((c) => c.threadId === threadId);
}

/** 删除一条对话记录 */
export function deleteChat(userId: string, threadId: string): void {
  const doc = readDoc(userId);
  doc.chats = doc.chats.filter((c) => c.threadId !== threadId);
  writeDoc(doc);
}

/** 清空某用户全部历史 */
export function clearHistory(userId: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(storageKey(userId));
}

/** 检查 localStorage 是否可用 */
export function isStorageAvailable(): boolean {
  if (!isBrowser()) return false;
  try {
    const testKey = `${STORAGE_KEY_PREFIX}__test__`;
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
