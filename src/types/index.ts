export interface Division {
  id: string;
  name: string;
}

export interface Scheme {
  id: string;
  divisionId: string;
  name: string;
}

export interface PumpHouse {
  id: string;
  schemeId: string;
  name: string;
}

export interface PhoneMapping {
  id: string;
  pumpHouseId: string;
  phoneNumber: string;
  operatorName?: string;
}

export type PumpStatus = "running" | "stopped" | "not_running";

export interface PumpOperation {
  id: string;
  pumpHouseId: string;
  operatorName: string;
  phoneNumber: string;
  date: string;
  startTime: string | null;
  stopTime: string | null;
  status: PumpStatus;
  reason?: string;
  rawMessage: string;
  translatedMessage?: string;
  createdAt: string;
}

export interface PumpOperationWithDetails extends PumpOperation {
  divisionId: string;
  schemeId: string;
  pumpHouseId: string;
  divisionName: string;
  schemeName: string;
  pumpHouseName: string;
}

export interface ParsedMessage {
  action: "start" | "stop" | "not_running" | "unknown";
  time?: string;
  date?: string;
  reason?: string;
  confidence: number;
}
