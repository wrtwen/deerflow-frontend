import { NextResponse } from "next/server";
import {
  listUsers,
  getUserById,
  getUserByUsername,
  upsertUser,
  deleteUser,
} from "@/core/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const username = searchParams.get("username");

    if (id) {
      const user = await getUserById(Number(id));
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json(user);
    }
    if (username) {
      const user = await getUserByUsername(username);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json(user);
    }

    const users = await listUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error("[users GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, role } = body;

    if (!username) {
      return NextResponse.json(
        { error: "username is required" },
        { status: 400 },
      );
    }

    const user = await upsertUser(username, email, role);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("[users POST]", error);
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
        { error: "id query parameter is required" },
        { status: 400 },
      );
    }

    const count = await deleteUser(Number(id));
    if (count === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ deleted: count });
  } catch (error) {
    console.error("[users DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
