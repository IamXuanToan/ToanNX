"use client";

import { cn } from "cn";
import { ArrowDown, ArrowUp, ChevronsUpDown, Pin, PinOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shares/components/ui/dropdown-menu";

/** Vị trí ghim của cột. */
export type ColumnPin = "left" | "right" | false;

/**
 * Tiêu đề một cột: nhãn (bấm để sắp xếp nếu có `sortKey`: chưa sắp → tăng → giảm → bỏ)
 * và menu ghim cột (ghim trái / ghim phải / bỏ ghim) hiện khi rê hoặc khi cột đang ghim.
 *
 * @param props - Nhãn, sắp xếp, trạng thái ghim và callback.
 * @returns Nội dung `<th>`.
 */
export function TableHeaderCell({
  label,
  sortKey,
  ordering,
  onOrderingChange,
  align,
  pin,
  onPinChange,
}: {
  label: string;
  sortKey?: string;
  ordering?: string;
  onOrderingChange?: (ordering: string | undefined) => void;
  align?: "start" | "end";
  pin?: ColumnPin;
  onPinChange?: (pin: ColumnPin) => void;
}) {
  const t = useTranslations("common.table");
  const direction = !sortKey
    ? null
    : ordering === sortKey
      ? "asc"
      : ordering === `-${sortKey}`
        ? "desc"
        : null;
  const next = direction === null ? sortKey : direction === "asc" ? `-${sortKey}` : undefined;
  const SortIcon =
    direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ChevronsUpDown;

  return (
    <div
      className={cn(
        "group/header flex min-w-0 items-center gap-1",
        align === "end" && "flex-row-reverse",
      )}
    >
      {sortKey && onOrderingChange ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onOrderingChange(next)}
          aria-label={`${label}: ${direction === "asc" ? t("sortDescending") : t("sortAscending")}`}
          className={cn(
            "group/sort hover:text-foreground focus-visible:ring-ring/50 -mx-1 inline-flex h-8 min-w-0 items-center gap-1 rounded-md px-1 outline-hidden transition-colors focus-visible:ring-2",
            align === "end" && "flex-row-reverse",
            direction && "text-foreground",
          )}
        >
          <span className="truncate">{label}</span>
          <SortIcon
            aria-hidden
            className={cn(
              "size-3.5 shrink-0",
              !direction && "opacity-40 transition-opacity group-hover/sort:opacity-100",
            )}
          />
        </Button>
      ) : (
        <span className="truncate">{label}</span>
      )}
      {onPinChange ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("pinOptions", { column: label })}
              className={cn(
                "text-muted-foreground hover:text-foreground size-10 rounded-xl transition-colors",
                pin && "text-primary opacity-100",
              )}
            >
              <Pin className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-40 rounded-xl p-1">
            <DropdownMenuItem
              className="h-10 rounded-lg px-3"
              disabled={pin === "left"}
              onSelect={() => onPinChange("left")}
            >
              <Pin className="-rotate-45" />
              {t("pinLeft")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="h-10 rounded-lg px-3"
              disabled={pin === "right"}
              onSelect={() => onPinChange("right")}
            >
              <Pin className="rotate-45" />
              {t("pinRight")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="h-10 rounded-lg px-3"
              disabled={!pin}
              onSelect={() => onPinChange(false)}
            >
              <PinOff />
              {t("unpin")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}

/**
 * Trạng thái sắp xếp của một cột cho `aria-sort` của `<th>`.
 *
 * @param sortKey - Khoá sắp xếp của cột.
 * @param ordering - `ordering` hiện tại.
 * @returns Giá trị `aria-sort`.
 */
export function ariaSort(
  sortKey: string | undefined,
  ordering: string | undefined,
): "ascending" | "descending" | undefined {
  if (!sortKey) return undefined;
  if (ordering === sortKey) return "ascending";
  if (ordering === `-${sortKey}`) return "descending";
  return undefined;
}
