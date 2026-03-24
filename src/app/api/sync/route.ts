import { NextResponse } from "next/server";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_FILE = join(process.cwd(), "data.json");

interface AppData {
  divisions: unknown[];
  schemes: unknown[];
  pumpHouses: unknown[];
  phoneMappings: unknown[];
  operations: unknown[];
  settings: unknown;
  lastSync?: string;
}

function readData(): AppData {
  if (!existsSync(DATA_FILE)) {
    return { divisions: [], schemes: [], pumpHouses: [], phoneMappings: [], operations: [], settings: {} };
  }
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return { divisions: [], schemes: [], pumpHouses: [], phoneMappings: [], operations: [], settings: {} };
  }
}

function writeData(data: AppData): void {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  const data = readData();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const clientData = await request.json();
    const serverData = readData();
    
    const merged: AppData = {
      divisions: clientData.divisions || serverData.divisions,
      schemes: clientData.schemes || serverData.schemes,
      pumpHouses: clientData.pumpHouses || serverData.pumpHouses,
      phoneMappings: clientData.phoneMappings || serverData.phoneMappings,
      operations: clientData.operations || serverData.operations,
      settings: clientData.settings || serverData.settings,
      lastSync: new Date().toISOString(),
    };
    
    writeData(merged);
    return NextResponse.json({ success: true, lastSync: merged.lastSync });
  } catch (error) {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}