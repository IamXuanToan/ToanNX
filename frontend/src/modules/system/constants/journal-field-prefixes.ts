import type { MessageKey } from "@/shares/types/navigation.types";

/**
 * Tiền tố khóa dịch nhãn field theo tài nguyên (`<app_label>.<model_name>` — không dấu gạch dưới),
 * trùng `fieldPrefix` mà trang chi tiết của module truyền cho lịch sử. Chỉ là chuỗi khóa, không import
 * module khác. Tài nguyên chưa có ở đây thì dùng `system.journal.fields.*`, rồi nhãn BE (`fieldLabels`),
 * cuối cùng là tên field.
 */
export const JOURNAL_FIELD_PREFIXES: Readonly<Record<string, MessageKey>> = {
  "system.currency": "system.currencies.fields",
  "system.emailtemplate": "system.emailTemplates.fields",
  "system.language": "system.languages.fields",
  "system.role": "system.iam.roles.fields",
  "system.user": "system.account.users.fields",
  "utilities.page": "utilities.customPages.pages.fields",
  "utilities.pagefeedback": "utilities.feedbacks.fields",
  "utilities.pagepath": "utilities.customPages.paths.fields",
  "utilities.qrcode": "utilities.qrCodes.fields",
  "utilities.shortlink": "utilities.shortLinks.fields",
  "novel.author": "novel.authors.fields",
  "novel.chapter": "novel.chapters.fields",
  "novel.genre": "novel.genres.fields",
  "novel.novel": "novel.novelForm.fields",
  "novel.tag": "novel.tags.fields",
  "finance.income": "finance.history.fields",
  "finance.invoice": "finance.history.fields",
  "finance.platform": "finance.history.fields",
  "finance.classificationrule": "finance.history.fields",
  "workspace.asset": "workspace.assets.fields",
  "workspace.assetwarrantyclaim": "workspace.warrantyClaims.fields",
  "workspace.reminder": "workspace.reminders.fields",
  "workspace.subscription": "workspace.subscriptions.fields",
  "workspace.subscriptionpayment": "workspace.subscriptionPayments.fields",
  "workspace.vaultitem": "workspace.vault.fields",
  "workspace.workspacesetting": "workspace.settings.fields",
};
