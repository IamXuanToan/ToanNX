"use client";

import { useEffect } from "react";
import { EditorContent } from "@tiptap/react";
import { cn } from "cn";
import { useTranslations } from "next-intl";

import { TiptapAiDialog } from "./tiptap-ai-dialog";
import { TiptapBlockHandle } from "./tiptap-block-handle";
import { TiptapBubbleToolbar } from "./tiptap-bubble-toolbar";
import { TiptapNotionUrlDialog } from "./tiptap-notion-url-dialog";
import { TiptapSlashMenu } from "./tiptap-slash-menu";
import { TiptapToolbar } from "./tiptap-toolbar";
import { useTiptapAi } from "./hooks/use-tiptap-ai";
import { useTiptapBlockHandle } from "./hooks/use-tiptap-block-handle";
import { useTiptapEditor } from "./hooks/use-tiptap-editor";
import { useTiptapPluginItems } from "./hooks/use-tiptap-plugins";
import { useTiptapSlashCommand } from "./hooks/use-tiptap-slash-command";
import type { TiptapEditorProps } from "./tiptap-editor.types";

/**
 * **Bộ 1 — Full Editor (`TiptapEditor`)**: hợp nhất thanh công cụ cố định quen thuộc (Simple Sticky
 * Toolbar) và bộ trải nghiệm Notion-like đầy đủ (gõ `/` chèn khối, Bubble Menu khi bôi đen chữ, kéo
 * thả sắp xếp dòng `⠿`, thêm khối `+`, kéo chỉnh/căn lề ảnh từ Thư viện & URL).
 * Có thể bật/tắt `showToolbar` hoặc `notion` linh hoạt theo ngữ cảnh; xuất JSON tương thích 100% với
 * `TiptapContent`.
 *
 * @param props - Giá trị, callback và cấu hình của module.
 * @returns Full Editor hợp nhất.
 */
export function TiptapEditor(props: TiptapEditorProps) {
  const t = useTranslations("common.editor");
  const showToolbar = props.showToolbar ?? true;
  const notionEnabled = (props.notion ?? true) && !props.disabled;

  const {
    editor,
    stats,
    urlModalKind,
    urlValue,
    setUrlValue,
    urlError,
    openUrlModal,
    closeUrlModal,
    submitUrlModal,
  } = useTiptapEditor(props);

  const ai = useTiptapAi(editor, props.aiContextHint);
  const { onEditorReady } = props;

  useEffect(() => {
    onEditorReady?.(editor);
    return () => {
      onEditorReady?.(null);
    };
  }, [editor, onEditorReady]);
  const pluginItems = useTiptapPluginItems();
  const mergedInsertItems = [...(props.insertItems ?? []), ...pluginItems];

  const slash = useTiptapSlashCommand({
    editor,
    enabled: notionEnabled,
    insertItems: mergedInsertItems,
    onSelectImage: props.onSelectImage,
    onRequestUrlModal: openUrlModal,
    onOpenAi: () => ai.openDialog("generate"),
  });

  const blockHandle = useTiptapBlockHandle(editor, notionEnabled);
  const invalid = Boolean(props["aria-invalid"]);

  return (
    <div
      data-slot="tiptap-editor"
      data-invalid={invalid || undefined}
      className={cn(
        "bg-card text-card-foreground ring-foreground/10 flex max-w-full min-w-0 flex-col rounded-xl text-sm ring-1",
        invalid && "ring-destructive/60",
      )}
    >
      {showToolbar ? (
        <TiptapToolbar
          editor={editor}
          disabled={props.disabled}
          label={props.label}
          insertItems={mergedInsertItems}
          onSelectImage={props.onSelectImage}
          onOpenAi={() => ai.openDialog()}
        />
      ) : null}

      <div
        data-tiptap-canvas
        onMouseMove={notionEnabled ? blockHandle.handleCanvasMouseMove : undefined}
        onMouseLeave={notionEnabled ? blockHandle.handleCanvasMouseLeave : undefined}
        className={cn(
          "bg-background relative min-w-0 flex-1",
          showToolbar ? (props.showStats ? "rounded-none" : "rounded-b-xl") : "rounded-t-xl",
          !showToolbar && !props.showStats && "rounded-xl",
        )}
      >
        {notionEnabled ? (
          <>
            <TiptapBlockHandle
              hoveredBlock={blockHandle.hoveredBlock}
              dragState={blockHandle.dragState}
              menuOpen={blockHandle.menuOpen}
              onMenuOpenChange={blockHandle.setMenuOpen}
              onGripPointerDown={blockHandle.handleGripPointerDown}
              onGripPointerMove={blockHandle.handleGripPointerMove}
              onGripPointerUp={blockHandle.handleGripPointerUp}
              onGripPointerCancel={blockHandle.handleGripPointerCancel}
              onAddBelow={blockHandle.insertBlockBelow}
              onMove={blockHandle.moveBlock}
              onDuplicate={blockHandle.duplicateBlock}
              onDelete={blockHandle.deleteBlock}
              onTurnInto={blockHandle.turnBlockInto}
            />
            {editor ? (
              <TiptapBubbleToolbar editor={editor} onOpenAi={() => ai.openDialog("rewrite")} />
            ) : null}
            <TiptapSlashMenu slash={slash} />
            {!props.disabled ? <TiptapAiDialog ai={ai} /> : null}
            <TiptapNotionUrlDialog
              kind={urlModalKind}
              value={urlValue}
              error={urlError}
              onValueChange={setUrlValue}
              onClose={closeUrlModal}
              onSubmit={submitUrlModal}
            />
          </>
        ) : null}

        <EditorContent editor={editor} />
      </div>

      {props.showStats ? (
        <div className="bg-muted/25 border-border/60 text-muted-foreground flex flex-wrap items-center justify-between gap-2 rounded-b-xl border-t px-3.5 py-1.5 text-[11px]">
          <span>{notionEnabled ? t("notionHint") : ""}</span>
          <span className="tabular-nums">
            {t("stats", { words: stats.words, chars: stats.chars, blocks: stats.blocks })}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export type * from "./tiptap-editor.types";
