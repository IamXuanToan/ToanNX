"use client";

import type { JSONContent } from "@tiptap/core";
import { cn } from "cn";
import { ImageIcon, ImageOff, Smile } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { TiptapContent } from "@/shares/components/common/tiptap-content";
import { TiptapEditor } from "@/shares/components/common/tiptap-editor";
import type { TiptapInsertItem } from "@/shares/components/common/tiptap-editor.types";
import { Button } from "@/shares/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shares/components/ui/popover";
import { Textarea } from "@/shares/components/ui/textarea";

import { NOTION_COVER_PRESETS, NOTION_EMOJI_OPTIONS } from "../../constants/notion-demo-data";
import { PAGE_EXTENSIONS } from "../../extensions/page-extensions";

type CoverPreset = (typeof NOTION_COVER_PRESETS)[number];

/**
 * Khung tài liệu Full Editor (`TiptapEditor` hợp nhất Simple Sticky Toolbar + Notion-like):
 * gồm ảnh bìa, emoji icon, tiêu đề chỉnh trực tiếp và vùng soạn thảo có kéo thả dòng `⠿`,
 * lệnh `/`, Bubble Menu chọn chữ, resize ảnh và chế độ xem trước `TiptapContent`.
 */
export function NotionDemoEditor({
  docSnapshot,
  onDocChange,
  title,
  onTitleChange,
  icon,
  onIconChange,
  cover,
  hasCover,
  onCycleCover,
  onRemoveCover,
  previewMode,
  showToolbar,
  darkCanvas,
  insertItems,
}: {
  docSnapshot: JSONContent;
  onDocChange: (doc: JSONContent) => void;
  title: string;
  onTitleChange: (title: string) => void;
  icon: string;
  onIconChange: (emoji: string) => void;
  cover: CoverPreset | null;
  hasCover: boolean;
  onCycleCover: () => void;
  onRemoveCover: () => void;
  previewMode: "edit" | "read";
  showToolbar: boolean;
  darkCanvas: boolean;
  insertItems: TiptapInsertItem[];
}) {
  const t = useTranslations("utilities.customPages.notionDemo");

  return (
    <div
      className={cn(
        "border-border/80 relative mx-auto w-full max-w-4xl rounded-2xl border shadow-sm transition-colors",
        darkCanvas ? "dark bg-neutral-950 text-neutral-100" : "bg-background text-foreground",
      )}
    >
      {/* Ảnh bìa */}
      {hasCover && cover ? (
        <div className="group/cover relative h-40 w-full overflow-hidden rounded-t-2xl sm:h-48">
          {"imageUrl" in cover ? (
            <Image
              src={cover.imageUrl}
              alt={title || t("defaultTitle")}
              fill
              sizes="(max-width: 1024px) 100vw, 896px"
              loading="eager"
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className={cn("size-full bg-gradient-to-r", cover.gradientClass)} />
          )}

          {previewMode === "edit" ? (
            <div className="bg-background/95 text-foreground border-border/80 absolute right-3 bottom-3 flex items-center gap-1 rounded-xl border p-1 opacity-100 shadow-md backdrop-blur-md transition-opacity sm:opacity-0 sm:group-hover/cover:opacity-100">
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={onCycleCover}
                className="h-7 gap-1.5 rounded-lg px-2 text-xs font-medium"
              >
                <ImageIcon className="size-3.5" />
                <span>{t("toggleCover")}</span>
              </Button>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={onRemoveCover}
                className="h-7 gap-1.5 rounded-lg px-2 text-xs font-medium"
              >
                <ImageOff className="size-3.5" />
                <span>{t("removeCover")}</span>
              </Button>
            </div>
          ) : null}
        </div>
      ) : previewMode === "edit" ? (
        <div className="flex justify-end px-5 pt-4 sm:px-10">
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={onCycleCover}
            className="text-muted-foreground h-7 gap-1.5 text-xs"
          >
            <ImageIcon className="size-3.5" />
            <span>{t("toggleCover")}</span>
          </Button>
        </div>
      ) : null}

      {/* Đầu tài liệu: Emoji icon + Tiêu đề */}
      <div className={cn("px-5 sm:px-10", hasCover ? "-mt-7 pt-0" : "pt-6")}>
        <div className="mb-3 flex items-end gap-3">
          {previewMode === "edit" ? (
            <Popover>
              <AppTooltip content={t("pickIcon")}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={t("pickIcon")}
                    className="bg-background hover:bg-muted relative z-10 size-14 rounded-2xl border text-3xl shadow-sm"
                  >
                    <span aria-hidden>{icon}</span>
                  </Button>
                </PopoverTrigger>
              </AppTooltip>
              <PopoverContent align="start" className="w-auto rounded-xl p-2">
                <div className="flex flex-wrap gap-1">
                  {NOTION_EMOJI_OPTIONS.map((emoji) => (
                    <Button
                      key={emoji}
                      type="button"
                      variant={emoji === icon ? "secondary" : "ghost"}
                      size="icon-sm"
                      onClick={() => onIconChange(emoji)}
                      className="rounded-lg text-lg"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <div className="bg-background relative z-10 flex size-14 items-center justify-center rounded-2xl border text-3xl shadow-sm">
              <span aria-hidden>{icon}</span>
            </div>
          )}

          {previewMode === "edit" ? (
            <span className="text-muted-foreground hidden items-center gap-1 pb-1 text-xs sm:inline-flex">
              <Smile className="size-3.5" />
              {t("pickIcon")}
            </span>
          ) : null}
        </div>

        {previewMode === "edit" ? (
          <Textarea
            rows={1}
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder={t("titlePlaceholder")}
            aria-label={t("titlePlaceholder")}
            className="placeholder:text-muted-foreground/50 min-h-0 resize-none border-0 bg-transparent px-0 py-1 text-2xl leading-tight font-bold tracking-tight shadow-none focus-visible:ring-0 sm:text-3xl md:text-4xl dark:bg-transparent"
          />
        ) : (
          <h1 className="py-1 text-2xl leading-tight font-bold tracking-tight sm:text-3xl md:text-4xl">
            {title}
          </h1>
        )}
      </div>

      {/* Thân bài viết dùng chính TiptapEditor hợp nhất (Simple Sticky + Notion-like Drag/Slash/Bubble) */}
      <div className="px-4 pt-3 pb-8 sm:px-10 sm:pb-12">
        {previewMode === "edit" ? (
          <TiptapEditor
            value={docSnapshot}
            onChange={onDocChange}
            label={title || t("defaultTitle")}
            showToolbar={showToolbar}
            notion
            showStats
            extensions={PAGE_EXTENSIONS}
            insertItems={insertItems}
            contentClassName="min-h-[26rem] text-[15px] leading-relaxed"
          />
        ) : (
          <TiptapContent
            content={docSnapshot}
            extensions={PAGE_EXTENSIONS}
            className="px-1 py-2 text-[15px] leading-relaxed"
          />
        )}
      </div>
    </div>
  );
}
