"use client";

import { EditorContent, useEditorState } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import { Button } from "@/shares/components/ui/button";
import { FieldError } from "@/shares/components/ui/field";
import { Input } from "@/shares/components/ui/input";

import { useEditorAssets } from "./hooks/use-editor-assets";
import { useRichTextEditor } from "./hooks/use-rich-text-editor";
import type { RichTextEditorProps } from "./types";

/** Editor Tiptap dùng control shadcn, nhận HTML và callback từ form của module. */
export function RichTextEditor(props: RichTextEditorProps) {
  const t = useTranslations("common.editor");
  const errorId = useId();
  const editor = useRichTextEditor(props);
  const assets = useEditorAssets(editor, props.onSelectImage, {
    invalidUrl: t("invalidUrl"),
    failed: t("imageFailed"),
  });
  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold"),
      italic: editor?.isActive("italic"),
      underline: editor?.isActive("underline"),
    }),
  });
  const actions = [
    {
      label: t("bold"),
      active: active?.bold,
      run: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      label: t("italic"),
      active: active?.italic,
      run: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      label: t("underline"),
      active: active?.underline,
      run: () => editor?.chain().focus().toggleUnderline().run(),
    },
    { label: t("heading"), run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: t("bulletList"), run: () => editor?.chain().focus().toggleBulletList().run() },
    { label: t("orderedList"), run: () => editor?.chain().focus().toggleOrderedList().run() },
    {
      label: t("table"),
      run: () =>
        editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    { label: t("undo"), run: () => editor?.chain().focus().undo().run() },
    { label: t("redo"), run: () => editor?.chain().focus().redo().run() },
  ];

  return (
    <div className="bg-card overflow-hidden rounded-xl border" data-invalid={props["aria-invalid"]}>
      <div role="toolbar" aria-label={props.label} className="flex flex-wrap gap-1 border-b p-1">
        {actions.map((action) => (
          <Button
            key={action.label}
            type="button"
            variant={action.active ? "secondary" : "ghost"}
            disabled={!editor || props.disabled}
            aria-pressed={action.active}
            onClick={action.run}
          >
            {action.label}
          </Button>
        ))}
        {props.onSelectImage ? (
          <Button
            type="button"
            variant="ghost"
            disabled={!editor || props.disabled || assets.pending}
            onClick={() => void assets.insertImage()}
          >
            {t("image")}
          </Button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 border-b p-2">
        <Input
          aria-label={t("link")}
          aria-invalid={Boolean(assets.error)}
          aria-describedby={assets.error ? errorId : undefined}
          value={assets.url}
          onChange={(event) => assets.setUrl(event.target.value)}
          disabled={props.disabled}
          className="min-w-40 flex-1"
        />
        <Button
          type="button"
          variant="outline"
          disabled={!editor || props.disabled}
          onClick={assets.applyLink}
        >
          {t("applyLink")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!editor || props.disabled}
          onClick={assets.removeLink}
        >
          {t("removeLink")}
        </Button>
      </div>
      <FieldError id={errorId} className="px-3">
        {assets.error}
      </FieldError>
      <EditorContent editor={editor} />
    </div>
  );
}
