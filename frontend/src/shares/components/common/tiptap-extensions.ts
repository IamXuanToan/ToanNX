import type { AnyExtension } from "@tiptap/core";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Youtube from "@tiptap/extension-youtube";
import StarterKit from "@tiptap/starter-kit";

import type { TiptapSlashCommandId } from "./tiptap-editor.types";

/** Giao thức liên kết được phép (khớp BE `page_content_validator`). */
export const LINK_PROTOCOLS = ["http", "https", "mailto", "tel"] as const;

/** Các kiểu căn lề của node ảnh trong tài liệu Tiptap. */
export const TIPTAP_IMAGE_ALIGNS = ["left", "center", "right", "full"] as const;
export type TiptapImageAlign = (typeof TIPTAP_IMAGE_ALIGNS)[number];

/** Các mức kích thước nhanh cho ảnh. */
export const TIPTAP_IMAGE_WIDTH_PRESETS = ["25%", "50%", "75%", "100%"] as const;

/** Bảng màu chữ dùng chung cho Bubble Toolbar. */
export const TIPTAP_TEXT_COLORS = [
  { key: "green", hex: "#2f7a24" },
  { key: "blue", hex: "#2563eb" },
  { key: "amber", hex: "#d97706" },
  { key: "rose", hex: "#e11d48" },
  { key: "purple", hex: "#7c3aed" },
] as const;

/** Bảng màu tô sáng chữ dùng chung cho Bubble Toolbar. */
export const TIPTAP_HIGHLIGHT_COLORS = [
  { key: "yellow", hex: "#fef08a" },
  { key: "mint", hex: "#bbf7d0" },
  { key: "sky", hex: "#bae6fd" },
  { key: "rose", hex: "#fecdd3" },
  { key: "lavender", hex: "#e9d5ff" },
] as const;

/** Danh sách lệnh `/` chuẩn dùng chung cho chế độ Notion-like ở mọi nơi. */
export const TIPTAP_SLASH_COMMANDS: readonly {
  id: TiptapSlashCommandId;
  group: "basic" | "media";
  keywords: readonly string[];
}[] = [
  { id: "paragraph", group: "basic", keywords: ["text", "paragraph", "doan van", "p"] },
  { id: "h1", group: "basic", keywords: ["h1", "heading 1", "tieu de 1", "title"] },
  { id: "h2", group: "basic", keywords: ["h2", "heading 2", "tieu de 2"] },
  { id: "h3", group: "basic", keywords: ["h3", "heading 3", "tieu de 3"] },
  { id: "bulletList", group: "basic", keywords: ["ul", "bullet", "list", "danh sach"] },
  { id: "orderedList", group: "basic", keywords: ["ol", "numbered", "ordered", "so"] },
  { id: "taskList", group: "basic", keywords: ["todo", "task", "checkbox", "viec"] },
  { id: "blockquote", group: "basic", keywords: ["quote", "trich dan", "blockquote"] },
  { id: "codeBlock", group: "media", keywords: ["code", "ma", "pre", "snippet"] },
  { id: "table", group: "media", keywords: ["table", "bang", "grid"] },
  { id: "horizontalRule", group: "media", keywords: ["divider", "hr", "line", "duong ke"] },
  { id: "imageUrl", group: "media", keywords: ["image", "img", "anh", "hinh", "photo"] },
  { id: "youtube", group: "media", keywords: ["youtube", "video", "embed"] },
];

/** Chuẩn hóa giá trị `width` thành chuỗi CSS an toàn cho thẻ ảnh/khung ảnh. */
export function formatTiptapImageWidth(width: unknown, align?: string | null): string | undefined {
  if (align === "full") return "100%";
  if (typeof width === "number" && Number.isFinite(width) && width > 0) {
    return `${Math.min(Math.round(width), 4000)}px`;
  }
  if (typeof width === "string") {
    const cleaned = width.trim();
    if (/^(?:[1-9][0-9]?|100)%$/.test(cleaned)) return cleaned;
    if (/^\d{2,4}px$/.test(cleaned)) return cleaned;
  }
  return undefined;
}

/** Lớp căn lề flex ngoài khung ảnh (dùng chung cho Editor NodeView và TiptapContent). */
export function getTiptapImageWrapperAlignClass(align?: string | null): string {
  switch (align) {
    case "center":
      return "justify-center";
    case "right":
      return "justify-end";
    case "full":
    case "left":
    default:
      return "justify-start";
  }
}

/** Lớp căn lề trực tiếp trên thẻ img khi render HTML thuần. */
export function getTiptapImageElementAlignClass(align?: string | null): string {
  switch (align) {
    case "center":
      return "mx-auto block";
    case "right":
      return "ml-auto mr-0 block";
    case "full":
      return "w-full block";
    case "left":
    default:
      return "mr-auto ml-0 block";
  }
}

/**
 * Ảnh có thêm `attachmentId`, `width` và `align`: ảnh từ Thư viện (kể cả ảnh mã QR) lưu id, BE dựng lại
 * `src` theo file hiện tại. Ảnh dán URL ngoài chỉ có `src`. Kích thước & căn lề được đồng bộ giữa Editor và
 * bản hiển thị `TiptapContent`.
 */
export const LibraryImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      attachmentId: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-attachment-id"),
        renderHTML: (attributes: { attachmentId?: string | null }) =>
          attributes.attachmentId ? { "data-attachment-id": attributes.attachmentId } : {},
      },
      align: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-align"),
        renderHTML: (attributes: { align?: string | null }) =>
          attributes.align ? { "data-align": attributes.align } : {},
      },
      width: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-width") ||
          element.style?.width ||
          element.getAttribute("width"),
        renderHTML: (attributes: { width?: string | number | null; align?: string | null }) => {
          const cssWidth = formatTiptapImageWidth(attributes.width, attributes.align);
          if (!cssWidth) return {};
          return {
            "data-width": String(attributes.width ?? cssWidth),
            style: `width: ${cssWidth}; height: auto; max-width: 100%;`,
          };
        },
      },
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      "img",
      {
        ...this.options.HTMLAttributes,
        ...HTMLAttributes,
        class: `${getTiptapImageElementAlignClass(node.attrs.align)} rounded-xl max-w-full h-auto`,
      },
    ];
  },
});

/**
 * Extension nền của bộ Full (editor và `TiptapContent` dùng cùng danh sách nên hiển thị khớp 100%).
 * Chỉ dùng node/mark có trong danh sách cho phép của BE.
 */
export function createBaseExtensions(): AnyExtension[] {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        protocols: [...LINK_PROTOCOLS],
        defaultProtocol: "https",
      },
    }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Highlight.configure({ multicolor: true }),
    TextStyle,
    Color,
    TaskList,
    TaskItem.configure({ nested: true }),
    TableKit.configure({ table: { resizable: false } }),
    LibraryImage.configure({ inline: false, allowBase64: false }),
    Youtube.configure({ nocookie: true, controls: true, modestBranding: true }),
  ];
}

/**
 * Extension tối giản cho bộ `TiptapBasicEditor` (mô tả): chỉ văn bản, xuống dòng, lịch sử hoàn tác,
 * in đậm, in nghiêng (và gạch chân nếu bật). Vẫn tương thích schema JSON của `TiptapContent`.
 */
export function createBasicExtensions({
  allowUnderline = false,
}: { allowUnderline?: boolean } = {}): AnyExtension[] {
  return [
    StarterKit.configure({
      heading: false,
      bulletList: false,
      orderedList: false,
      listItem: false,
      blockquote: false,
      codeBlock: false,
      code: false,
      horizontalRule: false,
      strike: false,
      link: false,
      underline: allowUnderline ? {} : false,
    }),
  ];
}

/**
 * Extension gọn nhẹ cho bộ `TiptapCommentEditor` (bình luận): văn bản, đậm, nghiêng, gạch ngang,
 * code nội tuyến, liên kết an toàn, trích dẫn và danh sách đơn giản.
 */
export function createCommentExtensions(): AnyExtension[] {
  return [
    StarterKit.configure({
      heading: false,
      horizontalRule: false,
      underline: false,
      link: {
        openOnClick: false,
        autolink: true,
        protocols: [...LINK_PROTOCOLS],
        defaultProtocol: "https",
      },
    }),
  ];
}
