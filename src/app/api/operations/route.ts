import { NextResponse } from "next/server";
import { db } from "@/db";
import { operations } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const allOperations = await db.select().from(operations);
    return NextResponse.json(allOperations);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch operations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newOperation = await db.insert(operations).values({
      ...body,
      createdAt: new Date().toISOString(),
    }).returning();
    return NextResponse.json(newOperation[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create operation" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    await db.update(operations).set(data).where(eq(operations.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update operation" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await db.delete(operations).where(eq(operations.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete operation" }, { status: 500 });
  }
}
