import { ParsedMessage } from "@/types";
import { getSettings } from "./storage";

const BENGALI_KEYWORDS: Record<string, string> = {
  "পাম্প চালু": "start",
  "পাম্প চালু করা হয়েছে": "start",
  "পাম্প চালু হয়েছে": "start",
  "মোটর চালু": "start",
  "মোটর চালু করা হয়েছে": "start",
  "মোটর চালু হয়েছে": "start",
  "পাম্প শুরু": "start",
  "পাম্প বন্ধ": "stop",
  "পাম্প বন্ধ করা হয়েছে": "stop",
  "পাম্প বন্ধ হয়েছে": "stop",
  "মোটর বন্ধ": "stop",
  "মোটর বন্ধ করা হয়েছে": "stop",
  "মোটর বন্ধ হয়েছে": "stop",
  "পাম্প স্টপ": "stop",
  "চলছে": "running",
  "চলছে না": "not_running",
  "হচ্ছে না": "not_running",
  "চালু হয়নি": "not_running",
  "বন্ধ হয়ে গেছে": "stop",
  "পাম্প অফ": "stop",
  "পাম্প অন": "start",
};

const ENGLISH_KEYWORDS: Record<string, string> = {
  "pump start": "start",
  "pump on": "start",
  "pump running": "start",
  "motor start": "start",
  "motor on": "start",
  "motor running": "start",
  "started": "start",
  "pump stop": "stop",
  "pump off": "stop",
  "pump stopped": "stop",
  "motor stop": "stop",
  "motor off": "stop",
  "motor stopped": "stop",
  "stopped": "stop",
  "not running": "not_running",
  "not running due": "not_running",
  "pump not running": "not_running",
  "motor not running": "not_running",
  "problem": "not_running",
  "issue": "not_running",
};

const REASON_KEYWORDS: Record<string, string> = {
  "no power": "No power supply",
  "লাইন নেই": "No power supply",
  "বিদ্যুৎ নেই": "No power supply",
  "আলো নেই": "No power supply",
  "no water": "No water",
  "পানি নেই": "No water",
  "জল নেই": "No water",
  "repair": "Under repair",
  "মেরামত": "Under repair",
  "ত্রুটি": "Fault/Malfunction",
  "fault": "Fault/Malfunction",
  "breakdown": "Breakdown",
  "maintenance": "Under maintenance",
  "জারি": "Long running",
  "overload": "Motor overload",
  "burnt": "Motor burnt",
  "pump burnt": "Pump burnt",
  "cable": "Cable fault",
  "তার": "Cable fault",
  "pipe": "Pipe problem",
  "নল": "Pipe problem",
  "valve": "Valve issue",
  "leak": "Leakage",
  "ক্ষতি": "Damage",
  "accident": "Accident",
};

const bengaliWordMap: Record<string, string> = {
  "পাম্প": "pump",
  "মোটর": "motor",
  "চালু": "start",
  "বন্ধ": "stop",
  "শুরু": "start",
  "চলছে": "running",
  "হচ্ছে": "happening",
  "না": "not",
  "করা": "done",
  "হয়েছে": "done",
  "সমস্যা": "problem",
  "ত্রুটি": "fault",
  "মেরামত": "repair",
  "লাইন": "line",
  "বিদ্যুৎ": "electricity",
  "পানি": "water",
  "জল": "water",
  "কারণ": "because",
  "তাই": "so",
  "এবার": "now",
};

function basicBengaliTranslate(text: string): string {
  let translated = text.toLowerCase();
  for (const [bn, en] of Object.entries(bengaliWordMap)) {
    translated = translated.replace(new RegExp(bn, "g"), en);
  }
  return translated;
}

function extractTimeFromMessage(text: string): string | undefined {
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm)?/i,
    /(\d{1,2})\s*(am|pm)/i,
    /at\s*(\d{1,2}):?(\d{2})?/i,
  ];

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      const meridiem = match[3]?.toLowerCase();

      if (meridiem === "pm" && hours < 12) hours += 12;
      if (meridiem === "am" && hours === 12) hours = 0;

      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }
  }

  return undefined;
}

function extractDateFromMessage(text: string): string | undefined {
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[1].length === 4) {
        return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
      }
      const year = new Date().getFullYear();
      return `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
    }
  }

  return undefined;
}

function extractReason(text: string): string | undefined {
  const lowerText = text.toLowerCase();

  for (const [keyword, reason] of Object.entries(REASON_KEYWORDS)) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return reason;
    }
  }

  const afterNotRunning = lowerText.split(/not running|চলছে না|হচ্ছে না/);
  if (afterNotRunning.length > 1 && afterNotRunning[1].trim().length > 3) {
    return afterNotRunning[1].trim().substring(0, 100);
  }

  return undefined;
}

export function parseWhatsAppMessage(
  message: string,
  whatsappTimestamp?: string
): ParsedMessage {
  const result: ParsedMessage = {
    action: "unknown",
    confidence: 0,
  };

  const normalizedMessage = message.toLowerCase().trim();
  const translatedMessage = basicBengaliTranslate(message);
  const combinedText = `${normalizedMessage} ${translatedMessage}`;

  for (const [keyword, action] of Object.entries(ENGLISH_KEYWORDS)) {
    if (combinedText.includes(keyword)) {
      result.action = action as ParsedMessage["action"];
      result.confidence = 0.9;
      break;
    }
  }

  if (result.action === "unknown") {
    for (const [keyword, action] of Object.entries(BENGALI_KEYWORDS)) {
      if (normalizedMessage.includes(keyword)) {
        result.action = action as ParsedMessage["action"];
        result.confidence = 0.85;
        break;
      }
    }
  }

  if (result.action === "unknown") {
    if (combinedText.includes("start") || combinedText.includes("on") || combinedText.includes("running")) {
      result.action = "start";
      result.confidence = 0.5;
    } else if (combinedText.includes("stop") || combinedText.includes("off") || combinedText.includes("close")) {
      result.action = "stop";
      result.confidence = 0.5;
    }
  }

  const timeFromMessage = extractTimeFromMessage(message);
  if (timeFromMessage) {
    result.time = timeFromMessage;
  } else if (whatsappTimestamp) {
    const date = new Date(whatsappTimestamp);
    if (!isNaN(date.getTime())) {
      result.time = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    }
  }

  const dateFromMessage = extractDateFromMessage(message);
  if (dateFromMessage) {
    result.date = dateFromMessage;
  } else if (whatsappTimestamp) {
    const date = new Date(whatsappTimestamp);
    if (!isNaN(date.getTime())) {
      result.date = date.toISOString().split("T")[0];
    }
  }

  const reason = extractReason(message);
  if (reason) {
    result.reason = reason;
    if (result.action === "unknown") {
      result.action = "not_running";
    }
  }

  return result;
}

export async function translateToEnglish(text: string): Promise<string> {
  if (!text || text.trim() === "") return text;
  
  const isBengali = /[\u0980-\u09FF]/.test(text);
  if (!isBengali) return text;

  const settings = getSettings();
  const { provider, ollamaBaseUrl, ollamaModel, openaiApiKey, openrouterApiKey } = settings;

  const systemPrompt = "You are a Bengali to English translator. Translate the following Bengali text to English accurately. Only respond with the translation, nothing else.";

  if (provider === "ollama") {
    const url = ollamaBaseUrl || "http://localhost:11434";
    try {
      const response = await fetch(`${url}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel || "llama3.2",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text }
          ],
          stream: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.message?.content?.trim() || text;
      }
    } catch (error) {
      console.error("Ollama translation error:", error);
    }
  }

  if (provider === "openrouter" && openrouterApiKey) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openrouterApiKey}`,
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
          "X-Title": "AquaLog",
        },
        body: JSON.stringify({
          model: ollamaModel || "google/gemma-3-4b-it:free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text }
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || text;
      }
    } catch (error) {
      console.error("OpenRouter translation error:", error);
    }
  }

  if (provider === "openai" && openaiApiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text }
          ],
          max_tokens: 1000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || text;
      }
    } catch (error) {
      console.error("OpenAI translation error:", error);
    }
  }

  return basicBengaliTranslate(text);
}

export function generateResponseMessage(
  action: string,
  pumpHouseName: string,
  time?: string
): string {
  const timeStr = time || new Date().toLocaleTimeString("en-IN", { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: false 
  });

  switch (action) {
    case "start":
      return `✅ Pump ${pumpHouseName} started at ${timeStr}. Operation logged.`;
    case "stop":
      return `✅ Pump ${pumpHouseName} stopped at ${timeStr}. Operation logged.`;
    case "not_running":
      return `⚠️ Pump ${pumpHouseName} not operational. Reason noted.`;
    default:
      return `📝 Message received for ${pumpHouseName}. Please use keywords: pump start / pump stop`;
  }
}
