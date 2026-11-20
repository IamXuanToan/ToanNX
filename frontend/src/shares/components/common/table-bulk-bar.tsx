"use client";

import { CheckCircle2, ChevronDown, Loader2, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/shares/components/common/confirm-dialog";
import { Button } from "@/shares/components/ui/button";
import { Card } from "@/shares/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shares/components/ui/dropdown-menu";

import type { DataTableBulkAction, DataTableBulkStatus } from "./data-table.types";
import { useTableBulkBar } from "./hooks/use-table-bulk-bar";

/**
 * Thanh thao tác hàng loạt: hiện khi có dòng được chọn, thay chỗ toolbar để bảng không nhảy. Nền trắng
 * có viền như toolbar (không tô cả dải màu); chỉ chip "Đã chọn n" mang màu nhấn.
 * Trái: số dòng đã chọn + Bỏ chọn. Phải: Đổi trạng thái, thao tác tuỳ biến (có thể hỏi xác nhận),
 * Xoá (hỏi xác nhận).
 * Thao tác xong thì bỏ chọn.
 *
 * @param props - Dòng đã chọn, callback bỏ chọn và các thao tác.
 * @returns Thanh thao tác hàng loạt.
 */
export function TableBulkBar<T>({
  selectedRows,
  onClearSelection,
  onBulkDelete,
  bulkStatus,
  bulkActions = [],
}: {
  selectedRows: T[];
  onClearSelection: () => void;
  onBulkDelete?: (rows: T[]) => unknown;
  bulkStatus?: DataTableBulkStatus<T>;
  bulkActions?: DataTableBulkAction<T>[];
}) {
  const t = useTranslations("common.table");
  const { confirmOpen, setConfirmOpen, pendingAction, setPendingAction, isProcessing, count, run } =
    useTableBulkBar({ selectedRows, onClearSelection });

  return (
    <Card
      role="region"
      aria-label={t("selected", { count })}
      data-testid="table-bulk-bar"
      className="flex min-h-10 flex-wrap items-center justify-between gap-2 rounded-xl p-2 py-1 shadow-2xs"
    >
      <div className="flex items-center gap-1">
        <span className="bg-primary-light text-primary inline-flex h-8 items-center rounded-lg px-3 text-sm font-medium tabular-nums">
          {t("selected", { count })}
        </span>
        <Button
          type="button"
          variant="ghost"
          onClick={onClearSelection}
          disabled={isProcessing}
          className="text-muted-foreground hover:text-foreground h-9 rounded-lg px-3"
        >
          <X />
          {t("clearSelection")}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isProcessing ? <Loader2 className="text-primary size-4 animate-spin" aria-hidden /> : null}
        {bulkStatus ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isProcessing}
                className="h-9 rounded-lg"
              >
                <CheckCircle2 />
                {t("changeStatus")}
                <ChevronDown className="opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44 rounded-xl p-1">
              {bulkStatus.options.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  className="h-10 rounded-lg px-3"
                  onSelect={() => run(() => bulkStatus.onChange(selectedRows, option.value))}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        {bulkActions.map((action) => (
          <Button
            key={action.key}
            type="button"
            variant={action.destructive ? "destructive" : "outline"}
            disabled={isProcessing}
            onClick={() =>
              action.confirm ? setPendingAction(action) : run(() => action.onClick(selectedRows))
            }
            className="h-9 rounded-lg"
          >
            {action.icon ? <action.icon /> : null}
            {action.label}
          </Button>
        ))}
        {onBulkDelete ? (
          <Button
            type="button"
            variant="destructive"
            disabled={isProcessing}
            onClick={() => setConfirmOpen(true)}
            className="h-9 rounded-lg"
          >
            <Trash2 />
            {t("bulkDelete", { count })}
          </Button>
        ) : null}
      </div>
      {pendingAction?.confirm ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setPendingAction(null)}
          {...pendingAction.confirm(selectedRows)}
          isPending={isProcessing}
          onConfirm={() => run(() => pendingAction.onClick(selectedRows))}
        />
      ) : null}
      {onBulkDelete ? (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={t("bulkDeleteTitle", { count })}
          description={t("bulkDeleteDescription", { count })}
          confirmLabel={t("bulkDelete", { count })}
          isPending={isProcessing}
          onConfirm={() => run(() => onBulkDelete(selectedRows))}
        />
      ) : null}
    </Card>
  );
}
