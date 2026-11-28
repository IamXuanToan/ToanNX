import type { TiptapDocument } from "@/shares/components/common/tiptap-editor.types";

import type { EmailTemplateCategory } from "../../types/email-template.types";

/** Mô tả một trường trộn biến trong mẫu email. */
export type EmailMergeFieldOption = {
  key: string;
  labelVi: string;
  labelEn: string;
  sample: string;
};

const FEEDBACK_FIELDS: readonly EmailMergeFieldOption[] = [
  { key: "sender_name", labelVi: "Tên người gửi", labelEn: "Sender name", sample: "Nguyễn Văn A" },
  {
    key: "target_title",
    labelVi: "Tên trang / link",
    labelEn: "Target title",
    sample: "Trang sản phẩm mẫu",
  },
  {
    key: "target_url",
    labelVi: "Đường dẫn trang",
    labelEn: "Target URL",
    sample: "https://toannx.com/shop/demo",
  },
  {
    key: "feedback_type",
    labelVi: "Loại góp ý",
    labelEn: "Feedback type",
    sample: "Link hỏng / Sai link",
  },
  {
    key: "resolution_note",
    labelVi: "Ghi chú xử lý",
    labelEn: "Resolution note",
    sample: "Đã cập nhật lại link chính xác.",
  },
  { key: "owner_name", labelVi: "Tên chủ trang", labelEn: "Owner name", sample: "Xuân Toàn" },
];

const AUTH_FIELDS: readonly EmailMergeFieldOption[] = [
  { key: "full_name", labelVi: "Họ và tên", labelEn: "Full name", sample: "Nguyễn Văn A" },
  {
    key: "action_url",
    labelVi: "Liên kết xác nhận",
    labelEn: "Action URL",
    sample: "https://toannx.com/verify",
  },
];

/** Danh sách biến trộn gợi ý theo từng nhóm mẫu email. */
export function getMergeFieldsForCategory(
  category: EmailTemplateCategory,
): readonly EmailMergeFieldOption[] {
  if (category === "AUTH") return AUTH_FIELDS;
  if (category === "NOTIFICATION") return [...AUTH_FIELDS, ...FEEDBACK_FIELDS];
  return FEEDBACK_FIELDS;
}

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/**
 * Chuyển các chuỗi `{{key}}` trong Tiptap JSON thành node `mergeField` (dạng badge) để hiển thị đẹp
 * ngay cả khi mở mẫu cũ hoặc mẫu được tạo bởi AI.
 *
 * @param doc - Tài liệu Tiptap gốc.
 * @param labelByKey - Bảng ánh xạ tên hiển thị theo khóa biến.
 * @returns Tài liệu Tiptap đã chuyển đổi các biến thành `mergeField`.
 */
export function hydrateMergeFieldsInDoc(
  doc: TiptapDocument,
  labelByKey: ReadonlyMap<string, string>,
): TiptapDocument {
  const transformNode = (node: Record<string, unknown>): Record<string, unknown>[] => {
    if (node.type === "text" && typeof node.text === "string") {
      const text = node.text;
      const matches = [...text.matchAll(PLACEHOLDER_RE)];
      if (matches.length === 0) return [node];

      const out: Record<string, unknown>[] = [];
      let lastIndex = 0;
      for (const match of matches) {
        const idx = match.index ?? 0;
        if (idx > lastIndex) {
          out.push({ ...node, text: text.slice(lastIndex, idx) });
        }
        const fieldKey = match[1];
        out.push({
          type: "mergeField",
          attrs: {
            fieldKey,
            label: labelByKey.get(fieldKey) ?? "",
          },
        });
        lastIndex = idx + match[0].length;
      }
      if (lastIndex < text.length) {
        out.push({ ...node, text: text.slice(lastIndex) });
      }
      return out;
    }

    if (Array.isArray(node.content)) {
      const nextContent: Record<string, unknown>[] = [];
      for (const child of node.content) {
        if (child && typeof child === "object") {
          nextContent.push(...transformNode(child as Record<string, unknown>));
        }
      }
      return [{ ...node, content: nextContent }];
    }
    return [node];
  };

  const result = transformNode(doc as Record<string, unknown>);
  return (result[0] as TiptapDocument) ?? doc;
}
