import { Division, Scheme, PumpHouse, PhoneMapping, PumpOperation } from "@/types";

export interface BackupData {
  version: string;
  exportedAt: string;
  divisions: Division[];
  schemes: Scheme[];
  pumpHouses: PumpHouse[];
  phoneMappings: PhoneMapping[];
  operations: PumpOperation[];
}

export function createBackup(): BackupData {
  const data: BackupData = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    divisions: [],
    schemes: [],
    pumpHouses: [],
    phoneMappings: [],
    operations: [],
  };

  if (typeof window === "undefined") return data;

  const divisionsData = localStorage.getItem("aqualog_divisions");
  if (divisionsData) data.divisions = JSON.parse(divisionsData);

  const schemesData = localStorage.getItem("aqualog_schemes");
  if (schemesData) data.schemes = JSON.parse(schemesData);

  const pumpHousesData = localStorage.getItem("aqualog_pumphouses");
  if (pumpHousesData) data.pumpHouses = JSON.parse(pumpHousesData);

  const phoneMappingsData = localStorage.getItem("aqualog_phone_mappings");
  if (phoneMappingsData) data.phoneMappings = JSON.parse(phoneMappingsData);

  const operationsData = localStorage.getItem("aqualog_operations");
  if (operationsData) data.operations = JSON.parse(operationsData);

  return data;
}

export function downloadBackup(data: BackupData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateStr = new Date().toISOString().split("T")[0];
  a.download = `aqualog_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function restoreBackup(data: BackupData): { success: boolean; message: string } {
  if (!data.version || !data.exportedAt) {
    return { success: false, message: "Invalid backup file format" };
  }

  try {
    if (typeof window === "undefined") {
      return { success: false, message: "Cannot restore in server context" };
    }

    if (data.divisions) {
      localStorage.setItem("aqualog_divisions", JSON.stringify(data.divisions));
    }
    if (data.schemes) {
      localStorage.setItem("aqualog_schemes", JSON.stringify(data.schemes));
    }
    if (data.pumpHouses) {
      localStorage.setItem("aqualog_pumphouses", JSON.stringify(data.pumpHouses));
    }
    if (data.phoneMappings) {
      localStorage.setItem("aqualog_phone_mappings", JSON.stringify(data.phoneMappings));
    }
    if (data.operations) {
      localStorage.setItem("aqualog_operations", JSON.stringify(data.operations));
    }

    return { success: true, message: `Successfully restored ${data.operations?.length || 0} operations, ${data.divisions?.length || 0} divisions, and other data` };
  } catch {
    return { success: false, message: "Failed to restore backup. Please try again." };
  }
}

export function getBackupInfo(data: BackupData): { totalRecords: number; divisions: number; schemes: number; pumpHouses: number; operations: number } {
  return {
    totalRecords: (data.divisions?.length || 0) + (data.schemes?.length || 0) + (data.pumpHouses?.length || 0) + (data.operations?.length || 0),
    divisions: data.divisions?.length || 0,
    schemes: data.schemes?.length || 0,
    pumpHouses: data.pumpHouses?.length || 0,
    operations: data.operations?.length || 0,
  };
}
