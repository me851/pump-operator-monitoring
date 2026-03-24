"use client";

import { Division, Scheme, PumpHouse, PhoneMapping, PumpOperation } from "@/types";

const STORAGE_KEYS = {
  divisions: "aqualog_divisions",
  schemes: "aqualog_schemes",
  pumpHouses: "aqualog_pumphouses",
  phoneMappings: "aqualog_phone_mappings",
  operations: "aqualog_operations",
  settings: "aqualog_settings",
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function getDivisions(): Division[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.divisions);
  return data ? JSON.parse(data) : [];
}

export function saveDivision(division: Omit<Division, "id">): Division {
  const divisions = getDivisions();
  const newDivision: Division = { ...division, id: generateId() };
  divisions.push(newDivision);
  localStorage.setItem(STORAGE_KEYS.divisions, JSON.stringify(divisions));
  return newDivision;
}

export function updateDivision(division: Division): void {
  const divisions = getDivisions();
  const index = divisions.findIndex((d) => d.id === division.id);
  if (index !== -1) {
    divisions[index] = division;
    localStorage.setItem(STORAGE_KEYS.divisions, JSON.stringify(divisions));
  }
}

export function deleteDivision(id: string): void {
  const divisions = getDivisions().filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEYS.divisions, JSON.stringify(divisions));
  const schemes = getSchemes().filter((s) => s.divisionId !== id);
  localStorage.setItem(STORAGE_KEYS.schemes, JSON.stringify(schemes));
  const schemeIds = getSchemes()
    .filter((s) => s.divisionId === id)
    .map((s) => s.id);
  const pumpHouses = getPumpHouses().filter(
    (p) => !schemeIds.includes(p.schemeId)
  );
  localStorage.setItem(STORAGE_KEYS.pumpHouses, JSON.stringify(pumpHouses));
}

export function getSchemes(): Scheme[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.schemes);
  return data ? JSON.parse(data) : [];
}

export function getSchemesByDivision(divisionId: string): Scheme[] {
  return getSchemes().filter((s) => s.divisionId === divisionId);
}

export function saveScheme(scheme: Omit<Scheme, "id">): Scheme {
  const schemes = getSchemes();
  const newScheme: Scheme = { ...scheme, id: generateId() };
  schemes.push(newScheme);
  localStorage.setItem(STORAGE_KEYS.schemes, JSON.stringify(schemes));
  return newScheme;
}

export function updateScheme(scheme: Scheme): void {
  const schemes = getSchemes();
  const index = schemes.findIndex((s) => s.id === scheme.id);
  if (index !== -1) {
    schemes[index] = scheme;
    localStorage.setItem(STORAGE_KEYS.schemes, JSON.stringify(schemes));
  }
}

export function deleteScheme(id: string): void {
  const schemes = getSchemes().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.schemes, JSON.stringify(schemes));
  const pumpHouses = getPumpHouses().filter((p) => p.schemeId !== id);
  localStorage.setItem(STORAGE_KEYS.pumpHouses, JSON.stringify(pumpHouses));
}

export function getPumpHouses(): PumpHouse[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.pumpHouses);
  return data ? JSON.parse(data) : [];
}

export function getPumpHousesByScheme(schemeId: string): PumpHouse[] {
  return getPumpHouses().filter((p) => p.schemeId === schemeId);
}

export function savePumpHouse(pumpHouse: Omit<PumpHouse, "id">): PumpHouse {
  const pumpHouses = getPumpHouses();
  const newPumpHouse: PumpHouse = { ...pumpHouse, id: generateId() };
  pumpHouses.push(newPumpHouse);
  localStorage.setItem(STORAGE_KEYS.pumpHouses, JSON.stringify(pumpHouses));
  return newPumpHouse;
}

export function updatePumpHouse(pumpHouse: PumpHouse): void {
  const pumpHouses = getPumpHouses();
  const index = pumpHouses.findIndex((p) => p.id === pumpHouse.id);
  if (index !== -1) {
    pumpHouses[index] = pumpHouse;
    localStorage.setItem(STORAGE_KEYS.pumpHouses, JSON.stringify(pumpHouses));
  }
}

export function deletePumpHouse(id: string): void {
  const pumpHouses = getPumpHouses().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.pumpHouses, JSON.stringify(pumpHouses));
  const phoneMappings = getPhoneMappings().filter((pm) => pm.pumpHouseId !== id);
  localStorage.setItem(STORAGE_KEYS.phoneMappings, JSON.stringify(phoneMappings));
}

export function getPhoneMappings(): PhoneMapping[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.phoneMappings);
  return data ? JSON.parse(data) : [];
}

export function getPhoneMappingsByPumpHouse(pumpHouseId: string): PhoneMapping[] {
  return getPhoneMappings().filter((pm) => pm.pumpHouseId === pumpHouseId);
}

export function getPhoneMappingByNumber(phoneNumber: string): PhoneMapping | null {
  const normalized = phoneNumber.replace(/\D/g, "");
  const mappings = getPhoneMappings();
  return mappings.find((pm) => pm.phoneNumber.replace(/\D/g, "") === normalized) || null;
}

export function savePhoneMapping(mapping: Omit<PhoneMapping, "id">): PhoneMapping {
  const mappings = getPhoneMappings();
  const newMapping: PhoneMapping = { ...mapping, id: generateId() };
  mappings.push(newMapping);
  localStorage.setItem(STORAGE_KEYS.phoneMappings, JSON.stringify(mappings));
  return newMapping;
}

export function updatePhoneMapping(mapping: PhoneMapping): void {
  const mappings = getPhoneMappings();
  const index = mappings.findIndex((m) => m.id === mapping.id);
  if (index !== -1) {
    mappings[index] = mapping;
    localStorage.setItem(STORAGE_KEYS.phoneMappings, JSON.stringify(mappings));
  }
}

export function deletePhoneMapping(id: string): void {
  const mappings = getPhoneMappings().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEYS.phoneMappings, JSON.stringify(mappings));
}

export function getOperations(): PumpOperation[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.operations);
  return data ? JSON.parse(data) : [];
}

export function saveOperation(operation: Omit<PumpOperation, "id" | "createdAt">): PumpOperation {
  const operations = getOperations();
  const newOperation: PumpOperation = {
    ...operation,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  operations.push(newOperation);
  localStorage.setItem(STORAGE_KEYS.operations, JSON.stringify(operations));
  return newOperation;
}

export function updateOperation(operation: PumpOperation): void {
  const operations = getOperations();
  const index = operations.findIndex((o) => o.id === operation.id);
  if (index !== -1) {
    operations[index] = operation;
    localStorage.setItem(STORAGE_KEYS.operations, JSON.stringify(operations));
  }
}

export function getOperationByPumpHouse(pumpHouseId: string): PumpOperation[] {
  return getOperations().filter((o) => o.pumpHouseId === pumpHouseId);
}

export function getOpenOperations(pumpHouseId: string): PumpOperation[] {
  return getOperations()
    .filter((o) => o.pumpHouseId === pumpHouseId && o.stopTime === null && o.status === "running")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getTodayOperationsByPumpHouse(pumpHouseId: string): PumpOperation[] {
  const today = new Date().toISOString().split("T")[0];
  return getOperations().filter((o) => o.pumpHouseId === pumpHouseId && o.date === today);
}

export function initializeSampleData(): void {
  if (typeof window === "undefined") return;
  
  const existingDivisions = getDivisions();
  if (existingDivisions.length > 0) return;

  const divisions = [
    saveDivision({ name: "Division North" }),
    saveDivision({ name: "Division South" }),
    saveDivision({ name: "Division East" }),
  ];

  const schemes = [
    saveScheme({ divisionId: divisions[0].id, name: "Kolkata Scheme" }),
    saveScheme({ divisionId: divisions[0].id, name: "Howrah Scheme" }),
    saveScheme({ divisionId: divisions[1].id, name: "Midnapore Scheme" }),
    saveScheme({ divisionId: divisions[2].id, name: "Bardhaman Scheme" }),
  ];

  const pumpHouses = [
    savePumpHouse({ schemeId: schemes[0].id, name: "PH-1" }),
    savePumpHouse({ schemeId: schemes[0].id, name: "PH-2" }),
    savePumpHouse({ schemeId: schemes[1].id, name: "PH-1" }),
    savePumpHouse({ schemeId: schemes[2].id, name: "PH-1" }),
    savePumpHouse({ schemeId: schemes[2].id, name: "PH-2" }),
    savePumpHouse({ schemeId: schemes[3].id, name: "PH-1" }),
  ];

  savePhoneMapping({ pumpHouseId: pumpHouses[0].id, phoneNumber: "+919000111111", operatorName: "Ramesh" });
  savePhoneMapping({ pumpHouseId: pumpHouses[1].id, phoneNumber: "+919000222222", operatorName: "Suresh" });
  savePhoneMapping({ pumpHouseId: pumpHouses[2].id, phoneNumber: "+919000333333", operatorName: "Mahesh" });
}

export type TranslationProvider = "ollama-local" | "ollama-cloud" | "openrouter" | "openai";

export interface AppSettings {
  provider: TranslationProvider;
  ollamaBaseUrl: string;
  ollamaModel: string;
  openaiApiKey: string;
  openrouterApiKey: string;
  ollamaApiKey: string;
  serverUrl: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  provider: "ollama-local",
  ollamaBaseUrl: "http://localhost:11434",
  ollamaModel: "llama3.2",
  openaiApiKey: "",
  openrouterApiKey: "",
  ollamaApiKey: "",
  serverUrl: "",
};

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const data = localStorage.getItem(STORAGE_KEYS.settings);
  return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(updated));
  return updated;
}

// Server sync functions (async)
export async function syncToServer(): Promise<{ success: boolean; error?: string }> {
  const settings = getSettings();
  const serverUrl = settings.serverUrl;
  
  if (!serverUrl) {
    return { success: false, error: "Server URL not configured" };
  }
  
  const data = {
    divisions: getDivisions(),
    schemes: getSchemes(),
    pumpHouses: getPumpHouses(),
    phoneMappings: getPhoneMappings(),
    operations: getOperations(),
    settings: getSettings(),
  };
  
  try {
    const res = await fetch(`${serverUrl}/api/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      return { success: false, error: "Server sync failed" };
    }
    
    return { success: true };
  } catch (e) {
    return { success: false, error: "Cannot connect to server" };
  }
}

export async function syncFromServer(): Promise<{ success: boolean; error?: string }> {
  const settings = getSettings();
  const serverUrl = settings.serverUrl;
  
  if (!serverUrl) {
    return { success: false, error: "Server URL not configured" };
  }
  
  try {
    const res = await fetch(`${serverUrl}/api/sync`);
    if (!res.ok) return { success: false, error: "Server fetch failed" };
    
    const data = await res.json();
    
    if (data.divisions?.length > 0) {
      localStorage.setItem(STORAGE_KEYS.divisions, JSON.stringify(data.divisions));
    }
    if (data.schemes?.length > 0) {
      localStorage.setItem(STORAGE_KEYS.schemes, JSON.stringify(data.schemes));
    }
    if (data.pumpHouses?.length > 0) {
      localStorage.setItem(STORAGE_KEYS.pumpHouses, JSON.stringify(data.pumpHouses));
    }
    if (data.phoneMappings?.length > 0) {
      localStorage.setItem(STORAGE_KEYS.phoneMappings, JSON.stringify(data.phoneMappings));
    }
    if (data.operations?.length > 0) {
      localStorage.setItem(STORAGE_KEYS.operations, JSON.stringify(data.operations));
    }
    if (data.settings) {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(data.settings));
    }
    
    return { success: true };
  } catch (e) {
    return { success: false, error: "Cannot connect to server" };
  }
}
