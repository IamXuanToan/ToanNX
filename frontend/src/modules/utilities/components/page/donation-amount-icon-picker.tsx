"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "cn";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { Button } from "@/shares/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shares/components/ui/popover";

import {
  DONATION_SUGGESTED_ICONS,
  type DonationSuggestedIconKey,
} from "../../constants/page-constants";
import { DonationAmountIcon } from "./donation-amount-icon";

/**
 * Bộ chọn biểu tượng trực quan (Icon Picker Popover) cho các mốc số tiền ủng hộ gợi ý.
 *
 * @param props - Giá trị icon hiện tại, callback thay đổi và trạng thái vô hiệu hóa.
 * @returns Nút kích hoạt và popover chọn icon.
 */
export function DonationAmountIconPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (val: DonationSuggestedIconKey) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("utilities.customPages.pages.donationEditor");
  const [open, setOpen] = useState(false);

  const currentOption = DONATION_SUGGESTED_ICONS.find((item) => item.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <AppTooltip content={t("selectIconTooltip")}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="border-border hover:border-primary/50 h-9 gap-1.5 px-2.5 text-xs font-medium shadow-2xs"
            aria-label={t("selectIconTooltip")}
          >
            <DonationAmountIcon iconKey={value} className="text-primary size-4 shrink-0" />
            <span className="hidden max-w-[80px] truncate sm:inline">
              {currentOption ? t(`icons.${currentOption.value}`) : t("selectIcon")}
            </span>
            <ChevronDown className="text-muted-foreground size-3 shrink-0 opacity-70" />
          </Button>
        </PopoverTrigger>
      </AppTooltip>

      <PopoverContent align="start" className="w-64 p-3 shadow-md">
        <div className="mb-2.5 border-b pb-2">
          <p className="text-foreground text-xs font-semibold">{t("iconPopoverTitle")}</p>
          <p className="text-muted-foreground text-[11px]">{t("iconPopoverSubtitle")}</p>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {DONATION_SUGGESTED_ICONS.map((item) => {
            const isSelected = value === item.value;

            return (
              <AppTooltip key={item.value} content={t(`icons.${item.value}`)} className="text-xs">
                <Button
                  type="button"
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "size-12 flex-col gap-1 rounded-xl p-0 transition-all",
                    isSelected
                      ? "font-bold shadow-xs"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                  )}
                >
                  <DonationAmountIcon
                    iconKey={item.value}
                    className={cn(
                      "size-4.5",
                      isSelected ? "text-primary-foreground" : "text-primary",
                    )}
                  />
                </Button>
              </AppTooltip>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
