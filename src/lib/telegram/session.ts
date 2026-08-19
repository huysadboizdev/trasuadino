import { UserConversationSession, ConversationFlow } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __TELEGRAM_SESSIONS__: Map<string, UserConversationSession> | undefined;
}

if (!global.__TELEGRAM_SESSIONS__) {
  global.__TELEGRAM_SESSIONS__ = new Map<string, UserConversationSession>();
}

const sessions = global.__TELEGRAM_SESSIONS__;
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 phút không hoạt động sẽ tự hủy state

export function getConversationSession(telegramUserId: string | number): UserConversationSession {
  const key = String(telegramUserId);
  const now = Date.now();
  const existing = sessions.get(key);

  if (existing) {
    if (now - existing.lastActive > SESSION_TTL_MS) {
      sessions.delete(key);
    } else {
      existing.lastActive = now;
      return existing;
    }
  }

  const newSession: UserConversationSession = {
    telegramUserId: key,
    flow: "IDLE",
    lastActive: now,
  };
  sessions.set(key, newSession);
  return newSession;
}

export function setConversationSession(
  telegramUserId: string | number,
  updates: Partial<UserConversationSession>
) {
  const current = getConversationSession(telegramUserId);
  const updated: UserConversationSession = {
    ...current,
    ...updates,
    lastActive: Date.now(),
  };
  sessions.set(String(telegramUserId), updated);
  return updated;
}

export function clearConversationSession(telegramUserId: string | number) {
  sessions.delete(String(telegramUserId));
}
