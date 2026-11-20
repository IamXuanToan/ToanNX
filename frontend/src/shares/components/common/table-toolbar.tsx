"use client";

import { Columns3, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { SearchInput } from "@/shares/components/common/search-input";
import { Button } from "@/shares/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shares/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shares/components/ui/tooltip";

/**
 * Toolbar của bảng: ô tìm bên trái; bên phải là control thêm, Tải lại và menu ẩn/hiện cột.
 *
 * @param props - Ô tìm, control thêm, tải lại, danh sách cột ẩn được.
 * @returns Toolbar.
 */
export function TableToolbar({
  search,
  toolbar,
  filters,
  onClearFilters,
  onReload,
  hideableColumns,
  isColumnVisible,
  onColumnVisibilityChange,
  onShowAllColumns,
  onResetColumnWidths,
  hasColumnWidths,
}: {
  search?: { value: string; onValueChange: (value: string) => void; placeholder: string };
  toolbar?: ReactNode;
  filters?: ReactNode;
  onClearFilters?: () => void;
  onReload?: () => void;
  hideableColumns: { id: string; label: string }[];
  isColumnVisible: (id: string) => boolean;
  onColumnVisibilityChange: (id: string, visible: boolean) => void;
  onShowAllColumns: () => void;
  onResetColumnWidths?: () => void;
  hasColumnWidths?: boolean;
}) {
  const t = useTranslations("common.table");
  if (
    !search &&
    !filters &&
    !toolbar &&
    !onReload &&
    !hideableColumns.length &&
    !onResetColumnWidths
  )
    return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {search ? (
        <SearchInput
          value={search.value}
          onValueChange={search.onValueChange}
          placeholder={search.placeholder}
          className="min-w-0 basis-full sm:flex-1 sm:basis-auto"
        />
      ) : null}
      {filters ? <div className="flex min-w-0 flex-wrap items-center gap-2">{filters}</div> : null}
      {onClearFilters ? (
        <Button variant="ghost" onClick={onClearFilters}>
          {t("clearFilters")}
        </Button>
      ) : null}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {toolbar}
        {onReload ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t("reload")}
                onClick={onReload}
              >
                <RefreshCw />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{t("reload")}</TooltipContent>
          </Tooltip>
        ) : null}
        {hideableColumns.length || onResetColumnWidths ? (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="icon" aria-label={t("columns")}>
                    <Columns3 />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top">{t("columns")}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="min-w-52 rounded-xl p-1">
              <DropdownMenuLabel className="text-muted-foreground px-3 text-xs">
                {t("columns")}
              </DropdownMenuLabel>
              {hideableColumns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={isColumnVisible(column.id)}
                  onCheckedChange={(checked) =>
                    onColumnVisibilityChange(column.id, Boolean(checked))
                  }
                  onSelect={(event) => event.preventDefault()}
                  className="h-10 rounded-lg"
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              {hideableColumns.length ? (
                <DropdownMenuItem onSelect={onShowAllColumns} className="h-10 rounded-lg px-3">
                  {t("showAllColumns")}
                </DropdownMenuItem>
              ) : null}
              {onResetColumnWidths ? (
                <DropdownMenuItem
                  onSelect={onResetColumnWidths}
                  disabled={!hasColumnWidths}
                  className="h-10 rounded-lg px-3"
                >
                  {t("resetColumnWidths")}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  );
}
