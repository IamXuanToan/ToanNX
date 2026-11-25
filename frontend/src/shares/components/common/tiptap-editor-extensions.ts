"use client";

import { type AnyExtension, Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { createBaseExtensions, LibraryImage } from "./tiptap-extensions";
import { TiptapImageNodeView } from "./tiptap-image-node-view";

/**
 * Node ảnh mở rộng dành riêng cho môi trường Editor phía Client (gắn NodeView tương tác kéo kích thước
 * và căn lề). Phần `tiptap-extensions.ts` vẫn giữ thuần server-safe để `TiptapContent` chạy được ở SSR.
 */
export const InteractiveLibraryImage = LibraryImage.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TiptapImageNodeView);
  },
});

/**
 * Extension hiển thị placeholder nhẹ nhàng ở dòng trống đang đặt con trỏ (dùng chung cho Full, Basic,
 * Comment mà không cần cài thêm gói `@tiptap/extension-placeholder`).
 */
export function createTiptapPlaceholderExtension(placeholderText: string): AnyExtension {
  return Extension.create({
    name: "tiptapPlaceholder",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey("tiptapPlaceholder"),
          props: {
            decorations: ({ doc, selection }) => {
              if (!placeholderText) return DecorationSet.empty;
              const decorations: Decoration[] = [];
              const { anchor } = selection;
              doc.descendants((node, pos) => {
                const isParagraph = node.type.name === "paragraph";
                const isEmpty = node.content.size === 0;
                const cursorInside = anchor >= pos && anchor <= pos + node.nodeSize;
                if (isParagraph && isEmpty && (doc.childCount === 1 || cursorInside)) {
                  decorations.push(
                    Decoration.node(pos, pos + node.nodeSize, {
                      class: "is-tiptap-empty",
                      "data-placeholder": placeholderText,
                    }),
                  );
                }
              });
              return DecorationSet.create(doc, decorations);
            },
          },
        }),
      ];
    },
  });
}

/** Danh sách extension nền phía Client cho editor có đầy đủ NodeView ảnh tương tác. */
export function createEditorBaseExtensions(): AnyExtension[] {
  return createBaseExtensions().map((extension) =>
    extension.name === "image"
      ? InteractiveLibraryImage.configure({ inline: false, allowBase64: false })
      : extension,
  );
}
