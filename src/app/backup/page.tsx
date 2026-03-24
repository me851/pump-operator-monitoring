"use client";

import { useState, useEffect, useRef } from "react";
import { createBackup, downloadBackup, restoreBackup, getBackupInfo, BackupData } from "@/lib/backup";
import { getDivisions, getSchemes, getPumpHouses, getOperations, syncToServer, syncFromServer } from "@/lib/storage";

export default function BackupPage() {
  const [currentData, setCurrentData] = useState({
    divisions: 0,
    schemes: 0,
    pumpHouses: 0,
    operations: 0,
  });
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");
  const [restoreMode, setRestoreMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [backupInfo, setBackupInfo] = useState<{
    totalRecords: number;
    divisions: number;
    schemes: number;
    pumpHouses: number;
    operations: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentData({
      divisions: getDivisions().length,
      schemes: getSchemes().length,
      pumpHouses: getPumpHouses().length,
      operations: getOperations().length,
    });
  }, []);

  const handleBackup = () => {
    const backup = createBackup();
    downloadBackup(backup);
    setStatus("Backup downloaded successfully!");
    setStatusType("success");
    setTimeout(() => setStatus(""), 3000);
  };

  const handleSyncToServer = async () => {
    setIsSyncing(true);
    try {
      await syncToServer();
      setStatus("Data synced to server successfully!");
      setStatusType("success");
    } catch {
      setStatus("Failed to sync to server");
      setStatusType("error");
    }
    setIsSyncing(false);
    setTimeout(() => setStatus(""), 3000);
  };

  const handleSyncFromServer = async () => {
    setIsSyncing(true);
    try {
      await syncFromServer();
      setCurrentData({
        divisions: getDivisions().length,
        schemes: getSchemes().length,
        pumpHouses: getPumpHouses().length,
        operations: getOperations().length,
      });
      setStatus("Data synced from server successfully!");
      setStatusType("success");
    } catch {
      setStatus("Failed to sync from server");
      setStatusType("error");
    }
    setIsSyncing(false);
    setTimeout(() => setStatus(""), 3000);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData;
        const info = getBackupInfo(data);
        setBackupInfo(info);
        setRestoreMode(true);
      } catch {
        setStatus("Invalid backup file");
        setStatusType("error");
        setTimeout(() => setStatus(""), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleRestore = () => {
    if (!fileInputRef.current?.files?.[0]) return;

    const file = fileInputRef.current.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData;
        const result = restoreBackup(data);
        setStatus(result.message);
        setStatusType(result.success ? "success" : "error");

        if (result.success) {
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } catch {
        setStatus("Failed to restore backup. Invalid file format.");
        setStatusType("error");
      }
      setTimeout(() => {
        setStatus("");
        setStatusType("");
      }, 3000);
    };
    reader.readAsText(file);
  };

  const cancelRestore = () => {
    setRestoreMode(false);
    setBackupInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Data Backup & Restore</h1>
        <p className="page-subtitle">Backup your data locally or restore from a previous backup</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Current Data</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Divisions</span>
              <span className="font-semibold">{currentData.divisions}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Schemes</span>
              <span className="font-semibold">{currentData.schemes}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Pump Houses</span>
              <span className="font-semibold">{currentData.pumpHouses}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Operations</span>
              <span className="font-semibold">{currentData.operations}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-800 font-medium">Total Records</span>
              <span className="font-bold text-cyan-600">
                {currentData.divisions + currentData.schemes + currentData.pumpHouses + currentData.operations}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Create Backup</h2>
          <p className="text-slate-600 mb-4">
            Download a backup file containing all your divisions, schemes, pump houses, phone mappings, and operations data.
          </p>
          <button onClick={handleBackup} className="btn btn-primary w-full">
            Download Backup
          </button>
          <p className="text-xs text-slate-500 mt-3">
            The backup will be saved as a JSON file that can be restored later.
          </p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Network Sync</h2>
          <p className="text-slate-600 mb-4">
            Sync data between machines in your local network. All machines accessing this server will see the same data.
          </p>
          <div className="space-y-2">
            <button 
              onClick={handleSyncToServer} 
              disabled={isSyncing}
              className="btn btn-primary w-full"
            >
              {isSyncing ? "Syncing..." : "Sync to Server"}
            </button>
            <button 
              onClick={handleSyncFromServer} 
              disabled={isSyncing}
              className="btn btn-secondary w-full"
            >
              {isSyncing ? "Syncing..." : "Sync from Server"}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Data is stored on the server and shared across all machines.
          </p>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold mb-4">Restore from Backup</h2>
        <p className="text-slate-600 mb-4">
          Select a previously downloaded backup file to restore your data. This will replace all current data.
        </p>

        {!restoreMode ? (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="input file-input"
              style={{ maxWidth: "400px" }}
            />
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-800 mb-2">Backup File Details</h3>
            {backupInfo && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                <div>
                  <span className="text-slate-600">Divisions:</span>{" "}
                  <span className="font-medium">{backupInfo.divisions}</span>
                </div>
                <div>
                  <span className="text-slate-600">Schemes:</span>{" "}
                  <span className="font-medium">{backupInfo.schemes}</span>
                </div>
                <div>
                  <span className="text-slate-600">Pump Houses:</span>{" "}
                  <span className="font-medium">{backupInfo.pumpHouses}</span>
                </div>
                <div>
                  <span className="text-slate-600">Operations:</span>{" "}
                  <span className="font-medium">{backupInfo.operations}</span>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleRestore} className="btn btn-primary">
                Confirm Restore
              </button>
              <button onClick={cancelRestore} className="btn btn-secondary">
                Cancel
              </button>
            </div>
            <p className="text-xs text-amber-700 mt-3">
              Warning: Restoring will replace all current data with the backup data. This action cannot be undone.
            </p>
          </div>
        )}

        {status && (
          <p className={`mt-4 text-sm ${statusType === "success" ? "text-green-600" : "text-red-600"}`}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
