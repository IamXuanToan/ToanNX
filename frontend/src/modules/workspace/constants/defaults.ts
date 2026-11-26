/** Giá trị mặc định và tập lựa chọn cố định của module Workspace. */
export const DEFAULT_WORKSPACE_TIMEZONE = "Asia/Ho_Chi_Minh";

export const WORKSPACE_TIMEZONE_OPTIONS = [
  "Asia/Ho_Chi_Minh",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
] as const;

export const ASSET_CATEGORIES = [
  "LAPTOP",
  "PHONE",
  "TABLET",
  "MONITOR",
  "PERIPHERAL",
  "AUDIO",
  "NETWORK",
  "CAMERA",
  "OTHER",
] as const;

export const ASSET_STATUSES = [
  "IN_USE",
  "BACKUP",
  "IN_WARRANTY",
  "IN_REPAIR",
  "SOLD",
  "BROKEN",
] as const;

export const ASSET_PURCHASE_CHANNELS = [
  "OFFICIAL_STORE",
  "RETAILER",
  "ECOMMERCE",
  "SECOND_HAND",
  "COMPANY",
  "GIFT",
] as const;

export const ASSET_WARRANTY_TYPES = ["MANUFACTURER", "STORE", "EXTENDED", "NONE"] as const;

export const CLAIM_TYPES = ["WARRANTY", "PAID_REPAIR", "MAINTENANCE"] as const;

export const CLAIM_STATUSES = [
  "SUBMITTED",
  "INSPECTING",
  "WAITING_PARTS",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
] as const;

export const SUBSCRIPTION_CATEGORIES = [
  "DOMAIN",
  "HOSTING_VPS",
  "SAAS_TOOL",
  "ENTERTAINMENT",
  "TELECOM",
  "OTHER",
] as const;

export const BILLING_CYCLES = [
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "SEMI_ANNUAL",
  "YEARLY",
  "CUSTOM_DAYS",
] as const;

export const VAULT_CATEGORIES = [
  "SERVER",
  "API_KEY",
  "ACCOUNT",
  "SNIPPET",
  "ENV_CONFIG",
  "OTHER",
] as const;

export const MONITOR_METHODS = ["GET", "HEAD"] as const;

export const MONITOR_STATUSES = ["HEALTHY", "DEGRADED", "DOWN", "UNKNOWN"] as const;

export const REMINDER_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const REMINDER_RECURRENCES = ["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

export const TELEGRAM_GROUP_TOOL_POLICIES = ["DISABLED", "OWNER_ONLY", "ALL_MEMBERS"] as const;

export const CALENDAR_EVENT_TYPES = [
  "subscription",
  "reminder",
  "asset_warranty",
  "warranty_claim",
  "monitor_incident",
] as const;

export const ASSISTANT_SLASH_COMMANDS = [
  { command: "/today", key: "today" },
  { command: "/upcoming", key: "upcoming" },
  { command: "/spending", key: "spending" },
  { command: "/assets", key: "assets" },
  { command: "/status", key: "status" },
  { command: "/remind ", key: "remind" },
  { command: "/newchat", key: "newchat" },
  { command: "/help", key: "help" },
] as const;
