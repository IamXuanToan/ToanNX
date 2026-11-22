"use client";

import { cn } from "cn";
import { Clock3 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shares/components/ui/popover";
import { HOUR_OPTIONS } from "@/shares/lib/date-time-input";

import { FORM_CONTROL_TRIGGER_CLASS } from "./form-control.styles";
import { useTimePickerPopover } from "./hooks/use-time-picker-popover";
import { TimeScrollColumn } from "./time-scroll-column";

/**
 * Nút chọn giờ dạng popover hai cột (giờ / phút), theo TimePickerPopover của Medoly.
 *
 * @param props - Giờ, phút, các phút được chọn, callback và trạng thái.
 * @returns Nút chọn giờ.
 */
export function TimePickerPopover({
  hour,
  minute,
  minuteOptions,
  onHourChange,
  onMinuteChange,
  disabled,
  placeholder,
  hasValue,
  className,
}: {
  hour: number;
  minute: number;
  minuteOptions: number[];
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  disabled?: boolean;
  placeholder?: string;
  hasValue: boolean;
  className?: string;
}) {
  const t = useTranslations("common.timePicker");
  const { open, setOpen, display } = useTimePickerPopover(hour, minute);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-expanded={open}
          aria-label={t("label")}
          className={cn(FORM_CONTROL_TRIGGER_CLASS, "tabular-nums", className)}
        >
          <Clock3 className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <span className={cn("truncate", !hasValue && "text-muted-foreground")}>
            {hasValue ? display : (placeholder ?? t("placeholder"))}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto gap-0 overflow-hidden rounded-xl p-0"
        align="start"
        onWheel={(event) => event.stopPropagation()}
      >
        <div className="flex divide-x">
          <TimeScrollColumn
            label={t("hour")}
            options={HOUR_OPTIONS}
            value={hour}
            open={open}
            onSelect={onHourChange}
          />
          <TimeScrollColumn
            label={t("minute")}
            options={minuteOptions}
            value={minute}
            open={open}
            onSelect={onMinuteChange}
          />
        </div>
        <div className="flex justify-end border-t p-1">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {t("done")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
