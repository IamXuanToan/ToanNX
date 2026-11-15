import type { AnyExtension } from "@tiptap/react";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Youtube from "@tiptap/extension-youtube";
import StarterKit from "@tiptap/starter-kit";

/** Giao thức liên kết được phép (khớp BE `page_content_validator`). */
export const LINK_PROTOCOLS = ["http", "https", "mailto", "tel"] as const;

/**
 * Ảnh có thêm `attachmentId`: ảnh từ Thư viện (kể cả ảnh mã QR) lưu id, BE dựng lại `src` theo file hiện tại.
 * Ảnh dán URL ngoài chỉ có `src`.
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
    };
  },
});

/**
 * Extension nền của mọi trường soạn thảo trong hệ thống (editor và bản hiển thị dùng cùng danh sách,
 * nên JSON lưu ra hiển thị lại y như lúc soạn). Module thêm node riêng qua prop `extensions`.
 *
 * Chỉ dùng node/mark có trong danh sách cho phép của BE; thêm extension mới phải thêm cả bên BE.
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
