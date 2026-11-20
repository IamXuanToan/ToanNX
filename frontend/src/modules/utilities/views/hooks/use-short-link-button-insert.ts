"use client";

import type { Editor } from "@tiptap/react";
import { Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useTiptapInsertItem } from "@/shares/components/common/hooks/use-tiptap-plugins";

import { useShortLinkOptions } from "../../hooks/use-short-link-options";

/**
 * Hook quản lý đăng ký menu chèn link rút gọn và form chọn link trong Tiptap editor.
 *
 * @returns Editor instance, danh sách link, id và label đang chọn, cờ dialog và các hàm xử lý.
 */
export function useShortLinkButtonInsert() {
  const t = useTranslations("utilities.shortLinks.editor");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [linkId, setLinkId] = useState("");
  const [label, setLabel] = useState("");

  const options = useShortLinkOptions("", editor !== null);
  useTiptapInsertItem({
    key: "short-link-button",
    label: t("insert"),
    icon: Link2,
    run: setEditor,
  });

  const links = options.data ?? [];
  const selected = links.find((link) => link.id === linkId);

  const close = () => {
    setEditor(null);
    setLinkId("");
    setLabel("");
  };

  const handleSelectLink = (value: string) => {
    setLinkId(value);
    if (!label) {
      setLabel(links.find((link) => link.id === value)?.name ?? "");
    }
  };

  const handleConfirm = () => {
    if (!selected) return;
    editor
      ?.chain()
      .focus()
      .insertContent({
        type: "button",
        attrs: {
          label: label.trim(),
          href: selected.shortUrl,
          shortLinkId: selected.id,
          variant: "primary",
        },
      })
      .run();
    close();
  };

  return {
    isOpen: editor !== null,
    close,
    linkId,
    label,
    setLabel,
    handleSelectLink,
    links,
    selected,
    isPending: options.isPending,
    handleConfirm,
  };
}
