import { query, queryOne, execute } from "./connection";

export interface ImageRow {
  id: string;          // UUID
  message_id: string;  // UUID
  file_url: string;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export async function getImagesByMessage(
  messageId: string,
): Promise<ImageRow[]> {
  return query<ImageRow>(
    "SELECT * FROM message_attachments WHERE message_id = $1 ORDER BY created_at ASC",
    [messageId],
  );
}

export async function getImagesBySession(
  sessionId: string,
): Promise<ImageRow[]> {
  return query<ImageRow>(
    `SELECT ma.* FROM message_attachments ma
     JOIN chat_messages m ON m.id = ma.message_id
     WHERE m.session_id = $1
     ORDER BY ma.created_at ASC`,
    [sessionId],
  );
}

export async function addImage(
  messageId: string,
  imageUrl: string,
  fileName?: string,
  fileType?: string,
  fileSize?: number,
): Promise<ImageRow> {
  const row = await queryOne<ImageRow>(
    `INSERT INTO message_attachments (message_id, file_url, file_name, file_type, file_size)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [messageId, imageUrl, fileName ?? null, fileType ?? null, fileSize ?? null],
  );
  return row!;
}

export async function deleteImage(id: string): Promise<number> {
  return execute("DELETE FROM message_attachments WHERE id = $1", [id]);
}

export async function deleteImagesByMessage(messageId: string): Promise<number> {
  return execute("DELETE FROM message_attachments WHERE message_id = $1", [messageId]);
}
