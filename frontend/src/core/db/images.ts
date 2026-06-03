import { query, queryOne, execute } from "./connection";

export interface ImageRow {
  id: number;
  message_id: number;
  image_url: string;
  file_name: string | null;
  uploaded_at: string;
}

export async function getImagesByMessage(
  messageId: number,
): Promise<ImageRow[]> {
  return query<ImageRow>(
    "SELECT * FROM message_images WHERE message_id = $1 ORDER BY uploaded_at ASC",
    [messageId],
  );
}

export async function getImagesBySession(
  sessionId: number,
): Promise<ImageRow[]> {
  return query<ImageRow>(
    `SELECT mi.* FROM message_images mi
     JOIN messages m ON m.id = mi.message_id
     WHERE m.session_id = $1
     ORDER BY mi.uploaded_at ASC`,
    [sessionId],
  );
}

export async function addImage(
  messageId: number,
  imageUrl: string,
  fileName?: string,
): Promise<ImageRow> {
  const row = await queryOne<ImageRow>(
    `INSERT INTO message_images (message_id, image_url, file_name)
     VALUES ($1, $2, $3) RETURNING *`,
    [messageId, imageUrl, fileName ?? null],
  );
  return row!;
}

export async function deleteImage(id: number): Promise<number> {
  return execute("DELETE FROM message_images WHERE id = $1", [id]);
}

export async function deleteImagesByMessage(messageId: number): Promise<number> {
  return execute("DELETE FROM message_images WHERE message_id = $1", [messageId]);
}
