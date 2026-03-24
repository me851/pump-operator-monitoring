CREATE TABLE `divisions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `operations` (
	`id` text PRIMARY KEY NOT NULL,
	`pump_house_id` text NOT NULL,
	`operator_name` text NOT NULL,
	`phone_number` text NOT NULL,
	`date` text NOT NULL,
	`start_time` text,
	`stop_time` text,
	`status` text NOT NULL,
	`reason` text,
	`raw_message` text,
	`translated_message` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `phone_mappings` (
	`id` text PRIMARY KEY NOT NULL,
	`pump_house_id` text NOT NULL,
	`phone_number` text NOT NULL,
	`operator_name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pump_houses` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`scheme_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `schemes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`division_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
