import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const divisions = sqliteTable("divisions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const schemes = sqliteTable("schemes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  divisionId: text("division_id").notNull(),
});

export const pumpHouses = sqliteTable("pump_houses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  schemeId: text("scheme_id").notNull(),
});

export const phoneMappings = sqliteTable("phone_mappings", {
  id: text("id").primaryKey(),
  pumpHouseId: text("pump_house_id").notNull(),
  phoneNumber: text("phone_number").notNull(),
  operatorName: text("operator_name").notNull(),
});

export const operations = sqliteTable("operations", {
  id: text("id").primaryKey(),
  pumpHouseId: text("pump_house_id").notNull(),
  operatorName: text("operator_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time"),
  stopTime: text("stop_time"),
  status: text("status").notNull(),
  reason: text("reason"),
  rawMessage: text("raw_message"),
  translatedMessage: text("translated_message"),
  createdAt: text("created_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value"),
});
