"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import type { Pagination } from "@/shares/types/api.types";

/**
 * Thanh phân trang có kiểm soát (rút gọn từ CommonPagination của Medoly).
 *
 * @param props - Thông tin phân trang, callback đổi trang, trạng thái disabled.
 * @returns Thanh phân trang.
 */
export function DataPagination({
  pagination,
  onPageChange,
  disabled,
}: {
  pagination: Pagination;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("common.pagination");
  const { page, totalPages, total } = pagination;
  return (
    <nav
      aria-label={t("label")}
      className="flex flex-wrap items-center justify-between gap-2 text-sm"
    >
      <span className="text-muted-foreground">{t("total", { total })}</span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t("previous")}
        >
          <ChevronLeft />
        </Button>
        <span className="tabular-nums">{t("page", { page, totalPages })}</span>
        <Button
          variant="outline"
          size="icon-sm"
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
