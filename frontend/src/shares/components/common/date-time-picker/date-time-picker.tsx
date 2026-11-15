"use client";

import { cn } from "cn";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import {
  formatDateTimeLocal,
  mergeDateAndTime,
  MINUTE_OPTIONS,
  parseDateTimeLocal,
  parseIsoDate,
  snapMinuteToStep,
  toInputDate,
} from "@/shares/lib/date-time-input";

import { TimePickerPopover } from "../time-picker/components/time-picker-popover";
import { DatePicker } from "../date-picker/date-picker";

/**
 * Chọn ngày + giờ chuẩn (theo CommonDateTimePicker của Medoly): ô ngày và ô giờ cạnh nhau (xếp dọc
 * trên mobile); chưa chọn ngày thì khoá ô giờ. Giá trị `yyyy-MM-ddTHH:mm` (giờ địa phương).
 * Điều khiển (controlled).
 *
 * @param props - Giá trị, callback, giới hạn ngày, bước phút và trạng thái.
 * @returns Ô chọn ngày giờ.
 */
export function DateTimePicker({
  value,
  onChange,
  disabled,
  clearable = true,
  fromDate,
  toDate,
  minuteStep = 1,
  invalid,
  className,
}: {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  clearable?: boolean;
  fromDate?: Date;
  toDate?: Date;
  minuteStep?: number;
  invalid?: boolean;
  className?: string;
}) {
  const t = useTranslations("common.dateTimePicker");
  const selected = parseDateTimeLocal(value);
  const hour = selected?.getHours() ?? 0;
  const minute = selected?.getMinutes() ?? 0;
  const dateValue = toInputDate(value);
  const base = () => selected ?? parseIsoDate(dateValue) ?? new Date();
  const update = (date: Date, nextHour: number, nextMinute: number) =>
    onChange(formatDateTimeLocal(mergeDateAndTime(date, nextHour, nextMinute)));

  return (
    <div
      className={cn("flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center", className)}
    >
      <DatePicker
        value={dateValue}
        disabled={disabled}
        clearable={false}
        invalid={invalid}
        fromDate={fromDate}
        toDate={toDate}
        className="sm:flex-1"
        onChange={(next) =>
          next ? update(parseIsoDate(next) ?? new Date(), hour, minute) : onChange("")
        }
      />
      <div className="flex items-center gap-1 sm:w-44 sm:shrink-0">
        <TimePickerPopover
          hour={hour}
          minute={minute}
          hasValue={Boolean(selected)}
          minuteOptions={MINUTE_OPTIONS.filter((item) => item % minuteStep === 0)}
          disabled={disabled || !dateValue}
          className="flex-1"
          onHourChange={(next) => update(base(), next, minute)}
          onMinuteChange={(next) => update(base(), hour, snapMinuteToStep(next, minuteStep))}
        />
        {clearable && value ? (
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
    </div>
  );
}
