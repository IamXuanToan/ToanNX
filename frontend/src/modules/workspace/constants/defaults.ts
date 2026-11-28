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

export const WORKSPACE_TIMEZONE_SELECT_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "Asia/Ho_Chi_Minh", label: "(UTC+07:00) Hà Nội / TP.HCM" },
  { value: "Asia/Bangkok", label: "(UTC+07:00) Bangkok" },
  { value: "Asia/Singapore", label: "(UTC+08:00) Singapore" },
  { value: "Asia/Tokyo", label: "(UTC+09:00) Tokyo" },
  { value: "Asia/Seoul", label: "(UTC+09:00) Seoul" },
  { value: "Europe/London", label: "(UTC+00:00) London" },
  { value: "America/New_York", label: "(UTC-05:00) New York" },
  { value: "America/Los_Angeles", label: "(UTC-08:00) Los Angeles" },
  { value: "UTC", label: "(UTC+00:00) UTC" },
];

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

export const REMINDER_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const REMINDER_RECURRENCES = ["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

export const TELEGRAM_GROUP_TOOL_POLICIES = ["DISABLED", "OWNER_ONLY", "ALL_MEMBERS"] as const;

export const CALENDAR_EVENT_TYPES = [
  "subscription",
  "reminder",
  "asset_warranty",
  "warranty_claim",
  "income",
  "donation",
] as const;

import type { AssistantCommand } from "../types/assistant.types";

export type AssistantSlashCommandSpec = {
  key: "today" | "upcoming" | "spending" | "assets" | "remind" | "clear" | "help";
  commandVi: string;
  commandEn: string;
  syntaxVi: string;
  syntaxEn: string;
  insertOnly?: boolean;
};

export const ASSISTANT_SLASH_COMMANDS: readonly AssistantSlashCommandSpec[] = [
  {
    key: "today",
    commandVi: "/hom_nay",
    commandEn: "/today",
    syntaxVi: "/hom_nay",
    syntaxEn: "/today",
  },
  {
    key: "upcoming",
    commandVi: "/sap_toi",
    commandEn: "/upcoming",
    syntaxVi: "/sap_toi [số_ngày]",
    syntaxEn: "/upcoming [days]",
  },
  {
    key: "spending",
    commandVi: "/chi_tieu",
    commandEn: "/spending",
    syntaxVi: "/chi_tieu [mm/yyyy]",
    syntaxEn: "/spending [mm/yyyy]",
  },
  {
    key: "assets",
    commandVi: "/thiet_bi",
    commandEn: "/assets",
    syntaxVi: "/thiet_bi [từ_khóa]",
    syntaxEn: "/assets [keyword]",
  },
  {
    key: "remind",
    commandVi: "/nhac_viec ",
    commandEn: "/remind ",
    syntaxVi: "/nhac_viec <DD/MM> <HH:MM> <nội_dung>",
    syntaxEn: "/remind <DD/MM> <HH:MM> <title>",
    insertOnly: true,
  },
  {
    key: "clear",
    commandVi: "/xoa_lich_su",
    commandEn: "/clear",
    syntaxVi: "/xoa_lich_su",
    syntaxEn: "/clear",
  },
  {
    key: "help",
    commandVi: "/tro_giup",
    commandEn: "/help",
    syntaxVi: "/tro_giup",
    syntaxEn: "/help",
  },
];

export type ResolvedAssistantSlashCommand = {
  key: AssistantSlashCommandSpec["key"];
  command: string;
  alias: string;
  syntax: string;
  insertOnly: boolean;
};

/**
 * Chuẩn hóa danh sách câu lệnh nhanh theo ngôn ngữ UI (`vi`: tiếng Việt chuẩn, `en`: tiếng Anh),
 * giữ alias để bộ lọc `/` nhận cả hai dạng gõ.
 *
 * @param locale - Mã ngôn ngữ đang hiển thị.
 * @returns Danh sách lệnh đã chuẩn hóa.
 */
export function resolveLocaleSlashCommands(locale: string): ResolvedAssistantSlashCommand[] {
  const isEn = locale === "en";
  return ASSISTANT_SLASH_COMMANDS.map((item) => ({
    key: item.key,
    command: isEn ? item.commandEn : item.commandVi,
    alias: isEn ? item.commandVi.trim() : item.commandEn.trim(),
    syntax: isEn ? item.syntaxEn : item.syntaxVi,
    insertOnly: Boolean(item.insertOnly),
  }));
}

/**
 * Tạo nội dung chuẩn để dán trực tiếp vào lệnh `/setcommands` của `@BotFather` trên Telegram.
 *
 * @param commands - Danh sách lệnh từ backend `assistantConfig.telegramCommands`.
 * @param locale - Ngôn ngữ hiển thị hiện tại (`vi` hoặc `en`).
 * @returns Chuỗi `lenh - Mo ta` mỗi lệnh một dòng (không chứa dấu `/`).
 */
export function buildBotFatherCommandsText(
  commands: readonly AssistantCommand[],
  locale: string,
): string {
  const isEn = locale === "en";
  return commands
    .map((item) => {
      const cmdName = (isEn ? item.enCommand : item.command).replace(/^\/+/, "");
      const desc = isEn ? item.enDescription : item.description;
      return `${cmdName} - ${desc}`;
    })
    .join("\n");
}

/**
 * Chuẩn hóa thông tin hiển thị một câu lệnh Telegram theo ngôn ngữ hiện tại mà không lặp logic so sánh locale ở component.
 *
 * @param item - Đầu mục câu lệnh từ backend.
 * @param locale - Ngôn ngữ đang hiển thị (`vi` hoặc `en`).
 * @returns Lệnh chính, alias, cú pháp và mô tả tương ứng.
 */
export function resolveCommandSpecForLocale(item: AssistantCommand, locale: string) {
  const isEn = locale === "en";
  return {
    primary: isEn ? item.enCommand : item.command,
    secondary: isEn ? item.command : item.enCommand,
    syntax: isEn ? item.enSyntax : item.syntax,
    description: isEn ? item.enDescription : item.description,
  };
}

/** Mẫu policy gợi ý cho Trợ lý AI ở màn Admin. */
export const ASSISTANT_POLICY_PRESETS = [
  "standardSafety",
  "concise",
  "analytical",
  "english",
] as const;

/** Khóa `localStorage` ghi nhớ tọa độ nút tròn Chatbot AI nổi trên màn hình. */
export const ASSISTANT_WIDGET_POSITION_KEY = "assistant_launcher_position";
export const ASSISTANT_POPUP_SIZE_KEY = "assistant_popup_size";

export const ASSISTANT_LAUNCHER_SIZE_OPTIONS = ["sm", "md", "lg"] as const;

export type AssistantLauncherSize = (typeof ASSISTANT_LAUNCHER_SIZE_OPTIONS)[number];

/** Kích thước (px) nút tròn Chatbot AI nổi do Admin cấu hình. */
export const ASSISTANT_LAUNCHER_SIZES: Record<AssistantLauncherSize, number> = {
  sm: 40,
  md: 48,
  lg: 60,
};

/** Kích thước chuẩn cố định của khung popup chat Chatbot AI (tự thu gọn theo viewport). */
export const ASSISTANT_POPUP_DIMENSIONS = {
  width: 420,
  height: 560,
} as const;

export const ASSISTANT_POPUP_MIN_DIMENSIONS = {
  width: 340,
  height: 380,
} as const;

/** Class badge theo token Light/Dark hệ thống cho từng câu lệnh nhanh. */
export const ASSISTANT_SLASH_BADGE_STYLES: Record<AssistantSlashCommandSpec["key"], string> = {
  today: "border-primary/25 bg-primary-light text-primary dark:bg-primary/15",
  upcoming: "border-warning/25 bg-warning-bg text-warning",
  spending: "border-info/25 bg-info-bg text-info",
  assets: "border-success/25 bg-success-bg text-success",
  remind: "border-border bg-accent text-accent-foreground",
  clear: "border-destructive/30 bg-destructive/10 text-destructive",
  help: "border-border bg-secondary text-secondary-foreground",
};

/** Kiểm tra xem nội dung nhập vào có phải câu lệnh xóa lịch sử (`/xoa_lich_su`, `/clear`) hay không. */
export function isClearSlashCommand(content: string): boolean {
  const token = content.trim().toLowerCase();
  return token === "/xoa_lich_su" || token === "/xoalichsu" || token === "/clear";
}

/**
 * Nhận diện câu lệnh `/` ở đầu tin nhắn để hiển thị dưới dạng badge trường trộn đẹp mắt.
 *
 * @param content - Nội dung tin nhắn gốc.
 * @returns Thông tin lệnh khớp + phần nội dung còn lại, hoặc `null` nếu là câu chat thường.
 */
export function matchSlashBadgeInMessage(content: string): {
  key: AssistantSlashCommandSpec["key"];
  rest: string;
} | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith("/")) return null;
  const spaceIndex = trimmed.indexOf(" ");
  const token = (spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex)).toLowerCase();
  const rest = spaceIndex === -1 ? "" : trimmed.slice(spaceIndex + 1).trim();
  const matched = ASSISTANT_SLASH_COMMANDS.find(
    (cmd) => cmd.commandVi.trim() === token || cmd.commandEn.trim() === token,
  );
  return matched ? { key: matched.key, rest } : null;
}

/** Chuỗi che giá trị bí mật (mật khẩu) người dùng gõ khi trả lời Trợ lý — khớp `ASSISTANT_MASKED_SECRET_TEXT` BE. */
export const MASKED_SECRET_TEXT = "••••••";

/** Loại thẻ kết quả link rút gọn (có thêm nút sao chép/mở link ngắn) — khớp `CARD_TYPE_SHORT_LINK` BE. */
export const SHORT_LINK_CARD_TYPE = "short_link";
