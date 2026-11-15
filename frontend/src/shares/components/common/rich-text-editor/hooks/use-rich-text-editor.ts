"use client";

import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

import type { RichTextEditorProps } from "../types";

/** Khởi tạo Tiptap an toàn với SSR và đồng bộ giá trị form từ module. */
export function useRichTextEditor({
  value,
  onChange,
  onBlur,
  disabled,
  label,
  id,
  "aria-invalid": invalid,
  "aria-describedby": descriptionId,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, protocols: ["http", "https", "mailto"] },
      }),
      Image,
      TableKit,
    ],
    content: value,
    immediatelyRender: false,
    editable: !disabled,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
        class:
          "min-h-40 p-3 outline-none [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-5 " +
          "[&_h2]:text-xl [&_h3]:text-lg [&_blockquote]:border-l-2 [&_blockquote]:pl-3 " +
          "[&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 " +
          "[&_img]:max-w-full [&_a]:underline [&_pre]:overflow-auto [&_pre]:bg-muted [&_pre]:p-3",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
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
