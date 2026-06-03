import { NextResponse } from "next/server";
import {
  getImagesByMessage,
  getImagesBySession,
  addImage,
  deleteImage,
} from "@/core/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("message_id");
    const sessionId = searchParams.get("session_id");

    if (messageId) {
      const images = await getImagesByMessage(messageId);
      return NextResponse.json(images);
    }
    if (sessionId) {
      const images = await getImagesBySession(sessionId);
      return NextResponse.json(images);
    }

    return NextResponse.json(
      { error: "Provide message_id or session_id" },
      { status: 400 },
    );
  } catch (error) {
    console.error("[images GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message_id, image_url, file_name } = body;

    if (!message_id || !image_url) {
      return NextResponse.json(
        { error: "message_id and image_url are required" },
        { status: 400 },
      );
    }

    const image = await addImage(message_id, image_url, file_name);
    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error("[images POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 },
      );
    }

    const count = await deleteImage(id);
    if (count === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ deleted: count });
  } catch (error) {
    console.error("[images DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
