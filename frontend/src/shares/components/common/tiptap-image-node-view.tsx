"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { cn } from "cn";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Captions,
  ImageOff,
  Maximize2,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shares/components/ui/popover";
import { Separator } from "@/shares/components/ui/separator";

import {
  formatTiptapImageWidth,
  getTiptapImageWrapperAlignClass,
  TIPTAP_IMAGE_WIDTH_PRESETS,
} from "./tiptap-extensions";
import { useTiptapImageNode } from "./hooks/use-tiptap-image-node";

/**
 * NodeView ảnh tương tác cho Tiptap (hỗ trợ cả ảnh từ Thư viện lẫn URL ngoài):
 * - Bấm chọn để hiện thanh nổi căn lề (trái, giữa, phải, toàn rộng) và mức kích thước nhanh (25%–100%).
 * - Kéo hai thanh nắm cạnh trái/phải để phóng to / thu nhỏ mượt mà trên cả chuột và cảm ứng.
 * - Sửa nhanh mô tả (Alt) hoặc xóa ảnh ngay trên thanh nổi.
 */
export function TiptapImageNodeView(props: NodeViewProps) {
  const t = useTranslations("common.editor");
  const {
    src,
    alt,
    align,
    rawAlign,
    widthAttr,
    draftPercent,
    isDragging,
    selected,
    editable,
    imgFailed,
    markFailed,
    altOpen,
    setAltOpen,
    altDraft,
    setAltDraft,
    handleSaveAlt,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
    handleSetAlign,
    handleSetWidthPreset,
    handleDelete,
  } = useTiptapImageNode(props);

  const effectiveWidth =
    draftPercent !== null ? `${draftPercent}%` : formatTiptapImageWidth(widthAttr, rawAlign);
  const showControls = editable && (selected || isDragging || altOpen);

  return (
    <NodeViewWrapper
      className={cn(
        "group/tiptap-img relative my-3 flex w-full select-none",
        getTiptapImageWrapperAlignClass(rawAlign),
      )}
      data-align={rawAlign ?? undefined}
    >
      {/* Thanh thao tác nổi căn giữa theo hàng ngang để không bị bóp hẹp khi ảnh thu nhỏ */}
      {showControls ? (
        <div
          contentEditable={false}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          role="toolbar"
          aria-label={t("resizeImage")}
          className="bg-popover/95 border-border/80 animate-in fade-in-0 zoom-in-95 absolute bottom-full left-1/2 z-10 mb-2 flex w-max max-w-[calc(100%-0.5rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-0.5 rounded-xl border p-1 shadow-lg backdrop-blur-md duration-150"
        >
          <Button
            type="button"
            size="icon-xs"
            variant={align === "left" ? "secondary" : "ghost"}
            onClick={() => handleSetAlign("left")}
            aria-label={t("alignLeft")}
            title={t("alignLeft")}
            className="rounded-lg"
          >
            <AlignLeft className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-xs"
            variant={align === "center" ? "secondary" : "ghost"}
            onClick={() => handleSetAlign("center")}
            aria-label={t("alignCenter")}
            title={t("alignCenter")}
            className="rounded-lg"
          >
            <AlignCenter className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-xs"
            variant={align === "right" ? "secondary" : "ghost"}
            onClick={() => handleSetAlign("right")}
            aria-label={t("alignRight")}
            title={t("alignRight")}
            className="rounded-lg"
          >
            <AlignRight className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-xs"
            variant={align === "full" ? "secondary" : "ghost"}
            onClick={() => handleSetAlign("full")}
            aria-label={t("alignFull")}
            title={t("alignFull")}
            className="rounded-lg"
          >
            <Maximize2 className="size-3.5" />
          </Button>

          <Separator orientation="vertical" className="mx-0.5 h-4" />

          {TIPTAP_IMAGE_WIDTH_PRESETS.map((preset) => {
            const active = effectiveWidth === preset;
            return (
              <Button
                key={preset}
                type="button"
                size="xs"
                variant={active ? "secondary" : "ghost"}
                onClick={() => handleSetWidthPreset(preset)}
                className={cn(
                  "h-6 rounded-lg px-1.5 text-[11px] font-medium tabular-nums",
                  active && "text-primary font-semibold",
                )}
              >
                {preset}
              </Button>
            );
          })}

          <Separator orientation="vertical" className="mx-0.5 h-4" />

          <Popover open={altOpen} onOpenChange={setAltOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                size="icon-xs"
                variant={alt ? "secondary" : "ghost"}
                aria-label={t("imageAlt")}
                title={t("imageAlt")}
                className="rounded-lg"
              >
                <Captions className="size-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-72 space-y-2 rounded-xl"
              align="center"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <p className="text-xs font-medium">{t("imageAlt")}</p>
              <div className="flex gap-2">
                <Input
                  value={altDraft}
                  onChange={(event) => setAltDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.stopPropagation();
                      handleSaveAlt();
                    }
                  }}
                  placeholder={t("imageAltPlaceholder")}
                  maxLength={300}
                  className="h-8 text-xs"
                />
                <Button type="button" size="sm" onClick={handleSaveAlt} className="h-8 shrink-0">
                  {t("apply")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            onClick={handleDelete}
            aria-label={t("deleteImage")}
            title={t("deleteImage")}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ) : null}

      {/* Khung chứa ảnh + hai thanh nắm kéo kích thước */}
      <figure
        style={effectiveWidth ? { width: effectiveWidth } : undefined}
        className={cn(
          "relative max-w-full rounded-xl transition-shadow",
          !effectiveWidth && "w-auto",
          editable && "cursor-pointer",
          selected && editable && "ring-primary ring-2 ring-offset-2",
        )}
      >
        {src && !imgFailed ? (
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={800}
            unoptimized
            draggable={false}
            onError={markFailed}
            style={{ width: effectiveWidth ? "100%" : "auto", height: "auto" }}
            className="block max-w-full rounded-xl select-none"
          />
        ) : (
          <div className="bg-muted/60 text-muted-foreground flex min-h-36 min-w-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-8 text-xs">
            <ImageOff className="size-6 opacity-70" />
            <span>{t("imageUnavailable")}</span>
          </div>
        )}

        {/* Huy hiệu % kích thước trực tiếp khi kéo */}
        {draftPercent !== null ? (
          <span className="bg-foreground/85 text-background pointer-events-none absolute right-2 bottom-2 z-10 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums shadow-sm">
            {draftPercent}%
          </span>
        ) : null}

        {/* Thanh nắm kéo trái & phải */}
        {editable ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={t("resizeImage")}
              onPointerDown={handleResizeStart("left")}
              onPointerMove={handleResizeMove}
              onPointerUp={handleResizeEnd}
              onPointerCancel={handleResizeEnd}
              className={cn(
                "bg-background/90 border-border hover:bg-primary hover:border-primary absolute top-1/2 left-1.5 z-10 h-10 w-2.5 -translate-y-1/2 cursor-ew-resize touch-none rounded-full border p-0 shadow-sm transition-opacity",
                selected || isDragging
                  ? "opacity-100"
                  : "opacity-0 group-hover/tiptap-img:opacity-90",
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={t("resizeImage")}
              onPointerDown={handleResizeStart("right")}
              onPointerMove={handleResizeMove}
              onPointerUp={handleResizeEnd}
              onPointerCancel={handleResizeEnd}
              className={cn(
                "bg-background/90 border-border hover:bg-primary hover:border-primary absolute top-1/2 right-1.5 z-10 h-10 w-2.5 -translate-y-1/2 cursor-ew-resize touch-none rounded-full border p-0 shadow-sm transition-opacity",
                selected || isDragging
                  ? "opacity-100"
                  : "opacity-0 group-hover/tiptap-img:opacity-90",
              )}
            />
          </>
        ) : null}

        {alt ? (
          <figcaption className="text-muted-foreground mt-1.5 truncate px-1 text-center text-xs">
            {alt}
          </figcaption>
        ) : null}
      </figure>
    </NodeViewWrapper>
  );
}
