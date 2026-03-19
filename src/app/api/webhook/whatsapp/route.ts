import { NextRequest, NextResponse } from "next/server";
import { parseWhatsAppMessage, generateResponseMessage } from "@/lib/parser";

const MOCK_MODE = true;

const mockDb = {
  divisions: [
    { id: "d1", name: "Division North" },
    { id: "d2", name: "Division South" },
    { id: "d3", name: "Division East" },
  ],
  schemes: [
    { id: "s1", divisionId: "d1", name: "Kolkata Scheme" },
    { id: "s2", divisionId: "d1", name: "Howrah Scheme" },
    { id: "s3", divisionId: "d2", name: "Midnapore Scheme" },
    { id: "s4", divisionId: "d3", name: "Bardhaman Scheme" },
  ],
  pumpHouses: [
    { id: "ph1", schemeId: "s1", name: "PH-1" },
    { id: "ph2", schemeId: "s1", name: "PH-2" },
    { id: "ph3", schemeId: "s2", name: "PH-1" },
    { id: "ph4", schemeId: "s3", name: "PH-1" },
    { id: "ph5", schemeId: "s3", name: "PH-2" },
    { id: "ph6", schemeId: "s4", name: "PH-1" },
  ],
  phoneMappings: [
    { id: "pm1", pumpHouseId: "ph1", phoneNumber: "+919000111111", operatorName: "Ramesh" },
    { id: "pm2", pumpHouseId: "ph2", phoneNumber: "+919000222222", operatorName: "Suresh" },
    { id: "pm3", pumpHouseId: "ph3", phoneNumber: "+919000333333", operatorName: "Mahesh" },
  ],
  operations: [] as any[],
};

function getPhoneMapping(phoneNumber: string) {
  const normalized = phoneNumber.replace(/\D/g, "");
  return mockDb.phoneMappings.find(
    (pm) => pm.phoneNumber.replace(/\D/g, "") === normalized
  );
}

function getPumpHouse(pumpHouseId: string) {
  return mockDb.pumpHouses.find((ph) => ph.id === pumpHouseId);
}

function saveOperation(op: any) {
  mockDb.operations.push({
    ...op,
    id: "op" + Date.now(),
    createdAt: new Date().toISOString(),
  });
}

function getOpenOperation(pumpHouseId: string) {
  return mockDb.operations
    .filter((o) => o.pumpHouseId === pumpHouseId && !o.stopTime && o.status === "running")
    .pop();
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "aqualog_verify_token";

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Unauthorized", { status: 401 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (MOCK_MODE) {
      return handleMockMessage(body);
    }

    const entry = body.entry?.[0]?.changes?.[0]?.value;
    if (!entry?.messages?.[0]) {
      return NextResponse.json({ status: "ok" });
    }

    const message = entry.messages[0];
    const phoneNumber = message.from;
    const text = message.text?.body || "";
    const timestamp = message.timestamp;

    return await processMessage(phoneNumber, text, timestamp);

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleMockMessage(body: { phone?: string; message?: string }) {
  const phoneNumber = body.phone || "+919000111111";
  const text = body.message || "pump start";
  const timestamp = Date.now().toString();

  return await processMessage(phoneNumber, text, timestamp);
}

async function processMessage(phoneNumber: string, text: string, timestamp: string) {
  const phoneMapping = getPhoneMapping(phoneNumber);

  if (!phoneMapping) {
    return NextResponse.json({
      messaging_product: "whatsapp",
      to: phoneNumber,
      text: {
        text: "⚠️ Your phone number is not registered. Please contact administrator."
      }
    });
  }

  const parsed = parseWhatsAppMessage(text);
  const pumpHouse = getPumpHouse(phoneMapping.pumpHouseId);
  
  if (!pumpHouse) {
    return NextResponse.json({
      messaging_product: "whatsapp",
      to: phoneNumber,
      text: { text: "⚠️ Pump house not found. Contact administrator." }
    });
  }

  const date = parsed.date || new Date().toISOString().split("T")[0];
  const time = parsed.time || new Date().toTimeString().slice(0, 5);

  if (parsed.action === "start") {
    saveOperation({
      pumpHouseId: phoneMapping.pumpHouseId,
      operatorName: phoneMapping.operatorName || "Unknown",
      phoneNumber,
      date,
      startTime: time,
      stopTime: null,
      status: "running",
      reason: null,
      rawMessage: text,
      translatedMessage: parsed.reason,
    });
  } else if (parsed.action === "stop") {
    const openOp = getOpenOperation(phoneMapping.pumpHouseId);
    if (openOp) {
      openOp.stopTime = time;
      openOp.status = "stopped";
    } else {
      saveOperation({
        pumpHouseId: phoneMapping.pumpHouseId,
        operatorName: phoneMapping.operatorName || "Unknown",
        phoneNumber,
        date,
        startTime: null,
        stopTime: time,
        status: "stopped",
        reason: null,
        rawMessage: text,
        translatedMessage: null,
      });
    }
  } else if (parsed.action === "not_running") {
    saveOperation({
      pumpHouseId: phoneMapping.pumpHouseId,
      operatorName: phoneMapping.operatorName || "Unknown",
      phoneNumber,
      date,
      startTime: null,
      stopTime: null,
      status: "not_running",
      reason: parsed.reason || "Not specified",
      rawMessage: text,
      translatedMessage: parsed.reason,
    });
  }

  const responseText = generateResponseMessage(
    parsed.action,
    pumpHouse.name,
    time
  );

  console.log(`[WhatsApp] ${phoneMapping.operatorName} (${pumpHouse.name}): ${text} -> ${parsed.action}`);

  return NextResponse.json({
    messaging_product: "whatsapp",
    to: phoneNumber,
    text: { text: responseText }
  });
}
