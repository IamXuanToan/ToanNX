"use client";

import { EditorContent } from "@tiptap/react";
import { cn } from "cn";
import { Bold, Italic, Redo2, Underline, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Separator } from "@/shares/components/ui/separator";

import { useTiptapBasicEditor } from "./hooks/use-tiptap-basic-editor";
import type { TiptapBasicEditorProps } from "./tiptap-editor.types";
import { TiptapToggle } from "./tiptap-toggle";

/**
 * **Bộ 2 — Basic Editor (`TiptapBasicEditor`)**: tách riêng cho các ô mô tả / giới thiệu ngắn,
 * tối giản chỉ gồm In đậm, In nghiêng (kèm Hoàn tác/Làm lại và Gạch chân nếu bật `allowUnderline`).
 * Xuất JSON Tiptap chuẩn, hiển thị lại trực tiếp bằng `TiptapContent`.
 *
 * @param props - Giá trị, callback, giới hạn ký tự và trạng thái khóa.
 * @returns Trình soạn thảo mô tả gọn nhẹ.
 */
export function TiptapBasicEditor(props: TiptapBasicEditorProps) {
  const t = useTranslations("common.editor");
  const { editor, active, charCount } = useTiptapBasicEditor(props);
  const off = !editor || props.disabled;
  const overLimit = Boolean(props.maxLength && charCount > props.maxLength);
  const invalid = Boolean(props["aria-invalid"]) || overLimit;
  const chain = () => editor?.chain().focus();

  return (
    <div
      data-slot="tiptap-basic-editor"
      data-invalid={invalid || undefined}
      className={cn(
        "bg-background ring-foreground/15 focus-within:ring-ring flex min-w-0 flex-col rounded-xl ring-1 transition-shadow focus-within:ring-2",
        invalid && "ring-destructive/70 focus-within:ring-destructive",
        props.disabled && "opacity-70",
      )}
    >
      <div
        role="toolbar"
        aria-label={props.label}
        className="bg-muted/30 border-border/70 flex items-center justify-between gap-2 rounded-t-xl border-b px-2 py-1"
      >
        <div className="flex items-center gap-0.5">
          <TiptapToggle
            label={t("bold")}
            active={active?.bold}
            disabled={off}
            onClick={() => chain()?.toggleBold().run()}
          >
            <Bold />
          </TiptapToggle>
          <TiptapToggle
            label={t("italic")}
            active={active?.italic}
            disabled={off}
            onClick={() => chain()?.toggleItalic().run()}
          >
            <Italic />
          </TiptapToggle>
          {props.allowUnderline ? (
            <TiptapToggle
              label={t("underline")}
              active={active?.underline}
              disabled={off}
              onClick={() => chain()?.toggleUnderline().run()}
            >
              <Underline />
            </TiptapToggle>
          ) : null}

          <Separator orientation="vertical" className="mx-1 h-4" />

          <TiptapToggle
            label={t("undo")}
            disabled={off || !active?.canUndo}
            onClick={() => chain()?.undo().run()}
          >
            <Undo2 />
          </TiptapToggle>
          <TiptapToggle
            label={t("redo")}
            disabled={off || !active?.canRedo}
            onClick={() => chain()?.redo().run()}
          >
            <Redo2 />
          </TiptapToggle>
        </div>

        {props.maxLength ? (
          <span
            className={cn(
              "text-muted-foreground pr-1 text-[11px] tabular-nums",
              overLimit && "text-destructive font-medium",
            )}
          >
            {t("charCount", { count: charCount, max: props.maxLength })}
          </span>
        ) : null}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
