# Pump Operation Logging System - SPEC

## Project Overview

- **Project Name**: AquaLog - Water Pump Operation Dashboard
- **Type**: Web Application (Dashboard with WhatsApp Integration)
- **Core Functionality**: Automatically capture pump start/stop messages via WhatsApp and display operational analytics
- **Target Users**: Pump operators (via WhatsApp), division supervisors, management

## Data Hierarchy

```
Division (e.g., Division North, Division South)
  └── Water Supply Scheme (e.g., Scheme A, Scheme B)
       └── Pump House (PH-1, PH-2, PH-3...)
            └── Phone Numbers (multiple numbers mapped)
```

## WhatsApp Integration (Core Feature)

### How It Works
1. Each pump house has one or more phone numbers mapped to it
2. Operators send WhatsApp messages to a business number
3. Webhook receives messages and auto-parses them
4. System extracts: start/stop time, pump status, reason (if not running)

### Message Parsing
- Supports both Bengali and English messages
- Uses keyword detection and translation
- Extracts time information automatically
- Records reasons for pump not operational

### Supported Message Types
1. **Start Pump**: "pump start", "motor chalu", "pump on", "পাম্প চালু"
2. **Stop Pump**: "pump stop", "motor bandh", "pump off", "পাম্প বন্ধ"
3. **Not Running**: "pump not running", "motor chalena", "পাম্প চলছে না" + reason

## Functionality Specification

### 1. WhatsApp Webhook
- Endpoint: `/api/webhook/whatsapp`
- Receives messages from WhatsApp Business API
- Validates phone number against mappings
- Parses message content
- Creates operation log entry

### 2. Phone Number Mapping
- Map multiple phone numbers to each pump house
- Store: phone number, pump house ID, operator name
- Manage via Master Data page

### 3. Message Parser
- Bengali keyword detection (common terms)
- English keyword detection
- Time extraction (various formats)
- Reason extraction for not running

### 4. Dashboard Views

#### Daily View
- Select division and date
- Show all pump operations for that day
- Display: Start time, Stop time, Total run hours
- Show reasons for pumps not running

#### Weekly View
- Select week (date range)
- Group by: Division, Scheme, Operator
- Show: Total operations, Total run hours, Reasons summary

#### Monthly View
- Select month and year
- Group by: Division, Scheme, Operator
- Summary statistics including reasons

### 5. Master Data Management
- Add/Edit/Delete Divisions
- Add/Edit/Delete Schemes (associated with Division)
- Add/Edit/Delete Pump Houses (associated with Scheme)
- Phone Number Mapping: Link phone numbers to pump houses

## UI/UX Specification

### Visual Design
- **Primary**: #0ea5e9 (Sky blue)
- **Secondary**: #0369a1 (Deep blue)
- **Background**: #f8fafc
- **Card**: #ffffff
- **Success**: #22c55e
- **Warning**: #f59e0b
- **Error**: #ef4444

## Data Model

```typescript
interface Division { id: string; name: string; }
interface Scheme { id: string; divisionId: string; name: string; }
interface PumpHouse { id: string; schemeId: string; name: string; }
interface PhoneMapping { id: string; pumpHouseId: string; phoneNumber: string; operatorName?: string; }
interface PumpOperation {
  id: string;
  pumpHouseId: string;
  operatorName: string;
  phoneNumber: string;
  date: string;
  startTime: string | null;
  stopTime: string | null;
  status: "running" | "stopped" | "not_running";
  reason?: string;
  rawMessage: string;
  translatedMessage?: string;
  createdAt: string;
}
```

## Bengali Keywords Reference

| Bengali | English |
|---------|---------|
| পাম্প চালু | pump start |
| পাম্প বন্ধ | pump stop |
| মোটর চালু | motor start |
| মোটর বন্ধ | motor stop |
| চলছে | running |
| চলছে না | not running |
| হচ্ছে না | not happening |
| সমস্যা | problem |
| ত্রুটি | fault |
| মেরামত | repair |
| কাজ চলছে | work in progress |
| লাইন নেই | no line/power |
| পানি নেই | no water |
