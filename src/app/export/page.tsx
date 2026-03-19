"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getDivisions,
  getSchemes,
  getPumpHouses,
  getOperations,
} from "@/lib/storage";
import { Division, Scheme, PumpHouse, PumpOperation } from "@/types";
import {
  exportToExcel,
  exportToPDF,
  ReportType,
  ExportFormat,
  FilterLevel,
} from "@/lib/export";
import { getDateRangeForWeek, getDateRangeForMonth } from "@/lib/utils";

export default function ExportPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [pumpHouses, setPumpHouses] = useState<PumpHouse[]>([]);
  const [operations, setOperations] = useState<PumpOperation[]>([]);

  const [reportType, setReportType] = useState<ReportType>("daily");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("excel");
  const [filterLevel, setFilterLevel] = useState<FilterLevel>("all");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedScheme, setSelectedScheme] = useState("");
  const [selectedPumpHouse, setSelectedPumpHouse] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedWeekDate, setSelectedWeekDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [exportStatus, setExportStatus] = useState("");

  useEffect(() => {
    setDivisions(getDivisions());
    setSchemes(getSchemes());
    setPumpHouses(getPumpHouses());
    setOperations(getOperations());
  }, []);

  const filteredSchemes = useMemo(() => {
    if (!selectedDivision) return schemes;
    return schemes.filter((s) => s.divisionId === selectedDivision);
  }, [schemes, selectedDivision]);

  const filteredPumpHouses = useMemo(() => {
    if (!selectedScheme) return pumpHouses;
    return pumpHouses.filter((p) => p.schemeId === selectedScheme);
  }, [pumpHouses, selectedScheme]);

  const operationsWithDetails = useMemo(() => {
    let filteredOps: PumpOperation[] = operations;

    if (reportType === "daily") {
      filteredOps = operations.filter((op) => op.date === selectedDate);
    } else if (reportType === "weekly") {
      const range = getDateRangeForWeek(new Date(selectedWeekDate));
      const startStr = range.start.toISOString().split("T")[0];
      const endStr = range.end.toISOString().split("T")[0];
      filteredOps = operations.filter((op) => op.date >= startStr && op.date <= endStr);
    } else if (reportType === "monthly") {
      const range = getDateRangeForMonth(selectedYear, selectedMonth);
      const startStr = range.start.toISOString().split("T")[0];
      const endStr = range.end.toISOString().split("T")[0];
      filteredOps = operations.filter((op) => op.date >= startStr && op.date <= endStr);
    }

    return filteredOps
      .map((op) => {
        const pumpHouse = pumpHouses.find((p) => p.id === op.pumpHouseId);
        if (!pumpHouse) return null;
        const scheme = schemes.find((s) => s.id === pumpHouse.schemeId);
        if (!scheme) return null;
        const division = divisions.find((d) => d.id === scheme.divisionId);

        if (filterLevel === "division" && selectedDivision && division?.id !== selectedDivision) return null;
        if (filterLevel === "scheme" && selectedScheme && scheme.id !== selectedScheme) return null;
        if (filterLevel === "pumphouse" && selectedPumpHouse && op.pumpHouseId !== selectedPumpHouse) return null;

        return {
          ...op,
          divisionId: division?.id || "",
          schemeId: scheme.id,
          pumpHouseId: pumpHouse.id,
          divisionName: division?.name || "Unknown",
          schemeName: scheme.name,
          pumpHouseName: pumpHouse.name,
        };
      })
      .filter((op): op is NonNullable<typeof op> => op !== null);
  }, [operations, pumpHouses, schemes, divisions, reportType, selectedDate, selectedWeekDate, selectedYear, selectedMonth, filterLevel, selectedDivision, selectedScheme, selectedPumpHouse]);

  const handleExport = () => {
    try {
      if (exportFormat === "excel") {
        exportToExcel(operationsWithDetails, {
          reportType,
          format: exportFormat,
          filterLevel,
          divisionId: selectedDivision || undefined,
          schemeId: selectedScheme || undefined,
          pumpHouseId: selectedPumpHouse || undefined,
          date: selectedDate,
          weekDate: selectedWeekDate,
          year: selectedYear,
          month: selectedMonth,
        }, divisions, schemes, pumpHouses);
      } else {
        exportToPDF(operationsWithDetails, {
          reportType,
          format: exportFormat,
          filterLevel,
          divisionId: selectedDivision || undefined,
          schemeId: selectedScheme || undefined,
          pumpHouseId: selectedPumpHouse || undefined,
          date: selectedDate,
          weekDate: selectedWeekDate,
          year: selectedYear,
          month: selectedMonth,
        }, divisions, schemes, pumpHouses);
      }
      setExportStatus("Export successful!");
      setTimeout(() => setExportStatus(""), 3000);
    } catch {
      setExportStatus("Export failed. Please try again.");
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Export Reports</h1>
        <p className="page-subtitle">Export pump operation data to PDF or Excel</p>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Report Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="label">Report Type</label>
            <select
              className="select"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              style={{ width: "100%" }}
            >
              <option value="daily">Daily Report</option>
              <option value="weekly">Weekly Report</option>
              <option value="monthly">Monthly Report</option>
            </select>
          </div>

          <div>
            <label className="label">Export Format</label>
            <select
              className="select"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              style={{ width: "100%" }}
            >
              <option value="excel">Excel (.xlsx)</option>
              <option value="pdf">PDF (.pdf)</option>
            </select>
          </div>

          <div>
            <label className="label">Filter Level</label>
            <select
              className="select"
              value={filterLevel}
              onChange={(e) => {
                setFilterLevel(e.target.value as FilterLevel);
                if (e.target.value === "all") {
                  setSelectedDivision("");
                  setSelectedScheme("");
                  setSelectedPumpHouse("");
                }
              }}
              style={{ width: "100%" }}
            >
              <option value="all">All Data</option>
              <option value="division">By Division</option>
              <option value="scheme">By Scheme</option>
              <option value="pumphouse">By Pump House</option>
            </select>
          </div>

          <div>
            <label className="label">Records Found</label>
            <p className="text-lg font-semibold text-cyan-600">{operationsWithDetails.length}</p>
          </div>
        </div>

        {filterLevel !== "all" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {filterLevel === "division" || filterLevel === "scheme" || filterLevel === "pumphouse" ? (
              <div>
                <label className="label">Division</label>
                <select
                  className="select"
                  value={selectedDivision}
                  onChange={(e) => {
                    setSelectedDivision(e.target.value);
                    setSelectedScheme("");
                    setSelectedPumpHouse("");
                  }}
                  style={{ width: "100%" }}
                >
                  <option value="">Select Division</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            ) : null}

            {(filterLevel === "scheme" || filterLevel === "pumphouse") && (
              <div>
                <label className="label">Scheme</label>
                <select
                  className="select"
                  value={selectedScheme}
                  onChange={(e) => {
                    setSelectedScheme(e.target.value);
                    setSelectedPumpHouse("");
                  }}
                  style={{ width: "100%" }}
                >
                  <option value="">Select Scheme</option>
                  {filteredSchemes.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {filterLevel === "pumphouse" && (
              <div>
                <label className="label">Pump House</label>
                <select
                  className="select"
                  value={selectedPumpHouse}
                  onChange={(e) => setSelectedPumpHouse(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="">Select Pump House</option>
                  {filteredPumpHouses.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {reportType === "daily" && (
            <div>
              <label className="label">Select Date</label>
              <input
                type="date"
                className="input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
          )}

          {reportType === "weekly" && (
            <div>
              <label className="label">Select Week</label>
              <input
                type="date"
                className="input"
                value={selectedWeekDate}
                onChange={(e) => setSelectedWeekDate(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
          )}

          {reportType === "monthly" && (
            <>
              <div>
                <label className="label">Month</label>
                <select
                  className="select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  style={{ width: "100%" }}
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx} value={idx}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <input
                  type="number"
                  className="input"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
            </>
          )}
        </div>

        <button
          onClick={handleExport}
          disabled={operationsWithDetails.length === 0}
          className="btn btn-primary"
        >
          Export {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report as {exportFormat.toUpperCase()}
        </button>

        {exportStatus && (
          <p className={`mt-3 text-sm ${exportStatus.includes("successful") ? "text-green-600" : "text-red-600"}`}>
            {exportStatus}
          </p>
        )}
      </div>

      {operationsWithDetails.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Preview (First 10 Records)</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Pump House</th>
                  <th>Scheme</th>
                  <th>Division</th>
                  <th>Status</th>
                  <th>Operator</th>
                </tr>
              </thead>
              <tbody>
                {operationsWithDetails.slice(0, 10).map((op) => (
                  <tr key={op.id}>
                    <td>{op.date}</td>
                    <td>{op.pumpHouseName}</td>
                    <td>{op.schemeName}</td>
                    <td>{op.divisionName}</td>
                    <td>
                      {op.status === "running" ? (
                        <span className="badge badge-running">Running</span>
                      ) : op.status === "stopped" ? (
                        <span className="badge badge-success">Stopped</span>
                      ) : (
                        <span className="badge bg-red-100 text-red-700">Not Running</span>
                      )}
                    </td>
                    <td>{op.operatorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {operationsWithDetails.length > 10 && (
            <p className="text-sm text-slate-500 mt-2">
              ...and {operationsWithDetails.length - 10} more records
            </p>
          )}
        </div>
      )}
    </div>
  );
}
