import { Division, Scheme, PumpHouse, PhoneMapping, PumpOperation } from "@/types";

export type TranslationProvider = "ollama-local" | "ollama-cloud" | "openrouter" | "openai";

export interface AppSettings {
  provider: TranslationProvider;
  ollamaBaseUrl: string;
  ollamaModel: string;
  openaiApiKey: string;
  openrouterApiKey: string;
  ollamaApiKey: string;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Divisions
export async function getDivisions(): Promise<Division[]> {
  try {
    const res = await fetch("/api/divisions");
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function saveDivision(division: Omit<Division, "id">): Promise<Division> {
  const newDivision = { ...division, id: generateId() };
  const res = await fetch("/api/divisions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newDivision),
  });
  if (!res.ok) throw new Error("Failed to save division");
  return newDivision;
}

export async function updateDivision(division: Division): Promise<void> {
  const res = await fetch("/api/divisions", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(division),
  });
  if (!res.ok) throw new Error("Failed to update division");
}

export async function deleteDivision(id: string): Promise<void> {
  const res = await fetch(`/api/divisions?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete division");
}

// Schemes
export async function getSchemes(): Promise<Scheme[]> {
  try {
    const res = await fetch("/api/schemes");
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function getSchemesByDivision(divisionId: string): Promise<Scheme[]> {
  const allSchemes = await getSchemes();
  return allSchemes.filter((s) => s.divisionId === divisionId);
}

export async function saveScheme(scheme: Omit<Scheme, "id">): Promise<Scheme> {
  const newScheme = { ...scheme, id: generateId() };
  const res = await fetch("/api/schemes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newScheme),
  });
  if (!res.ok) throw new Error("Failed to save scheme");
  return newScheme;
}

export async function updateScheme(scheme: Scheme): Promise<void> {
  const res = await fetch("/api/schemes", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scheme),
  });
  if (!res.ok) throw new Error("Failed to update scheme");
}

export async function deleteScheme(id: string): Promise<void> {
  const res = await fetch(`/api/schemes?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete scheme");
}

// Pump Houses
export async function getPumpHouses(): Promise<PumpHouse[]> {
  try {
    const res = await fetch("/api/pump-houses");
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function getPumpHousesByScheme(schemeId: string): Promise<PumpHouse[]> {
  const allPumpHouses = await getPumpHouses();
  return allPumpHouses.filter((p) => p.schemeId === schemeId);
}

export async function savePumpHouse(pumpHouse: Omit<PumpHouse, "id">): Promise<PumpHouse> {
  const newPumpHouse = { ...pumpHouse, id: generateId() };
  const res = await fetch("/api/pump-houses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newPumpHouse),
  });
  if (!res.ok) throw new Error("Failed to save pump house");
  return newPumpHouse;
}

export async function updatePumpHouse(pumpHouse: PumpHouse): Promise<void> {
  const res = await fetch("/api/pump-houses", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pumpHouse),
  });
  if (!res.ok) throw new Error("Failed to update pump house");
}

export async function deletePumpHouse(id: string): Promise<void> {
  const res = await fetch(`/api/pump-houses?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete pump house");
}

// Phone Mappings
export async function getPhoneMappings(): Promise<PhoneMapping[]> {
  try {
    const res = await fetch("/api/phone-mappings");
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function getPhoneMappingsByPumpHouse(pumpHouseId: string): Promise<PhoneMapping[]> {
  const allMappings = await getPhoneMappings();
  return allMappings.filter((pm) => pm.pumpHouseId === pumpHouseId);
}

export async function getPhoneMappingByNumber(phoneNumber: string): Promise<PhoneMapping | null> {
  const normalized = phoneNumber.replace(/\D/g, "");
  const mappings = await getPhoneMappings();
  return mappings.find((pm) => pm.phoneNumber.replace(/\D/g, "") === normalized) || null;
}

export async function savePhoneMapping(mapping: Omit<PhoneMapping, "id">): Promise<PhoneMapping> {
  const newMapping = { ...mapping, id: generateId() };
  const res = await fetch("/api/phone-mappings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newMapping),
  });
  if (!res.ok) throw new Error("Failed to save phone mapping");
  return newMapping;
}

export async function updatePhoneMapping(mapping: PhoneMapping): Promise<void> {
  const res = await fetch("/api/phone-mappings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mapping),
  });
  if (!res.ok) throw new Error("Failed to update phone mapping");
}

export async function deletePhoneMapping(id: string): Promise<void> {
  const res = await fetch(`/api/phone-mappings?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete phone mapping");
}

// Operations
export async function getOperations(): Promise<PumpOperation[]> {
  try {
    const res = await fetch("/api/operations");
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function saveOperation(operation: Omit<PumpOperation, "id" | "createdAt">): Promise<PumpOperation> {
  const newOperation = {
    ...operation,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  const res = await fetch("/api/operations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newOperation),
  });
  if (!res.ok) throw new Error("Failed to save operation");
  return newOperation;
}

export async function updateOperation(operation: PumpOperation): Promise<void> {
  const res = await fetch("/api/operations", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(operation),
  });
  if (!res.ok) throw new Error("Failed to update operation");
}

export async function getOperationByPumpHouse(pumpHouseId: string): Promise<PumpOperation[]> {
  const allOperations = await getOperations();
  return allOperations.filter((o) => o.pumpHouseId === pumpHouseId);
}

export async function getOpenOperations(pumpHouseId: string): Promise<PumpOperation[]> {
  const allOperations = await getOperations();
  return allOperations
    .filter((o) => o.pumpHouseId === pumpHouseId && o.stopTime === null && o.status === "running")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getTodayOperationsByPumpHouse(pumpHouseId: string): Promise<PumpOperation[]> {
  const today = new Date().toISOString().split("T")[0];
  const allOperations = await getOperations();
  return allOperations.filter((o) => o.pumpHouseId === pumpHouseId && o.date === today);
}

// Settings
export async function getSettings(): Promise<AppSettings> {
  try {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      return {
        provider: data.provider || "ollama-local",
        ollamaBaseUrl: data.ollamaBaseUrl || "http://localhost:11434",
        ollamaModel: data.ollamaModel || "llama3.2",
        openaiApiKey: data.openaiApiKey || "",
        openrouterApiKey: data.openrouterApiKey || "",
        ollamaApiKey: data.ollamaApiKey || "",
      };
    }
  } catch {}
  return {
    provider: "ollama-local",
    ollamaBaseUrl: "http://localhost:11434",
    ollamaModel: "llama3.2",
    openaiApiKey: "",
    openrouterApiKey: "",
    ollamaApiKey: "",
  };
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
}

export async function initializeSampleData(): Promise<void> {
  const existingDivisions = await getDivisions();
  if (existingDivisions.length > 0) return;

  const d1 = await saveDivision({ name: "Division North" });
  const d2 = await saveDivision({ name: "Division South" });
  const d3 = await saveDivision({ name: "Division East" });

  const s1 = await saveScheme({ divisionId: d1.id, name: "Kolkata Scheme" });
  const s2 = await saveScheme({ divisionId: d1.id, name: "Howrah Scheme" });
  const s3 = await saveScheme({ divisionId: d2.id, name: "Midnapore Scheme" });
  const s4 = await saveScheme({ divisionId: d3.id, name: "Bardhaman Scheme" });

  const ph1 = await savePumpHouse({ schemeId: s1.id, name: "PH-1" });
  const ph2 = await savePumpHouse({ schemeId: s1.id, name: "PH-2" });
  const ph3 = await savePumpHouse({ schemeId: s2.id, name: "PH-1" });
  const ph4 = await savePumpHouse({ schemeId: s3.id, name: "PH-1" });

  await savePhoneMapping({ pumpHouseId: ph1.id, phoneNumber: "+919000111111", operatorName: "Ramesh" });
  await savePhoneMapping({ pumpHouseId: ph2.id, phoneNumber: "+919000222222", operatorName: "Suresh" });
  await savePhoneMapping({ pumpHouseId: ph3.id, phoneNumber: "+919000333333", operatorName: "Mahesh" });
}
