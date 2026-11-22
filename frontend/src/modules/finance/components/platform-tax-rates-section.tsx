"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { DatePicker } from "@/shares/components/common/date-picker";
import { FormSection } from "@/shares/components/common/form-section";
import { NumberInput } from "@/shares/components/common/number-input";
import { StatusBadge } from "@/shares/components/common/status-badge";
import { SwitchField } from "@/shares/components/common/switch-field";
import { Alert, AlertDescription } from "@/shares/components/ui/alert";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { usePlatformTaxRatesSection } from "./hooks/use-platform-tax-rates-section";

/**
 * Lịch sử khấu trừ của nền tảng: mỗi mốc áp dụng từ ngày (giờ VN) tới mốc kế tiếp; giao dịch đã có giữ % đã
 * chụp, sửa mốc thì hỏi có cập nhật các giao dịch bị ảnh hưởng không.
 *
 * @param props - Nền tảng, quyền sửa.
 * @returns Section.
 */
export function PlatformTaxRatesSection({
  platformId,
  canUpdate,
}: {
  platformId: string;
  canUpdate: boolean;
}) {
  const t = useTranslations("finance.taxRates");
  const tCommon = useTranslations("common.actions");
  const format = useFormatter();
  const state = usePlatformTaxRatesSection(platformId);
  const { draft } = state;
  return (
    <FormSection
      title={t("title")}
      headerAction={
        canUpdate && !draft ? (
          <Button type="button" variant="outline" size="sm" onClick={state.startCreate}>
            <Plus />
            {t("add")}
          </Button>
        ) : null
      }
    >
      {state.affected.length ? (
        <Alert>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{t("affected", { count: state.affected.length })}</span>
            <span className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={state.dismissAffected}>
                {t("keep")}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void state.applyAffected()}
                disabled={state.isApplying}
              >
                {t("apply")}
              </Button>
            </span>
          </AlertDescription>
        </Alert>
      ) : null}
      {draft ? (
        <div className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_auto_8rem_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t("fields.effectiveFrom")}</Label>
            <DatePicker
              value={draft.effectiveFrom}
              onChange={(value) => state.setDraft({ ...draft, effectiveFrom: value })}
            />
          </div>
          <SwitchField
            label={t("fields.taxWithheld")}
            checked={draft.taxWithheld}
            onCheckedChange={(checked) => state.setDraft({ ...draft, taxWithheld: checked })}
          />
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t("fields.rate")}</Label>
            <NumberInput
              value={draft.rate}
              min={0}
              max={99.99}
              disabled={!draft.taxWithheld}
              onChange={(value) => state.setDraft({ ...draft, rate: String(value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t("fields.note")}</Label>
            <Input
              value={draft.note}
              onChange={(event) => state.setDraft({ ...draft, note: event.target.value })}
            />
          </div>
          <span className="flex gap-2">
            <Button type="button" variant="outline" onClick={state.cancel}>
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => void state.submit()}
              disabled={
                state.isSaving || !draft.effectiveFrom || (draft.taxWithheld && !draft.rate)
              }
            >
              {tCommon("save")}
            </Button>
          </span>
        </div>
      ) : null}
      {state.query.isPending ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : state.query.data?.length ? (
        <ul className="divide-y rounded-xl border">
          {state.query.data.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
              <span className="min-w-28 font-medium">
                {t("from", {
                  date: format.dateTime(new Date(entry.effectiveFrom), { dateStyle: "medium" }),
                })}
              </span>
              <StatusBadge tone={entry.taxWithheld ? "success" : "neutral"}>
                {entry.taxWithheld ? t("withheld", { rate: Number(entry.rate) }) : t("notWithheld")}
              </StatusBadge>
              <span className="text-muted-foreground min-w-0 flex-1 truncate">{entry.note}</span>
              {canUpdate ? (
                <span className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("edit")}
                    onClick={() => state.startEdit(entry)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("remove")}
                    onClick={() => void state.remove(entry)}
                  >
                    <Trash2 />
                  </Button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      )}
    </FormSection>
  );
}
