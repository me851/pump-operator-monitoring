import { NextResponse } from "next/server";
import { db } from "@/db";
import { schemes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allSchemes = await db.select().from(schemes);
    return NextResponse.json(allSchemes);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch schemes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newScheme = await db.insert(schemes).values(body).returning();
    return NextResponse.json(newScheme[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create scheme" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    await db.update(schemes).set(data).where(eq(schemes.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update scheme" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await db.delete(schemes).where(eq(schemes.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete scheme" }, { status: 500 });
  }
}
