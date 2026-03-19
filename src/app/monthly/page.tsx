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
  calculateTotalMinutes,
  formatMinutesToHours,
  getDateRangeForMonth,
} from "@/lib/utils";

export default function MonthlyPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [pumpHouses, setPumpHouses] = useState<PumpHouse[]>([]);
  const [operations, setOperations] = useState<PumpOperation[]>([]);
  
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedDivision, setSelectedDivision] = useState("");

  useEffect(() => {
    setDivisions(getDivisions());
    setSchemes(getSchemes());
    setPumpHouses(getPumpHouses());
    setOperations(getOperations());
  }, []);

  const monthRange = useMemo(() => {
    return getDateRangeForMonth(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const monthOperations = useMemo(() => {
    const startStr = monthRange.start.toISOString().split("T")[0];
    const endStr = monthRange.end.toISOString().split("T")[0];
    
    return operations.filter((op) => op.date >= startStr && op.date <= endStr);
  }, [operations, monthRange]);

  const operationsWithDetails = useMemo(() => {
    return monthOperations
      .map((op) => {
        const pumpHouse = pumpHouses.find((p) => p.id === op.pumpHouseId);
        if (!pumpHouse) return null;
        const scheme = schemes.find((s) => s.id === pumpHouse.schemeId);
        if (!scheme) return null;
        const division = divisions.find((d) => d.id === scheme.divisionId);
        
        if (selectedDivision && division?.id !== selectedDivision) return null;
        
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
  }, [monthOperations, pumpHouses, schemes, divisions, selectedDivision]);

  const summaryByScheme = useMemo(() => {
    const summary: Record<string, { name: string; divisionName: string; totalMinutes: number; runs: number; notRunningCount: number; reasons: Record<string, number> }> = {};
    
    for (const op of operationsWithDetails) {
      const key = op.schemeName;
      if (!summary[key]) {
        summary[key] = {
          name: op.schemeName,
          divisionName: op.divisionName,
          totalMinutes: 0,
          runs: 0,
          notRunningCount: 0,
          reasons: {},
        };
      }
      summary[key].runs += 1;
      if (op.status === "not_running") {
        summary[key].notRunningCount += 1;
        const reason = op.reason || "Unknown";
        summary[key].reasons[reason] = (summary[key].reasons[reason] || 0) + 1;
      }
      if (op.stopTime && op.startTime) {
        summary[key].totalMinutes += calculateTotalMinutes(op.startTime, op.stopTime);
      }
    }
    
    return Object.values(summary);
  }, [operationsWithDetails]);

  const summaryByDivision = useMemo(() => {
    const summary: Record<string, { name: string; totalMinutes: number; runs: number; notRunningCount: number }> = {};
    
    for (const op of operationsWithDetails) {
      if (!summary[op.divisionName]) {
        summary[op.divisionName] = {
          name: op.divisionName,
          totalMinutes: 0,
          runs: 0,
          notRunningCount: 0,
        };
      }
      summary[op.divisionName].runs += 1;
      if (op.status === "not_running") {
        summary[op.divisionName].notRunningCount += 1;
      }
      if (op.stopTime && op.startTime) {
        summary[op.divisionName].totalMinutes += calculateTotalMinutes(op.startTime, op.stopTime);
      }
    }
    
    return Object.values(summary);
  }, [operationsWithDetails]);

  const totalRunMinutes = summaryByScheme.reduce((acc, curr) => acc + curr.totalMinutes, 0);
  const totalNotRunning = summaryByScheme.reduce((acc, curr) => acc + curr.notRunningCount, 0);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Monthly Report</h1>
        <p className="page-subtitle">Pump operation summary for the month</p>
      </div>

      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Month</label>
            <select
              className="select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              style={{ width: "150px" }}
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
              style={{ width: "120px" }}
            />
          </div>
          <div>
            <label className="label">Division</label>
            <select
              className="select"
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              style={{ width: "200px" }}
            >
              <option value="">All Divisions</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Showing: {monthNames[selectedMonth]} {selectedYear}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-slate-500">Total Operations</p>
          <p className="text-2xl font-bold text-slate-800">{operationsWithDetails.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Total Run Hours</p>
          <p className="text-2xl font-bold text-green-600">{formatMinutesToHours(totalRunMinutes)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Not Running Incidents</p>
          <p className="text-2xl font-bold text-red-600">{totalNotRunning}</p>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Summary by Division</h2>
        {summaryByDivision.length === 0 ? (
          <p className="text-slate-500 text-sm">No data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Division</th>
                  <th>Operations</th>
                  <th>Not Running</th>
                  <th>Total Run Time</th>
                </tr>
              </thead>
              <tbody>
                {summaryByDivision.map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-medium">{item.name}</td>
                    <td>{item.runs}</td>
                    <td className="text-red-600">{item.notRunningCount}</td>
                    <td className="font-medium text-green-600">{formatMinutesToHours(item.totalMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Summary by Scheme</h2>
        {summaryByScheme.length === 0 ? (
          <p className="text-slate-500 text-sm">No data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Scheme</th>
                  <th>Division</th>
                  <th>Operations</th>
                  <th>Not Running</th>
                  <th>Total Run Time</th>
                </tr>
              </thead>
              <tbody>
                {summaryByScheme.map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-medium">{item.name}</td>
                    <td>{item.divisionName}</td>
                    <td>{item.runs}</td>
                    <td className="text-red-600">{item.notRunningCount}</td>
                    <td className="font-medium text-green-600">{formatMinutesToHours(item.totalMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Not Running Reasons</h2>
        {totalNotRunning === 0 ? (
          <p className="text-slate-500 text-sm">No incidents reported</p>
        ) : (
          <div className="space-y-3">
            {summaryByScheme.filter(s => s.notRunningCount > 0).map((scheme, idx) => (
              <div key={idx} className="border-l-4 border-red-400 pl-4">
                <p className="font-medium">{scheme.name}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(scheme.reasons).map(([reason, count]) => (
                    <span key={reason} className="badge bg-red-100 text-red-700">
                      {reason}: {count}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
