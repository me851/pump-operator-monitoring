import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_FILE = join(process.cwd(), "data", "aqualog_data.json");

interface AppData {
  divisions: Array<{ id: string; name: string }>;
  schemes: Array<{ id: string; name: string; divisionId: string }>;
  pumpHouses: Array<{ id: string; name: string; schemeId: string }>;
  phoneMappings: Array<{ id: string; pumpHouseId: string; phoneNumber: string; operatorName: string }>;
  operations: Array<Record<string, unknown>>;
  settings: Record<string, string>;
}

const DEFAULT_DATA: AppData = {
  divisions: [],
  schemes: [],
  pumpHouses: [],
  phoneMappings: [],
  operations: [],
  settings: {},
};

function readData(): AppData {
  if (!existsSync(DATA_FILE)) {
    const dir = join(process.cwd(), "data");
    if (!existsSync(dir)) {
      require("fs").mkdirSync(dir, { recursive: true });
    }
    writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
    return DEFAULT_DATA;
  }
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return DEFAULT_DATA;
  }
}

function writeData(data: AppData): void {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export function getAllData(): AppData {
  return readData();
}

export function saveAllData(data: Partial<AppData>): void {
  const current = readData();
  writeData({ ...current, ...data });
}

export function addItem(type: keyof AppData, item: Record<string, unknown>): void {
  const data = readData();
  if (Array.isArray(data[type])) {
    (data[type] as Array<Record<string, unknown>>).push(item);
    writeData(data);
  }
}

export function updateItem(type: keyof AppData, id: string, updates: Record<string, unknown>): void {
  const data = readData();
  if (Array.isArray(data[type])) {
    const index = (data[type] as Array<Record<string, unknown>>).findIndex((i) => i.id === id);
    if (index !== -1) {
      (data[type] as Array<Record<string, unknown>>)[index] = { ...(data[type] as Array<Record<string, unknown>>)[index], ...updates };
      writeData(data);
    }
  }
}

export function deleteItem(type: keyof AppData, id: string): void {
  const data = readData();
  if (Array.isArray(data[type])) {
    (data[type] as Array<Record<string, unknown>>) = (data[type] as Array<Record<string, unknown>>).filter((i) => i.id !== id);
    writeData(data);
  }
}

export function setSetting(key: string, value: string): void {
  const data = readData();
  data.settings[key] = value;
  writeData(data);
}
