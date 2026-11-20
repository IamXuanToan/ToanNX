"use client";

import { type CSSProperties, type KeyboardEvent, type PointerEvent, type RefObject, useLayoutEffect, useRef, useState } from "react";

import { useMediaQuery } from "@/shares/hooks/use-media-query";
import { useStoredPreference } from "@/shares/hooks/use-stored-preference";

import type { DataTableColumn } from "../data-table.types";

const MIN_WIDTH = 96;
const MAX_WIDTH = 1200;
const KEY_STEP = 10;
const LARGE_KEY_STEP = 50;
type Widths = Record<string, number>;
const NO_WIDTHS: Widths = {};
type Drag = {
  id: string;
  pointerId: number;
  startX: number;
  startWidth: number;
  min: number;
  max: number;
  direction: number;
  original: Widths;
  latest: Widths;
  target: HTMLDivElement;
};

/** @param value - Cấu hình từ storage. @returns Chỉ nhận các độ rộng hữu hạn, dương. */
export function isColumnWidths(value: unknown): value is Widths {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(
      (width) => typeof width === "number" && Number.isFinite(width) && width > 0,
    )
  );
}

/**
 * Resize cột bằng pointer/bàn phím, lưu theo bảng và giữ nguyên bố cục card mobile.
 * Đo kích thước tự nhiên trước khi chuyển sang table-layout fixed để nội dung không đẩy ngược tay kéo.
 *
 * @param tableId - Khóa bảng.
 * @param tableRef - Phần tử bảng cần đo.
 * @param columns - Cột dữ liệu theo thứ tự đang hiển thị.
 * @param leftUtilities - Cột dựng sẵn bên trái.
 * @param rightUtilities - Cột dựng sẵn bên phải.
 * @param ready - Bảng đã có dữ liệu thật để đo kích thước tự nhiên.
 * @returns Độ rộng cột, style bảng và handler của tay nắm.
 */
export function useColumnResizing<T>(
  tableId: string,
  tableRef: RefObject<HTMLTableElement | null>,
  columns: DataTableColumn<T>[],
  leftUtilities: string[],
  rightUtilities: string[],
  ready: boolean,
) {
  const desktop = useMediaQuery("(min-width: 768px)");
  const large = useMediaQuery("(min-width: 1024px)");
  const extraLarge = useMediaQuery("(min-width: 1280px)");
  const [saved, save] = useStoredPreference(
    `data-table:${tableId}:column-widths`,
    NO_WIDTHS,
    isColumnWidths,
  );
  const [draft, setDraft] = useState<Widths | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [natural, setNatural] = useState<Widths>(NO_WIDTHS);
  const drag = useRef<Drag | null>(null);
  const widths = draft ?? saved;
  const customized = Object.keys(widths).length > 0;
  const displayed = columns.filter(
    (column) => !column.hideBelow || (column.hideBelow === "lg" ? large : extraLarge),
  );
  const ids = [...leftUtilities, ...displayed.map((column) => column.id), ...rightUtilities];
  const signature = ids.join("|");

  const readWidths = () => {
    const result: Widths = {};
    tableRef.current
      ?.querySelectorAll<HTMLTableCellElement>("thead th[data-col]")
      .forEach((cell) => {
        const width = cell.getBoundingClientRect().width;
        if (width > 0 && cell.dataset.col) result[cell.dataset.col] = width;
      });
    return result;
  };

  useLayoutEffect(() => {
    const element = tableRef.current;
    if (!element || !desktop || !ready) return;
    const measure = () => {
      const measured: Widths = {};
      element.querySelectorAll<HTMLTableCellElement>("thead th[data-col]").forEach((cell) => {
        const width = cell.getBoundingClientRect().width;
        if (width > 0 && cell.dataset.col) measured[cell.dataset.col] = width;
      });
      setNatural((current) => {
        const next = { ...current };
        for (const [id, width] of Object.entries(measured)) {
          if (!customized || next[id] === undefined) next[id] = width;
        }
        return JSON.stringify(current) === JSON.stringify(next) ? current : next;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    element.querySelectorAll("thead th").forEach((cell) => observer.observe(cell));
    return () => observer.disconnect();
  }, [tableRef, signature, desktop, customized, ready]);

  const limits = (column: DataTableColumn<T>) => {
    const requestedMin = column.minWidth ?? MIN_WIDTH;
    const requestedMax = column.maxWidth ?? MAX_WIDTH;
    const min = Number.isFinite(requestedMin) && requestedMin > 0 ? requestedMin : MIN_WIDTH;
    const max =
      Number.isFinite(requestedMax) && requestedMax >= min
        ? requestedMax
        : Math.max(min, MAX_WIDTH);
    return { min, max };
  };
  const clamp = (width: number, min: number, max: number) =>
    Math.min(max, Math.max(min, Math.round(width)));
  const widthOf = (id: string) => {
    const column = columns.find((item) => item.id === id);
    if (column && column.enableResizing !== false && widths[id] !== undefined) {
      const { min, max } = limits(column);
      return clamp(widths[id], min, max);
    }
    return natural[id] ?? MIN_WIDTH;
  };
  const fixed = desktop && ready && customized && ids.every((id) => natural[id] !== undefined);
  const finish = (commit: boolean) => {
    const current = drag.current;
    if (!current) return;
    drag.current = null;
    if (commit) save(current.latest);
    setDraft(null);
    setActiveId(null);
    if (current.target.hasPointerCapture(current.pointerId)) {
      current.target.releasePointerCapture(current.pointerId);
    }
  };

  return {
    fixed,
    customized: Object.keys(saved).length > 0,
    ids,
    widthOf,
    tableStyle: fixed
      ? ({
          "--data-table-width": `${ids.reduce((sum, id) => sum + widthOf(id), 0)}px`,
        } as CSSProperties)
      : undefined,
    resetAll: () => {
      finish(false);
      save(NO_WIDTHS);
    },
    handle: (column: DataTableColumn<T>, rightPinned = false) => {
      const { min, max } = limits(column);
      // Cột ghim phải nới về trái để tay nắm di chuyển đúng hướng con trỏ.
      const direction = rightPinned ? -1 : 1;
      return {
        edge: rightPinned ? ("left" as const) : ("right" as const),
        min,
        max,
        value: clamp(widthOf(column.id), min, max),
        active: activeId === column.id,
        onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
          if (event.button !== 0 || !event.isPrimary || drag.current) return;
          event.preventDefault();
          event.stopPropagation();
          const measured = readWidths();
          const startWidth = measured[column.id];
          if (!startWidth) return;
          if (!customized) setNatural(measured);
          const latest = { ...saved, [column.id]: clamp(startWidth, min, max) };
          drag.current = {
            id: column.id,
            pointerId: event.pointerId,
            startX: event.clientX,
            startWidth,
            min,
            max,
            direction,
            original: saved,
            latest,
            target: event.currentTarget,
          };
          setDraft(latest);
          setActiveId(column.id);
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
        },
        onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
          const current = drag.current;
          if (!current || current.pointerId !== event.pointerId) return;
          event.preventDefault();
          current.latest = {
            ...current.original,
            [current.id]: clamp(
              current.startWidth + (event.clientX - current.startX) * current.direction,
              current.min,
              current.max,
            ),
          };
          setDraft(current.latest);
        },
        onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
          if (drag.current?.pointerId === event.pointerId) finish(true);
        },
        onPointerCancel: (event: PointerEvent<HTMLDivElement>) => {
          if (drag.current?.pointerId === event.pointerId) finish(false);
        },
        onLostPointerCapture: () => finish(false),
        onDoubleClick: () => {
          const next = { ...saved };
          delete next[column.id];
          save(next);
        },
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === "Escape") {
            if (drag.current) {
              event.preventDefault();
              event.stopPropagation();
            }
            finish(false);
            return;
          }
          const current = readWidths()[column.id] ?? widthOf(column.id);
          const step = event.shiftKey ? LARGE_KEY_STEP : KEY_STEP;
          const next =
            event.key === "ArrowLeft"
              ? current - step * direction
              : event.key === "ArrowRight"
                ? current + step * direction
                : event.key === "Home"
                  ? min
                  : event.key === "End"
                    ? max
                    : null;
          if (next === null) return;
          event.preventDefault();
          event.stopPropagation();
          if (!customized) setNatural(readWidths());
          save({ ...saved, [column.id]: clamp(next, min, max) });
        },
      };
    },
  };
}
