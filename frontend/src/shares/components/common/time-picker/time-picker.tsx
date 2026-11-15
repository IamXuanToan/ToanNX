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

import { TimePickerPopover } from "./components/time-picker-popover";

/**
 * Chọn giờ chuẩn (theo CommonTimePicker của Medoly): popover hai cột giờ/phút, `minuteStep` để chỉ
 * cho chọn phút chia hết (5, 15…), nút xoá. Giá trị `HH:mm`. Điều khiển (controlled).
 *
 * @param props - Giá trị `HH:mm`, callback, bước phút và trạng thái.
 * @returns Ô chọn giờ.
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
    <div className={cn("flex w-full min-w-0 items-center gap-1", className)}>
      <TimePickerPopover
        hour={hour}
        minute={minute}
        hasValue={Boolean(parsed)}
        placeholder={placeholder}
        minuteOptions={MINUTE_OPTIONS.filter((item) => item % minuteStep === 0)}
        disabled={disabled}
        className="flex-1"
        onHourChange={(next) => onChange(formatTimeString(next, minute))}
        onMinuteChange={(next) =>
          onChange(formatTimeString(hour, snapMinuteToStep(next, minuteStep)))
        }
      />
      {clearable && parsed ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("clear")}
          disabled={disabled}
          className="text-muted-foreground"
          onClick={() => onChange("")}
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}
