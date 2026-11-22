"use client";

import { CheckCircle2, ChevronDown, Loader2, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/shares/components/common/confirm-dialog";
import { Button } from "@/shares/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shares/components/ui/dropdown-menu";

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
    <div
      role="region"
      aria-label={t("selected", { count })}
      data-testid="table-bulk-bar"
      className="bg-card/95 border-border/80 text-foreground flex min-h-12 w-full flex-wrap items-center justify-between gap-3 rounded-xl border px-3.5 py-1.5 shadow-2xs backdrop-blur-xs transition-all sm:flex-nowrap"
    >
      <div className="flex shrink-0 items-center gap-2">
        <span className="bg-primary/10 text-primary border-primary/20 inline-flex h-8 items-center rounded-lg border px-2.5 text-xs font-semibold tabular-nums">
          {t("selected", { count })}
        </span>
        <div className="bg-border/60 h-4 w-px" aria-hidden />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={isProcessing}
          className="text-muted-foreground hover:text-foreground h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
        >
          <X className="size-3.5" />
          <span>{t("clearSelection")}</span>
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
                size="sm"
                disabled={isProcessing}
                className="h-8 gap-1.5 rounded-lg text-xs font-medium"
              >
                <CheckCircle2 className="size-3.5" />
                <span>{t("changeStatus")}</span>
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44 rounded-xl p-1">
              {bulkStatus.options.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  className="h-9 rounded-lg px-3 text-xs"
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
            size="sm"
            variant={action.destructive ? "destructive" : "outline"}
            disabled={isProcessing}
            onClick={() =>
              action.confirm ? setPendingAction(action) : run(() => action.onClick(selectedRows))
            }
            className="h-8 gap-1.5 rounded-lg text-xs font-medium"
          >
            {action.icon ? <action.icon className="size-3.5" /> : null}
            <span>{action.label}</span>
          </Button>
        ))}
        {onBulkDelete ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isProcessing}
            onClick={() => setConfirmOpen(true)}
            className="h-8 gap-1.5 rounded-lg text-xs font-medium"
          >
            <Trash2 className="size-3.5" />
            <span>{t("bulkDelete", { count })}</span>
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
    </div>
  );
}
