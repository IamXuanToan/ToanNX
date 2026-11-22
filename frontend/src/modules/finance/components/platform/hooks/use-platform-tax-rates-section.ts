"use client";

import { useState } from "react";

import { useDeleteTaxRate } from "../../../hooks/use-delete-tax-rate";
import { usePlatformTaxRates } from "../../../hooks/use-platform-tax-rates";
import { useRecalculateIncomeTax } from "../../../hooks/use-recalculate-income-tax";
import { useSaveTaxRate } from "../../../hooks/use-save-tax-rate";
import type { PlatformTaxRate, PlatformTaxRateInput } from "../../../types/platform-tax-rate.types";

/** Dòng nhập mốc mới / đang sửa. */
export type TaxRateDraft = {
  id?: string;
  effectiveFrom: string;
  taxWithheld: boolean;
  rate: string;
  note: string;
};

const EMPTY_DRAFT: TaxRateDraft = { effectiveFrom: "", taxWithheld: true, rate: "", note: "" };

/**
 * State section lịch sử khấu trừ: thêm/sửa/xóa mốc; sau mỗi thay đổi giữ danh sách giao dịch bị ảnh hưởng để
 * hỏi "Cập nhật N giao dịch?" (không tự tính lại).
 *
 * @param platformId - Nền tảng.
 * @returns Truy vấn, nháp, handler.
 */
export function usePlatformTaxRatesSection(platformId: string) {
  const query = usePlatformTaxRates(platformId);
  const save = useSaveTaxRate();
  const remove = useDeleteTaxRate();
  const recalculate = useRecalculateIncomeTax();
  const [draft, setDraft] = useState<TaxRateDraft | null>(null);
  const [affected, setAffected] = useState<string[]>([]);
  const toInput = (value: TaxRateDraft): PlatformTaxRateInput => ({
    effectiveFrom: value.effectiveFrom,
    taxWithheld: value.taxWithheld,
    rate: value.taxWithheld ? value.rate : "0",
    note: value.note,
  });
  return {
    query,
    draft,
    affected,
    isSaving: save.isPending,
    startCreate: () => setDraft({ ...EMPTY_DRAFT }),
    startEdit: (entry: PlatformTaxRate) =>
      setDraft({
        id: entry.id,
        effectiveFrom: entry.effectiveFrom,
        taxWithheld: entry.taxWithheld,
        rate: entry.rate,
        note: entry.note,
      }),
    setDraft,
    cancel: () => setDraft(null),
    submit: async () => {
      if (!draft) return;
      const result = await save.mutateAsync({
        platformId,
        rateId: draft.id,
        input: toInput(draft),
      });
      setAffected(result.affectedIncomeIds);
      setDraft(null);
    },
    remove: async (entry: PlatformTaxRate) => {
      const result = await remove.mutateAsync({ platformId, rateId: entry.id });
      setAffected(result.affectedIncomeIds);
    },
    applyAffected: async () => {
      await recalculate.mutateAsync({ ids: affected });
      setAffected([]);
    },
    dismissAffected: () => setAffected([]),
    isApplying: recalculate.isPending,
  };
}
