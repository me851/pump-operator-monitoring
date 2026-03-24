import { NextResponse } from "next/server";
import { db } from "@/db";
import { pumpHouses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allPumpHouses = await db.select().from(pumpHouses);
    return NextResponse.json(allPumpHouses);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch pump houses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newPumpHouse = await db.insert(pumpHouses).values(body).returning();
    return NextResponse.json(newPumpHouse[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create pump house" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    await db.update(pumpHouses).set(data).where(eq(pumpHouses.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update pump house" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await db.delete(pumpHouses).where(eq(pumpHouses.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete pump house" }, { status: 500 });
  }
}
