export function calculateRunHours(startTime: string, stopTime: string | null): string {
  if (!stopTime) return "Running";
  
  const [startH, startM] = startTime.split(":").map(Number);
  const [stopH, stopM] = stopTime.split(":").map(Number);
  
  const startMinutes = startH * 60 + startM;
  let stopMinutes = stopH * 60 + stopM;
  
  if (stopMinutes < startMinutes) {
    stopMinutes += 24 * 60;
  }
  
  const diffMinutes = stopMinutes - startMinutes;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function calculateTotalMinutes(startTime: string, stopTime: string | null): number {
  if (!stopTime) return 0;
  
  const [startH, startM] = startTime.split(":").map(Number);
  const [stopH, stopM] = stopTime.split(":").map(Number);
  
  const startMinutes = startH * 60 + startM;
  let stopMinutes = stopH * 60 + stopM;
  
  if (stopMinutes < startMinutes) {
    stopMinutes += 24 * 60;
  }
  
  return stopMinutes - startMinutes;
}

export function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function getDateRangeForWeek(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

export function getDateRangeForMonth(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}
