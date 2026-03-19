"use client";

import { useState, useCallback } from "react";
import { getPhoneMappings, getPumpHouses, getSchemes, getDivisions, getOperations, saveOperation } from "@/lib/storage";
import { PhoneMapping, PumpHouse, Scheme, Division, PumpOperation } from "@/types";
import { parseWhatsAppMessage } from "@/lib/parser";

interface ChatMessage {
  date: string;
  time: string;
  phoneNumber: string;
  senderName: string;
  message: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function ImportPage() {
  const [fileContent, setFileContent] = useState("");
  const [parsedMessages, setParsedMessages] = useState<ChatMessage[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseWhatsAppChat = (content: string): ChatMessage[] => {
    const lines = content.split("\n");
    const messages: ChatMessage[] = [];
    
    let currentMessage: Partial<ChatMessage> = {};
    let messageBuffer = "";

    const dateTimePattern = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/;
    const phonePattern = /^(\+?[\d\s\-]+):\s*(.+)/;
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
        
        currentMessage = {
          date: formattedDate,
          time: formattedTime,
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

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      
      const skipHeaderLines = 5;
      const contentAfterHeader = content.split("\n").slice(skipHeaderLines).join("\n");
      
      const messages = parseWhatsAppChat(contentAfterHeader);
      setParsedMessages(messages);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const getPhoneMapping = (phoneNumber: string): PhoneMapping | null => {
    const normalized = phoneNumber.replace(/[\s\-\(\)]/g, "");
    const mappings = getPhoneMappings();
    return mappings.find(m => {
      const mapped = m.phoneNumber.replace(/[\s\-\(\)]/g, "");
      return mapped.includes(normalized) || normalized.includes(mapped);
    }) || null;
  };

  const getPumpHouseDetails = (pumpHouseId: string) => {
    const ph = getPumpHouses().find(p => p.id === pumpHouseId);
    const sc = ph ? getSchemes().find(s => s.id === ph.schemeId) : null;
    const div = sc ? getDivisions().find(d => d.id === sc.divisionId) : null;
    return { pumpHouse: ph, scheme: sc, division: div };
  };

  const processImport = async () => {
    setIsProcessing(true);
    const result: ImportResult = { success: 0, failed: 0, errors: [] };
    
    const existingOps = getOperations();
    const maxId = existingOps.reduce((max, op) => {
      const num = parseInt(op.id.replace(/[^0-9]/g, "") || "0");
      return num > max ? num : max;
    }, 0);
    
    let opCounter = maxId + 1;

    for (const msg of parsedMessages) {
      const mapping = getPhoneMapping(msg.phoneNumber);
      
      if (!mapping) {
        result.failed++;
        result.errors.push(`Unknown phone: ${msg.phoneNumber} - "${msg.message.substring(0, 30)}"`);
        continue;
      }

      const parsed = parseWhatsAppMessage(msg.message);
      
      if (parsed.action === "unknown") {
        result.failed++;
        continue;
      }

      const date = msg.date;
      const time = parsed.time || msg.time;

      if (parsed.action === "start") {
        const newOp: PumpOperation = {
          id: "op" + opCounter++,
          pumpHouseId: mapping.pumpHouseId,
          operatorName: mapping.operatorName || msg.senderName,
          phoneNumber: msg.phoneNumber,
          date,
          startTime: time,
          stopTime: null,
          status: "running",
          reason: undefined,
          rawMessage: msg.message,
          translatedMessage: undefined,
          createdAt: new Date().toISOString(),
        };
        existingOps.push(newOp);
        result.success++;
      } 
      else if (parsed.action === "stop") {
        const todayOps = existingOps.filter(
          o => o.pumpHouseId === mapping.pumpHouseId && 
               o.date === date && 
               o.status === "running" &&
               !o.stopTime
        );
        
        if (todayOps.length > 0) {
          const latestOp = todayOps[todayOps.length - 1];
          latestOp.stopTime = time;
          latestOp.status = "stopped";
          latestOp.rawMessage = msg.message;
          result.success++;
        } else {
          const newOp: PumpOperation = {
            id: "op" + opCounter++,
            pumpHouseId: mapping.pumpHouseId,
            operatorName: mapping.operatorName || msg.senderName,
            phoneNumber: msg.phoneNumber,
            date,
            startTime: null,
            stopTime: time,
            status: "stopped",
            reason: undefined,
            rawMessage: msg.message,
            translatedMessage: undefined,
            createdAt: new Date().toISOString(),
          };
          existingOps.push(newOp);
          result.success++;
        }
      }
      else if (parsed.action === "not_running") {
        const newOp: PumpOperation = {
          id: "op" + opCounter++,
          pumpHouseId: mapping.pumpHouseId,
          operatorName: mapping.operatorName || msg.senderName,
          phoneNumber: msg.phoneNumber,
          date,
          startTime: null,
          stopTime: null,
          status: "not_running",
          reason: parsed.reason || "Not specified",
          rawMessage: msg.message,
          translatedMessage: parsed.reason,
          createdAt: new Date().toISOString(),
        };
        existingOps.push(newOp);
        result.success++;
      }
    }

    localStorage.setItem("aqualog_operations", JSON.stringify(existingOps));
    setImportResult(result);
    setIsProcessing(false);
  };

  const mappedMessages = parsedMessages.filter(msg => getPhoneMapping(msg.phoneNumber));
  const unmappedMessages = parsedMessages.filter(msg => !getPhoneMapping(msg.phoneNumber));

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
      </div>

      {parsedMessages.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="card">
              <p className="text-sm text-slate-500">Total Messages</p>
              <p className="text-2xl font-bold">{parsedMessages.length}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500">Mapped (Registered)</p>
              <p className="text-2xl font-bold text-green-600">{mappedMessages.length}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500">Unmapped (Unknown)</p>
              <p className="text-2xl font-bold text-amber-600">{unmappedMessages.length}</p>
            </div>
          </div>

          {unmappedMessages.length > 0 && (
            <div className="card mb-6 border-l-4 border-amber-500">
              <h3 className="font-semibold text-amber-700 mb-2">⚠️ Unmapped Phone Numbers</h3>
              <p className="text-sm text-slate-600 mb-3">
                These phone numbers are not registered. Please add them in Master Data → Phone Mappings
              </p>
              <div className="max-h-40 overflow-y-auto">
                <table className="table text-sm">
                  <thead>
                    <tr>
                      <th>Phone</th>
                      <th>Sample Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...new Set(unmappedMessages.map(m => m.phoneNumber))].map(phone => (
                      <tr key={phone}>
                        <td className="font-mono">{phone}</td>
                        <td className="text-slate-500">
                          {unmappedMessages.find(m => m.phoneNumber === phone)?.message.substring(0, 40)}...
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
            <div className="max-h-96 overflow-y-auto">
              <table className="table text-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Phone</th>
                    <th>Message</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedMessages.slice(0, 50).map((msg, idx) => {
                    const mapping = getPhoneMapping(msg.phoneNumber);
                    const parsed = parseWhatsAppMessage(msg.message);
                    return (
                      <tr key={idx}>
                        <td>{msg.date}</td>
                        <td>{msg.time}</td>
                        <td className="font-mono text-xs">{msg.phoneNumber.substring(0, 15)}</td>
                        <td className="max-w-xs truncate">{msg.message.substring(0, 30)}</td>
                        <td>
                          {mapping ? (
                            <span className={`badge ${parsed.action === "unknown" ? "bg-slate-200 text-slate-600" : "badge-success"}`}>
                              {parsed.action}
                            </span>
                          ) : (
                            <span className="badge bg-amber-100 text-amber-700">Unknown Phone</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {parsedMessages.length > 50 && (
                <p className="text-sm text-slate-500 text-center py-2">
                  ...and {parsedMessages.length - 50} more messages
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
              {isProcessing ? "Processing..." : `Import ${mappedMessages.length} Messages`}
            </button>
          </div>
        </>
      )}

      {importResult && (
        <div className={`card mt-6 ${importResult.failed === 0 ? "border-green-500" : "border-amber-500"}`}>
          <h3 className="font-semibold mb-2">
            {importResult.failed === 0 ? "✅ Import Complete" : "⚠️ Import Completed with Issues"}
          </h3>
          <p className="text-sm">
            Successfully processed: <span className="font-bold text-green-600">{importResult.success}</span> messages
            {importResult.failed > 0 && (
              <> • Failed: <span className="font-bold text-amber-600">{importResult.failed}</span></>
            )}
          </p>
          {importResult.errors.length > 0 && (
            <details className="mt-3">
              <summary className="text-sm text-slate-600 cursor-pointer">View Errors</summary>
              <ul className="text-xs text-slate-500 mt-2 space-y-1">
                {importResult.errors.slice(0, 10).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
