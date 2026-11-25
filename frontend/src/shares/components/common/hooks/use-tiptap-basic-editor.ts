"use client";

import { useEditor, useEditorState } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import { createTiptapPlaceholderExtension } from "../tiptap-editor-extensions";
import type { TiptapBasicEditorProps, TiptapDocument } from "../tiptap-editor.types";
import { createBasicExtensions } from "../tiptap-extensions";

const EMPTY_BASIC_DOC: TiptapDocument = { type: "doc", content: [{ type: "paragraph" }] };

/**
 * Hook khởi tạo cho `TiptapBasicEditor` (bộ cơ bản cho ô Mô tả: chỉ hỗ trợ in đậm, in nghiêng).
 */
export function useTiptapBasicEditor({
  value,
  onChange,
  onBlur,
  disabled,
  label,
  id,
  placeholder,
  allowUnderline = false,
  contentClassName,
  "aria-invalid": invalid,
  "aria-describedby": descriptionId,
}: TiptapBasicEditorProps) {
  const t = useTranslations("common.editor");
  const [charCount, setCharCount] = useState(0);
  const callbacksRef = useRef({ onChange, onBlur });

  useEffect(() => {
    callbacksRef.current = { onChange, onBlur };
  }, [onChange, onBlur]);

  const effectivePlaceholder = placeholder ?? t("basicPlaceholder");
  const extensions = useMemo(
    () => [
      ...createBasicExtensions({ allowUnderline }),
      createTiptapPlaceholderExtension(effectivePlaceholder),
    ],
    [allowUnderline, effectivePlaceholder],
  );

  const editor = useEditor(
    {
      extensions,
      content: value ?? EMPTY_BASIC_DOC,
      immediatelyRender: false,
      editable: !disabled,
      onCreate: ({ editor: current }) => setCharCount(current.getText().length),
      onUpdate: ({ editor: current }) => {
        setCharCount(current.getText().length);
        callbacksRef.current.onChange(current.getJSON());
      },
      onBlur: () => callbacksRef.current.onBlur?.(),
      editorProps: {
        attributes: {
          role: "textbox",
          "aria-multiline": "true",
          "aria-label": label,
          class:
            `outline-none min-h-24 p-3 text-sm leading-relaxed [&_p]:my-1 ` +
            `[&_.is-tiptap-empty]:before:pointer-events-none [&_.is-tiptap-empty]:before:float-left [&_.is-tiptap-empty]:before:h-0 [&_.is-tiptap-empty]:before:text-muted-foreground/55 [&_.is-tiptap-empty]:before:content-[attr(data-placeholder)] ${contentClassName ?? ""}`,
        },
      },
    },
    [extensions],
  );

  useEffect(() => {
    if (!editor || !value) return;
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(value)) {
      editor.commands.setContent(value, { emitUpdate: false });
      queueMicrotask(() => setCharCount(editor.getText().length));
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

  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current?.isActive("bold") ?? false,
      italic: current?.isActive("italic") ?? false,
      underline: current?.isActive("underline") ?? false,
      canUndo: current?.can().undo() ?? false,
      canRedo: current?.can().redo() ?? false,
    }),
  });

  return { editor, active, charCount };
}
