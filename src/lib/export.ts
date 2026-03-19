import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PumpOperationWithDetails } from "@/types";
import { formatMinutesToHours } from "./utils";

export type ReportType = "daily" | "weekly" | "monthly";
export type ExportFormat = "pdf" | "excel";
export type FilterLevel = "all" | "division" | "scheme" | "pumphouse";

export interface ExportOptions {
  reportType: ReportType;
  format: ExportFormat;
  filterLevel: FilterLevel;
  divisionId?: string;
  schemeId?: string;
  pumpHouseId?: string;
  date?: string;
  weekDate?: string;
  year?: number;
  month?: number;
}

function getOperationDetails(
  op: PumpOperationWithDetails,
  filterLevel: FilterLevel,
  divisionId?: string,
  schemeId?: string,
  pumpHouseId?: string
): boolean {
  if (filterLevel === "all") return true;
  if (filterLevel === "division" && divisionId) {
    return op.divisionId === divisionId;
  }
  if (filterLevel === "scheme" && schemeId) {
    return op.schemeId === schemeId;
  }
  if (filterLevel === "pumphouse" && pumpHouseId) {
    return op.pumpHouseId === pumpHouseId;
  }
  return true;
}

export function exportToExcel(
  data: PumpOperationWithDetails[],
  options: ExportOptions,
  divisions: { id: string; name: string }[],
  schemes: { id: string; name: string }[],
  pumpHouses: { id: string; name: string }[]
): void {
  const filteredData = data.filter((op) =>
    getOperationDetails(
      op,
      options.filterLevel,
      options.divisionId,
      options.schemeId,
      options.pumpHouseId
    )
  );

  const reportData = filteredData.map((op) => ({
    Date: op.date,
    "Pump House": op.pumpHouseName,
    Scheme: op.schemeName,
    Division: op.divisionName,
    Operator: op.operatorName,
    Status: op.status === "running" ? "Running" : op.status === "stopped" ? "Stopped" : "Not Running",
    "Start Time": op.startTime || "-",
    "Stop Time": op.stopTime || "-",
    "Run Duration": op.startTime && op.stopTime ? formatMinutesToHours(
      calculateMinutes(op.startTime, op.stopTime)
    ) : "-",
    Reason: op.reason || "-",
  }));

  const ws = XLSX.utils.json_to_sheet(reportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pump Operations");

  const fileName = generateFileName(options, "xlsx");
  XLSX.writeFile(wb, fileName);
}

function calculateMinutes(start: string, stop: string): number {
  const [startH, startM] = start.split(":").map(Number);
  const [stopH, stopM] = stop.split(":").map(Number);
  return (stopH * 60 + stopM) - (startH * 60 + startM);
}

export function exportToPDF(
  data: PumpOperationWithDetails[],
  options: ExportOptions,
  divisions: { id: string; name: string }[],
  schemes: { id: string; name: string }[],
  pumpHouses: { id: string; name: string }[]
): void {
  const filteredData = data.filter((op) =>
    getOperationDetails(
      op,
      options.filterLevel,
      options.divisionId,
      options.schemeId,
      options.pumpHouseId
    )
  );

  const doc = new jsPDF();
  
  const title = getReportTitle(options);
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

  const tableData = filteredData.map((op) => [
    op.date,
    op.pumpHouseName,
    op.schemeName,
    op.status === "running" ? "Running" : op.status === "stopped" ? "Stopped" : "Not Running",
    op.startTime || "-",
    op.stopTime || "-",
    op.startTime && op.stopTime
      ? formatMinutesToHours(calculateMinutes(op.startTime, op.stopTime))
      : "-",
    op.reason || "-",
  ]);

  autoTable(doc, {
    head: [["Date", "Pump House", "Scheme", "Status", "Start", "Stop", "Duration", "Reason"]],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [8, 145, 178] },
  });

  const fileName = generateFileName(options, "pdf");
  doc.save(fileName);
}

function getReportTitle(options: ExportOptions): string {
  const titles: Record<ReportType, string> = {
    daily: "Daily Report",
    weekly: "Weekly Report",
    monthly: "Monthly Report",
  };
  return titles[options.reportType];
}

function generateFileName(options: ExportOptions, ext: string): string {
  const dateStr = new Date().toISOString().split("T")[0];
  const prefix = options.reportType;
  const filterStr = options.filterLevel === "all" ? "all" : options.filterLevel;
  return `${prefix}_report_${filterStr}_${dateStr}.${ext}`;
}

export function exportSummaryToExcel(
  summaryData: Record<string, unknown>[],
  options: ExportOptions,
  headers: string[]
): void {
  const ws = XLSX.utils.json_to_sheet(
    summaryData.map((row) => {
      const newRow: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        const keys = Object.keys(row);
        newRow[h] = row[keys[i]];
      });
      return newRow;
    })
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Summary");

  const fileName = `summary_${options.reportType}_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportSummaryToPDF(
  summaryData: Record<string, unknown>[],
  options: ExportOptions,
  headers: string[]
): void {
  const doc = new jsPDF();
  
  const title = `${getReportTitle(options)} - Summary`;
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

  const tableData = summaryData.map((row) => Object.values(row).map(String));

  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 35,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [8, 145, 178] },
  });

  const fileName = `summary_${options.reportType}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}
