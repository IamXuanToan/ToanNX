"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { SelectField } from "@/shares/components/common/select-field";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Checkbox } from "@/shares/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { Label } from "@/shares/components/ui/label";
import { Textarea } from "@/shares/components/ui/textarea";
import type { TiptapAiMode } from "@/shares/services/tiptap-ai.service";

import type { TiptapAiState } from "./hooks/use-tiptap-ai";
import { createBaseExtensions } from "./tiptap-extensions";

const AI_MODES: readonly TiptapAiMode[] = [
  "generate",
  "rewrite",
  "expand",
  "summarize",
  "fix_grammar",
];

/**
 * Hộp thoại yêu cầu AI viết / biên tập nội dung chuẩn HTML Tiptap (hỗ trợ RAG dữ liệu cá nhân).
 */
export function TiptapAiDialog({ ai }: { ai: TiptapAiState }) {
  const t = useTranslations("common.editor.ai");
  const tActions = useTranslations("common.actions");

  const previewEditor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: createBaseExtensions(),
    content: ai.result?.html || "",
    editorProps: {
      attributes: {
        class: "tiptap-prose prose-sm max-w-none p-3 text-sm focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (previewEditor && ai.result?.html) {
      previewEditor.commands.setContent(ai.result.html);
    }
  }, [previewEditor, ai.result?.html]);

  return (
    <Dialog open={ai.open} onOpenChange={ai.setOpen}>
      <DialogContent className="flex max-h-[85svh] flex-col gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="text-primary size-4" />
            <span>{t("title")}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t("modeLabel")}</Label>
            <SelectField
              value={ai.mode}
              onValueChange={(value) => ai.setMode(value as TiptapAiMode)}
              options={AI_MODES.map((m) => ({
                value: m,
                label: t(`modes.${m}`),
              }))}
            />
          </div>

          {ai.selectedText ? (
            <div className="bg-muted/40 space-y-1 rounded-lg border p-3">
              <p className="text-muted-foreground text-[11px] font-medium uppercase">
                {t("selectedLabel")}
              </p>
              <p className="line-clamp-3 text-xs whitespace-pre-wrap">{ai.selectedText}</p>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="tiptap-ai-prompt" className="text-xs font-medium">
              {t("promptLabel")}
            </Label>
            <Textarea
              id="tiptap-ai-prompt"
              rows={3}
              value={ai.prompt}
              onChange={(event) => ai.setPrompt(event.target.value)}
              placeholder={t("promptPlaceholder")}
              maxLength={2000}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <Checkbox
              checked={ai.usePersonalRag}
              onCheckedChange={(checked) => ai.setUsePersonalRag(Boolean(checked))}
            />
            <span>{t("useRagLabel")}</span>
          </label>

          {ai.errorMessage ? (
            <p className="text-destructive text-xs font-medium">{ai.errorMessage}</p>
          ) : null}

          {ai.result ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium">{t("previewLabel")}</span>
                {ai.result.ragSources.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1">
                    {ai.result.ragSources.map((src) => (
                      <Badge key={src} variant="secondary" className="text-[10px]">
                        RAG: {src}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="bg-muted/20 max-h-56 overflow-y-auto rounded-lg border">
                <EditorContent editor={previewEditor} />
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="mx-0 mb-0 flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3">
          <Button type="button" variant="outline" onClick={() => ai.setOpen(false)}>
            {tActions("cancel")}
          </Button>
          <Button type="button" onClick={() => void ai.generate()} disabled={ai.isGenerating}>
            {ai.isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>{t("generating")}</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>{ai.result ? t("regenerate") : t("generate")}</span>
              </>
            )}
          </Button>
          {ai.result ? (
            <>
              {ai.hasSelection ? (
                <Button type="button" variant="secondary" onClick={() => ai.insertIntoEditor(true)}>
                  {t("replaceSelection")}
                </Button>
              ) : null}
              <Button type="button" onClick={() => ai.insertIntoEditor(false)}>
                {t("insertContent")}
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
