"use client";

import { EditorContent } from "@tiptap/react";

import { TiptapToolbar } from "./components/tiptap-toolbar";
import { useTiptapEditor } from "./hooks/use-tiptap-editor";
import { useTiptapPluginItems } from "./hooks/use-tiptap-plugins";
import type { TiptapEditorProps } from "./types";

/**
 * Editor soạn thảo **duy nhất** của hệ thống (Tiptap, giá trị JSON). Module truyền node riêng qua
 * `extensions`, mục chèn riêng qua `insertItems` hoặc plugin (`useTiptapInsertItem` trong `TiptapPluginContext`),
 * bộ chọn ảnh qua `onSelectImage`; common không gọi API.
 * Nội dung lưu ra hiển thị lại bằng `TiptapContent` với cùng danh sách extension.
 *
 * @param props - Giá trị, callback và cấu hình của module.
 * @returns Editor kèm toolbar.
 */
export function TiptapEditor(props: TiptapEditorProps) {
  const editor = useTiptapEditor(props);
  const pluginItems = useTiptapPluginItems();
  return (
    <div
      className="bg-card overflow-hidden rounded-xl border"
      data-invalid={props["aria-invalid"] || undefined}
    >
      <TiptapToolbar
        editor={editor}
        disabled={props.disabled}
        label={props.label}
        insertItems={[...(props.insertItems ?? []), ...pluginItems]}
        onSelectImage={props.onSelectImage}
      />
      <EditorContent editor={editor} />
    </div>
  );
}
