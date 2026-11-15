import type { AnyExtension, Editor, JSONContent } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";

/** Tài liệu Tiptap (`{ type: "doc", content: [...] }`), lưu nguyên JSON xuống BE. */
export type TiptapDocument = JSONContent;

/** Ảnh trả về từ bộ chọn ảnh của module (Thư viện, mã QR...). */
export type TiptapImage = { src: string; alt: string; attachmentId?: string };

/** Mục chèn riêng của module, hiện trong menu "Chèn" của toolbar. */
export type TiptapInsertItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Chạy khi chọn; nhận editor để tự chèn node. */
  run: (editor: Editor) => unknown;
};

/** Props của `TiptapEditor`; module sở hữu dữ liệu, quyền và việc chọn ảnh/tài nguyên. */
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
};
