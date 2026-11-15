"use client";

import { getCoreRowModel, type RowSelectionState, useReactTable } from "@tanstack/react-table";
import { useState } from "react";
import { useStoredPreference } from "@/shares/hooks/use-stored-preference";

import type { ColumnPin } from "../components/table-header-cell";
import type { DataTableColumn, DataTableProps } from "../types";

const EMPTY_ROWS: never[] = [];

type PinnedColumns = { left: string[]; right: string[] };
const NO_PINS: PinnedColumns = { left: [], right: [] };

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");
const isPinned = (value: unknown): value is PinnedColumns =>
  typeof value === "object" &&
  value !== null &&
  isStringArray((value as PinnedColumns).left) &&
  isStringArray((value as PinnedColumns).right);

/**
 * State nội bộ của `DataTable`: chọn dòng (TanStack Table), cột ẩn/hiện và cột ghim (nhớ theo
 * `tableId`), dòng đang chờ xác nhận xoá. Dữ liệu mới thì chỉ giữ lựa chọn của dòng còn hiển thị.
 *
 * @param props - Props của `DataTable`.
 * @returns Bảng TanStack, dòng đã chọn, cột theo thứ tự hiển thị, state ghim và xác nhận xoá.
 */
export function useDataTable<T>({
  tableId,
  columns,
  rows,
  getRowId,
  canSelectRow,
  onBulkDelete,
  bulkStatus,
  bulkActions,
}: Pick<
  DataTableProps<T>,
  | "tableId"
  | "columns"
  | "rows"
  | "getRowId"
  | "canSelectRow"
  | "onBulkDelete"
  | "bulkStatus"
  | "bulkActions"
>) {
  const hiddenKey = `data-table:${tableId}:hidden-columns`;
  const pinnedKey = `data-table:${tableId}:pinned-columns`;
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [prevRows, setPrevRows] = useState(rows);
  const [hiddenIds, updateHidden] = useStoredPreference(hiddenKey, [], isStringArray);
  const [pins, updatePins] = useStoredPreference(pinnedKey, NO_PINS, isPinned);
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dữ liệu mới (đổi trang, tìm, sắp xếp, tải lại): chỉ giữ lựa chọn của dòng còn hiển thị,
  // để không thao tác nhầm dòng đã khuất mà refetch nền cũng không xoá mất lựa chọn.
  if (prevRows !== rows) {
    setPrevRows(rows);
    const visible = new Set((rows ?? []).map(getRowId));
    const kept = Object.fromEntries(
      Object.entries(rowSelection).filter(([id, selected]) => selected && visible.has(id)),
    );
    if (Object.keys(kept).length !== Object.keys(rowSelection).length) setRowSelection(kept);
  }

  const selectable = Boolean(onBulkDelete || bulkStatus || bulkActions?.length);

  // TanStack Table trả về handler không memo hoá; React Compiler tự bỏ qua hook này.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<T>({
    data: rows ?? EMPTY_ROWS,
    columns: [{ id: "__row" }],
    getCoreRowModel: getCoreRowModel(),
    getRowId,
    enableRowSelection: (row) => selectable && (canSelectRow?.(row.original) ?? true),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  });

  const isHideable = (column: DataTableColumn<T>) =>
    column.enableHiding ?? column.mobile !== "title";
  const shown = columns.filter((column) => !(isHideable(column) && hiddenIds.includes(column.id)));
  const byId = new Map(shown.map((column) => [column.id, column]));
  const pick = (ids: string[]) =>
    ids.map((id) => byId.get(id)).filter((column): column is DataTableColumn<T> => !!column);
  const leftColumns = pick([...new Set(pins.left)]).filter(
    (column) => column.enablePinning !== false,
  );
  const leftIds = new Set(leftColumns.map((column) => column.id));
  const rightColumns = pick([...new Set(pins.right)]).filter(
    (column) => column.enablePinning !== false && !leftIds.has(column.id),
  );
  const rightIds = new Set(rightColumns.map((column) => column.id));
  const pinnedIds = new Set([...leftIds, ...rightIds]);

  const pinOf = (id: string): ColumnPin =>
    leftIds.has(id) ? "left" : rightIds.has(id) ? "right" : false;

  return {
    table,
    selectable,
    selectedRows: table.getSelectedRowModel().rows.map((row) => row.original),
    clearSelection: () => setRowSelection({}),
    /** Cột hiển thị theo thứ tự: ghim trái → cột thường → ghim phải. */
    visibleColumns: [
      ...leftColumns,
      ...shown.filter((column) => !pinnedIds.has(column.id)),
      ...rightColumns,
    ],
    hideableColumns: columns
      .filter(isHideable)
      .map((column) => ({ id: column.id, label: column.header })),
    isColumnVisible: (id: string) => !hiddenIds.includes(id),
    setColumnVisible: (id: string, visible: boolean) =>
      updateHidden(visible ? hiddenIds.filter((item) => item !== id) : [...hiddenIds, id]),
    showAllColumns: () => updateHidden([]),
    pinOf,
    /**
     * Ghim/bỏ ghim một cột.
     *
     * @param id - Id cột.
     * @param pin - `left`, `right` hoặc `false` (bỏ ghim).
     */
    setColumnPin: (id: string, pin: ColumnPin) => {
      const next = {
        left: pins.left.filter((item) => item !== id),
        right: pins.right.filter((item) => item !== id),
      };
      if (pin === "left") next.left.push(id);
      if (pin === "right") next.right.unshift(id);
      updatePins(next);
    },
    pendingDelete,
    requestDelete: (row: T) => setPendingDelete(row),
    cancelDelete: () => !isDeleting && setPendingDelete(null),
    isDeleting,
    /**
     * Chạy xoá dòng đang chờ xác nhận rồi đóng hộp thoại.
     *
     * @param onDelete - Callback xoá của trang.
     */
    confirmDelete: async (onDelete: (row: T) => unknown) => {
      if (!pendingDelete) return;
      setIsDeleting(true);
      try {
        await onDelete(pendingDelete);
        setPendingDelete(null);
      } finally {
        setIsDeleting(false);
      }
    },
  };
}
