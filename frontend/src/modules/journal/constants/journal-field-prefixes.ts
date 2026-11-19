import type { MessageKey } from "@/shares/types/navigation.types";

/**
 * Tiền tố khóa dịch nhãn field theo tài nguyên (`<module>.<model>`), trùng `fieldPrefix` mà trang chi tiết của
 * module truyền cho lịch sử. Chỉ là chuỗi khóa, không import module khác. Tài nguyên chưa có ở đây thì dùng
 * `journal.fields.*`, rồi nhãn do BE trả (`fieldLabels`), cuối cùng là tên field.
 */
export const JOURNAL_FIELD_PREFIXES: Readonly<Record<string, MessageKey>> = {
  "account.user": "account.users.fields",
  "iam.role": "iam.roles.fields",
  "short_links.shortlink": "shortLinks.fields",
  "qr_codes.qrcode": "qrCodes.fields",
  "custom_pages.page": "customPages.pages.fields",
  "custom_pages.pagepath": "customPages.paths.fields",
  "novel.novel": "novel.novelForm.fields",
  "novel.author": "novel.authors.fields",
  "novel.genre": "novel.genres.fields",
  "novel.tag": "novel.tags.fields",
  "novel.chapter": "novel.chapters.fields",
};
