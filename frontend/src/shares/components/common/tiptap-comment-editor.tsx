"use client";

import { EditorContent } from "@tiptap/react";
import { cn } from "cn";
import {
  Bold,
  Code,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Send,
  Strikethrough,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";

import { useTiptapCommentEditor } from "./hooks/use-tiptap-comment-editor";
import type { TiptapCommentEditorProps } from "./tiptap-editor.types";
import { TiptapToggle } from "./tiptap-toggle";
import { UrlPopover } from "./url-popover";

/**
 * **Bộ 3 — Comment Editor (`TiptapCommentEditor`)**: tách riêng cho khung viết hoặc trả lời bình luận
 * với thanh định dạng nhẹ ở đáy (Đậm, Nghiêng, Gạch ngang, Code, Liên kết, Trích dẫn, Danh sách),
 * nhãn đang trả lời (`replyingTo`), nút Hủy/Gửi và phím tắt `Ctrl + Enter` gửi nhanh.
 *
 * @param props - Giá trị, callback gửi/hủy và cấu hình bình luận.
 * @returns Khung soạn thảo bình luận.
 */
export function TiptapCommentEditor(props: TiptapCommentEditorProps) {
  const t = useTranslations("common.editor");
  const state = useTiptapCommentEditor(props);
  const off = !state.editor || props.disabled || props.isSubmitting;
  const invalid = Boolean(props["aria-invalid"]) || state.overLimit;
  const chain = () => state.editor?.chain().focus();

  return (
    <div
      data-slot="tiptap-comment-editor"
      data-invalid={invalid || undefined}
      className={cn(
        "bg-card ring-foreground/15 focus-within:ring-ring flex min-w-0 flex-col rounded-xl ring-1 transition-shadow focus-within:ring-2",
        invalid && "ring-destructive/70 focus-within:ring-destructive",
      )}
    >
      {props.replyingTo ? (
        <div className="bg-muted/35 border-border/60 text-muted-foreground flex items-center justify-between rounded-t-xl border-b px-3.5 py-1.5 text-xs">
          <span>{t("commentReplyingTo", { target: props.replyingTo })}</span>
          {props.onCancel ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={t("commentCancel")}
              onClick={props.onCancel}
              className="size-6 rounded-md"
            >
              <X className="size-3.5" />
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className={cn("bg-background", !props.replyingTo && "rounded-t-xl")}>
        <EditorContent editor={state.editor} />
      </div>

      <div className="bg-muted/25 border-border/60 flex flex-wrap items-center justify-between gap-2 rounded-b-xl border-t px-2.5 py-1.5">
        <div
          role="toolbar"
          aria-label={props.label}
          className="flex flex-wrap items-center gap-0.5"
        >
          <TiptapToggle
            label={t("bold")}
            active={state.active?.bold}
            disabled={off}
            onClick={() => chain()?.toggleBold().run()}
          >
            <Bold />
          </TiptapToggle>
          <TiptapToggle
            label={t("italic")}
            active={state.active?.italic}
            disabled={off}
            onClick={() => chain()?.toggleItalic().run()}
          >
            <Italic />
          </TiptapToggle>
          <TiptapToggle
            label={t("strike")}
            active={state.active?.strike}
            disabled={off}
            onClick={() => chain()?.toggleStrike().run()}
          >
            <Strikethrough />
          </TiptapToggle>
          <TiptapToggle
            label={t("code")}
            active={state.active?.code}
            disabled={off}
            onClick={() => chain()?.toggleCode().run()}
          >
            <Code />
          </TiptapToggle>
          <UrlPopover
            label={t("link")}
            icon={<Link2 />}
            disabled={off}
            initial={(state.editor?.getAttributes("link").href as string) ?? ""}
            error={state.linkError}
            onOpen={state.clearLinkError}
            onApply={(value) => state.setLink(value, t("invalidUrl"))}
          />
          <TiptapToggle
            label={t("quote")}
            active={state.active?.blockquote}
            disabled={off}
            onClick={() => chain()?.toggleBlockquote().run()}
          >
            <Quote />
          </TiptapToggle>
          <TiptapToggle
            label={t("bulletList")}
            active={state.active?.bulletList}
            disabled={off}
            onClick={() => chain()?.toggleBulletList().run()}
          >
            <List />
          </TiptapToggle>
          <TiptapToggle
            label={t("orderedList")}
            active={state.active?.orderedList}
            disabled={off}
            onClick={() => chain()?.toggleOrderedList().run()}
          >
            <ListOrdered />
          </TiptapToggle>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {props.maxLength ? (
            <span
              className={cn(
                "text-muted-foreground text-[11px] tabular-nums",
                state.overLimit && "text-destructive font-medium",
              )}
            >
              {t("charCount", { count: state.textLength, max: props.maxLength })}
            </span>
          ) : null}

          <span className="text-muted-foreground hidden text-[11px] sm:inline">
            {t("commentShortcutHint")}
          </span>

          {props.onCancel ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={props.disabled || props.isSubmitting}
              onClick={props.onCancel}
              className="h-8 rounded-lg px-2.5 text-xs"
            >
              {t("commentCancel")}
            </Button>
          ) : null}

          <Button
            type="button"
            size="sm"
            disabled={off || state.isEmpty || state.overLimit}
            onClick={() => void state.handleSubmit()}
            className="h-8 gap-1.5 rounded-lg px-3 text-xs font-medium"
          >
            {props.isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            <span>
              {props.isSubmitting
                ? t("commentSubmitting")
                : (props.submitLabel ?? t("commentSubmit"))}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
