"use client";

import { type Editor, useEditorState } from "@tiptap/react";
import { useState } from "react";

import { LINK_PROTOCOLS } from "../tiptap-extensions";
import type { TiptapEditorProps } from "../tiptap-editor.types";

/** Kiểu căn lề của đoạn/tiêu đề/ảnh. */
export type TextAlignValue = "left" | "center" | "right" | "justify";

/** URL hợp lệ cho liên kết (http, https, mailto, tel). */
export function isAllowedLink(value: string): boolean {
  try {
    return LINK_PROTOCOLS.includes(new URL(value).protocol.replace(":", "") as never);
  } catch {
    return false;
  }
}

/** URL https (ảnh ngoài, video). */
function isHttps(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Trạng thái toolbar: mark/node đang bật, ô nhập liên kết/ảnh URL/video, căn lề (cả đoạn văn lẫn ảnh)
 * và chọn ảnh từ module. Lỗi hiện trong popover (không dùng prompt/alert).
 *
 * @param editor - Editor.
 * @param selectImage - Bộ chọn ảnh của module.
 * @returns Trạng thái và hành động.
 */
export function useTiptapToolbar(
  editor: Editor | null,
  selectImage: TiptapEditorProps["onSelectImage"],
) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      const isImageSelected = current?.isActive("image") ?? false;
      const imageAlign = current?.getAttributes("image").align as string | undefined;
      const textAlign = (["center", "right", "justify"] as const).find((value) =>
        current?.isActive({ textAlign: value }),
      );
      const resolvedAlign: TextAlignValue = isImageSelected
        ? imageAlign === "full"
          ? "justify"
          : imageAlign === "center" || imageAlign === "right"
            ? imageAlign
            : "left"
        : (textAlign ?? "left");

      return {
        bold: current?.isActive("bold") ?? false,
        italic: current?.isActive("italic") ?? false,
        underline: current?.isActive("underline") ?? false,
        strike: current?.isActive("strike") ?? false,
        code: current?.isActive("code") ?? false,
        highlight: current?.isActive("highlight") ?? false,
        link: current?.isActive("link") ?? false,
        bulletList: current?.isActive("bulletList") ?? false,
        orderedList: current?.isActive("orderedList") ?? false,
        taskList: current?.isActive("taskList") ?? false,
        blockquote: current?.isActive("blockquote") ?? false,
        codeBlock: current?.isActive("codeBlock") ?? false,
        isImageSelected,
        block: current?.isActive("heading", { level: 1 })
          ? "h1"
          : current?.isActive("heading", { level: 2 })
            ? "h2"
            : current?.isActive("heading", { level: 3 })
              ? "h3"
              : current?.isActive("blockquote")
                ? "blockquote"
                : current?.isActive("codeBlock")
                  ? "codeBlock"
                  : "paragraph",
        align: resolvedAlign,
        canUndo: current?.can().undo() ?? false,
        canRedo: current?.can().redo() ?? false,
      };
    },
  });
  const chain = () => editor?.chain().focus();

  return {
    active,
    error,
    pending,
    clearError: () => setError(""),
    setBlock: (block: string) => {
      if (block === "paragraph") chain()?.setParagraph().run();
      else if (block === "blockquote") chain()?.toggleBlockquote().run();
      else if (block === "codeBlock") chain()?.toggleCodeBlock().run();
      else
        chain()
          ?.setHeading({ level: Number(block.slice(1)) as 1 | 2 | 3 })
          .run();
    },
    setAlign: (nextAlign: TextAlignValue) => {
      if (editor?.isActive("image")) {
        chain()
          ?.updateAttributes("image", {
            align: nextAlign === "justify" ? "full" : nextAlign,
            ...(nextAlign === "justify" ? { width: "100%" } : {}),
          })
          .run();
        return;
      }
      chain()?.setTextAlign(nextAlign).run();
    },
    setLink: (href: string, invalid: string) => {
      if (!href) {
        chain()?.extendMarkRange("link").unsetLink().run();
        return true;
      }
      if (!isAllowedLink(href)) {
        setError(invalid);
        return false;
      }
      chain()?.extendMarkRange("link").setLink({ href }).run();
      setError("");
      return true;
    },
    insertImageUrl: (src: string, invalid: string) => {
      if (!isHttps(src)) {
        setError(invalid);
        return false;
      }
      chain()?.setImage({ src }).run();
      setError("");
      return true;
    },
    insertYoutube: (src: string, invalid: string) => {
      if (
        !isHttps(src) ||
        !/(^|\.)youtu(be\.com|\.be|be-nocookie\.com)$/.test(new URL(src).hostname)
      ) {
        setError(invalid);
        return false;
      }
      chain()?.setYoutubeVideo({ src }).run();
      setError("");
      return true;
    },
    selectImage: async (failed: string) => {
      if (!selectImage || pending) return;
      setPending(true);
      setError("");
      try {
        const image = await selectImage();
        if (image) {
          chain()
            ?.insertContent({
              type: "image",
              attrs: { src: image.src, alt: image.alt, attachmentId: image.attachmentId ?? null },
            })
            .run();
        }
      } catch {
        setError(failed);
      } finally {
        setPending(false);
      }
    },
  };
}
