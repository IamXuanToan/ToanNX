"use client";

import type { JSONContent } from "@tiptap/core";
import { MoveVertical, StickyNote } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DEFAULT_LOCALE, type AppLocale } from "@/i18n/routing";
import type { TiptapInsertItem } from "@/shares/components/common/tiptap-editor.types";

import {
  createBasicDemoSampleDoc,
  createNotionDemoSampleDoc,
  NOTION_COVER_PRESETS,
  NOTION_EMOJI_OPTIONS,
} from "../../../constants/notion-demo-data";

export type DemoEditorSuiteMode = "full" | "basic" | "comment";

export type DemoCommentItem = {
  id: string;
  doc: JSONContent;
};

/**
 * Hook quản lý trạng thái cho trang trình diễn bộ 3 Editor (`/demo/editor`):
 * 1) Full (hợp nhất Simple Sticky Toolbar + Notion-like kéo thả dòng / gõ `/` / Bubble Menu),
 * 2) Basic (mô tả chỉ in đậm, in nghiêng),
 * 3) Comment (khung viết bình luận + Ctrl+Enter).
 */
export function useNotionDemo() {
  const locale = (useLocale() === "en" ? "en" : DEFAULT_LOCALE) as AppLocale;
  const t = useTranslations("utilities.customPages.notionDemo");
  const tEditor = useTranslations("utilities.customPages.editor");

  const [suiteMode, setSuiteMode] = useState<DemoEditorSuiteMode>("full");
  const [title, setTitle] = useState(() => t("defaultTitle"));
  const [icon, setIcon] = useState<string>(NOTION_EMOJI_OPTIONS[0]);
  const [coverIndex, setCoverIndex] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState<"edit" | "read">("edit");
  const [showToolbar, setShowToolbar] = useState(true);
  const [darkCanvas, setDarkCanvas] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);

  const sampleDoc = useMemo(() => createNotionDemoSampleDoc(locale), [locale]);
  const sampleBasicDoc = useMemo(() => createBasicDemoSampleDoc(locale), [locale]);

  const [docSnapshot, setDocSnapshot] = useState<JSONContent>(sampleDoc);
  const [basicDoc, setBasicDoc] = useState<JSONContent>(sampleBasicDoc);
  const [comments, setComments] = useState<DemoCommentItem[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(() => t("commentSampleReply"));

  const insertItems = useMemo<TiptapInsertItem[]>(
    () => [
      {
        key: "page-callout",
        label: tEditor("callout"),
        icon: StickyNote,
        run: (editor) =>
          editor
            .chain()
            .focus()
            .insertContent({
              type: "callout",
              attrs: { tone: "info" },
              content: [{ type: "paragraph" }],
            })
            .run(),
      },
      {
        key: "page-spacer",
        label: tEditor("spacer"),
        icon: MoveVertical,
        run: (editor) =>
          editor
            .chain()
            .focus()
            .insertContent({ type: "spacer", attrs: { size: "md" } })
            .run(),
      },
    ],
    [tEditor],
  );

  const handleCycleCover = () => {
    setCoverIndex((prev) => (prev + 1) % NOTION_COVER_PRESETS.length);
  };

  const handleRemoveCover = () => {
    setCoverIndex((prev) => (prev < 0 ? 0 : -1));
  };

  const handleResetSample = () => {
    setTitle(t("defaultTitle"));
    setIcon(NOTION_EMOJI_OPTIONS[0]);
    setCoverIndex(0);
    setPreviewMode("edit");
    setShowToolbar(true);
    setDocSnapshot(sampleDoc);
    setBasicDoc(sampleBasicDoc);
    setComments([]);
  };

  const activeJsonSnapshot =
    suiteMode === "full"
      ? docSnapshot
      : suiteMode === "basic"
        ? basicDoc
        : (comments[0]?.doc ?? { type: "doc", content: [{ type: "paragraph" }] });

  const handleCopyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(activeJsonSnapshot, null, 2));
    toast.success(t("copiedJson"));
  };

  const handlePostComment = (doc: JSONContent) => {
    setComments((prev) => [{ id: `cmt-${Date.now()}`, doc }, ...prev]);
  };

  return {
    suiteMode,
    setSuiteMode,
    title,
    setTitle,
    icon,
    setIcon,
    cover: coverIndex >= 0 ? NOTION_COVER_PRESETS[coverIndex] : null,
    hasCover: coverIndex >= 0,
    handleCycleCover,
    handleRemoveCover,
    previewMode,
    setPreviewMode,
    showToolbar,
    setShowToolbar,
    darkCanvas,
    setDarkCanvas,
    jsonOpen,
    setJsonOpen,
    docSnapshot,
    setDocSnapshot,
    basicDoc,
    setBasicDoc,
    comments,
    replyingTo,
    clearReply: () => setReplyingTo(null),
    restoreReplySample: () => setReplyingTo(t("commentSampleReply")),
    handlePostComment,
    activeJsonSnapshot,
    insertItems,
    handleResetSample,
    handleCopyJson,
  };
}
