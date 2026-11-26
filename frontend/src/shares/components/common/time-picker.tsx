"use client";

import { cn } from "cn";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import {
  formatTimeString,
  MINUTE_OPTIONS,
  parseTimeString,
  snapMinuteToStep,
} from "@/shares/lib/date-time-input";

import { TimePickerPopover } from "./time-picker-popover";

/**
 * Chọn giờ gọn trong một khung `h-10`: popover hai cột giờ/phút, `minuteStep` để chỉ cho chọn
 * phút chia hết (5, 15…) và nút xoá nằm gọn trong cùng đường viền. Giá trị `HH:mm`. Điều khiển (controlled).
 *
 * @param props - Giá trị `HH:mm`, callback, bước phút và trạng thái.
 * @returns Ô chọn giờ gọn.
 */
export function TimePicker({
  value,
  onChange,
  disabled,
  clearable = true,
  minuteStep = 1,
  placeholder,
  className,
}: {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  clearable?: boolean;
  minuteStep?: number;
  placeholder?: string;
  className?: string;
}) {
  const t = useTranslations("common.timePicker");
  const parsed = parseTimeString(value);
  const hour = parsed?.hour ?? 0;
  const minute = parsed?.minute ?? 0;

  return (
    <div
      className={cn(
        "border-input bg-card dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/50 inline-flex h-10 w-fit min-w-[8.5rem] items-center overflow-hidden rounded-xl border text-sm transition-colors focus-within:ring-3",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <TimePickerPopover
        inline
        hour={hour}
        minute={minute}
        hasValue={Boolean(parsed)}
        clearable={clearable}
        onClear={() => onChange("")}
        placeholder={placeholder}
        minuteOptions={MINUTE_OPTIONS.filter((item) => item % minuteStep === 0)}
        disabled={disabled}
        className="flex-1"
        onHourChange={(next) => onChange(formatTimeString(next, minute))}
        onMinuteChange={(next) =>
          onChange(formatTimeString(hour, snapMinuteToStep(next, minuteStep)))
        }
      />
      {clearable && parsed && !disabled ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t("clear")}
          onClick={() => onChange("")}
          className="text-muted-foreground hover:text-foreground h-full w-8 shrink-0 rounded-none border-l"
        >
          <X className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
