import { NextResponse } from "next/server";
import { db } from "@/db";
import { divisions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allDivisions = await db.select().from(divisions);
    return NextResponse.json(allDivisions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch divisions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newDivision = await db.insert(divisions).values(body).returning();
    return NextResponse.json(newDivision[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create division" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    await db.update(divisions).set(data).where(eq(divisions.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update division" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await db.delete(divisions).where(eq(divisions.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete division" }, { status: 500 });
  }
}
