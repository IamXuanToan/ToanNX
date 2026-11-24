"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import React, { useId, useMemo } from "react";

import { SortableItem } from "./sortable-item";

/**
 * Di chuyển phần tử trong mảng từ vị trí cũ sang vị trí mới.
 *
 * @param list - Mảng nguồn.
 * @param startIndex - Vị trí ban đầu.
 * @param endIndex - Vị trí đích.
 * @returns Mảng mới đã được sắp xếp lại.
 */
export function reorderArray<T>(list: T[], startIndex: number, endIndex: number): T[] {
  if (startIndex === endIndex) return list;
  if (startIndex < 0 || endIndex < 0 || startIndex >= list.length || endIndex >= list.length) {
    return list;
  }
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  if (removed === undefined) return list;
  result.splice(endIndex, 0, removed);
  return result;
}

export interface SortableRenderState {
  index: number;
  isDragging: boolean;
  isOver: boolean;
  isFirst: boolean;
  isLast: boolean;
  moveUp: () => void;
  moveDown: () => void;
  dragHandleProps: {
    ref?: (element: HTMLElement | null) => void;
    className?: string;
    "aria-label"?: string;
    role?: string;
    tabIndex?: number;
    [key: string]: unknown;
  };
}

export interface SortableListProps<T> {
  items: T[];
  onReorder: (newItems: T[]) => void;
  keyExtractor?: (item: T, index: number) => string;
  renderItem: (item: T, state: SortableRenderState) => React.ReactNode;
  disabled?: boolean;
  className?: string;
  itemClassName?: string;
  dragHandlePosition?: "left" | "right" | "custom";
}

/**
 * Danh sách kéo thả sắp xếp thứ tự (Drag and Drop Reorderable List) chuẩn hóa dùng chung toàn hệ thống.
 * Sử dụng thư viện @dnd-kit chuyên dụng với thuật toán rectSortingStrategy hỗ trợ mượt mà cả danh sách dọc,
 * danh sách ngang và dạng lưới (grid / flex-wrap).
 * Tối ưu cảm ứng trên thiết bị di động với PointerSensor khoảng cách 5px tránh chạm nhầm,
 * hỗ trợ trợ năng bàn phím (KeyboardSensor).
 */
export function SortableList<T>({
  items,
  onReorder,
  keyExtractor = (item: T, index: number) =>
    (item as { id?: string })?.id ?? `sortable-item-${index}`,
  renderItem,
  disabled = false,
  className = "space-y-2",
  itemClassName,
  dragHandlePosition = "left",
}: SortableListProps<T>) {
  const dndId = useId();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const itemIds = useMemo(() => {
    return items.map((item, index) => {
      const key = keyExtractor(item, index);
      return key ? String(key) : `sortable-item-${index}`;
    });
  }, [items, keyExtractor]);

  const handleMove = (from: number, to: number) => {
    if (disabled || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
    const reordered = reorderArray(items, from, to);
    onReorder(reordered);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || disabled) return;

    const oldIndex = itemIds.indexOf(String(active.id));
    const newIndex = itemIds.indexOf(String(over.id));

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(items, oldIndex, newIndex);
      onReorder(reordered);
    }
  };

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <div className={className}>
          {items.map((item, index) => {
            const id = itemIds[index] ?? `sortable-item-${index}`;
            const isFirst = index === 0;
            const isLast = index === items.length - 1;

            return (
              <SortableItem
                key={id}
                id={id}
                item={item}
                index={index}
                isFirst={isFirst}
                isLast={isLast}
                disabled={disabled}
                dragHandlePosition={dragHandlePosition}
                itemClassName={itemClassName}
                onMove={handleMove}
                renderItem={renderItem}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
