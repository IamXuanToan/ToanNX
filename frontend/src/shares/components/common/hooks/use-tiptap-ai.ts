"use client";

import type { Editor } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import {
  type TiptapAiComposeResult,
  type TiptapAiMode,
  tiptapAiService,
} from "@/shares/services/tiptap-ai.service";

export type TiptapAiState = ReturnType<typeof useTiptapAi>;

/**
 * Hook quản lý hộp thoại AI viết & biên tập nội dung trực tiếp trong `TiptapEditor`:
 * tự động lấy đoạn văn bản đang bôi đen, ngữ cảnh tài liệu và gọi `/workspace/assistant/compose` kèm RAG.
 *
 * @param editor - Instance Tiptap Editor hiện tại.
 * @returns State & handlers cho `TiptapAiDialog`, Toolbar, BubbleMenu và SlashMenu.
 */
export function useTiptapAi(editor: Editor | null, aiContextHint?: string) {
  const t = useTranslations("common.editor.ai");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<TiptapAiMode>("generate");
  const [prompt, setPrompt] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);
  const [usePersonalRag, setUsePersonalRag] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<TiptapAiComposeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  function openDialog(initialMode?: TiptapAiMode, initialPrompt?: string) {
    if (editor) {
      const { from, to, empty } = editor.state.selection;
      const text = empty ? "" : editor.state.doc.textBetween(from, to, "\n").trim();
      setSelectedText(text);
      setSelectionRange(empty ? null : { from, to });
      if (!initialMode) {
        setMode(text ? "rewrite" : "generate");
      } else {
        setMode(initialMode);
      }
    } else {
      setSelectedText("");
      setSelectionRange(null);
      setMode(initialMode ?? "generate");
    }
    setPrompt(initialPrompt ?? "");
    setResult(null);
    setErrorMessage("");
    setOpen(true);
  }

  async function generate() {
    const cleanedPrompt = prompt.trim() || t(`defaultPrompts.${mode}`);
    if (!cleanedPrompt || isGenerating) return;
    setIsGenerating(true);
    setErrorMessage("");
    try {
      const editorText = editor ? editor.getText().slice(0, 1600) : "";
      const documentContext = [aiContextHint?.trim(), editorText]
        .filter(Boolean)
        .join("\n\n")
        .slice(0, 2000);
      const res = await tiptapAiService.compose({
        prompt: cleanedPrompt,
        mode,
        selectedText,
        documentContext,
        usePersonalRag,
      });
      setResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("errorFallback");
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  }

  function insertIntoEditor(replaceSelection: boolean) {
    if (!editor || !result?.html) return;
    if (replaceSelection && selectionRange) {
      editor.chain().focus().insertContentAt(selectionRange, result.html).run();
    } else {
      editor.chain().focus().insertContent(result.html).run();
    }
    setOpen(false);
    setResult(null);
  }

  return {
    open,
    setOpen,
    mode,
    setMode,
    prompt,
    setPrompt,
    selectedText,
    hasSelection: Boolean(selectionRange && selectedText),
    usePersonalRag,
    setUsePersonalRag,
    isGenerating,
    result,
    errorMessage,
    openDialog,
    generate,
    insertIntoEditor,
  };
}
