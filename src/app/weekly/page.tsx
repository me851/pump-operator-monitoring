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
  getDateRangeForWeek,
} from "@/lib/utils";

export default function WeeklyPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [pumpHouses, setPumpHouses] = useState<PumpHouse[]>([]);
  const [operations, setOperations] = useState<PumpOperation[]>([]);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDivision, setSelectedDivision] = useState("");

  useEffect(() => {
    setDivisions(getDivisions());
    setSchemes(getSchemes());
    setPumpHouses(getPumpHouses());
    setOperations(getOperations());
  }, []);

  const weekRange = useMemo(() => {
    return getDateRangeForWeek(new Date(selectedDate));
  }, [selectedDate]);

  const weekOperations = useMemo(() => {
    const startStr = weekRange.start.toISOString().split("T")[0];
    const endStr = weekRange.end.toISOString().split("T")[0];
    
    return operations.filter((op) => op.date >= startStr && op.date <= endStr);
  }, [operations, weekRange]);

  const operationsWithDetails = useMemo(() => {
    return weekOperations
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
  }, [weekOperations, pumpHouses, schemes, divisions, selectedDivision]);

  const summaryByScheme = useMemo(() => {
    const summary: Record<string, { name: string; divisionName: string; totalMinutes: number; runs: number; notRunningCount: number; reasons: string[] }> = {};
    
    for (const op of operationsWithDetails) {
      const key = op.schemeName;
      if (!summary[key]) {
        summary[key] = {
          name: op.schemeName,
          divisionName: op.divisionName,
          totalMinutes: 0,
          runs: 0,
          notRunningCount: 0,
          reasons: [],
        };
      }
      summary[key].runs += 1;
      if (op.status === "not_running") {
        summary[key].notRunningCount += 1;
        if (op.reason) summary[key].reasons.push(op.reason);
      }
      if (op.stopTime && op.startTime) {
        summary[key].totalMinutes += calculateTotalMinutes(op.startTime, op.stopTime);
      }
    }
    
    return Object.values(summary);
  }, [operationsWithDetails]);

  const summaryByOperator = useMemo(() => {
    const summary: Record<string, { name: string; pumpHouse: string; totalMinutes: number; runs: number }> = {};
    
    for (const op of operationsWithDetails) {
      const key = op.operatorName + "|" + op.pumpHouseName;
      if (!summary[key]) {
        summary[key] = {
          name: op.operatorName,
          pumpHouse: op.pumpHouseName,
          totalMinutes: 0,
          runs: 0,
        };
      }
      summary[key].runs += 1;
      if (op.stopTime && op.startTime) {
        summary[key].totalMinutes += calculateTotalMinutes(op.startTime, op.stopTime);
      }
    }
    
    return Object.values(summary);
  }, [operationsWithDetails]);

  const totalRunMinutes = summaryByScheme.reduce((acc, curr) => acc + curr.totalMinutes, 0);
  const totalNotRunning = summaryByScheme.reduce((acc, curr) => acc + curr.notRunningCount, 0);

  const formatDateRange = () => {
    const start = weekRange.start.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });
    const end = weekRange.end.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
    return `${start} - ${end}`;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Weekly Report</h1>
        <p className="page-subtitle">Pump operation summary for the week</p>
      </div>

      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Select Date (Week)</label>
            <input
              type="date"
              className="input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: "200px" }}
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
        <p className="text-sm text-slate-500 mt-2">Week: {formatDateRange()}</p>
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
        <h2 className="text-lg font-semibold mb-4">Summary by Operator</h2>
        {summaryByOperator.length === 0 ? (
          <p className="text-slate-500 text-sm">No data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Operator</th>
                  <th>Pump House</th>
                  <th>Operations</th>
                  <th>Total Run Time</th>
                </tr>
              </thead>
              <tbody>
                {summaryByOperator.map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-medium">{item.name}</td>
                    <td>{item.pumpHouse}</td>
                    <td>{item.runs}</td>
                    <td className="font-medium text-green-600">{formatMinutesToHours(item.totalMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
