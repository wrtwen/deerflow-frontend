export { query, queryOne, execute, healthCheck, getClient } from "./connection";
export type { UserRow } from "./users";
export type { SessionRow } from "./sessions";
export type { MessageRow, MessageInput } from "./messages";
export type { ImageRow } from "./images";

export {
  getUserById, getUserByUsername, listUsers,
  createUser, upsertUser, updateUser, deleteUser,
} from "./users";

export {
  getSessionById, getSessionByThreadId, listSessionsByUser,
  listRecentSessions, upsertSession,
  createSession, updateSession, deleteSession,
} from "./sessions";

export {
  getMessageById, listMessagesBySession, listRecentMessages,
  countMessages, searchMessages,
  createMessage, batchInsertMessages,
  deleteMessage, deleteMessagesBySession,
} from "./messages";

export {
  getImagesByMessage, getImagesBySession,
  addImage, deleteImage, deleteImagesByMessage,
} from "./images";
