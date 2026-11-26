"use client";

import { cn } from "cn";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import {
  formatDateTimeLocal,
  formatTimeString,
  mergeDateAndTime,
  MINUTE_OPTIONS,
  parseDateTimeLocal,
  parseIsoDate,
  parseTimeString,
  snapMinuteToStep,
  toInputDate,
} from "@/shares/lib/date-time-input";

import { DatePicker } from "./date-picker";
import { TimePickerPopover } from "./time-picker-popover";

/**
 * Chọn ngày + giờ gọn gàng trong **một khung viền duy nhất** (`h-10`, ôm sát nội dung).
 * Hỗ trợ hai chế độ:
 * - Gộp: `value` + `onChange` (chuỗi `yyyy-MM-ddTHH:mm`).
 * - Tách (giờ tuỳ chọn): `dateValue` + `timeValue` + `onDateChange` + `onTimeChange` (VD: Nhắc việc).
 * Chưa chọn ngày thì khoá phần giờ.
 *
 * @param props - Giá trị, callback, giới hạn ngày, bước phút và trạng thái.
 * @returns Ô chọn ngày giờ gọn trong một field.
 */
export function DateTimePicker({
  id,
  value,
  onChange,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  dateRequired = false,
  disabled,
  clearable = true,
  fromDate,
  toDate,
  minuteStep = 1,
  invalid,
  className,
}: {
  id?: string;
  value?: string | null;
  onChange?: (value: string) => void;
  dateValue?: string | null;
  timeValue?: string | null;
  onDateChange?: (date: string) => void;
  onTimeChange?: (time: string) => void;
  dateRequired?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  fromDate?: Date;
  toDate?: Date;
  minuteStep?: number;
  invalid?: boolean;
  className?: string;
}) {
  const t = useTranslations("common.dateTimePicker");
  const isSplit = Boolean(onDateChange || onTimeChange);

  const combinedDate = parseDateTimeLocal(value);
  const splitTime = parseTimeString(timeValue);

  const activeDate = isSplit ? toInputDate(dateValue) : toInputDate(value);
  const hour = isSplit ? (splitTime?.hour ?? 0) : (combinedDate?.getHours() ?? 0);
  const minute = isSplit ? (splitTime?.minute ?? 0) : (combinedDate?.getMinutes() ?? 0);
  const hasTime = isSplit ? Boolean(splitTime) : Boolean(combinedDate);

  const updateCombined = (date: Date, nextHour: number, nextMinute: number) =>
    onChange?.(formatDateTimeLocal(mergeDateAndTime(date, nextHour, nextMinute)));
  const combinedBase = () => combinedDate ?? parseIsoDate(activeDate) ?? new Date();

  const handleDateChange = (next: string) => {
    if (isSplit) {
      onDateChange?.(next);
      return;
    }
    if (next) updateCombined(parseIsoDate(next) ?? new Date(), hour, minute);
    else onChange?.("");
  };

  const handleHourChange = (nextHour: number) => {
    const snappedMinute = snapMinuteToStep(minute, minuteStep);
    if (isSplit) {
      onTimeChange?.(formatTimeString(nextHour, snappedMinute));
      return;
    }
    updateCombined(combinedBase(), nextHour, snappedMinute);
  };

  const handleMinuteChange = (nextMinute: number) => {
    const snapped = snapMinuteToStep(nextMinute, minuteStep);
    if (isSplit) {
      onTimeChange?.(formatTimeString(hour, snapped));
      return;
    }
    updateCombined(combinedBase(), hour, snapped);
  };

  const handleClearTime = () => {
    if (isSplit) {
      onTimeChange?.("");
      return;
    }
    onChange?.("");
  };

  const handleClearButton = () => {
    if (isSplit && dateRequired) {
      onTimeChange?.("");
      return;
    }
    if (isSplit) {
      onDateChange?.("");
      onTimeChange?.("");
      return;
    }
    onChange?.("");
  };

  const showClearButton = Boolean(
    clearable && !disabled && (isSplit && dateRequired ? hasTime : activeDate || hasTime),
  );

  return (
    <div
      className={cn(
        "border-input bg-card dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/50 inline-flex h-10 w-fit max-w-full flex-nowrap items-center overflow-hidden rounded-xl border text-sm transition-colors focus-within:ring-3",
        invalid && "border-destructive ring-destructive/20 dark:ring-destructive/40 ring-3",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <DatePicker
        id={id}
        inline
        value={activeDate}
        disabled={disabled}
        clearable={false}
        invalid={invalid}
        fromDate={fromDate}
        toDate={toDate}
        onChange={handleDateChange}
      />
      <span aria-hidden className="bg-border h-5 w-px shrink-0" />
      <TimePickerPopover
        inline
        hour={hour}
        minute={minute}
        hasValue={hasTime}
        clearable={clearable}
        placeholder={t("timePlaceholder")}
        minuteOptions={MINUTE_OPTIONS.filter((item) => item % minuteStep === 0)}
        disabled={disabled || !activeDate}
        onHourChange={handleHourChange}
        onMinuteChange={handleMinuteChange}
        onClear={handleClearTime}
      />
      {showClearButton ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={dateRequired ? t("clearTime") : t("clear")}
          onClick={handleClearButton}
          className="text-muted-foreground hover:text-foreground h-full w-8 shrink-0 rounded-none border-l"
        >
          <X className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
