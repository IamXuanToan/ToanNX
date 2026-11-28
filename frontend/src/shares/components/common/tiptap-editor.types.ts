import type { AnyExtension, Editor, JSONContent } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";

/** Tài liệu Tiptap (`{ type: "doc", content: [...] }`), lưu nguyên JSON xuống BE. */
export type TiptapDocument = JSONContent;

/** Ảnh trả về từ bộ chọn ảnh của module (Thư viện, mã QR...). */
export type TiptapImage = { src: string; alt: string; attachmentId?: string };

/** Mục chèn riêng của module, hiện trong menu "Chèn" của toolbar và lệnh `/` của Notion-like. */
export type TiptapInsertItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Chạy khi chọn; nhận editor để tự chèn node. */
  run: (editor: Editor) => unknown;
};

/** Mã lệnh Slash Command chuẩn dùng chung cho mọi editor bật chế độ Notion-like. */
export type TiptapSlashCommandId =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "blockquote"
  | "codeBlock"
  | "table"
  | "horizontalRule"
  | "imageUrl"
  | "youtube";

/** Mô tả lệnh Slash dùng chung (cả chuẩn lẫn mục chèn riêng của module). */
export type TiptapSlashEntry = {
  key: string;
  group: "basic" | "media" | "module";
  label: string;
  desc: string;
  keywords: readonly string[];
  commandId?: TiptapSlashCommandId;
  customItem?: TiptapInsertItem;
};

/** Props của `TiptapEditor` (bộ Full tổng hợp cả Simple Sticky Toolbar lẫn Notion-like). */
export type TiptapEditorProps = {
  value: TiptapDocument | null | undefined;
  onChange: (value: TiptapDocument) => void;
  onBlur?: () => void;
  disabled?: boolean;
  label: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  /** Node riêng của module (nút, khối nhấn mạnh...). */
  extensions?: AnyExtension[];
  /** Mục chèn riêng của module. */
  insertItems?: TiptapInsertItem[];
  /** Mở bộ chọn ảnh của module (Thư viện); không truyền thì chỉ dán được URL ảnh. */
  onSelectImage?: () => Promise<TiptapImage | null>;
  /** Chọn node để module mở bảng thiết lập (nút, ảnh...). */
  onSelectionChange?: (editor: Editor) => void;
  /** Lớp thêm cho vùng soạn (theo theme trang). */
  contentClassName?: string;
  /** Bật/tắt thanh công cụ sticky phía trên (mặc định true: vừa Simple vừa Notion-like). */
  showToolbar?: boolean;
  /** Bật/tắt bộ tính năng Notion-like: gõ `/`, Bubble Menu chọn chữ, kéo thả dòng (mặc định true). */
  notion?: boolean;
  /** Gợi ý dòng trống khi gõ. */
  placeholder?: string;
  /** Hiển thị thanh đếm từ/ký tự gọn phía đáy editor. */
  showStats?: boolean;
  /** Ngữ cảnh bổ sung truyền cho tính năng Viết bằng AI (vd danh sách biến trộn). */
  aiContextHint?: string;
  /** Callback nhận instance Editor sau khi khởi tạo (dùng cho nút chèn nhanh bên ngoài). */
  onEditorReady?: (editor: Editor | null) => void;
};

/** Props của `TiptapBasicEditor` — bộ cơ bản gọn nhẹ dành riêng cho mô tả (chỉ in đậm, in nghiêng). */
export type TiptapBasicEditorProps = {
  value: TiptapDocument | null | undefined;
  onChange: (value: TiptapDocument) => void;
  onBlur?: () => void;
  disabled?: boolean;
  label: string;
  id?: string;
  placeholder?: string;
  maxLength?: number;
  /** Tùy chọn mở rộng thêm gạch chân nếu thực sự cần (mặc định false: chỉ đậm/nghiêng). */
  allowUnderline?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  contentClassName?: string;
};

/** Props của `TiptapCommentEditor` — bộ chuyên dụng cho khung viết/trả lời bình luận. */
export type TiptapCommentEditorProps = {
  value?: TiptapDocument | null;
  onChange?: (value: TiptapDocument) => void;
  onSubmit: (value: TiptapDocument) => Promise<void> | void;
  onCancel?: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
  label: string;
  id?: string;
  placeholder?: string;
  submitLabel?: string;
  replyingTo?: string | null;
  maxLength?: number;
  /** Tự xóa trắng sau khi gửi thành công (mặc định true khi dùng làm ô bình luận mới). */
  clearOnSubmit?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  contentClassName?: string;
};
