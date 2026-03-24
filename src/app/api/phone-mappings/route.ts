import { NextResponse } from "next/server";
import { db } from "@/db";
import { phoneMappings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allMappings = await db.select().from(phoneMappings);
    return NextResponse.json(allMappings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch phone mappings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newMapping = await db.insert(phoneMappings).values(body).returning();
    return NextResponse.json(newMapping[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create phone mapping" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    await db.update(phoneMappings).set(data).where(eq(phoneMappings.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update phone mapping" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await db.delete(phoneMappings).where(eq(phoneMappings.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete phone mapping" }, { status: 500 });
  }
}
