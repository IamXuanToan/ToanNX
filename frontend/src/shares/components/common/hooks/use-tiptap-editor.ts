"use client";

import type { JSONContent } from "@tiptap/core";
import { useEditor } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  createEditorBaseExtensions,
  createTiptapPlaceholderExtension,
} from "../tiptap-editor-extensions";
import type { TiptapDocument, TiptapEditorProps } from "../tiptap-editor.types";

const EMPTY_DOCUMENT: TiptapDocument = { type: "doc", content: [{ type: "paragraph" }] };

/** Lớp nội dung chuẩn (danh sách, bảng, trích dẫn, ảnh) — dùng chung với `TiptapContent`. */
export const TIPTAP_PROSE_CLASS =
  "outline-none [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-5 [&_h1]:text-3xl [&_h1]:font-bold " +
  "[&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_p]:my-2 " +
  "[&_blockquote]:border-l-2 [&_blockquote]:border-primary/60 [&_blockquote]:pl-3 [&_blockquote]:italic " +
  "[&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:bg-muted [&_th]:p-2 " +
  "[&_img]:max-w-full [&_img]:rounded-xl [&_a:not(.page-button)]:text-primary [&_a:not(.page-button)]:underline " +
  "[&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_hr]:my-4 " +
  "[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]_li]:ml-0 [&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:items-start [&_ul[data-type=taskList]_li]:gap-2.5 " +
  "[&_ul[data-type=taskList]_input]:mt-1.5 [&_ul[data-type=taskList]_input]:accent-primary " +
  "[&_mark]:rounded [&_mark]:px-1 [&_mark]:text-neutral-950! " +
  "[&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-xl " +
  "[&_.is-tiptap-empty]:before:pointer-events-none [&_.is-tiptap-empty]:before:float-left [&_.is-tiptap-empty]:before:h-0 [&_.is-tiptap-empty]:before:text-muted-foreground/55 [&_.is-tiptap-empty]:before:content-[attr(data-placeholder)]";

function isValidHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isValidYoutubeUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      /(^|\.)youtu(be\.com|\.be|be-nocookie\.com)$/.test(parsed.hostname)
    );
  } catch {
    return false;
  }
}

function measureStats(doc: JSONContent, text: string) {
  const trimmed = text.trim();
  return {
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    chars: text.length,
    blocks: doc.content?.length ?? 0,
  };
}

/**
 * Khởi tạo Tiptap cho bộ `TiptapEditor` (hợp nhất Simple Sticky Toolbar + Notion-like),
 * an toàn SSR, giá trị là JSON và đồng bộ từ form của module mà không lặp `onChange`.
 *
 * @param props - Props của editor.
 * @returns Editor instance, trạng thái URL dialog của Slash Command và thống kê văn bản.
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
  notion = true,
  placeholder,
  "aria-invalid": invalid,
  "aria-describedby": descriptionId,
}: TiptapEditorProps) {
  const t = useTranslations("common.editor");
  const effectivePlaceholder = placeholder ?? (notion ? t("emptyPlaceholder") : "");
  const [stats, setStats] = useState({ words: 0, chars: 0, blocks: 1 });
  const [urlModalKind, setUrlModalKind] = useState<"image" | "youtube" | null>(null);
  const [urlValue, setUrlValue] = useState("");
  const [urlError, setUrlError] = useState("");

  const callbacksRef = useRef({ onChange, onBlur, onSelectionChange });
  useEffect(() => {
    callbacksRef.current = { onChange, onBlur, onSelectionChange };
  }, [onChange, onBlur, onSelectionChange]);

  const allExtensions = useMemo(
    () => [
      ...createEditorBaseExtensions(),
      ...(extensions ?? []),
      ...(effectivePlaceholder ? [createTiptapPlaceholderExtension(effectivePlaceholder)] : []),
    ],
    [extensions, effectivePlaceholder],
  );

  const paddingClass = notion ? "min-h-64 py-4 pr-4 pl-12 sm:pl-14" : "min-h-64 p-4";

  const editor = useEditor(
    {
      extensions: allExtensions,
      content: value ?? EMPTY_DOCUMENT,
      immediatelyRender: false,
      editable: !disabled,
      onCreate: ({ editor: current }) => {
        setStats(measureStats(current.getJSON(), current.getText()));
      },
      onUpdate: ({ editor: current }) => {
        const json = current.getJSON();
        setStats(measureStats(json, current.getText()));
        callbacksRef.current.onChange(json);
      },
      onBlur: () => callbacksRef.current.onBlur?.(),
      onSelectionUpdate: ({ editor: current }) => callbacksRef.current.onSelectionChange?.(current),
      editorProps: {
        attributes: {
          role: "textbox",
          "aria-multiline": "true",
          "aria-label": label,
          class: `${paddingClass} ${TIPTAP_PROSE_CLASS} ${contentClassName ?? ""}`,
        },
      },
    },
    [allExtensions],
  );

  // Giá trị đổi từ ngoài (tải lại, đặt lại mẫu, sao chép) thì nạp vào editor mà không phát onChange.
  useEffect(() => {
    if (!editor || editor.isDestroyed || !value) return;
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(value)) {
      editor.commands.setContent(value, { emitUpdate: false });
      queueMicrotask(() => {
        if (!editor.isDestroyed) {
          setStats(measureStats(editor.getJSON(), editor.getText()));
        }
      });
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
          class: `${paddingClass} ${TIPTAP_PROSE_CLASS} ${contentClassName ?? ""}`,
          "aria-label": label,
          "aria-invalid": String(Boolean(invalid)),
          "aria-describedby": descriptionId ?? "",
        },
      },
    });
  }, [editor, id, label, invalid, descriptionId, paddingClass, contentClassName]);

  const openUrlModal = (kind: "image" | "youtube") => {
    setUrlModalKind(kind);
    setUrlValue("");
    setUrlError("");
  };

  const submitUrlModal = () => {
    const trimmed = urlValue.trim();
    if (urlModalKind === "image") {
      if (!isValidHttpsUrl(trimmed)) {
        setUrlError(t("invalidImageUrl"));
        return;
      }
      editor?.chain().focus().setImage({ src: trimmed }).run();
    } else if (urlModalKind === "youtube") {
      if (!isValidYoutubeUrl(trimmed)) {
        setUrlError(t("invalidYoutube"));
        return;
      }
      editor?.chain().focus().setYoutubeVideo({ src: trimmed }).run();
    }
    setUrlModalKind(null);
    setUrlValue("");
    setUrlError("");
  };

  return {
    editor,
    stats,
    urlModalKind,
    urlValue,
    setUrlValue,
    urlError,
    openUrlModal,
    closeUrlModal: () => setUrlModalKind(null),
    submitUrlModal,
  };
}
