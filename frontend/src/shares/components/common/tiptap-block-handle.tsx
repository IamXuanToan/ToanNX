"use client";

import {
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Pilcrow,
  Plus,
  Quote,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { PointerEvent as ReactPointerEvent } from "react";

import { cn } from "cn";
import { Button } from "@/shares/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shares/components/ui/dropdown-menu";

import type { TiptapDragBlockState, TiptapHoveredBlockInfo } from "./hooks/use-tiptap-block-handle";

/**
 * Thanh điều khiển lề trái từng khối (`+` chèn khối và `⠿` kéo thả sắp xếp dòng hoặc bấm mở menu)
 * dùng chung cho mọi editor bật chế độ Notion-like.
 */
export function TiptapBlockHandle({
  hoveredBlock,
  dragState,
  menuOpen,
  onMenuOpenChange,
  onGripPointerDown,
  onGripPointerMove,
  onGripPointerUp,
  onGripPointerCancel,
  onAddBelow,
  onMove,
  onDuplicate,
  onDelete,
  onTurnInto,
}: {
  hoveredBlock: TiptapHoveredBlockInfo | null;
  dragState: TiptapDragBlockState | null;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onGripPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onGripPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onGripPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onGripPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onAddBelow: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
  onTurnInto: (
    index: number,
    kind: "paragraph" | "h1" | "h2" | "h3" | "bulletList" | "orderedList" | "blockquote",
  ) => void;
}) {
  const t = useTranslations("common.editor");

  return (
    <>
      {/* Khung đánh dấu khối nguồn & đường kẻ ngang vị trí thả khi kéo dòng */}
      {dragState ? (
        <>
          <div
            aria-hidden
            style={{ top: dragState.sourceTop, height: dragState.sourceHeight }}
            className="border-primary/40 bg-primary/5 pointer-events-none absolute right-3 left-11 z-10 rounded-lg border border-dashed sm:left-14"
          />
          <div
            aria-hidden
            data-testid="tiptap-drop-indicator"
            style={{ top: dragState.indicatorTop }}
            className="pointer-events-none absolute right-3 left-10 z-30 flex items-center sm:left-12"
          >
            <span className="bg-primary size-2 shrink-0 rounded-full shadow-xs" />
            <span className="bg-primary h-0.5 flex-1 rounded-full shadow-xs" />
          </div>
        </>
      ) : null}

      {hoveredBlock ? (
        <div
          style={{ top: hoveredBlock.top }}
          onMouseDown={(event) => event.stopPropagation()}
          className="absolute left-1 z-20 flex items-center gap-0.5 transition-[top] duration-75"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={t("addBlockHint")}
            title={t("addBlockHint")}
            onClick={() => onAddBelow(hoveredBlock.index)}
            className="text-muted-foreground hover:text-foreground size-6 rounded-md"
          >
            <Plus className="size-3.5" />
          </Button>

          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              data-testid="tiptap-block-grip"
              aria-label={t("dragHandleHint")}
              title={t("dragHandleHint")}
              onPointerDown={onGripPointerDown}
              onPointerMove={onGripPointerMove}
              onPointerUp={onGripPointerUp}
              onPointerCancel={onGripPointerCancel}
              className={cn(
                "text-muted-foreground hover:text-foreground size-6 cursor-grab touch-none rounded-md active:cursor-grabbing",
                dragState && "bg-primary/15 text-primary",
              )}
            >
              <GripVertical className="size-3.5" />
            </Button>

            {/* Trigger ẩn neo chính xác vào vị trí nút ⠿ để giữ pointerDown riêng cho thao tác kéo */}
            <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
              <DropdownMenuTrigger asChild>
                <span aria-hidden className="pointer-events-none absolute inset-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 rounded-xl p-1">
                <DropdownMenuItem
                  disabled={hoveredBlock.index === 0}
                  onSelect={() => onMove(hoveredBlock.index, -1)}
                  className="rounded-lg text-xs"
                >
                  <ArrowUp className="size-3.5" />
                  {t("moveUp")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={hoveredBlock.index >= hoveredBlock.totalBlocks - 1}
                  onSelect={() => onMove(hoveredBlock.index, 1)}
                  className="rounded-lg text-xs"
                >
                  <ArrowDown className="size-3.5" />
                  {t("moveDown")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => onDuplicate(hoveredBlock.index)}
                  className="rounded-lg text-xs"
                >
                  <Copy className="size-3.5" />
                  {t("duplicateBlock")}
                </DropdownMenuItem>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="rounded-lg text-xs">
                    <Pilcrow className="size-3.5" />
                    {t("turnInto")}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-44 rounded-xl p-1">
                    <DropdownMenuItem
                      onSelect={() => onTurnInto(hoveredBlock.index, "paragraph")}
                      className="rounded-lg text-xs"
                    >
                      <Pilcrow className="size-3.5" />
                      {t("paragraph")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => onTurnInto(hoveredBlock.index, "h1")}
                      className="rounded-lg text-xs"
                    >
                      <Heading1 className="size-3.5" />
                      {t("heading1")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => onTurnInto(hoveredBlock.index, "h2")}
                      className="rounded-lg text-xs"
                    >
                      <Heading2 className="size-3.5" />
                      {t("heading2")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => onTurnInto(hoveredBlock.index, "bulletList")}
                      className="rounded-lg text-xs"
                    >
                      <List className="size-3.5" />
                      {t("bulletList")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => onTurnInto(hoveredBlock.index, "orderedList")}
                      className="rounded-lg text-xs"
                    >
                      <ListOrdered className="size-3.5" />
                      {t("orderedList")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => onTurnInto(hoveredBlock.index, "blockquote")}
                      className="rounded-lg text-xs"
                    >
                      <Quote className="size-3.5" />
                      {t("quote")}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onDelete(hoveredBlock.index)}
                  className="rounded-lg text-xs"
                >
                  <Trash2 className="size-3.5" />
                  {t("deleteBlock")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ) : null}
    </>
  );
}
