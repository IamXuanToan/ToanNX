"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { useSepayImport } from "../../hooks/use-sepay-import";
import { useSepayPreview } from "../../hooks/use-sepay-preview";
import type { SepayPreviewRow } from "../../types/sepay.types";

const DEFAULT_DAYS = 7;
const DAY_MS = 86_400_000;

/**
 * State lấy thủ công: chọn khoảng ngày → xem trước → tích dòng (NEW tích sẵn, EXISTS khóa, CHANGED không tích
 * sẵn) → nhập; import gọi lại SePay phía BE.
 *
 * @returns Khoảng ngày, dòng xem trước, lựa chọn, handler.
 */
export function useSepayImportState() {
  const t = useTranslations("finance.sepay.import");
  const today = new Date();
  const [dateFrom, setDateFrom] = useState(
    new Date(today.getTime() - DEFAULT_DAYS * DAY_MS).toISOString().slice(0, 10),
  );
  const [dateTo, setDateTo] = useState(today.toISOString().slice(0, 10));
  const [rows, setRows] = useState<SepayPreviewRow[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const preview = useSepayPreview();
  const importer = useSepayImport();
  return {
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    rows,
    selected,
    toggle: (row: SepayPreviewRow, checked: boolean) =>
      setSelected((current) =>
        checked ? [...current, row.sepayId] : current.filter((id) => id !== row.sepayId),
      ),
    load: async () => {
      const result = await preview.mutateAsync({ dateFrom, dateTo });
      setRows(result);
      setSelected(result.filter((row) => row.status === "NEW").map((row) => row.sepayId));
    },
    submit: async () => {
      const result = await importer.mutateAsync({ dateFrom, dateTo, ids: selected });
      toast.success(t("done", result));
      setRows(null);
      setSelected([]);
    },
    isLoading: preview.isPending,
    isImporting: importer.isPending,
  };
}
