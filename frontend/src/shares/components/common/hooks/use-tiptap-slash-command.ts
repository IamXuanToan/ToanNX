"use client";

import type { Editor } from "@tiptap/react";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { normalizeSearchText } from "@/shares/lib/search-text";

import type { TiptapEditorProps, TiptapInsertItem, TiptapSlashEntry } from "../tiptap-editor.types";
import { TIPTAP_SLASH_COMMANDS } from "../tiptap-extensions";

export type TiptapSlashState = {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  coords: { top: number; left: number };
  items: TiptapSlashEntry[];
  selectItem: (entry: TiptapSlashEntry) => void;
  setSelectedIndex: (index: number) => void;
  close: () => void;
};

/**
 * Hook quản lý Slash Command (`/`) dùng chung cho mọi `TiptapEditor`:
 * - Tự gộp cả lệnh khối chuẩn (`H1-H3`, danh sách, bảng, ảnh URL, YouTube...) và mục chèn riêng
 *   của module (`insertItems`, `library-image`, `onSelectImage`...).
 * - Lọc không dấu, hỗ trợ chọn bằng phím `↑`/`↓`/`Enter`/`Esc` và chuột.
 */
export function useTiptapSlashCommand({
  editor,
  enabled,
  insertItems,
  onSelectImage,
  onRequestUrlModal,
  onOpenAi,
}: {
  editor: Editor | null;
  enabled: boolean;
  insertItems?: TiptapInsertItem[];
  onSelectImage?: TiptapEditorProps["onSelectImage"];
  onRequestUrlModal: (kind: "image" | "youtube") => void;
  onOpenAi?: () => void;
}): TiptapSlashState {
  const t = useTranslations("common.editor");
  const [openRange, setOpenRange] = useState<{ from: number; to: number } | null>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [coords, setCoords] = useState({ top: 120, left: 48 });

  const allItems = useMemo<TiptapSlashEntry[]>(() => {
    const coreEntries: TiptapSlashEntry[] = TIPTAP_SLASH_COMMANDS.map((meta) => ({
      key: meta.id,
      group: meta.group,
      label: t(`slashItems.${meta.id}.label` as Parameters<typeof t>[0]),
      desc: t(`slashItems.${meta.id}.desc` as Parameters<typeof t>[0]),
      keywords: meta.keywords,
      commandId: meta.id,
    }));

    const hasLibraryPlugin = insertItems?.some((item) => item.key === "library-image") ?? false;
    const selectImageItem: TiptapSlashEntry[] =
      onSelectImage && !hasLibraryPlugin
        ? [
            {
              key: "select-library-image",
              group: "media",
              label: t("image"),
              desc: t("slashItems.imageUrl.desc"),
              keywords: ["library", "thu vien", "anh", "image"],
              customItem: {
                key: "select-library-image",
                label: t("image"),
                icon: insertItems?.[0]?.icon as never,
                run: async (ed) => {
                  const image = await onSelectImage();
                  if (image) {
                    ed.chain()
                      .focus()
                      .insertContent({
                        type: "image",
                        attrs: {
                          src: image.src,
                          alt: image.alt,
                          attachmentId: image.attachmentId ?? null,
                        },
                      })
                      .run();
                  }
                },
              },
            },
          ]
        : [];

    const moduleEntries: TiptapSlashEntry[] = (insertItems ?? []).map((item) => ({
      key: `mod:${item.key}`,
      group: item.key === "library-image" ? "media" : "module",
      label: item.label,
      desc: t("insert"),
      keywords: [item.label, item.key],
      customItem: item,
    }));

    const aiEntry: TiptapSlashEntry[] = onOpenAi
      ? [
          {
            key: "ai-compose",
            group: "basic",
            label: t("ai.slashLabel"),
            desc: t("ai.slashDesc"),
            keywords: ["ai", "viet", "compose", "rag", "tao noi dung"],
            customItem: {
              key: "ai-compose",
              label: t("ai.slashLabel"),
              icon: Sparkles,
              run: () => onOpenAi(),
            },
          },
        ]
      : [];

    return [...aiEntry, ...coreEntries, ...selectImageItem, ...moduleEntries];
  }, [t, insertItems, onSelectImage, onOpenAi]);

  const items = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q) return allItems;
    return allItems.filter(
      (item) =>
        normalizeSearchText(item.label).includes(q) ||
        normalizeSearchText(item.desc).includes(q) ||
        item.keywords.some((kw) => normalizeSearchText(kw).includes(q)),
    );
  }, [allItems, query]);

  const executeEntry = useCallback(
    (entry: TiptapSlashEntry) => {
      if (!editor || !openRange) return;
      editor.chain().focus().deleteRange(openRange).run();
      setOpenRange(null);
      setQuery("");

      if (entry.customItem) {
        void entry.customItem.run(editor);
        return;
      }

      const chain = () => editor.chain().focus();
      switch (entry.commandId) {
        case "paragraph":
          chain().setParagraph().run();
          break;
        case "h1":
          chain().setHeading({ level: 1 }).run();
          break;
        case "h2":
          chain().setHeading({ level: 2 }).run();
          break;
        case "h3":
          chain().setHeading({ level: 3 }).run();
          break;
        case "bulletList":
          chain().toggleBulletList().run();
          break;
        case "orderedList":
          chain().toggleOrderedList().run();
          break;
        case "taskList":
          chain().toggleTaskList().run();
          break;
        case "blockquote":
          chain().toggleBlockquote().run();
          break;
        case "codeBlock":
          chain().toggleCodeBlock().run();
          break;
        case "table":
          chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
          break;
        case "horizontalRule":
          chain().setHorizontalRule().run();
          break;
        case "imageUrl":
          onRequestUrlModal("image");
          break;
        case "youtube":
          onRequestUrlModal("youtube");
          break;
      }
    },
    [editor, openRange, onRequestUrlModal],
  );

  const latestRef = useRef({
    isOpen: openRange !== null,
    items,
    selectedIndex,
    executeEntry,
  });

  useEffect(() => {
    latestRef.current = {
      isOpen: openRange !== null,
      items,
      selectedIndex,
      executeEntry,
    };
  }, [openRange, items, selectedIndex, executeEntry]);

  useEffect(() => {
    if (!editor || !enabled) return;

    const evaluateSlash = () => {
      if (!editor.isEditable || !editor.isFocused) {
        setOpenRange(null);
        return;
      }
      const { selection } = editor.state;
      if (!selection.empty) {
        setOpenRange(null);
        return;
      }
      const { $from } = selection;
      if ($from.parent.type.name === "codeBlock") {
        setOpenRange(null);
        return;
      }
      const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
      const match = textBefore.match(/(?:^|\s)\/([^\s/]*)$/);
      if (!match) {
        setOpenRange(null);
        return;
      }

      const typedQuery = match[1] ?? "";
      const from = $from.pos - typedQuery.length - 1;
      const to = $from.pos;
      const caret = editor.view.coordsAtPos($from.pos);
      const menuHeight = 320;
      const maxLeft = typeof window !== "undefined" ? window.innerWidth - 304 : 600;
      const fitsBelow =
        typeof window === "undefined" || caret.bottom + menuHeight + 16 < window.innerHeight;
      setCoords({
        left: Math.max(12, Math.min(caret.left, maxLeft)),
        top: fitsBelow ? caret.bottom + 8 : Math.max(16, caret.top - menuHeight - 8),
      });
      setQuery(typedQuery);
      setOpenRange({ from, to });
      setSelectedIndex(0);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const current = latestRef.current;
      if (!current.isOpen) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        event.stopPropagation();
        if (current.items.length > 0) {
          setSelectedIndex((prev) => (prev + 1) % current.items.length);
        }
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();
        if (current.items.length > 0) {
          setSelectedIndex((prev) => (prev - 1 + current.items.length) % current.items.length);
        }
      } else if (event.key === "Enter") {
        const picked = current.items[current.selectedIndex];
        if (picked) {
          event.preventDefault();
          event.stopPropagation();
          current.executeEntry(picked);
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setOpenRange(null);
      }
    };

    editor.on("update", evaluateSlash);
    editor.on("selectionUpdate", evaluateSlash);
    const dom = editor.view.dom;
    dom.addEventListener("keydown", handleKeyDown, true);

    return () => {
      editor.off("update", evaluateSlash);
      editor.off("selectionUpdate", evaluateSlash);
      dom.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [editor, enabled]);

  const safeIndex = items.length === 0 ? 0 : Math.min(selectedIndex, items.length - 1);

  return {
    isOpen: enabled && openRange !== null,
    query,
    selectedIndex: safeIndex,
    coords,
    items,
    selectItem: executeEntry,
    setSelectedIndex,
    close: () => setOpenRange(null),
  };
}
