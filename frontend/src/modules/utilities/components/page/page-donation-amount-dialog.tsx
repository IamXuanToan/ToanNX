"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/shares/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";
import { CURRENCY_SYMBOLS } from "@/shares/constants/currency";
import { formatVndText } from "@/shares/lib/number-format";

import type { DonationSuggestedIconKey } from "../../constants/page-constants";
import { DonationAmountIcon } from "./donation-amount-icon";
import { DonationAmountIconPicker } from "./donation-amount-icon-picker";

export interface SuggestedAmountItem {
  amount: number;
  label: string;
  icon?: string;
}

export interface PageDonationAmountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialItem?: SuggestedAmountItem | null;
  onSave: (item: SuggestedAmountItem) => void;
}

/**
 * Hộp thoại tạo và chỉnh sửa mức tiền gợi ý (Suggested Donation Amount) cho trang Quyên góp:
 * Thay thế hoàn toàn form inline chật chội trước đây, giải quyết triệt để lỗi tràn chữ và co cụm control.
 *
 * @param props - Trạng thái mở, item ban đầu và callback lưu.
 * @returns Dialog modal chỉnh sửa mức tiền gợi ý.
 */
export function PageDonationAmountDialog({
  open,
  onOpenChange,
  initialItem,
  onSave,
}: PageDonationAmountDialogProps) {
  const t = useTranslations("utilities.customPages.pages.donationEditor");
  const format = useFormatter();

  const [prevItem, setPrevItem] = useState<SuggestedAmountItem | null | undefined>(initialItem);
  const [prevOpen, setPrevOpen] = useState<boolean>(open);

  const [amountStr, setAmountStr] = useState<string>(initialItem ? String(initialItem.amount) : "");
  const [label, setLabel] = useState<string>(initialItem ? initialItem.label : "");
  const [icon, setIcon] = useState<DonationSuggestedIconKey>(
    (initialItem?.icon as DonationSuggestedIconKey) || "coffee",
  );

  // Đồng bộ dữ liệu khi mở dialog hoặc thay đổi item ban đầu (chuẩn React 19 - state adjustment during render)
  if (open !== prevOpen || initialItem !== prevItem) {
    setPrevOpen(open);
    setPrevItem(initialItem);
    if (open) {
      setAmountStr(initialItem ? String(initialItem.amount) : "");
      setLabel(initialItem ? initialItem.label : "");
      setIcon((initialItem?.icon as DonationSuggestedIconKey) || "coffee");
    }
  }

  const numAmount = Number(amountStr.replace(/\D/g, ""));
  const isValid = numAmount > 0;

  const handleSave = () => {
    if (!isValid) return;
    const finalLabel = label.trim() || formatVndText(numAmount);
    onSave({
      amount: numAmount,
      label: finalLabel,
      icon,
    });
    onOpenChange(false);
  };

  const isEditing = Boolean(initialItem);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("amountDialogEditTitle") : t("amountDialogAddTitle")}
          </DialogTitle>
          <DialogDescription>{t("amountDialogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 1. Số tiền */}
          <div className="space-y-1.5">
            <Label htmlFor="donation-amount-input" className="text-xs font-semibold">
              {t("amountLabel")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="donation-amount-input"
              type="text"
              inputMode="numeric"
              placeholder={t("amountPlaceholder")}
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="h-9 font-mono text-sm"
              autoFocus
            />
            {numAmount > 0 ? (
              <p className="text-primary font-mono text-xs font-semibold">
                = {formatVndText(numAmount)}
              </p>
            ) : (
              <p className="text-muted-foreground text-[11px]">{t("amountLabelHelp")}</p>
            )}
          </div>

          {/* 2. Nhãn hiển thị */}
          <div className="space-y-1.5">
            <Label htmlFor="donation-label-input" className="text-xs font-semibold">
              {t("labelFieldLabel")}
            </Label>
            <Input
              id="donation-label-input"
              type="text"
              placeholder={t("labelPlaceholder")}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="h-9 text-xs"
            />
            <p className="text-muted-foreground text-[11px]">{t("labelFieldHelp")}</p>
          </div>

          {/* 3. Biểu tượng */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("iconFieldLabel")}</Label>
            <div className="flex items-center gap-3">
              <DonationAmountIconPicker value={icon} onChange={setIcon} />
              <span className="text-muted-foreground text-xs">{t("selectIconTooltip")}</span>
            </div>
          </div>

          {/* 4. Xem trước trực tiếp (Live Preview Card) */}
          <div className="space-y-1.5 pt-1">
            <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
              {t("previewSuggestedButton")}
            </span>
            <div className="border-border/80 bg-muted/30 flex items-center gap-3 rounded-xl border p-3 shadow-2xs">
              <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                <DonationAmountIcon iconKey={icon} className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-xs font-semibold">
                  {label.trim() ||
                    (numAmount > 0
                      ? `${format.number(numAmount)} ${CURRENCY_SYMBOLS.VND}`
                      : t("defaultCoffeeAmountLabel"))}
                </p>
                <p className="text-primary font-mono text-xs font-bold">
                  {numAmount > 0
                    ? `${format.number(numAmount)} ${CURRENCY_SYMBOLS.VND}`
                    : `${format.number(50000)} ${CURRENCY_SYMBOLS.VND}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs"
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!isValid}
            className="h-9 text-xs font-medium"
          >
            {isEditing ? t("saveAmount") : t("addAmount")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
