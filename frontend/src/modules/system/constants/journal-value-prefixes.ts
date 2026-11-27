/**
 * Bảng ánh xạ `<fieldPrefix>.<fieldCamelCase>` (hoặc `*.<fieldCamelCase>`) sang tiền tố khóa dịch
 * cho các giá trị enum chuẩn của hệ thống khi hiển thị trong Lịch sử thay đổi / Nhật ký.
 */
export const JOURNAL_VALUE_PREFIXES: Readonly<Record<string, string>> = {
  "*.notificationChannels": "workspace.notificationChannels.options",
  "workspace.reminders.fields.priority": "workspace.reminders.priorities",
  "workspace.reminders.fields.recurrence": "workspace.reminders.recurrences",
  "workspace.assets.fields.status": "workspace.assets.statuses",
  "workspace.assets.fields.warrantyType": "workspace.assets.warrantyTypes",
  "workspace.assets.fields.category": "workspace.assets.categories",
  "workspace.warrantyClaims.fields.claimType": "workspace.warrantyClaims.types",
  "workspace.warrantyClaims.fields.status": "workspace.warrantyClaims.statuses",
  "workspace.subscriptions.fields.billingCycle": "workspace.subscriptions.cycles",
  "workspace.subscriptions.fields.category": "workspace.subscriptions.categories",
  "utilities.customPages.pages.fields.pageType": "utilities.customPages.pages.pageTypes",
  "utilities.customPages.pages.fields.status": "utilities.customPages.pages.statuses",
  "utilities.qrCodes.fields.qrType": "utilities.qrCodes.types",
  "finance.history.fields.docType": "finance.invoices.docType",
};
