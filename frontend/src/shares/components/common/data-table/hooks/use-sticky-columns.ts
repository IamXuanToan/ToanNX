"use client";

import { type CSSProperties, type RefObject, useLayoutEffect, useState } from "react";

/**
 * Vị trí dính (`left`/`right`) của các cột ghim, tính từ bề rộng thật của `<th>` (đánh dấu
 * `data-col`). Đo lại khi bảng đổi kích thước hoặc danh sách cột ghim đổi.
 *
 * @param tableRef - Bảng.
 * @param left - Id cột ghim trái theo thứ tự (gồm cột dựng sẵn).
 * @param right - Id cột ghim phải theo thứ tự (gồm cột dựng sẵn).
 * @param present - Bảng đang tồn tại; đăng ký lại observer sau trạng thái lỗi/rỗng.
 * @returns Hàm lấy style dính cho một cột (không ghim thì `undefined`).
 */
export function useStickyColumns(
  tableRef: RefObject<HTMLTableElement | null>,
  left: string[],
  right: string[],
  present = true,
) {
  const [widths, setWidths] = useState<Record<string, number>>({});
  const signature = `${left.join(",")}|${right.join(",")}`;

  useLayoutEffect(() => {
    const table = tableRef.current;
    if (!table || !present) return;
    const measure = () => {
      const next: Record<string, number> = {};
      table.querySelectorAll<HTMLTableCellElement>("thead th[data-col]").forEach((cell) => {
        next[cell.dataset.col as string] = cell.getBoundingClientRect().width;
      });
      setWidths((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(table);
    table.querySelectorAll("thead th").forEach((cell) => observer.observe(cell));
    return () => observer.disconnect();
  }, [tableRef, signature, present]);

  return (id: string): CSSProperties | undefined => {
    const leftIndex = left.indexOf(id);
    if (leftIndex >= 0) {
      const offset = left.slice(0, leftIndex).reduce((sum, key) => sum + (widths[key] ?? 0), 0);
      return { left: offset };
    }
    const rightIndex = right.indexOf(id);
    if (rightIndex >= 0) {
      const offset = right.slice(rightIndex + 1).reduce((sum, key) => sum + (widths[key] ?? 0), 0);
      return { right: offset };
    }
    return undefined;
  };
}
