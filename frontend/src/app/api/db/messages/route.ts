import { NextResponse } from "next/server";
import {
  listMessagesBySession,
  countMessages,
  searchMessages,
  createMessage,
  deleteMessage,
} from "@/core/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    const search = searchParams.get("search");
    const limit = Number(searchParams.get("limit") ?? 50);
    const offset = Number(searchParams.get("offset") ?? 0);

    // 全文搜索
    if (search) {
      const sid = sessionId ? Number(sessionId) : undefined;
      const messages = await searchMessages(search, sid, limit, offset);
      return NextResponse.json(messages);
    }

    // 按会话分页查询
    if (sessionId) {
      const [messages, total] = await Promise.all([
        listMessagesBySession(Number(sessionId), limit, offset),
        countMessages(Number(sessionId)),
      ]);
      return NextResponse.json({ messages, total });
    }

    return NextResponse.json(
      { error: "Provide session_id or search query" },
      { status: 400 },
    );
  } catch (error) {
    console.error("[messages GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, role, content, metadata } = body;

    if (!session_id || !role || content === undefined) {
      return NextResponse.json(
        { error: "session_id, role, and content are required" },
        { status: 400 },
      );
    }

    if (!["user", "assistant", "system", "tool"].includes(role)) {
      return NextResponse.json(
        { error: "role must be user, assistant, system, or tool" },
        { status: 400 },
      );
    }

    const message = await createMessage(session_id, role, content, metadata);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("[messages POST]", error);
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

    const count = await deleteMessage(Number(id));
    if (count === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ deleted: count });
  } catch (error) {
    console.error("[messages DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
