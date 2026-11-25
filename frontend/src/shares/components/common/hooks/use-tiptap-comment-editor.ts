"use client";

import { useEditor, useEditorState } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createTiptapPlaceholderExtension } from "../tiptap-editor-extensions";
import type { TiptapCommentEditorProps, TiptapDocument } from "../tiptap-editor.types";
import { createCommentExtensions } from "../tiptap-extensions";
import { isAllowedLink } from "./use-tiptap-toolbar";

const EMPTY_COMMENT_DOC: TiptapDocument = { type: "doc", content: [{ type: "paragraph" }] };

/**
 * Hook quản lý `TiptapCommentEditor` (bộ chuyên dụng cho bình luận): hỗ trợ phím tắt `Ctrl/Cmd+Enter`
 * để gửi nhanh, kiểm tra rỗng/vượt độ dài và tự làm sạch khung nhập sau khi gửi.
 */
export function useTiptapCommentEditor({
  value,
  onChange,
  onSubmit,
  disabled,
  isSubmitting = false,
  label,
  id,
  placeholder,
  maxLength,
  clearOnSubmit = true,
  contentClassName,
  "aria-invalid": invalid,
  "aria-describedby": descriptionId,
}: TiptapCommentEditorProps) {
  const t = useTranslations("common.editor");
  const [textLength, setTextLength] = useState(0);
  const [linkError, setLinkError] = useState("");
  const effectivePlaceholder = placeholder ?? t("commentPlaceholder");

  const extensions = useMemo(
    () => [...createCommentExtensions(), createTiptapPlaceholderExtension(effectivePlaceholder)],
    [effectivePlaceholder],
  );

  const submitRef = useRef<() => void>(() => {});
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor(
    {
      extensions,
      content: value ?? EMPTY_COMMENT_DOC,
      immediatelyRender: false,
      editable: !(disabled || isSubmitting),
      onCreate: ({ editor: current }) => setTextLength(current.getText().trim().length),
      onUpdate: ({ editor: current }) => {
        setTextLength(current.getText().trim().length);
        onChangeRef.current?.(current.getJSON());
      },
      editorProps: {
        handleKeyDown: (_, event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            submitRef.current();
            return true;
          }
          return false;
        },
        attributes: {
          role: "textbox",
          "aria-multiline": "true",
          "aria-label": label,
          class:
            `outline-none min-h-20 max-h-60 overflow-y-auto px-3.5 py-2.5 text-sm leading-relaxed ` +
            `[&_p]:my-1 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-5 ` +
            `[&_blockquote]:border-l-2 [&_blockquote]:border-primary/60 [&_blockquote]:pl-3 [&_blockquote]:italic ` +
            `[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_a]:text-primary [&_a]:underline ` +
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
      queueMicrotask(() => setTextLength(editor.getText().trim().length));
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!(disabled || isSubmitting), false);
  }, [editor, disabled, isSubmitting]);

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
      strike: current?.isActive("strike") ?? false,
      code: current?.isActive("code") ?? false,
      link: current?.isActive("link") ?? false,
      blockquote: current?.isActive("blockquote") ?? false,
      bulletList: current?.isActive("bulletList") ?? false,
      orderedList: current?.isActive("orderedList") ?? false,
    }),
  });

  const isEmpty = textLength === 0;
  const overLimit = Boolean(maxLength && textLength > maxLength);

  const handleSubmit = useCallback(async () => {
    if (!editor || disabled || isSubmitting || isEmpty || overLimit) return;
    const json = editor.getJSON();
    await onSubmit(json);
    if (clearOnSubmit) {
      editor.commands.setContent(EMPTY_COMMENT_DOC, { emitUpdate: true });
      setTextLength(0);
    }
  }, [editor, disabled, isSubmitting, isEmpty, overLimit, onSubmit, clearOnSubmit]);

  useEffect(() => {
    submitRef.current = () => {
      void handleSubmit();
    };
  }, [handleSubmit]);

  const setLink = (href: string, invalidMessage: string) => {
    if (!editor) return false;
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkError("");
      return true;
    }
    if (!isAllowedLink(href)) {
      setLinkError(invalidMessage);
      return false;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setLinkError("");
    return true;
  };

  return {
    editor,
    active,
    textLength,
    isEmpty,
    overLimit,
    linkError,
    clearLinkError: () => setLinkError(""),
    setLink,
    handleSubmit,
  };
}
