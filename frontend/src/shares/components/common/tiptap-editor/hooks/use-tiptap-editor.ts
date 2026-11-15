"use client";

import { useEditor } from "@tiptap/react";
import { useEffect, useMemo } from "react";

import { createBaseExtensions } from "../extensions";
import type { TiptapDocument, TiptapEditorProps } from "../types";

const EMPTY_DOCUMENT: TiptapDocument = { type: "doc", content: [{ type: "paragraph" }] };

/** Lớp nội dung chuẩn (danh sách, bảng, trích dẫn, ảnh) — dùng chung với `TiptapContent`. */
export const TIPTAP_PROSE_CLASS =
  "outline-none [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-5 [&_h1]:text-3xl [&_h1]:font-bold " +
  "[&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_p]:my-2 " +
  "[&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:italic [&_table]:w-full [&_table]:border-collapse " +
  "[&_td]:border [&_td]:p-2 [&_th]:border [&_th]:bg-muted [&_th]:p-2 [&_img]:max-w-full [&_img]:rounded-xl " +
  "[&_a]:underline [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_hr]:my-4 " +
  "[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:gap-2 " +
  "[&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-xl";

/**
 * Khởi tạo Tiptap an toàn với SSR, giá trị là JSON và đồng bộ từ form của module.
 *
 * @param props - Props của editor.
 * @returns Editor (null cho tới khi mount ở client).
 */
export function useTiptapEditor({
  value,
  onChange,
  onBlur,
  disabled,
  label,
  id,
  extensions,
  onSelectionChange,
  contentClassName,
  "aria-invalid": invalid,
  "aria-describedby": descriptionId,
}: TiptapEditorProps) {
  const allExtensions = useMemo(
    () => [...createBaseExtensions(), ...(extensions ?? [])],
    [extensions],
  );
  const editor = useEditor(
    {
      extensions: allExtensions,
      content: value ?? EMPTY_DOCUMENT,
      immediatelyRender: false,
      editable: !disabled,
      onUpdate: ({ editor }) => onChange(editor.getJSON()),
      onBlur: () => onBlur?.(),
      onSelectionUpdate: ({ editor }) => onSelectionChange?.(editor),
      editorProps: {
        attributes: {
          role: "textbox",
          "aria-multiline": "true",
          "aria-label": label,
          class: `min-h-64 p-4 ${TIPTAP_PROSE_CLASS} ${contentClassName ?? ""}`,
        },
      },
    },
    [allExtensions],
  );

  // Giá trị đổi từ ngoài (tải lại, sao chép) thì nạp vào editor mà không phát onChange.
  useEffect(() => {
    if (!editor || !value) return;
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(value)) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled, false);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        ...editor.options.editorProps,
        attributes: {
          ...editor.options.editorProps.attributes,
          id: id ?? "",
          "aria-label": label,
          "aria-invalid": String(Boolean(invalid)),
          "aria-describedby": descriptionId ?? "",
        },
      },
    });
  }, [editor, id, label, invalid, descriptionId]);

  return editor;
}
