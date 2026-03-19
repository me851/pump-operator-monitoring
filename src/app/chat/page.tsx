"use client";

import { useState, useEffect, useRef } from "react";
import { getPhoneMappingsByPumpHouse, getPumpHouses, getSchemes, getDivisions } from "@/lib/storage";
import { PhoneMapping, PumpHouse, Scheme, Division } from "@/types";
import { parseWhatsAppMessage, generateResponseMessage } from "@/lib/parser";
import { saveOperation, getOpenOperations, getOperations } from "@/lib/storage";

export default function WhatsAppChatPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verifiedMapping, setVerifiedMapping] = useState<PhoneMapping | null>(null);
  const [pumpHouse, setPumpHouse] = useState<PumpHouse | null>(null);
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [division, setDivision] = useState<Division | null>(null);
  
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ sender: "user" | "system"; text: string; time: string }[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVerified && verifiedMapping) {
      const ph = getPumpHouses().find(p => p.id === verifiedMapping.pumpHouseId);
      const sc = ph ? getSchemes().find(s => s.id === ph.schemeId) : null;
      const div = sc ? getDivisions().find(d => d.id === sc.divisionId) : null;
      setPumpHouse(ph || null);
      setScheme(sc || null);
      setDivision(div || null);
      
      setChatHistory([
        {
          sender: "system",
          text: `✅ Verified! You are operator for ${ph?.name || "Pump"}. Division: ${div?.name || "N/A"}`,
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        },
        {
          sender: "system",
          text: "💬 Send messages in Bengali or English:\n• 'pump start' or 'পাম্প চালু' to start\n• 'pump stop' or 'পাম্প বন্ধ' to stop\n• 'not running' + reason if pump is down",
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    }
  }, [isVerified, verifiedMapping]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const verifyPhoneNumber = () => {
    const normalized = phoneNumber.replace(/\D/g, "");
    const mappings = getPhoneMappings();
    const mapping = mappings.find(m => m.phoneNumber.replace(/\D/g, "") === normalized);
    
    if (mapping) {
      setVerifiedMapping(mapping);
      setIsVerified(true);
    } else {
      alert("Phone number not registered. Contact administrator.");
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !isVerified) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
    const dateStr = now.toISOString().split("T")[0];

    const userMsg = { sender: "user" as const, text: message, time: timeStr };
    setChatHistory(prev => [...prev, userMsg]);

    const parsed = parseWhatsAppMessage(message);
    const pumpName = pumpHouse?.name || "Pump";

    if (parsed.action === "start") {
      saveOperation({
        pumpHouseId: verifiedMapping!.pumpHouseId,
        operatorName: verifiedMapping!.operatorName || "Unknown",
        phoneNumber: verifiedMapping!.phoneNumber,
        date: dateStr,
        startTime: timeStr,
        stopTime: null,
        status: "running",
        reason: undefined,
        rawMessage: message,
      });
      
      setChatHistory(prev => [...prev, {
        sender: "system",
        text: `✅ Pump ${pumpName} started at ${timeStr}. Operation logged.`,
        time: timeStr
      }]);
    } 
    else if (parsed.action === "stop") {
      const openOps = getOpenOperations(verifiedMapping!.pumpHouseId);
      const allOps = getOperations();
      
      if (openOps.length > 0) {
        const latestOp = openOps[0];
        const idx = allOps.findIndex(o => o.id === latestOp.id);
        if (idx !== -1) {
          allOps[idx].stopTime = timeStr;
          allOps[idx].status = "stopped";
          localStorage.setItem("aqualog_operations", JSON.stringify(allOps));
        }
      }
      
      setChatHistory(prev => [...prev, {
        sender: "system",
        text: `✅ Pump ${pumpName} stopped at ${timeStr}. Operation logged.`,
        time: timeStr
      }]);
    }
    else if (parsed.action === "not_running") {
      saveOperation({
        pumpHouseId: verifiedMapping!.pumpHouseId,
        operatorName: verifiedMapping!.operatorName || "Unknown",
        phoneNumber: verifiedMapping!.phoneNumber,
        date: dateStr,
        startTime: null,
        stopTime: null,
        status: "not_running",
        reason: parsed.reason || "Not specified",
        rawMessage: message,
        translatedMessage: parsed.reason,
      });
      
      setChatHistory(prev => [...prev, {
        sender: "system",
        text: `⚠️ Pump ${pumpName} not operational. Reason: ${parsed.reason || "Not specified"}. Noted.`,
        time: timeStr
      }]);
    }
    else {
      setChatHistory(prev => [...prev, {
        sender: "system",
        text: `📝 Message received. Use keywords: pump start / pump stop / pump not running [reason]`,
        time: timeStr
      }]);
    }

    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800">AquaLog Operator</h1>
            <p className="text-sm text-slate-500 mt-1">Enter your registered phone number</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                className="input"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 90001 11111"
              />
            </div>
            <button
              onClick={verifyPhoneNumber}
              className="btn btn-primary w-full"
            >
              Verify Number
            </button>
          </div>
          
          <p className="text-xs text-slate-400 text-center mt-4">
            Contact your administrator to register your number
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col">
      <header className="bg-green-600 text-white p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-xl">👤</span>
          </div>
          <div>
            <h1 className="font-semibold">{pumpHouse?.name} - Operator</h1>
            <p className="text-xs text-green-100">{division?.name} • {scheme?.name}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.sender === "user"
                  ? "bg-green-500 text-white"
                  : "bg-white text-slate-800"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.sender === "user" ? "text-green-100" : "text-slate-400"}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 input bg-slate-50"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            onClick={handleSendMessage}
            className="bg-green-500 text-white p-3 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function getPhoneMappings(): PhoneMapping[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem("aqualog_phone_mappings");
  return data ? JSON.parse(data) : [];
}
