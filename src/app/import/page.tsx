"use client";

import { useState, useEffect } from "react";
import { getPhoneMappings, getPumpHouses, getSchemes, getDivisions, getOperations, saveOperation } from "@/lib/storage";
import { PhoneMapping, PumpHouse, PumpOperation, Scheme, Division } from "@/types";
import { parseWhatsAppMessage, translateToEnglish } from "@/lib/parser";

interface ChatMessage {
  date: string;
  time: string;
  whatsappTimestamp: string;
  phoneNumber: string;
  senderName: string;
  message: string;
}

interface FailedMessage {
  date: string;
  time: string;
  phone: string;
  message: string;
  reason: string;
}

interface ImportResult {
  success: number;
  failed: number;
  failedMessages: FailedMessage[];
  unknownPhones: { phone: string; count: number; sampleMessage: string }[];
}

interface ImportHistory {
  id: string;
  date: string;
  fileName: string;
  totalMessages: number;
  imported: number;
  failed: number;
}

export default function ImportPage() {
  const [parsedMessages, setParsedMessages] = useState<ChatMessage[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState({
    pumpHouseId: "",
    date: "",
    time: "",
    action: "start" as "start" | "stop" | "not_running",
    reason: "",
  });
  const [addMessage, setAddMessage] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);

  const pumpHouses = getPumpHouses();
  const schemes = getSchemes();
  const divisions = getDivisions();

  useEffect(() => {
    const history = localStorage.getItem("aqualog_import_history");
    if (history) {
      setImportHistory(JSON.parse(history));
    }
  }, []);

  const saveHistory = (entry: ImportHistory) => {
    const newHistory = [entry, ...importHistory].slice(0, 10);
    setImportHistory(newHistory);
    localStorage.setItem("aqualog_import_history", JSON.stringify(newHistory));
  };

  const parseWhatsAppChat = (content: string): ChatMessage[] => {
    const lines = content.split("\n");
    const messages: ChatMessage[] = [];
    
    let currentMessage: Partial<ChatMessage> = {};
    let messageBuffer = "";

    const dateTimePattern = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/;
    const phonePattern = /^(\+\d{1,3}[\s\-]?\d{4,}[\s\-]?\d{4,6}):\s*(.+)/;
    const nameOnlyPattern = /^([^:]+):\s*(.+)/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      const dateMatch = line.match(dateTimePattern);
      if (dateMatch) {
        if (currentMessage.message && currentMessage.phoneNumber) {
          currentMessage.message = messageBuffer.trim();
          messages.push(currentMessage as ChatMessage);
        }
        
        let dateStr = dateMatch[1];
        const timeStr = dateMatch[2].toUpperCase();
        
        const [day, month, year] = dateStr.split("/");
        const fullYear = year.length === 2 ? "20" + year : year;
        const formattedDate = `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        
        let hours = parseInt(timeStr.match(/\d+/)?.[0] || "0");
        const minutes = parseInt(timeStr.match(/:\d+/)?.[0].replace(":", "") || "0");
        const isPM = timeStr.includes("PM");
        
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        
        const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
        
        const whatsappTimestamp = new Date(`${formattedDate}T${formattedTime}:00`);
        
        currentMessage = {
          date: formattedDate,
          time: formattedTime,
          whatsappTimestamp: whatsappTimestamp.toISOString(),
          phoneNumber: "",
          senderName: "",
          message: ""
        };
        messageBuffer = "";
        continue;
      }
      
      const phoneMatch = line.match(phonePattern);
      if (phoneMatch && currentMessage.date) {
        currentMessage.phoneNumber = phoneMatch[1].trim();
        currentMessage.senderName = phoneMatch[1].trim();
        messageBuffer = phoneMatch[2].trim();
        continue;
      }
      
      const nameMatch = line.match(nameOnlyPattern);
      if (nameMatch && currentMessage.date && line.includes(":")) {
        currentMessage.senderName = nameMatch[1].trim();
        messageBuffer = nameMatch[2].trim();
        continue;
      }
      
      if (messageBuffer && currentMessage.date) {
        messageBuffer += " " + line;
      }
    }

    if (currentMessage.message && currentMessage.phoneNumber) {
      currentMessage.message = messageBuffer.trim();
      messages.push(currentMessage as ChatMessage);
    }

    return messages;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsLoadingFile(true);
    setLoadingStatus("Reading file...");
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setLoadingStatus("Parsing messages...");
      
      setTimeout(() => {
        const content = e.target?.result as string;
        
        const skipHeaderLines = 5;
        const contentAfterHeader = content.split("\n").slice(skipHeaderLines).join("\n");
        
        const messages = parseWhatsAppChat(contentAfterHeader);
        setParsedMessages(messages);
        setImportResult(null);
        setIsLoadingFile(false);
        setLoadingStatus("");
      }, 100);
    };
    reader.onerror = () => {
      setLoadingStatus("Error reading file. Please try again.");
      setIsLoadingFile(false);
    };
    reader.readAsText(file);
  };

  const normalizePhoneNumber = (phone: string): string => {
    return phone.replace(/[\s\-\(\)\+]/g, "");
  };

  const getMappingByPhoneOrName = (phoneNumber: string, senderName: string): PhoneMapping | null => {
    const mappings = getPhoneMappings();
    
    if (phoneNumber) {
      const normalized = normalizePhoneNumber(phoneNumber);
      const phoneMatch = mappings.find(m => {
        const mapped = normalizePhoneNumber(m.phoneNumber);
        return mapped.includes(normalized) || normalized.includes(mapped);
      });
      if (phoneMatch) return phoneMatch;
    }
    
    if (senderName) {
      const nameMatch = mappings.find(m => 
        m.operatorName?.toLowerCase() === senderName.toLowerCase() ||
        m.operatorName?.toLowerCase().includes(senderName.toLowerCase()) ||
        senderName.toLowerCase().includes(m.operatorName?.toLowerCase() || "")
      );
      if (nameMatch) return nameMatch;
    }
    
    return null;
  };

  const getPumpHouseMapping = (phoneNumber: string, senderName: string): { pumpHouse: PumpHouse | null; scheme: Scheme | null; division: Division | null } => {
    const mapping = getMappingByPhoneOrName(phoneNumber, senderName);
    
    if (mapping) {
      const pumpHouse = pumpHouses.find(p => p.id === mapping.pumpHouseId) || null;
      const scheme = pumpHouse ? schemes.find(s => s.id === pumpHouse.schemeId) || null : null;
      const division = scheme ? divisions.find(d => d.id === scheme.divisionId) || null : null;
      return { pumpHouse, scheme, division };
    }
    
    const senderLower = senderName.toLowerCase();
    for (const ph of pumpHouses) {
      const scheme = schemes.find(s => s.id === ph.schemeId) || null;
      const division = scheme ? divisions.find(d => d.id === scheme.divisionId) || null : null;
      
      const phName = ph.name.toLowerCase();
      const schemeName = scheme?.name.toLowerCase() || "";
      const divisionName = division?.name.toLowerCase() || "";
      
      if (senderLower.includes(phName) || senderLower.includes(schemeName) || senderLower.includes(divisionName)) {
        return { pumpHouse: ph, scheme, division };
      }
    }
    
    return { pumpHouse: null, scheme: null, division: null };
  };

  const processImport = async () => {
    setIsProcessing(true);
    setShowTranslation(true);
    const result: ImportResult = { success: 0, failed: 0, failedMessages: [], unknownPhones: [] };
    
    const unknownPhoneMap = new Map<string, { count: number; sampleMessage: string }>();
    
    const existingOps = getOperations();
    const maxId = existingOps.reduce((max, op) => {
      const num = parseInt(op.id.replace(/[^0-9]/g, "") || "0");
      return num > max ? num : max;
    }, 0);
    
    let opCounter = maxId + 1;

    for (const msg of parsedMessages) {
      const { pumpHouse, scheme, division } = getPumpHouseMapping(msg.phoneNumber, msg.senderName);
      
      if (!pumpHouse) {
        result.failed++;
        const existing = unknownPhoneMap.get(msg.senderName || msg.phoneNumber);
        if (existing) {
          existing.count++;
        } else {
          unknownPhoneMap.set(msg.senderName || msg.phoneNumber, { count: 1, sampleMessage: msg.message.substring(0, 50) });
        }
        continue;
      }

      const parsed = parseWhatsAppMessage(msg.message, msg.whatsappTimestamp);
      
      if (parsed.action === "unknown") {
        result.failed++;
        result.failedMessages.push({
          date: msg.date,
          time: msg.time,
          phone: msg.senderName || msg.phoneNumber,
          message: msg.message,
          reason: "Could not understand message"
        });
        continue;
      }

      const translatedMessage = await translateToEnglish(msg.message);

      const date = parsed.date || msg.date;
      const time = parsed.time || msg.time;

      if (parsed.action === "start") {
        const newOp: PumpOperation = {
          id: "op" + opCounter++,
          pumpHouseId: pumpHouse.id,
          operatorName: msg.senderName || "Unknown",
          phoneNumber: msg.phoneNumber || msg.senderName,
          date,
          startTime: time,
          stopTime: null,
          status: "running",
          reason: undefined,
          rawMessage: msg.message,
          translatedMessage: translatedMessage,
          createdAt: new Date().toISOString(),
        };
        existingOps.push(newOp);
        result.success++;
      } 
      else if (parsed.action === "stop") {
        const todayOps = existingOps.filter(
          o => o.pumpHouseId === pumpHouse.id && 
               o.date === date && 
               o.status === "running" &&
               !o.stopTime
        );
        
        if (todayOps.length > 0) {
          const latestOp = todayOps[todayOps.length - 1];
          latestOp.stopTime = time;
          latestOp.status = "stopped";
          latestOp.rawMessage = msg.message;
          latestOp.translatedMessage = translatedMessage;
          result.success++;
        } else {
          const newOp: PumpOperation = {
            id: "op" + opCounter++,
            pumpHouseId: pumpHouse.id,
            operatorName: msg.senderName || "Unknown",
            phoneNumber: msg.phoneNumber || msg.senderName,
            date,
            startTime: null,
            stopTime: time,
            status: "stopped",
            reason: undefined,
            rawMessage: msg.message,
            translatedMessage: translatedMessage,
            createdAt: new Date().toISOString(),
          };
          existingOps.push(newOp);
          result.success++;
        }
      }
      else if (parsed.action === "not_running") {
        const newOp: PumpOperation = {
          id: "op" + opCounter++,
          pumpHouseId: pumpHouse.id,
          operatorName: msg.senderName || "Unknown",
          phoneNumber: msg.phoneNumber || msg.senderName,
          date,
          startTime: null,
          stopTime: null,
          status: "not_running",
          reason: parsed.reason || "Not specified",
          rawMessage: msg.message,
          translatedMessage: translatedMessage,
          createdAt: new Date().toISOString(),
        };
        existingOps.push(newOp);
        result.success++;
      }
    }

    result.unknownPhones = Array.from(unknownPhoneMap.entries()).map(([phone, data]) => ({
      phone,
      ...data
    }));
    
    localStorage.setItem("aqualog_operations", JSON.stringify(existingOps));
    
    saveHistory({
      id: "imp" + Date.now(),
      date: new Date().toISOString(),
      fileName: selectedFileName,
      totalMessages: parsedMessages.length,
      imported: result.success,
      failed: result.failed
    });
    
    setImportResult(result);
    setIsProcessing(false);
  };

  const openAddForm = (failedMsg: FailedMessage) => {
    setAddFormData({
      pumpHouseId: "",
      date: failedMsg.date,
      time: failedMsg.time,
      action: "start",
      reason: "",
    });
    setAddMessage(failedMsg.message);
    setShowAddForm(true);
  };

  const handleAddToLog = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addFormData.pumpHouseId || !addFormData.date || !addFormData.time) {
      setAddMessage("Please fill all required fields");
      return;
    }

    const pumpHouse = pumpHouses.find(p => p.id === addFormData.pumpHouseId);
    const mapping = getPhoneMappings().find(m => m.pumpHouseId === addFormData.pumpHouseId);

    const newOp: PumpOperation = {
      id: "op" + Date.now(),
      pumpHouseId: addFormData.pumpHouseId,
      operatorName: mapping?.operatorName || "Manual",
      phoneNumber: "manual",
      date: addFormData.date,
      startTime: addFormData.action === "start" ? addFormData.time : null,
      stopTime: addFormData.action === "stop" ? addFormData.time : null,
      status: addFormData.action === "not_running" ? "not_running" : 
              addFormData.action === "start" ? "running" : "stopped",
      reason: addFormData.action === "not_running" ? addFormData.reason : undefined,
      rawMessage: "Added from failed import: " + addMessage,
      createdAt: new Date().toISOString(),
    };

    const existingOps = getOperations();
    existingOps.push(newOp);
    localStorage.setItem("aqualog_operations", JSON.stringify(existingOps));

    setAddSuccess("Operation added successfully!");
    setShowAddForm(false);
    setAddMessage("");
    setTimeout(() => setAddSuccess(""), 3000);
  };

  const mappedMessages = parsedMessages.filter(msg => getMappingByPhoneOrName(msg.phoneNumber, msg.senderName));
  const unmappedMessages = parsedMessages.filter(msg => !getMappingByPhoneOrName(msg.phoneNumber, msg.senderName));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Import WhatsApp Chat</h1>
        <p className="page-subtitle">Import and process exported WhatsApp group chats</p>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload Chat Export</h2>
        <p className="text-sm text-slate-600 mb-4">
          In WhatsApp: Open the group → Menu → Export chat → Without media → Save the text file
        </p>
        
        <input
          type="file"
          accept=".txt"
          onChange={handleFileUpload}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
        />
        
        {selectedFileName && !loadingStatus && parsedMessages.length === 0 && (
          <div className="mt-4 text-center">
            <p className="text-slate-500">No messages found in file.</p>
          </div>
        )}
        
        {loadingStatus && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-600"></div>
            <p className="text-slate-600">{loadingStatus}</p>
          </div>
        )}
      </div>

      {parsedMessages.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="card">
              <p className="text-sm text-slate-500">Total Messages</p>
              <p className="text-2xl font-bold">{parsedMessages.length}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500">Mapped (Identified)</p>
              <p className="text-2xl font-bold text-green-600">{mappedMessages.length}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500">Unmapped (Unknown)</p>
              <p className="text-2xl font-bold text-amber-600">{unmappedMessages.length}</p>
            </div>
          </div>

          {unmappedMessages.length > 0 && (
            <div className="card mb-6 border-l-4 border-amber-500">
              <h3 className="font-semibold text-amber-700 mb-2">⚠️ Unmapped Senders</h3>
              <p className="text-sm text-slate-600 mb-3">
                These senders could not be mapped. They may be identified by name instead of phone number.
              </p>
              <div className="max-h-40 overflow-y-auto">
                <table className="table text-sm">
                  <thead>
                    <tr>
                      <th>Sender Name</th>
                      <th>Sample Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...new Set(unmappedMessages.map(m => m.senderName || m.phoneNumber))].map(sender => (
                      <tr key={sender}>
                        <td className="font-medium">{sender}</td>
                        <td className="text-slate-500">
                          {unmappedMessages.find(m => (m.senderName || m.phoneNumber) === sender)?.message.substring(0, 40)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card mb-6">
            <h3 className="font-semibold mb-4">Preview Messages</h3>
            <div className="max-h-64 overflow-y-auto">
              <table className="table text-sm">
                <thead>
                  <tr>
                    <th>Date/Time</th>
                    <th>Sender</th>
                    <th>Message</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedMessages.slice(0, 30).map((msg, idx) => {
                    const mapping = getMappingByPhoneOrName(msg.phoneNumber, msg.senderName);
                    const parsed = parseWhatsAppMessage(msg.message, msg.whatsappTimestamp);
                    return (
                      <tr key={idx}>
                        <td className="whitespace-nowrap">{msg.date} {msg.time}</td>
                        <td className="text-xs">{msg.senderName || msg.phoneNumber}</td>
                        <td className="max-w-xs truncate" title={msg.message}>
                          {msg.message.substring(0, 30)}
                          {msg.message.length > 30 && "..."}
                        </td>
                        <td>
                          {mapping ? (
                            <span className={`badge ${parsed.action === "unknown" ? "bg-slate-200 text-slate-600" : "badge-success"}`}>
                              {parsed.action}
                            </span>
                          ) : (
                            <span className="badge bg-amber-100 text-amber-700">Unknown</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {parsedMessages.length > 30 && (
                <p className="text-sm text-slate-500 text-center py-2">
                  ...and {parsedMessages.length - 30} more messages
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={processImport}
              disabled={isProcessing || mappedMessages.length === 0}
              className="btn btn-primary disabled:opacity-50"
            >
              {isProcessing ? "Processing & Translating..." : `Import ${mappedMessages.length} Messages`}
            </button>
            
            <button
              onClick={() => {
                setParsedMessages([]);
                setSelectedFileName("");
                setImportResult(null);
              }}
              className="btn btn-secondary"
            >
              Clear
            </button>
          </div>
        </>
      )}

      {importResult && (
        <div className="space-y-4 mt-6">
          <div className={`card ${importResult.failed === 0 ? "border-green-500" : "border-amber-500"}`}>
            <h3 className="font-semibold mb-2">
              {importResult.failed === 0 ? "✅ Import Complete" : "⚠️ Import Completed with Issues"}
            </h3>
            <div className="flex gap-6">
              <div>
                <p className="text-sm text-slate-500">Successfully Imported</p>
                <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Failed / Not Imported</p>
                <p className="text-2xl font-bold text-amber-600">{importResult.failed}</p>
              </div>
            </div>
          </div>

          {importResult.unknownPhones.length > 0 && (
            <div className="card border-l-4 border-red-500">
              <h3 className="font-semibold text-red-700 mb-3">⚠️ Unmapped Senders - Need Registration</h3>
              <p className="text-sm text-slate-600 mb-4">
                These senders were not recognized. Add them in Master Data → Phone Mappings with their operator name or phone.
              </p>
              <div className="max-h-60 overflow-y-auto">
                <table className="table text-sm">
                  <thead>
                    <tr>
                      <th>Sender</th>
                      <th>Messages Count</th>
                      <th>Sample Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.unknownPhones.map((item, idx) => (
                      <tr key={idx}>
                        <td className="font-medium">{item.phone}</td>
                        <td><span className="badge bg-red-100 text-red-700">{item.count}</span></td>
                        <td className="text-slate-500">{item.sampleMessage}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {importResult.failedMessages.length > 0 && (
            <div className="card border-l-4 border-amber-500">
              <h3 className="font-semibold text-amber-700 mb-3">⚠️ Failed Messages - Need Manual Check</h3>
              <p className="text-sm text-slate-600 mb-4">
                These messages could not be understood. Review and add manually if needed.
              </p>
              <div className="max-h-60 overflow-y-auto">
                <table className="table text-sm">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Sender</th>
                      <th>Message</th>
                      <th>Reason</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.failedMessages.map((msg, idx) => (
                      <tr key={idx}>
                        <td>{msg.date}</td>
                        <td>{msg.time}</td>
                        <td>{msg.phone}</td>
                        <td className="max-w-xs truncate">{msg.message}</td>
                        <td><span className="badge bg-amber-100 text-amber-700">{msg.reason}</span></td>
                        <td>
                          <button
                            onClick={() => openAddForm(msg)}
                            className="text-xs bg-cyan-600 text-white px-2 py-1 rounded hover:bg-cyan-700"
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {importHistory.length > 0 && (
        <div className="card mt-6">
          <h3 className="font-semibold mb-4">Recent Imports</h3>
          <div className="overflow-x-auto">
            <table className="table text-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>File Name</th>
                  <th>Total</th>
                  <th>Imported</th>
                  <th>Failed</th>
                </tr>
              </thead>
              <tbody>
                {importHistory.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.date).toLocaleString()}</td>
                    <td>{entry.fileName}</td>
                    <td>{entry.totalMessages}</td>
                    <td className="text-green-600">{entry.imported}</td>
                    <td className="text-amber-600">{entry.failed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Failed Message to Log</h3>
            <form onSubmit={handleAddToLog} className="space-y-4">
              <div>
                <label className="label">Pump House</label>
                <select
                  className="select"
                  value={addFormData.pumpHouseId}
                  onChange={(e) => setAddFormData({ ...addFormData, pumpHouseId: e.target.value })}
                  required
                >
                  <option value="">Select Pump House</option>
                  {pumpHouses.map((ph) => {
                    const scheme = schemes.find(s => s.id === ph.schemeId);
                    const division = divisions.find(d => d.id === scheme?.divisionId);
                    return (
                      <option key={ph.id} value={ph.id}>
                        {ph.name} - {scheme?.name} ({division?.name})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="label">Action</label>
                <select
                  className="select"
                  value={addFormData.action}
                  onChange={(e) => setAddFormData({ ...addFormData, action: e.target.value as "start" | "stop" | "not_running" })}
                >
                  <option value="start">Pump Start</option>
                  <option value="stop">Pump Stop</option>
                  <option value="not_running">Not Running</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    className="input"
                    value={addFormData.date}
                    onChange={(e) => setAddFormData({ ...addFormData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Time</label>
                  <input
                    type="time"
                    className="input"
                    value={addFormData.time}
                    onChange={(e) => setAddFormData({ ...addFormData, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              {addFormData.action === "not_running" && (
                <div>
                  <label className="label">Reason</label>
                  <input
                    type="text"
                    className="input"
                    value={addFormData.reason}
                    onChange={(e) => setAddFormData({ ...addFormData, reason: e.target.value })}
                    placeholder="Reason for not running"
                  />
                </div>
              )}

              <div>
                <label className="label">Original Message</label>
                <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">{addMessage}</p>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1">
                  Add to Log
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {addSuccess}
        </div>
      )}
    </div>
  );
}
