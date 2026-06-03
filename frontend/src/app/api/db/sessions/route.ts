import { NextResponse } from "next/server";
import {
  listSessionsByUser,
  getSessionById,
  getSessionByThreadId,
  createSession,
  updateSession,
  deleteSession,
} from "@/core/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const threadId = searchParams.get("thread_id");
    const userId = searchParams.get("user_id");
    const limit = Number(searchParams.get("limit") ?? 50);
    const offset = Number(searchParams.get("offset") ?? 0);

    if (id) {
      const session = await getSessionById(id);
      if (!session)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(session);
    }
    if (threadId) {
      const session = await getSessionByThreadId(threadId);
      if (!session)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(session);
    }
    if (userId) {
      const sessions = await listSessionsByUser(userId, limit, offset);
      return NextResponse.json(sessions);
    }

    return NextResponse.json(
      { error: "Provide id, thread_id, or user_id" },
      { status: 400 },
    );
  } catch (error) {
    console.error("[sessions GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, thread_id, agent_name, summary } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 },
      );
    }

    const session = await createSession(
      user_id,
      thread_id,
      agent_name,
      summary,
    );
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("[sessions POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, summary, thread_id, agent_name } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 },
      );
    }

    const count = await updateSession(id, {
      summary,
      thread_id,
      agent_name,
    });
    if (count === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ updated: count });
  } catch (error) {
    console.error("[sessions PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    const count = await deleteSession(id);
    if (count === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ deleted: count });
  } catch (error) {
    console.error("[sessions DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
