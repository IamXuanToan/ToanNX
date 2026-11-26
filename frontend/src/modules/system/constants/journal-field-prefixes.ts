import type { MessageKey } from "@/shares/types/navigation.types";

/**
 * Tiền tố khóa dịch nhãn field theo tài nguyên (`<module>.<model>`), trùng `fieldPrefix` mà trang chi tiết của
 * module truyền cho lịch sử. Chỉ là chuỗi khóa, không import module khác. Tài nguyên chưa có ở đây thì dùng
 * `system.journal.fields.*`, rồi nhãn do BE trả (`fieldLabels`), cuối cùng là tên field.
 */
export const JOURNAL_FIELD_PREFIXES: Readonly<Record<string, MessageKey>> = {
  "system.user": "system.account.users.fields",
  "system.role": "system.iam.roles.fields",
  "utilities.shortlink": "utilities.shortLinks.fields",
  "utilities.qrcode": "utilities.qrCodes.fields",
  "utilities.page": "utilities.customPages.pages.fields",
  "utilities.pagepath": "utilities.customPages.paths.fields",
  "novel.novel": "novel.novelForm.fields",
  "novel.author": "novel.authors.fields",
  "novel.genre": "novel.genres.fields",
  "novel.tag": "novel.tags.fields",
  "novel.chapter": "novel.chapters.fields",
  "workspace.asset": "workspace.assets.fields",
  "workspace.asset_warranty_claim": "workspace.warrantyClaims.fields",
  "workspace.subscription": "workspace.subscriptions.fields",
  "workspace.subscription_payment": "workspace.subscriptionPayments.fields",
  "workspace.vault_item": "workspace.vault.fields",
  "workspace.reminder": "workspace.reminders.fields",
  "workspace.workspace_setting": "workspace.settings.fields",
};
