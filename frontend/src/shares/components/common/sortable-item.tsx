"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { cn } from "cn";

import type { SortableRenderState } from "./sortable-list";

export interface SortableItemProps<T> {
  id: string;
  item: T;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  dragHandlePosition: "left" | "right" | "custom";
  itemClassName?: string;
  onMove: (from: number, to: number) => void;
  renderItem: (item: T, state: SortableRenderState) => React.ReactNode;
}

/**
 * Phần tử con trong danh sách kéo thả sắp xếp thứ tự SortableList.
 * Tích hợp hook useSortable của thư viện @dnd-kit để cung cấp animation chuyển động mượt mà,
 * trạng thái đang kéo, và điều khiển kéo thả qua pointer/touch/keyboard.
 */
export function SortableItem<T>({
  id,
  item,
  index,
  isFirst,
  isLast,
  disabled,
  dragHandlePosition,
  itemClassName,
  onMove,
  renderItem,
}: SortableItemProps<T>) {
  const t = useTranslations("common.sortable");
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const moveUp = () => onMove(index, index - 1);
  const moveDown = () => onMove(index, index + 1);

  const dragHandleProps: SortableRenderState["dragHandleProps"] = {
    ref: setActivatorNodeRef,
    ...attributes,
    ...listeners,
    className: cn(
      "cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground touch-none select-none transition-colors p-1 rounded-md hover:bg-muted shrink-0",
      disabled && "cursor-not-allowed opacity-40",
    ),
    "aria-label": t("dragAriaLabel"),
    role: "button",
    tabIndex: 0,
  };

  const handleElement = (
    <div
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "text-muted-foreground/60 hover:text-foreground hover:bg-muted shrink-0 cursor-grab touch-none rounded-md p-1 transition-colors select-none active:cursor-grabbing",
        dragHandlePosition === "left" ? "mr-2.5" : "ml-2.5",
        disabled && "cursor-not-allowed opacity-40",
      )}
      aria-label={t("dragAriaLabel")}
      role="button"
      tabIndex={0}
    >
      <GripVertical className="size-4" />
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/sortable relative flex items-center transition-shadow",
        isDragging && "ring-primary/40 rounded-xl opacity-60 shadow-lg ring-2",
        isOver && "ring-primary/30 rounded-xl ring-2",
        itemClassName,
      )}
    >
      {dragHandlePosition === "left" && handleElement}

      <div className="min-w-0 flex-1">
        {renderItem(item, {
          index,
          isDragging,
          isOver,
          isFirst,
          isLast,
          moveUp,
          moveDown,
          dragHandleProps,
        })}
      </div>

      {dragHandlePosition === "right" && handleElement}
    </div>
  );
}
