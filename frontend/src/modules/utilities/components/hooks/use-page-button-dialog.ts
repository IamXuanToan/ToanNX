"use client";

import type { Editor } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";

import { isAllowedLink } from "@/shares/components/common/hooks/use-tiptap-toolbar";

/**
 * Thuộc tính của hook `usePageButtonDialog`.
 */
export interface UsePageButtonDialogProps {
  /** Đối tượng editor Tiptap hiện tại để chèn button */
  editor: Editor | null;
  /** Callback đóng dialog */
  onClose: () => void;
}

/**
 * Hook quản lý trạng thái form và hành động chèn nút liên kết vào Tiptap editor.
 *
 * @param props - Thuộc tính `UsePageButtonDialogProps`.
 * @returns State của form (label, href, error) và hàm handleSubmit.
 */
export function usePageButtonDialog({ editor, onClose }: UsePageButtonDialogProps) {
  const t = useTranslations("utilities.customPages.editor");
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("https://");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!label.trim()) {
      setError(t("buttonLabelRequired"));
      return;
    }
    if (!isAllowedLink(href.trim())) {
      setError(t("buttonUrlInvalid"));
      return;
    }
    editor
      ?.chain()
      .focus()
      .insertContent({
        type: "button",
        attrs: { label: label.trim(), href: href.trim(), variant: "primary" },
      })
      .run();
    setLabel("");
    setHref("https://");
    setError("");
    onClose();
  };

  return {
    label,
    setLabel,
    href,
    setHref,
    error,
    handleSubmit,
  };
}
