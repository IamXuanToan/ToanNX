"use client";

import { Download, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { DatePicker } from "@/shares/components/common/date-picker";
import { FormSection } from "@/shares/components/common/form-section";
import { StatusBadge } from "@/shares/components/common/status-badge";
import { TimestampText } from "@/shares/components/common/timestamp-text";
import { Button } from "@/shares/components/ui/button";
import { Checkbox } from "@/shares/components/ui/checkbox";
import { Label } from "@/shares/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shares/components/ui/table";

import type { SepayPreviewStatus } from "../../types/sepay.types";
import { useSepayImportState } from "./hooks/use-sepay-import";
import { MoneyText } from "../income/money-text";

const TONES: Record<SepayPreviewStatus, "success" | "neutral" | "warning" | "danger"> = {
  NEW: "success",
  EXISTS: "neutral",
  CHANGED: "warning",
  INVALID: "danger",
};

/**
 * Lấy giao dịch thủ công từ SePay (tối đa 92 ngày): xem trước, tích dòng cần nhập. Dòng "Đã có" không bao giờ
 * bị ghi đè; dòng "Khác" chỉ cập nhật trường từ SePay khi được tích.
 *
 * @returns Section lấy thủ công.
 */
export function SepayImport() {
  const t = useTranslations("finance.sepay.import");
  const state = useSepayImportState();
  return (
    <FormSection title={t("title")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{t("from")}</Label>
          <DatePicker value={state.dateFrom} onChange={state.setDateFrom} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{t("to")}</Label>
          <DatePicker value={state.dateTo} onChange={state.setDateTo} />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void state.load()}
          disabled={state.isLoading}
        >
          <Search />
          {t("preview")}
        </Button>
      </div>
      {state.rows ? (
        <>
          <div className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-1.5">
            <StatusBadge tone="info">{t("selected", { count: state.selected.length })}</StatusBadge>
            <Button
              type="button"
              onClick={() => void state.submit()}
              disabled={!state.selected.length || state.isImporting}
            >
              <Download />
              {t("submit")}
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>{t("columns.status")}</TableHead>
                  <TableHead>{t("columns.time")}</TableHead>
                  <TableHead className="text-end">{t("columns.amount")}</TableHead>
                  <TableHead>{t("columns.content")}</TableHead>
                  <TableHead>{t("columns.platform")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.rows.map((row) => (
                  <TableRow key={row.sepayId}>
                    <TableCell>
                      <Checkbox
                        checked={state.selected.includes(row.sepayId)}
                        disabled={row.status === "EXISTS"}
                        onCheckedChange={(checked) => state.toggle(row, checked === true)}
                        aria-label={row.sepayId}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={TONES[row.status]}>
                        {t(`status.${row.status}`)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <TimestampText value={row.receivedAt} />
                    </TableCell>
                    <TableCell className="text-end">
                      <MoneyText value={row.amount} />
                      {row.status === "CHANGED" ? (
                        <span className="text-muted-foreground block text-xs line-through">
                          <MoneyText value={row.existingAmount} />
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-80">
                      <AppTooltip content={row.content}>
                        <span className="block truncate">{row.content}</span>
                      </AppTooltip>
                    </TableCell>
                    <TableCell>
                      {row.platformName || "—"}
                      {row.taxRate && Number(row.taxRate) ? (
                        <span className="text-muted-foreground"> · {Number(row.taxRate)}%</span>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!state.rows.length ? (
            <p className="text-muted-foreground text-sm">{t("empty")}</p>
          ) : null}
        </>
      ) : null}
    </FormSection>
  );
}
