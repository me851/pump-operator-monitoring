"use client";

import { useState, useEffect } from "react";
import {
  getDivisions,
  getSchemes,
  getPumpHouses,
  getOpenOperations,
  saveOperation,
  initializeSampleData,
} from "@/lib/storage";
import { Division, Scheme, PumpHouse, PumpOperation } from "@/types";

export default function LogPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [pumpHouses, setPumpHouses] = useState<PumpHouse[]>([]);
  
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedScheme, setSelectedScheme] = useState("");
  const [selectedPumpHouse, setSelectedPumpHouse] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("");
  
  const [action, setAction] = useState<"start" | "stop">("start");
  const [openOps, setOpenOps] = useState<PumpOperation[]>([]);
  const [message, setMessage] = useState("");
  const [showStopOptions, setShowStopOptions] = useState(false);

  useEffect(() => {
    initializeSampleData();
    setDivisions(getDivisions());
    setSchemes(getSchemes());
    setPumpHouses(getPumpHouses());
  }, []);

  useEffect(() => {
    if (selectedPumpHouse) {
      setOpenOps(getOpenOperations(selectedPumpHouse));
    }
  }, [selectedPumpHouse]);

  const handleSchemeChange = (schemeId: string) => {
    setSelectedScheme(schemeId);
    setSelectedPumpHouse("");
  };

  const handlePumpHouseChange = (pumpHouseId: string) => {
    setSelectedPumpHouse(pumpHouseId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (action === "start") {
      if (!selectedPumpHouse || !operatorName || !date || !time) {
        setMessage("Please fill all fields");
        return;
      }
      
      saveOperation({
        pumpHouseId: selectedPumpHouse,
        operatorName,
        phoneNumber: "manual",
        date,
        startTime: time,
        stopTime: null,
        status: "running",
        rawMessage: "Manual entry",
      });
      
      setMessage("Pump start logged successfully!");
      setOperatorName("");
      setTime("");
    } else {
      if (!selectedPumpHouse || !date || !time) {
        setMessage("Please fill all fields");
        return;
      }
      
      const ops = getOpenOperations(selectedPumpHouse);
      if (ops.length > 0) {
        const latestOp = ops[0];
        const updatedOp: PumpOperation = {
          ...latestOp,
          stopTime: time,
          status: "stopped",
        };
        
        const allOps = JSON.parse(localStorage.getItem("aqualog_operations") || "[]");
        const idx = allOps.findIndex((o: PumpOperation) => o.id === latestOp.id);
        if (idx !== -1) {
          allOps[idx] = updatedOp;
          localStorage.setItem("aqualog_operations", JSON.stringify(allOps));
        }
        
        setMessage("Pump stop logged successfully!");
      } else {
        setMessage("No open pump operation found to stop");
      }
    }
    
    setTimeout(() => setMessage(""), 3000);
  };

  const filteredSchemes = schemes.filter(
    (s) => s.divisionId === selectedDivision
  );
  const filteredPumpHouses = pumpHouses.filter(
    (p) => p.schemeId === selectedScheme
  );

  const getPumpHouseName = (id: string) => {
    const ph = pumpHouses.find((p) => p.id === id);
    return ph?.name || id;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Log Pump Operation</h1>
        <p className="page-subtitle">Record pump start and stop times</p>
      </div>

      {divisions.length === 0 ? (
        <div className="card">
          <p className="text-slate-600">
            Please set up your master data first.{" "}
            <a href="/master" className="text-cyan-600 hover:underline">
              Go to Master Data
            </a>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">New Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Action</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAction("start");
                      setShowStopOptions(false);
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      action === "start"
                        ? "bg-green-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    Start Pump
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAction("stop");
                      setShowStopOptions(true);
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      action === "stop"
                        ? "bg-red-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    Stop Pump
                  </button>
                </div>
              </div>

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
                >
                  <option value="">Select Division</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Water Supply Scheme</label>
                <select
                  className="select"
                  value={selectedScheme}
                  onChange={(e) => handleSchemeChange(e.target.value)}
                  disabled={!selectedDivision}
                >
                  <option value="">Select Scheme</option>
                  {filteredSchemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Pump House</label>
                <select
                  className="select"
                  value={selectedPumpHouse}
                  onChange={(e) => handlePumpHouseChange(e.target.value)}
                  disabled={!selectedScheme}
                >
                  <option value="">Select Pump House</option>
                  {filteredPumpHouses.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {action === "start" && (
                <div>
                  <label className="label">Operator Name</label>
                  <input
                    type="text"
                    className="input"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    placeholder="Enter operator name"
                  />
                </div>
              )}

              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label">
                  {action === "start" ? "Start Time" : "Stop Time"}
                </label>
                <input
                  type="time"
                  className="input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary w-full">
                {action === "start" ? "Log Start" : "Log Stop"}
              </button>

              {message && (
                <p
                  className={`text-sm ${
                    message.includes("success") ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {message}
                </p>
              )}
            </form>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">
              Currently Running Pumps
            </h2>
            {openOps.length === 0 ? (
              <p className="text-slate-500 text-sm">
                No pumps currently running
              </p>
            ) : (
              <div className="space-y-3">
                {openOps.map((op) => (
                  <div
                    key={op.id}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                  >
                    <div>
                      <p className="font-medium text-blue-900">
                        {getPumpHouseName(op.pumpHouseId)}
                      </p>
                      <p className="text-sm text-blue-700">
                        Started at {op.startTime} on {op.date}
                      </p>
                      <p className="text-xs text-blue-500">
                        Operator: {op.operatorName}
                      </p>
                    </div>
                    <span className="badge badge-running">Running</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
