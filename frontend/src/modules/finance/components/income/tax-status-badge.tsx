"use client";

import { useTranslations } from "next-intl";

import { StatusBadge } from "@/shares/components/common/status-badge";

import type { TaxStatus } from "../../types/income.types";

const TONES: Record<TaxStatus, "success" | "neutral" | "warning" | "info"> = {
  WITHHELD: "success",
  NOT_WITHHELD: "neutral",
  NO_RATE: "warning",
  UNCLASSIFIED: "warning",
  PENDING: "warning",
};

/**
 * Nhãn trạng thái khấu trừ của giao dịch, kèm % khi đã khấu trừ.
 *
 * @param props - Trạng thái và %.
 * @returns Badge.
 */
export function TaxStatusBadge({ status, rate }: { status: TaxStatus; rate?: string }) {
  const t = useTranslations("finance.taxStatus");
  const label = status === "WITHHELD" && rate ? `${t(status)} ${Number(rate)}%` : t(status);
  return <StatusBadge tone={TONES[status]}>{label}</StatusBadge>;
}
