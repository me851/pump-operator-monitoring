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
  calculateRunHours,
  calculateTotalMinutes,
  formatMinutesToHours,
} from "@/lib/utils";

export default function DashboardPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [pumpHouses, setPumpHouses] = useState<PumpHouse[]>([]);
  const [operations, setOperations] = useState<PumpOperation[]>([]);
  
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    setDivisions(getDivisions());
    setSchemes(getSchemes());
    setPumpHouses(getPumpHouses());
    setOperations(getOperations());
  }, []);

  const operationsWithDetails = useMemo(() => {
    const filtered = operations.filter((op) => op.date === selectedDate);
    return filtered
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
  }, [operations, pumpHouses, schemes, divisions, selectedDate, selectedDivision]);

  const summaryByPumpHouse = useMemo(() => {
    const summary: Record<string, { name: string; schemeName: string; totalMinutes: number; runs: number }> = {};
    
    for (const op of operationsWithDetails) {
      if (!summary[op.pumpHouseId]) {
        summary[op.pumpHouseId] = {
          name: op.pumpHouseName,
          schemeName: op.schemeName,
          totalMinutes: 0,
          runs: 0,
        };
      }
      summary[op.pumpHouseId].runs += 1;
      if (op.stopTime && op.startTime) {
        summary[op.pumpHouseId].totalMinutes += calculateTotalMinutes(
          op.startTime,
          op.stopTime
        );
      }
    }
    
    return Object.values(summary);
  }, [operationsWithDetails]);

  const totalRunMinutes = summaryByPumpHouse.reduce(
    (acc, curr) => acc + curr.totalMinutes,
    0
  );

  const runningCount = operationsWithDetails.filter(o => o.status === "running").length;
  const notRunningCount = operationsWithDetails.filter(o => o.status === "not_running").length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Daily Dashboard</h1>
        <p className="page-subtitle">Pump operation summary for selected date</p>
      </div>

      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
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
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: "200px" }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-slate-500">Total Operations</p>
          <p className="text-2xl font-bold text-slate-800">
            {operationsWithDetails.length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Total Run Hours</p>
          <p className="text-2xl font-bold text-green-600">
            {formatMinutesToHours(totalRunMinutes)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Running Now</p>
          <p className="text-2xl font-bold text-blue-600">{runningCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Not Running</p>
          <p className="text-2xl font-bold text-red-600">{notRunningCount}</p>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Operations Detail</h2>
        {operationsWithDetails.length === 0 ? (
          <p className="text-slate-500 text-sm">No operations found for this date</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Pump House</th>
                  <th>Scheme</th>
                  <th>Operator</th>
                  <th>Start</th>
                  <th>Stop</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {operationsWithDetails.map((op) => (
                  <tr key={op.id}>
                    <td className="font-medium">{op.pumpHouseName}</td>
                    <td>{op.schemeName}</td>
                    <td>{op.operatorName}</td>
                    <td>{op.startTime || "-"}</td>
                    <td>{op.stopTime || "-"}</td>
                    <td className="font-medium">
                      {op.startTime && op.stopTime
                        ? calculateRunHours(op.startTime, op.stopTime)
                        : "-"}
                    </td>
                    <td className="text-sm text-red-600">{op.reason || "-"}</td>
                    <td>
                      {op.status === "running" ? (
                        <span className="badge badge-running">Running</span>
                      ) : op.status === "stopped" ? (
                        <span className="badge badge-success">Completed</span>
                      ) : (
                        <span className="badge bg-red-100 text-red-700">Not Running</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Summary by Pump House</h2>
        {summaryByPumpHouse.length === 0 ? (
          <p className="text-slate-500 text-sm">No data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Pump House</th>
                  <th>Scheme</th>
                  <th>Runs</th>
                  <th>Total Time</th>
                </tr>
              </thead>
              <tbody>
                {summaryByPumpHouse.map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-medium">{item.name}</td>
                    <td>{item.schemeName}</td>
                    <td>{item.runs}</td>
                    <td className="font-medium text-green-600">
                      {formatMinutesToHours(item.totalMinutes)}
                    </td>
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
