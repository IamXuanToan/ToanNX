"use client";

import type { Row } from "@tanstack/react-table";
import { cn } from "cn";
import { SearchX } from "lucide-react";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/shares/components/common/confirm-dialog";
import { DataPagination } from "@/shares/components/common/data-pagination";
import { EmptyState } from "@/shares/components/common/empty-state";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Button } from "@/shares/components/ui/button";
import { Card } from "@/shares/components/ui/card";
import { Checkbox } from "@/shares/components/ui/checkbox";
import { Skeleton } from "@/shares/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shares/components/ui/table";

import { TableBulkBar } from "./table-bulk-bar";
import { TableColumnResizer } from "./table-column-resizer";
import { ariaSort, TableHeaderCell } from "./table-header-cell";
import { TableRowActions } from "./table-row-actions";
import { TableToolbar } from "./table-toolbar";
import { useDataTable } from "./hooks/use-data-table";
import { useStickyColumns } from "./hooks/use-sticky-columns";
import { useColumnResizing } from "./hooks/use-column-resizing";
import type { DataTableColumn, DataTableProps } from "./data-table.types";

/** Id cột dựng sẵn (luôn ghim: chọn + # bên trái, Thao tác bên phải). */
const SELECT_COL = "__select";
const INDEX_COL = "__index";
const ACTIONS_COL = "__actions";
/** Khớp size-9 và gap-0.5 trong TableRowActions để cột dựng sẵn luôn đủ chỗ sau refetch. */
const ACTION_BUTTON_SIZE = 36;
const ACTION_BUTTON_GAP = 2;

const HIDE_BELOW_CLASS = { lg: "md:max-lg:hidden", xl: "md:max-xl:hidden" } as const;

const TH_CLASS =
  "text-muted-foreground relative h-11 border-b bg-card px-4 text-left align-middle text-xs font-medium whitespace-nowrap";
const TD_CLASS = "px-4 py-3 align-middle md:border-b md:whitespace-nowrap";
/** Ô dính: nền theo trạng thái dòng để nội dung cuộn bên dưới không lộ qua. */
const STICKY_TH = "md:sticky md:z-20";
const STICKY_TD =
  "md:sticky md:z-10 md:bg-card md:group-hover/row:bg-surface-hover md:group-data-[state=selected]/row:bg-primary-light";

/**
 * Bảng dữ liệu chuẩn của hệ thống (khuôn theo CommonDataTable):
 * toolbar (tìm, tải lại, ẩn/hiện cột), cột chọn + thanh thao tác hàng loạt (đổi trạng thái, xoá có
 * xác nhận), cột `#`, tiêu đề cột bấm để sắp xếp và **ghim cột** (trái/phải, dính khi cuộn ngang),
 * cột Thao tác gồm Sửa / Sao chép / Xoá + thao tác riêng (`rowActions`), trạng thái tải/lỗi/rỗng, phân trang.
 * Dưới `md` mỗi dòng là một card. State tìm/sắp xếp/phân trang lấy từ `useTableState` (đồng bộ URL).
 *
 * @param props - Xem `DataTableProps`.
 * @returns Bảng dữ liệu.
 */
export function DataTable<T>(props: DataTableProps<T>) {
  const {
    rows,
    getRowLabel,
    isLoading,
    isFetching,
    error,
    empty,
    search,
    ordering,
    onOrderingChange,
    pagination,
    onReload,
    toolbar,
    onClearFilters,
    onView,
    onEdit,
    onCopy,
    onDelete,
    can,
    canEditRow,
    canDeleteRow,
    rowActions,
    onBulkDelete,
    bulkStatus,
    bulkActions,
    showIndex = true,
    "aria-label": ariaLabel,
  } = props;
  const t = useTranslations("common.table");
  const state = useDataTable(props);
  const { table, selectable, selectedRows, visibleColumns, tableRef } = state;
  const hasActions = Boolean(onView || onEdit || onCopy || onDelete || rowActions?.length);
  const actionCount =
    Number(Boolean(onView)) +
    Number(Boolean(onEdit)) +
    Number(Boolean(onCopy)) +
    Number(Boolean(onDelete)) +
    (rowActions?.length ?? 0);
  const actionContentWidth =
    actionCount * ACTION_BUTTON_SIZE + Math.max(0, actionCount - 1) * ACTION_BUTTON_GAP;
  const tablePresent = !error && (isLoading || rows === undefined || rows.length > 0);
  const sizingReady = !error && !isLoading && rows !== undefined && rows.length > 0;
  const keyword = search?.value.trim() ?? "";
  const page = pagination?.value.page ?? 1;
  const pageSize = pagination?.value.pageSize ?? rows?.length ?? 0;
  const colSpan =
    visibleColumns.length + Number(selectable) + Number(showIndex) + Number(hasActions);

  const leftSticky = [
    ...(selectable ? [SELECT_COL] : []),
    ...(showIndex ? [INDEX_COL] : []),
    ...visibleColumns.filter((column) => state.pinOf(column.id) === "left").map((c) => c.id),
  ];
  const rightSticky = [
    ...visibleColumns.filter((column) => state.pinOf(column.id) === "right").map((c) => c.id),
    ...(hasActions ? [ACTIONS_COL] : []),
  ];
  const stickyStyle = useStickyColumns(tableRef, leftSticky, rightSticky, Boolean(tablePresent));
  const sizing = useColumnResizing(
    props.tableId,
    tableRef,
    visibleColumns,
    [...(selectable ? [SELECT_COL] : []), ...(showIndex ? [INDEX_COL] : [])],
    hasActions ? [ACTIONS_COL] : [],
    sizingReady,
  );
  const isSticky = (id: string) => leftSticky.includes(id) || rightSticky.includes(id);
  const edgeClass = (id: string) =>
    cn(
      id === leftSticky.at(-1) && "md:shadow-[inset_-1px_0_0_var(--color-border)]",
      id === rightSticky[0] && "md:shadow-[inset_1px_0_0_var(--color-border)]",
    );
  const thSticky = (id: string) => cn(isSticky(id) && STICKY_TH, edgeClass(id));
  const tdSticky = (id: string) => cn(isSticky(id) && STICKY_TD, edgeClass(id));

  const cellClass = (column: DataTableColumn<T>) =>
    cn(
      column.align === "end" && "md:text-right",
      column.hideBelow && HIDE_BELOW_CLASS[column.hideBelow],
      column.className,
    );
  const mobileClass = (column: DataTableColumn<T>) => {
    const role = column.mobile ?? "field";
    if (role === "title")
      return cn(
        "max-md:row-start-1 max-md:min-w-0",
        selectable ? "max-md:col-start-2" : "max-md:col-start-1",
      );
    if (role === "hidden") return "max-md:hidden";
    return "max-md:col-span-full max-md:flex max-md:min-h-6 max-md:items-center max-md:justify-between max-md:gap-3";
  };

  const renderRow = (row: Row<T>, index: number) => {
    const item = row.original;
    return (
      <TableRow
        key={row.id}
        data-state={row.getIsSelected() ? "selected" : undefined}
        onDoubleClick={() => (onView ?? onEdit)?.(item)}
        className={cn(
          "group/row md:hover:bg-surface-hover md:data-[state=selected]:bg-primary-light transition-colors",
          "max-md:bg-card max-md:data-[state=selected]:border-primary/40 max-md:grid max-md:items-start max-md:gap-x-3 max-md:gap-y-2.5 max-md:rounded-xl max-md:border max-md:p-4",
          selectable
            ? "max-md:grid-cols-[auto_minmax(0,1fr)_auto]"
            : "max-md:grid-cols-[minmax(0,1fr)_auto]",
        )}
      >
        {selectable ? (
          <TableCell
            style={stickyStyle(SELECT_COL)}
            className={cn(
              TD_CLASS,
              tdSticky(SELECT_COL),
              "pr-0 max-md:col-start-1 max-md:row-start-1 max-md:p-0 max-md:pt-0.5 md:w-12",
            )}
          >
            <Checkbox
              aria-label={t("selectRow")}
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onCheckedChange={(value) => row.toggleSelected(value === true)}
              onDoubleClick={(event) => event.stopPropagation()}
            />
          </TableCell>
        ) : null}
        {showIndex ? (
          <TableCell
            style={stickyStyle(INDEX_COL)}
            className={cn(
              TD_CLASS,
              tdSticky(INDEX_COL),
              "text-muted-foreground w-14 text-center text-xs tabular-nums max-md:hidden",
            )}
          >
            {(page - 1) * pageSize + index + 1}
          </TableCell>
        ) : null}
        {visibleColumns.map((column) => {
          const role = column.mobile ?? "field";
          return (
            <TableCell
              key={column.id}
              style={stickyStyle(column.id)}
              className={cn(
                TD_CLASS,
                tdSticky(column.id),
                cellClass(column),
                mobileClass(column),
                "max-md:p-0 max-md:whitespace-normal",
                sizing.fixed && "md:overflow-hidden md:text-ellipsis md:[&>*]:max-w-full",
              )}
            >
              {role === "field" ? (
                <span className="text-muted-foreground shrink-0 text-xs md:hidden">
                  {column.header}
                </span>
              ) : null}
              {column.cell(item)}
            </TableCell>
          );
        })}
        {hasActions ? (
          <TableCell
            style={stickyStyle(ACTIONS_COL)}
            className={cn(
              TD_CLASS,
              tdSticky(ACTIONS_COL),
              "py-2 text-right max-md:col-end-[-1] max-md:row-start-1 max-md:-my-1.5 max-md:p-0 md:w-px",
            )}
          >
            <TableRowActions
              row={item}
              onView={onView}
              onEdit={onEdit}
              onCopy={onCopy}
              onDelete={onDelete ? state.requestDelete : undefined}
              can={can}
              canEdit={canEditRow?.(item) ?? true}
              canDelete={canDeleteRow?.(item) ?? true}
              rowActions={rowActions}
            />
          </TableCell>
        ) : null}
      </TableRow>
    );
  };

  const renderSkeleton = () =>
    Array.from({ length: Math.min(pageSize || 5, 8) }, (_, index) => (
      <TableRow
        key={index}
        aria-hidden
        className="max-md:bg-card max-md:block max-md:space-y-3 max-md:rounded-xl max-md:border max-md:p-4"
      >
        {Array.from({ length: colSpan }, (_, cell) => (
          <TableCell key={cell} className={cn(TD_CLASS, "max-md:block max-md:p-0")}>
            <Skeleton
              className={cn(
                "h-4",
                cell === Number(selectable) + Number(showIndex) ? "w-40" : "w-16",
              )}
            />
          </TableCell>
        ))}
      </TableRow>
    ));

  const renderBody = () => {
    if (error) {
      return (
        <Card className="rounded-xl">
          <ErrorState
            message={error.message}
            onRetry={error.onRetry}
            className="border-0 bg-transparent shadow-none"
          />
        </Card>
      );
    }
    if (!isLoading && rows?.length === 0) {
      return (
        <Card className="rounded-xl" data-testid="data-table-empty">
          {(keyword && search) || onClearFilters ? (
            <EmptyState
              icon={<SearchX />}
              title={keyword ? t("noResults", { keyword }) : t("noFilterResults")}
              action={
                <Button
                  variant="outline"
                  onClick={onClearFilters ?? (() => search?.onValueChange(""))}
                >
                  {onClearFilters ? t("clearFilters") : t("clearSearch")}
                </Button>
              }
            />
          ) : (
            <EmptyState
              title={empty?.title}
              description={empty?.description}
              action={empty?.action}
            />
          )}
        </Card>
      );
    }

    const pageRows = table.getRowModel().rows;
    return (
      <Card
        aria-busy={isFetching || undefined}
        className={cn(
          "shadow-none transition-opacity md:overflow-hidden md:rounded-xl",
          isFetching && "opacity-60",
        )}
      >
        <div className="md:overflow-x-auto">
          <Table
            ref={tableRef}
            aria-label={ariaLabel}
            style={sizing.tableStyle}
            className={cn(
              "w-full text-sm max-md:block",
              sizing.fixed && "md:w-(--data-table-width) md:table-fixed",
            )}
          >
            {sizing.fixed ? (
              <colgroup className="max-md:hidden">
                {sizing.ids.map((id) => (
                  <col key={id} style={{ width: sizing.widthOf(id) }} />
                ))}
              </colgroup>
            ) : null}
            <TableHeader className="max-md:hidden">
              <TableRow>
                {selectable ? (
                  <TableHead
                    data-col={SELECT_COL}
                    style={stickyStyle(SELECT_COL)}
                    className={cn(TH_CLASS, thSticky(SELECT_COL), "w-12 pr-0")}
                  >
                    <Checkbox
                      aria-label={t("selectAll")}
                      checked={
                        table.getIsAllPageRowsSelected()
                          ? true
                          : table.getIsSomePageRowsSelected()
                            ? "indeterminate"
                            : false
                      }
                      disabled={!pageRows.some((row) => row.getCanSelect())}
                      onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
                    />
                  </TableHead>
                ) : null}
                {showIndex ? (
                  <TableHead
                    data-col={INDEX_COL}
                    style={stickyStyle(INDEX_COL)}
                    className={cn(TH_CLASS, thSticky(INDEX_COL), "w-14 text-center")}
                  >
                    #
                  </TableHead>
                ) : null}
                {visibleColumns.map((column) => (
                  <TableHead
                    key={column.id}
                    data-col={column.id}
                    style={stickyStyle(column.id)}
                    aria-sort={ariaSort(column.sortKey, ordering)}
                    className={cn(TH_CLASS, thSticky(column.id), cellClass(column))}
                  >
                    <TableHeaderCell
                      label={column.header}
                      sortKey={column.sortKey}
                      ordering={ordering}
                      onOrderingChange={onOrderingChange}
                      align={column.align}
                      pin={state.pinOf(column.id)}
                      onPinChange={
                        column.enablePinning === false
                          ? undefined
                          : (pin) => state.setColumnPin(column.id, pin)
                      }
                    />
                    {sizingReady && column.enableResizing !== false ? (
                      <TableColumnResizer
                        label={column.header}
                        control={sizing.handle(column, state.pinOf(column.id) === "right")}
                      />
                    ) : null}
                  </TableHead>
                ))}
                {hasActions ? (
                  <TableHead
                    data-col={ACTIONS_COL}
                    style={stickyStyle(ACTIONS_COL)}
                    className={cn(TH_CLASS, thSticky(ACTIONS_COL), "w-px text-right")}
                  >
                    <span className="inline-block" style={{ minWidth: actionContentWidth }}>
                      {t("actions")}
                    </span>
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody className="max-md:flex max-md:flex-col max-md:gap-3 md:[&>tr:last-child>td]:border-b-0">
              {isLoading || !rows ? renderSkeleton() : pageRows.map(renderRow)}
            </TableBody>
          </Table>
        </div>
        {pagination && rows && rows.length > 0 ? (
          <DataPagination
            pagination={pagination.value}
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPageSizeChange}
            pageSizeOptions={pagination.pageSizeOptions}
            disabled={isFetching}
            className="max-md:pt-2 md:border-t md:px-4 md:py-3"
          />
        ) : null}
      </Card>
    );
  };

  return (
    <div className="space-y-4" data-testid={`data-table-${props.tableId}`}>
      {selectedRows.length ? (
        <TableBulkBar
          selectedRows={selectedRows}
          onClearSelection={state.clearSelection}
          onBulkDelete={onBulkDelete}
          bulkStatus={bulkStatus}
          bulkActions={bulkActions}
        />
      ) : (
        <TableToolbar
          filters={props.filters}
          onClearFilters={onClearFilters}
          search={search}
          toolbar={toolbar}
          onReload={onReload}
          hideableColumns={state.hideableColumns}
          isColumnVisible={state.isColumnVisible}
          onColumnVisibilityChange={state.setColumnVisible}
          onShowAllColumns={state.showAllColumns}
          onResetColumnWidths={
            props.columns.some((column) => column.enableResizing !== false)
              ? sizing.resetAll
              : undefined
          }
          hasColumnWidths={sizing.customized}
        />
      )}
      {renderBody()}
      {onDelete ? (
        <ConfirmDialog
          open={state.pendingDelete !== null}
          onOpenChange={(open) => !open && state.cancelDelete()}
          title={t("deleteTitle")}
          description={
            state.pendingDelete
              ? t("deleteDescription", { name: getRowLabel(state.pendingDelete) })
              : null
          }
          confirmLabel={t("confirmDelete")}
          isPending={state.isDeleting}
          onConfirm={() => state.confirmDelete(onDelete)}
        />
      ) : null}
    </div>
  );
}

export type * from "./data-table.types";
