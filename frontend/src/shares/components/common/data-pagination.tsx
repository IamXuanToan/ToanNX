"use client";

import { cn } from "cn";
import { Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shares/components/ui/dropdown-menu";
import { Input } from "@/shares/components/ui/input";
import { PAGE_SIZE_OPTIONS } from "@/shares/constants/pagination";
import type { Pagination } from "@/shares/types/api.types";

import { useDataPagination } from "./hooks/use-data-pagination";

/**
 * Phân trang chuẩn của mọi danh sách: "1–20 trong 132" bên trái; bên phải là số dòng mỗi trang,
 * "Trang x/y", ‹, ô nhập trang (Enter để nhảy), ›. Dùng qua `DataTable`.
 *
 * @param props - Thông tin phân trang và callback.
 * @returns Thanh phân trang.
 */
export function DataPagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  disabled,
  className,
}: {
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
  className?: string;
}) {
  const t = useTranslations("common.pagination");
  const { page, pageSize, total } = pagination;
  const { from, to, totalPages, jump, handleJumpChange, goTo } = useDataPagination({
    pagination,
    onPageChange,
  });

  return (
    <nav
      aria-label={t("label")}
      className={cn("flex flex-wrap items-center justify-between gap-3 text-sm", className)}
    >
      <span className="text-muted-foreground tabular-nums">{t("range", { from, to, total })}</span>
      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                aria-label={t("rowsPerPage")}
                className="w-20 justify-between px-3 tabular-nums"
              >
                {pageSize}
                <ChevronDown className="opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-24 rounded-xl p-1">
              {pageSizeOptions.map((size) => (
                <DropdownMenuItem
                  key={size}
                  onSelect={() => onPageSizeChange(size)}
                  className="h-10 justify-between rounded-lg px-3 tabular-nums"
                >
                  {size}
                  {size === pageSize ? <Check className="text-primary" /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <span className="text-muted-foreground hidden px-1 tabular-nums sm:inline">
          {t("pageOf", { page, totalPages })}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t("previous")}
        >
          <ChevronLeft />
        </Button>
        <Input
          inputMode="numeric"
          aria-label={t("jumpToPage")}
          value={jump}
          disabled={disabled || totalPages <= 1}
          onChange={(event) => handleJumpChange(event.target.value)}
          onBlur={goTo}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              goTo();
            }
          }}
          className="w-14 px-1 text-center tabular-nums"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label={t("next")}
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
