"use client";

import type { Editor } from "@tiptap/react";
import { useState } from "react";

import type { RichTextEditorProps } from "../types";

/** Chỉ nhận URL HTTP/HTTPS cho liên kết và ảnh được chọn qua callback của module. */
function isPublicUrl(value: string): boolean {
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** State liên kết và chọn ảnh; lỗi hiển thị trong FieldError, không dùng prompt/alert. */
export function useEditorAssets(
  editor: Editor | null,
  selectImage: RichTextEditorProps["onSelectImage"],
  messages: { invalidUrl: string; failed: string },
) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const applyLink = () => {
    if (!isPublicUrl(url)) {
      setError(messages.invalidUrl);
      return;
    }

    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    setError("");
  };

  const removeLink = () => {
    editor?.chain().focus().unsetLink().run();
    setUrl("");
    setError("");
  };

  const insertImage = async () => {
    if (!selectImage || pending) return;

    setPending(true);
    setError("");

    try {
      const image = await selectImage();
      if (!image) return;

      if (!isPublicUrl(image.url)) {
        setError(messages.invalidUrl);
        return;
      }

      editor?.chain().focus().setImage({ src: image.url, alt: image.alt }).run();
    } catch {
      setError(messages.failed);
    } finally {
      setPending(false);
    }
  };

  return { url, setUrl, error, pending, applyLink, removeLink, insertImage };
}
